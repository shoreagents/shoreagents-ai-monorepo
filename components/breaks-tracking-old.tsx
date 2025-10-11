"use client"

import { useState, useEffect } from "react"
import { Coffee, Clock, MapPin, Calendar, ChevronLeft, ChevronRight, Play, Square } from "lucide-react"

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

export default function BreaksTracking() {
  const [breaks, setBreaks] = useState<Break[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeBreak, setActiveBreak] = useState<Break | null>(null)

  useEffect(() => {
    setMounted(true)
    fetchBreaks()
  }, [selectedDate])

  const fetchBreaks = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const response = await fetch(`/api/breaks?date=${dateStr}`)
      if (!response.ok) throw new Error("Failed to fetch breaks")
      const data = await response.json()
      console.log("Fetched breaks:", data.breaks)
      setBreaks(data.breaks)
      const active = data.breaks.find((b: Break) => !b.endTime) || null
      console.log("Active break:", active)
      setActiveBreak(active)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load breaks")
    } finally {
      setLoading(false)
    }
  }

  const startBreak = async (type: BreakType, reason?: string) => {
    try {
      const response = await fetch("/api/breaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, reason }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        alert(errorData.error || "Failed to start break")
        return
      }
      
      const result = await response.json()
      console.log("Break started:", result.break)
      
      // Update breaks list and set as active
      setBreaks([...breaks, result.break])
      setActiveBreak(result.break)
      
      // Also fetch to sync with server
      await fetchBreaks()
    } catch (err) {
      console.error("Error starting break:", err)
      alert("Failed to start break")
    }
  }

  const endBreak = async (breakId: string) => {
    try {
      const response = await fetch(`/api/breaks/${breakId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endTime: new Date().toISOString() }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        alert(errorData.error || "Failed to end break")
        return
      }
      
      const result = await response.json()
      console.log("Break ended:", result.break)
      
      // Clear active break immediately
      setActiveBreak(null)
      
      // Refresh breaks list
      await fetchBreaks()
    } catch (err) {
      console.error("Error ending break:", err)
      alert("Failed to end break")
    }
  }

  const formatDate = (date: Date, format: 'weekday' | 'full') => {
    if (format === 'weekday') {
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return weekdays[date.getDay()]
    } else {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const previousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const nextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const breakTypeConfig = {
    MORNING: { label: "Morning Break", color: "bg-blue-500/20 text-blue-400", icon: Coffee },
    LUNCH: { label: "Lunch Break", color: "bg-emerald-500/20 text-emerald-400", icon: Coffee },
    AFTERNOON: { label: "Afternoon Break", color: "bg-purple-500/20 text-purple-400", icon: Coffee },
    AWAY: { label: "Away from Desk", color: "bg-amber-500/20 text-amber-400", icon: MapPin },
  }

  const totalBreakTime = breaks.reduce((acc, b) => acc + (b.duration || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-96 rounded-xl bg-slate-800/50 animate-pulse" />
            <div className="h-96 rounded-xl bg-slate-800/50 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Breaks</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-900/50 via-orange-900/50 to-amber-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Coffee className="h-8 w-8 text-amber-400" />
                Break Tracking
              </h1>
              <p className="mt-1 text-slate-300">Monitor your work breaks and away time</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{formatDuration(totalBreakTime)}</div>
              <div className="text-xs text-slate-400">Today's Breaks</div>
            </div>
          </div>
        </div>

        {/* Calendar Navigator */}
        <div className="rounded-xl bg-slate-900/50 p-4 backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <button
              onClick={previousDay}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {mounted ? formatDate(selectedDate, 'weekday') : 'Loading...'}
              </div>
              <div className="text-sm text-slate-300">
                {mounted ? formatDate(selectedDate, 'full') : 'Loading...'}
              </div>
            </div>
            <button
              onClick={nextDay}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Break / Quick Start */}
          <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
            <h2 className="mb-4 text-xl font-bold text-white">Break Controls</h2>
            
            {activeBreak ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-amber-500/10 p-4 ring-1 ring-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-400 animate-pulse" />
                        <span className="font-bold text-white">Break Active</span>
                      </div>
                      <p className="mt-1 text-sm text-amber-400">
                        {breakTypeConfig[activeBreak.type].label}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Started: {formatTime(activeBreak.startTime)}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => endBreak(activeBreak.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 font-medium text-white transition-all hover:from-red-700 hover:to-red-800"
                >
                  <Square className="h-5 w-5" />
                  End Break
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => startBreak("MORNING")}
                  className="flex w-full items-center gap-3 rounded-lg bg-blue-500/10 p-4 ring-1 ring-blue-500/30 transition-all hover:bg-blue-500/20"
                >
                  <Coffee className="h-5 w-5 text-blue-400" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Morning Break</div>
                    <div className="text-xs text-slate-400">15 minutes</div>
                  </div>
                  <Play className="h-5 w-5 text-blue-400" />
                </button>

                <button
                  onClick={() => startBreak("LUNCH")}
                  className="flex w-full items-center gap-3 rounded-lg bg-emerald-500/10 p-4 ring-1 ring-emerald-500/30 transition-all hover:bg-emerald-500/20"
                >
                  <Coffee className="h-5 w-5 text-emerald-400" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Lunch Break</div>
                    <div className="text-xs text-slate-400">60 minutes</div>
                  </div>
                  <Play className="h-5 w-5 text-emerald-400" />
                </button>

                <button
                  onClick={() => startBreak("AFTERNOON")}
                  className="flex w-full items-center gap-3 rounded-lg bg-purple-500/10 p-4 ring-1 ring-purple-500/30 transition-all hover:bg-purple-500/20"
                >
                  <Coffee className="h-5 w-5 text-purple-400" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Afternoon Break</div>
                    <div className="text-xs text-slate-400">15 minutes</div>
                  </div>
                  <Play className="h-5 w-5 text-purple-400" />
                </button>

                <button
                  onClick={() => startBreak("AWAY", "Other")}
                  className="flex w-full items-center gap-3 rounded-lg bg-amber-500/10 p-4 ring-1 ring-amber-500/30 transition-all hover:bg-amber-500/20"
                >
                  <MapPin className="h-5 w-5 text-amber-400" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Away from Desk</div>
                    <div className="text-xs text-slate-400">Meeting, bathroom, etc.</div>
                  </div>
                  <Play className="h-5 w-5 text-amber-400" />
                </button>
              </div>
            )}
          </div>

          {/* Break Statistics */}
          <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
            <h2 className="mb-4 text-xl font-bold text-white">Today's Summary</h2>
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Breaks</span>
                  <span className="text-xl font-bold text-white">{breaks.length}</span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Time</span>
                  <span className="text-xl font-bold text-white">{formatDuration(totalBreakTime)}</span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Average Duration</span>
                  <span className="text-xl font-bold text-white">
                    {breaks.length > 0 ? formatDuration(Math.round(totalBreakTime / breaks.length)) : '0m'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Break Log */}
        <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
          <h2 className="mb-4 text-xl font-bold text-white">
            Break Log for {mounted ? selectedDate.toLocaleDateString() : 'Loading...'}
          </h2>
          {breaks.length === 0 ? (
            <div className="rounded-xl bg-slate-800/50 p-8 text-center ring-1 ring-white/5">
              <p className="text-slate-400">No breaks logged for this day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {breaks.map((breakItem) => {
                const config = breakTypeConfig[breakItem.type]
                return (
                  <div
                    key={breakItem.id}
                    className="flex items-center justify-between rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
                        <config.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{config.label}</div>
                        {breakItem.reason && (
                          <div className="text-xs text-slate-400">Reason: {breakItem.reason}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">
                        {formatTime(breakItem.startTime)} - {breakItem.endTime ? formatTime(breakItem.endTime) : 'Active'}
                      </div>
                      {breakItem.duration && (
                        <div className="text-xs text-slate-400">{formatDuration(breakItem.duration)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
