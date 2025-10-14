"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Coffee, Clock, Play, Square, Pause, X } from "lucide-react"
import { useWebSocketEvent, useWebSocketEmit } from "@/hooks/use-websocket-event"

type BreakType = "MORNING" | "LUNCH" | "AFTERNOON" | "AWAY"

interface Break {
  id: string
  type: BreakType
  startTime: string
  endTime: string | null
  duration: number | null
  reason: string | null
  date: string
}

const breakConfig = {
  MORNING: { 
    label: "Morning Break", 
    duration: 15, // minutes
    color: "from-blue-600 to-blue-800",
    message: "☕ Enjoy your morning break! Recharge and have fun. See you back soon!"
  },
  LUNCH: { 
    label: "Lunch Break", 
    duration: 60,
    color: "from-emerald-600 to-emerald-800",
    message: "🍽️ Enjoy your lunch! Take your time, relax, and refuel. You deserve it!"
  },
  AFTERNOON: { 
    label: "Afternoon Break", 
    duration: 15,
    color: "from-purple-600 to-purple-800",
    message: "🌟 Take a breather! Stretch, relax, and come back refreshed!"
  },
  AWAY: { 
    label: "Away from Desk", 
    duration: 30,
    color: "from-amber-600 to-amber-800",
    message: "⏰ You're away from your desk. We'll be here when you get back!"
  },
}

export default function BreaksTracking() {
  const [breaks, setBreaks] = useState<Break[]>([])
  const [activeBreak, setActiveBreak] = useState<Break | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0) // seconds
  const [timeElapsed, setTimeElapsed] = useState(0) // seconds
  const [isKioskMode, setIsKioskMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { emit } = useWebSocketEmit()

  const fetchBreaks = useCallback(async () => {
    try {
      console.log('[BreaksTracking] Fetching breaks...')
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/breaks?date=${today}`)
      console.log('[BreaksTracking] Fetch response:', response.ok, response.status)
      
      if (!response.ok) {
        console.error('[BreaksTracking] Failed to fetch breaks:', response.status)
        setIsLoading(false)
        return
      }
      
      const data = await response.json()
      console.log('[BreaksTracking] Breaks data:', data)
      setBreaks(data.breaks || [])
      
      // Check for active break
      const active = data.breaks?.find((b: Break) => !b.endTime) || null
      console.log('[BreaksTracking] Active break:', active)
      
      if (active) {
        setActiveBreak(active)
        const config = breakConfig[active.type as BreakType]
        const elapsed = Math.floor((Date.now() - new Date(active.startTime).getTime()) / 1000)
        setTimeElapsed(elapsed)
        setTimeRemaining(Math.max(0, (config.duration * 60) - elapsed))
        console.log('[BreaksTracking] Set active break:', active.type, 'elapsed:', elapsed, 'remaining:', Math.max(0, (config.duration * 60) - elapsed))
      } else {
        console.log('[BreaksTracking] No active break found')
      }
      
      setIsLoading(false)
    } catch (err) {
      console.error("[BreaksTracking] Error fetching breaks:", err)
      setIsLoading(false)
    }
  }, [])

  // Listen for real-time break events from other users/sessions
  const handleBreakStarted = useCallback((data: any) => {
    console.log('[BreaksTracking] Real-time break started:', data)
    fetchBreaks() // Refresh breaks list
  }, [fetchBreaks])

  const handleBreakEnded = useCallback((data: any) => {
    console.log('[BreaksTracking] Real-time break ended:', data)
    fetchBreaks() // Refresh breaks list
  }, [fetchBreaks])

  useWebSocketEvent('break:started', handleBreakStarted)
  useWebSocketEvent('break:ended', handleBreakEnded)

  useEffect(() => {
    // Check if in kiosk mode from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const kioskParam = urlParams.get('kiosk')
    const typeParam = urlParams.get('type') as BreakType | null
    
    if (kioskParam === 'true' && typeParam) {
      console.log('[BreaksTracking] Kiosk mode detected, type:', typeParam)
      setIsKioskMode(true)
      // In kiosk mode, fetch the active break from API
      fetchBreaks()
    } else {
      fetchBreaks()
    }
  }, [fetchBreaks])

  // Timer logic
  useEffect(() => {
    if (activeBreak && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-end break when timer reaches 0
            endBreak(activeBreak.id, true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [activeBreak, isPaused])

  const startBreak = async (type: BreakType) => {
    try {
      const response = await fetch("/api/breaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || "Failed to start break")
        return
      }
      
      const result = await response.json()
      setActiveBreak(result.break)
      setTimeElapsed(0)
      setTimeRemaining(breakConfig[type].duration * 60)
      setIsPaused(false)

      // Emit WebSocket event for real-time updates
      emit('break:start', {
        breakId: result.break.id,
        type,
        duration: breakConfig[type].duration,
        userId: result.break.userId,
        startTime: result.break.startTime,
      })

      // Start kiosk mode in Electron
      if (window.electron?.breaks?.start) {
        await window.electron.breaks.start({
          type,
          duration: breakConfig[type].duration,
          breakId: result.break.id,
        })
      }
    } catch (err) {
      console.error("Error starting break:", err)
      alert("Failed to start break")
    }
  }

  const endBreak = async (breakId: string, autoEnd = false) => {
    try {
      console.log('[BreaksTracking] Ending break:', breakId)
      
      const response = await fetch(`/api/breaks/${breakId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || "Failed to end break")
        return
      }
      
      console.log('[BreaksTracking] Break ended successfully, clearing state')
      
      // Emit WebSocket event for real-time updates
      emit('break:end', {
        breakId,
        autoEnd,
      })
      
      // Clear state immediately
      setActiveBreak(null)
      setIsPaused(false)
      setTimeElapsed(0)
      setTimeRemaining(0)
      
      // Exit kiosk mode in Electron
      if (window.electron?.breaks?.end) {
        console.log('[BreaksTracking] Exiting kiosk mode')
        await window.electron.breaks.end()
      }
      
      if (autoEnd) {
        // Show completion message
        alert("⏰ Break time is up! Welcome back! 🎉")
      }
      
      // If in kiosk mode, we need to close this window
      // The main window will be shown by Electron
      if (isKioskMode) {
        console.log('[BreaksTracking] Kiosk mode ended, window will be closed by Electron')
        // Don't fetch breaks or do anything else - this window is closing
        return
      }
      
      await fetchBreaks()
    } catch (err) {
      console.error("Error ending break:", err)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Loading state
  if (isLoading && isKioskMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 mx-auto animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>
          <p className="text-white text-xl">Loading break...</p>
        </div>
      </div>
    )
  }

  // Full-screen break overlay
  if (activeBreak) {
    const config = breakConfig[activeBreak.type]
    const progress = (timeElapsed / (config.duration * 60)) * 100

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)] animate-pulse"></div>
        
        <div className="relative z-10 w-full max-w-2xl p-8 text-center">
          {/* Close button (hidden in kiosk mode) */}
          {!isKioskMode && (
            <button
              onClick={() => endBreak(activeBreak.id)}
              className="absolute top-4 right-4 rounded-full bg-slate-800/50 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          )}

          {/* Break type badge */}
          <div className={`mx-auto mb-8 inline-block rounded-full bg-gradient-to-r ${config.color} px-6 py-3`}>
            <div className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-white" />
              <span className="font-bold text-white">{config.label}</span>
            </div>
          </div>

          {/* Motivational message */}
          <h1 className="mb-8 text-4xl font-bold text-white">
            {config.message}
          </h1>

          {/* Giant countdown timer */}
          <div className="mb-8">
            <div className="relative mx-auto h-64 w-64">
              {/* Progress circle */}
              <svg className="h-full w-full -rotate-90 transform">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-800"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                  className={`text-transparent bg-gradient-to-r ${config.color} bg-clip-text transition-all duration-1000`}
                  style={{
                    stroke: progress > 80 ? '#ef4444' : progress > 50 ? '#f59e0b' : '#10b981'
                  }}
                />
              </svg>
              
              {/* Time display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <div className="text-6xl font-bold text-white">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="mt-2 text-sm text-slate-400">
                    {formatTime(timeElapsed)} elapsed
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex justify-center gap-4">
            {/* Pause/Resume button */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-8 py-4 font-semibold text-white transition-all hover:bg-slate-700"
            >
              {isPaused ? (
                <>
                  <Play className="h-5 w-5" />
                  Resume Break
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5" />
                  Pause Break
                </>
              )}
            </button>

            {/* End break button */}
            <button
              onClick={() => {
                if (confirm("Are you sure you want to end your break early?")) {
                  endBreak(activeBreak.id)
                }
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-8 py-4 font-semibold text-white transition-all hover:from-red-700 hover:to-red-800"
            >
              <Square className="h-5 w-5" />
              End Break
            </button>
          </div>

          {/* Status indicator */}
          {isPaused && (
            <div className="mt-6 animate-pulse text-amber-400">
              ⏸️ Break Paused
            </div>
          )}
        </div>
      </div>
    )
  }

  // Break selection screen (when no active break)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-blue-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <Coffee className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Break Tracking</h1>
              <p className="text-slate-300">Take regular breaks to stay productive and healthy</p>
            </div>
          </div>
        </div>

        {/* Break options */}
        <div className="grid gap-6 md:grid-cols-2">
          {(Object.entries(breakConfig) as [BreakType, typeof breakConfig.MORNING][]).map(([type, config]) => (
            <button
              key={type}
              onClick={() => startBreak(type)}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.color} p-8 text-left shadow-xl transition-all hover:scale-105 hover:shadow-2xl`}
            >
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                  <Coffee className="h-12 w-12 text-white" />
                  <Clock className="h-8 w-8 text-white/50" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">{config.label}</h3>
                <p className="mb-4 text-lg text-white/80">{config.duration} minutes</p>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Play className="h-4 w-4" />
                  <span>Click to start</span>
                </div>
              </div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-white/0 transition-all group-hover:bg-white/10"></div>
            </button>
          ))}
        </div>

        {/* Break history */}
        <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
          <h2 className="mb-4 text-xl font-bold text-white">Today's Breaks</h2>
          
          {breaks.length === 0 ? (
            <p className="text-center text-slate-400">No breaks taken today</p>
          ) : (
            <div className="space-y-3">
              {breaks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl bg-slate-800/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Coffee className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="font-semibold text-white">
                        {breakConfig[b.type].label}
                      </div>
                      <div className="text-sm text-slate-400">
                        {new Date(b.startTime).toLocaleTimeString()} - 
                        {b.endTime ? new Date(b.endTime).toLocaleTimeString() : 'In progress'}
                      </div>
                    </div>
                  </div>
                  {b.duration && (
                    <div className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-400">
                      {formatDuration(b.duration)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
