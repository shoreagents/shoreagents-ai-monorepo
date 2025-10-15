"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, LogIn, LogOut, Calendar, TrendingUp, AlertCircle, Coffee } from "lucide-react"
import { ShiftModal } from "@/components/shift-modal"
import { BreakScheduler } from "@/components/break-scheduler"
import { BreakModal } from "@/components/break-modal"

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  createdAt: string
  wasLate?: boolean
  lateBy?: number
  expectedClockIn?: string
}

interface TimeStats {
  today: number
  week: number
  month: number
}

export default function TimeTracking() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [currentSessionTime, setCurrentSessionTime] = useState("00:00:00")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<TimeStats>({ today: 0, week: 0, month: 0 })
  
  // New state for shift management
  const [showLateModal, setShowLateModal] = useState(false)
  const [showBreakScheduler, setShowBreakScheduler] = useState(false)
  const [showClockOutModal, setShowClockOutModal] = useState(false)
  const [lateMinutes, setLateMinutes] = useState(0)
  const [pendingTimeEntryId, setPendingTimeEntryId] = useState<string | null>(null)
  const [scheduledBreaks, setScheduledBreaks] = useState<any[]>([])
  const [activeBreak, setActiveBreak] = useState<any | null>(null)
  const [breakModalOpen, setBreakModalOpen] = useState(false)
  const [breakIsPaused, setBreakIsPaused] = useState(false)

  useEffect(() => {
    fetchStatus()
    fetchTimeEntries()
    fetchScheduledBreaks()
  }, [])
  
  // Fetch scheduled breaks when clocked in
  useEffect(() => {
    if (isClockedIn) {
      fetchScheduledBreaks()
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchScheduledBreaks()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isClockedIn])

  // Update current session timer every second
  useEffect(() => {
    if (isClockedIn && activeEntry) {
      const interval = setInterval(() => {
        const clockIn = new Date(activeEntry.clockIn)
        const now = new Date()
        const diff = now.getTime() - clockIn.getTime()
        
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        setCurrentSessionTime(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        )
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isClockedIn, activeEntry])
  
  // Auto-start scheduled breaks at their scheduled time
  useEffect(() => {
    if (!isClockedIn || !scheduledBreaks.length || activeBreak) return
    
    const checkScheduledBreaks = () => {
      const now = new Date()
      const currentTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
      
      console.log("🕐 CHECKING SCHEDULED BREAKS - Current time:", currentTime)
      
      // Find a break that should start now
      const breakToStart = scheduledBreaks.find(b => {
        // Skip if already started or completed
        if (b.actualStart || b.actualEnd) {
          console.log(`  ⏭️ Skipping ${b.type} - already started/completed`)
          return false
        }
        
        // Normalize both times for comparison (remove leading zeros, spaces)
        const scheduledTime = b.scheduledStart.trim()
        const normalizedCurrent = currentTime.trim()
        
        console.log(`  🔍 Comparing: "${scheduledTime}" === "${normalizedCurrent}"`)
        
        // Check if scheduledStart matches current time
        const shouldStart = scheduledTime === normalizedCurrent
        
        if (shouldStart) {
          console.log("🚨 BREAK SHOULD START NOW:", b.type, "at", currentTime)
        }
        
        return shouldStart
      })
      
      if (breakToStart) {
        console.log("🎯 AUTO-STARTING SCHEDULED BREAK:", breakToStart.type, breakToStart.id)
        handleStartBreak(breakToStart.id, breakToStart.type)
      } else {
        console.log("  ⏸️ No breaks to start right now")
      }
    }
    
    // Check every 15 seconds for more accuracy
    const interval = setInterval(checkScheduledBreaks, 15000)
    
    // Also check immediately
    checkScheduledBreaks()
    
    return () => clearInterval(interval)
  }, [isClockedIn, scheduledBreaks, activeBreak])

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/time-tracking/status")
      const data = await response.json()
      
      setIsClockedIn(data.isClockedIn)
      setActiveEntry(data.activeEntry)
    } catch (error) {
      console.error("Error fetching status:", error)
    }
  }

  const fetchTimeEntries = async () => {
    try {
      const response = await fetch("/api/time-tracking")
      const data = await response.json()
      
      setTimeEntries(data.entries || [])
      calculateStats(data.entries || [])
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching time entries:", error)
      setIsLoading(false)
    }
  }
  
  const fetchScheduledBreaks = async () => {
    try {
      const response = await fetch("/api/breaks/scheduled")
      const data = await response.json()
      const breaks = data.breaks || []
      setScheduledBreaks(breaks)
      
      // Find active break (actualStart exists but actualEnd is null)
      const active = breaks.find((b: any) => b.actualStart && !b.actualEnd)
      setActiveBreak(active || null)
    } catch (error) {
      console.error("Error fetching scheduled breaks:", error)
    }
  }
  
  const handleStartBreak = async (breakId: string | null, breakType: string) => {
    console.log("🚀 STARTING BREAK:", { breakId, breakType })
    try {
      const response = await fetch("/api/breaks/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breakId, type: breakType }),
      })
      
      const data = await response.json()
      console.log("✅ BREAK START RESPONSE:", data)
      
      if (response.ok) {
        // Set expected duration based on break type
        const durations: Record<string, number> = {
          MORNING: 1,  // 🧪 TESTING MODE (normally 15)
          LUNCH: 1,    // 🧪 TESTING MODE (normally 60)
          AFTERNOON: 1, // 🧪 TESTING MODE (normally 15)
          AWAY: 1      // 🧪 TESTING MODE (normally 15)
        }
        
        const breakWithDuration = {
          ...data.break,
          startTime: data.break.actualStart || new Date().toISOString(),
          duration: durations[breakType] || 1  // 🧪 TESTING MODE (normally 15)
        }
        
        setActiveBreak(breakWithDuration)
        setBreakModalOpen(true)
        setBreakIsPaused(false)
        fetchTimeEntries()
        fetchScheduledBreaks()
        // Show success toast (no alert)
      } else {
        console.error("❌ BREAK START ERROR:", data.error)
      }
    } catch (error) {
      console.error("❌ BREAK START EXCEPTION:", error)
    }
  }
  
  const handleEndBreak = async () => {
    if (!activeBreak) return
    console.log("🛑 ENDING BREAK:", activeBreak.id)
    
    try {
      const endResponse = await fetch(`/api/breaks/${activeBreak.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          endTime: new Date().toISOString() 
        }),
      })
      
      const endData = await endResponse.json()
      console.log("✅ BREAK END RESPONSE:", endData)
      
      if (endResponse.ok) {
        // Clear state immediately and refresh time entries
        setActiveBreak(null)
        setBreakModalOpen(false)
        setBreakIsPaused(false)
        
        // Refresh data immediately without waiting
        fetchTimeEntries()
        
        // Fetch scheduled breaks but DON'T let it override the null activeBreak
        // We've already ended the break, so just update the list for display
        const breaksResponse = await fetch("/api/breaks/scheduled")
        const breaksData = await breaksResponse.json()
        const breaks = breaksData.breaks || []
        setScheduledBreaks(breaks)
        
        console.log("🔍 BREAK LIST UPDATED - activeBreak stays NULL for manual breaks to show")
      } else {
        console.error("❌ BREAK END ERROR:", endData.error)
      }
    } catch (error) {
      console.error("❌ BREAK END EXCEPTION:", error)
    }
  }
  
  const handlePauseBreak = () => {
    console.log("⏸️ PAUSING BREAK (Modal closes, staff can work)")
    setBreakIsPaused(true)
    // TODO: Notify Electron to resume performance tracking
  }
  
  const handleResumeBreak = () => {
    console.log("▶️ RESUMING BREAK (Modal reopens)")
    setBreakIsPaused(false)
    setBreakModalOpen(true)
    // TODO: Notify Electron to pause performance tracking
  }
  
  const handleCloseBreakModal = () => {
    console.log("🚪 CLOSING BREAK MODAL (break still active)")
    setBreakModalOpen(false)
  }

  const calculateStats = (entries: TimeEntry[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let todayHours = 0
    let weekHours = 0
    let monthHours = 0

    entries.forEach((entry) => {
      const entryDate = new Date(entry.clockIn)
      const hours = Number(entry.totalHours) || 0

      if (entryDate >= today) {
        todayHours += hours
      }
      if (entryDate >= weekAgo) {
        weekHours += hours
      }
      if (entryDate >= monthAgo) {
        monthHours += hours
      }
    })

    setStats({
      today: Math.round(todayHours * 100) / 100,
      week: Math.round(weekHours * 100) / 100,
      month: Math.round(monthHours * 100) / 100,
    })
  }

  const handleClockIn = async () => {
    try {
      console.log("🚀 CLOCK IN CLICKED - NEW VERSION WITH SHIFT MANAGEMENT!")
      
      const response = await fetch("/api/time-tracking/clock-in", {
        method: "POST",
      })

      const data = await response.json()
      
      console.log("📦 RAW RESPONSE:", response.ok, data)
      
      if (!response.ok) {
        console.error("❌ Clock-in failed:", data)
        alert(data.error || "Failed to clock in")
        return
      }

      console.log("✅ CLOCK-IN SUCCESS!")
      console.log("📊 Was Late?", data.wasLate)
      console.log("⏰ Late By:", data.lateBy, "minutes")
      console.log("☕ Show Break Scheduler?", data.showBreakScheduler)
      console.log("📝 Message:", data.message)
      
      // Store pending time entry ID for break scheduler
      if (data.timeEntry?.id) {
        setPendingTimeEntryId(data.timeEntry.id)
      }
      
      // Show late modal FIRST if late
      // Break scheduler will show AFTER late modal is dismissed
      if (data.wasLate && data.lateBy > 0) {
        setLateMinutes(data.lateBy)
        setShowLateModal(true)
      } else if (data.showBreakScheduler && data.timeEntry?.id) {
        // If not late, show break scheduler immediately
        setShowBreakScheduler(true)
      }

      await fetchStatus()
      await fetchTimeEntries()
    } catch (error) {
      console.error("Error clocking in:", error)
      alert("Failed to clock in")
    }
  }

  const handleClockOut = async () => {
    // Show clock-out modal with reason selector
    setShowClockOutModal(true)
  }
  
  const handleClockOutConfirm = async (reason: string) => {
    try {
      const response = await fetch("/api/time-tracking/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, notes: "" }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        alert(data.error || "Failed to clock out")
        return
      }

      console.log("✅ Clock-out response:", data)
      
      setShowClockOutModal(false)
      await fetchStatus()
      await fetchTimeEntries()
      setCurrentSessionTime("00:00:00")
      
      // Show success message with net work hours
      if (data.totalHours) {
        alert(`Clocked out successfully!\nNet work hours: ${data.totalHours}h\nBreak time: ${data.breakTime || 0}h`)
      }
    } catch (error) {
      console.error("Error clocking out:", error)
      alert("Failed to clock out")
    }
  }
  
  const handleBreakScheduled = () => {
    setShowBreakScheduler(false)
    setPendingTimeEntryId(null)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* DEBUG BANNER */}
        <div className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-center">
          <p className="text-white font-bold text-lg">
            🎉 NEW SHIFT MANAGEMENT UI LOADED! v2.0
          </p>
          <p className="text-white/80 text-sm">
            With late detection, break scheduling, and clock-out reasons!
          </p>
        </div>
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Time Tracking</h1>
            <p className="text-slate-400">Clock in and out to track your work hours</p>
          </div>
        </div>

        {/* Clock In/Out Card */}
        <Card className="border-white/10 bg-slate-800/50 backdrop-blur">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-6">
              {/* Status */}
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      isClockedIn
                        ? "animate-pulse bg-green-500"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="text-lg font-medium text-white">
                    {isClockedIn ? "Clocked In" : "Clocked Out"}
                  </span>
                </div>
                
                {/* Shift Status (Late/On Time) */}
                {isClockedIn && activeEntry?.wasLate && (
                  <div className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-1 border border-red-500/20">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">
                      Clocked in {activeEntry.lateBy} min late
                    </span>
                  </div>
                )}
                
                {isClockedIn && activeEntry && !activeEntry.wasLate && (
                  <div className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 px-3 py-1 border border-green-500/20">
                    <span className="text-sm font-medium text-green-400">
                      ✓ On Time
                    </span>
                  </div>
                )}
                
                {isClockedIn && (
                  <div className="text-4xl font-bold tabular-nums text-indigo-400">
                    {currentSessionTime}
                  </div>
                )}
              </div>

              {/* Clock In/Out Button */}
              <Button
                onClick={isClockedIn ? handleClockOut : handleClockIn}
                size="lg"
                className={`h-20 w-full max-w-sm text-lg font-semibold ${
                  isClockedIn
                    ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                    : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                }`}
              >
                {isClockedIn ? (
                  <>
                    <LogOut className="mr-2 h-6 w-6" />
                    Clock Out
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-6 w-6" />
                    Clock In
                  </>
                )}
              </Button>

              {isClockedIn && activeEntry && (
                <div className="text-center text-sm text-slate-400">
                  Started at {formatTime(activeEntry.clockIn)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Full-Screen Break Modal */}
        <BreakModal
          isOpen={breakModalOpen}
          breakData={activeBreak}
          onEnd={handleEndBreak}
          onPause={handlePauseBreak}
          onResume={handleResumeBreak}
          onClose={handleCloseBreakModal}
        />

        {/* Paused Break - Resume Button */}
        {activeBreak && breakIsPaused && !breakModalOpen && (
          <Card className="border-yellow-500/30 bg-yellow-500/10 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {activeBreak.type === "MORNING" && "☕"}
                    {activeBreak.type === "LUNCH" && "🍽️"}
                    {activeBreak.type === "AFTERNOON" && "🍵"}
                    {activeBreak.type === "AWAY" && "🚶"}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-400">
                      Break Paused
                    </div>
                    <div className="text-sm text-slate-300">
                      {activeBreak.type === "MORNING" && "Morning Break"}
                      {activeBreak.type === "LUNCH" && "Lunch Break"}
                      {activeBreak.type === "AFTERNOON" && "Afternoon Break"}
                      {activeBreak.type === "AWAY" && "Away from Desk"}
                      {" · Click Resume when ready"}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleResumeBreak}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
                >
                  ▶️ Resume Break
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Breaks */}
        {isClockedIn && !activeBreak && (
          <Card className="border-white/10 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Coffee className="h-5 w-5 text-indigo-400" />
                Start a Break
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                Take a break anytime during your shift
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Morning Break - Only show if NOT scheduled */}
                {!scheduledBreaks.some(b => b.type === "MORNING" && b.scheduledStart) && (
                  <button
                    onClick={() => handleStartBreak(null, "MORNING")}
                    disabled={scheduledBreaks.some(b => b.type === "MORNING" && b.actualEnd)}
                    className="w-full flex items-center justify-between rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 hover:bg-orange-500/15 hover:border-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">☕</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Morning Break</div>
                        <div className="text-xs text-slate-400">🧪 1 min (normally 15)</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-orange-400">
                      {scheduledBreaks.some(b => b.type === "MORNING" && b.actualEnd) ? "✓ Taken" : "Start Now →"}
                    </div>
                  </button>
                )}

                {/* Lunch Break - Only show if NOT scheduled */}
                {!scheduledBreaks.some(b => b.type === "LUNCH" && b.scheduledStart) && (
                  <button
                    onClick={() => handleStartBreak(null, "LUNCH")}
                    disabled={scheduledBreaks.some(b => b.type === "LUNCH" && b.actualEnd)}
                    className="w-full flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 hover:bg-blue-500/15 hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍽️</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Lunch Break</div>
                        <div className="text-xs text-slate-400">🧪 1 min (normally 60)</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-blue-400">
                      {scheduledBreaks.some(b => b.type === "LUNCH" && b.actualEnd) ? "✓ Taken" : "Start Now →"}
                    </div>
                  </button>
                )}

                {/* Afternoon Break - Only show if NOT scheduled */}
                {!scheduledBreaks.some(b => b.type === "AFTERNOON" && b.scheduledStart) && (
                  <button
                    onClick={() => handleStartBreak(null, "AFTERNOON")}
                    disabled={scheduledBreaks.some(b => b.type === "AFTERNOON" && b.actualEnd)}
                    className="w-full flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 hover:bg-purple-500/15 hover:border-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍵</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Afternoon Break</div>
                        <div className="text-xs text-slate-400">🧪 1 min (normally 15)</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-purple-400">
                      {scheduledBreaks.some(b => b.type === "AFTERNOON" && b.actualEnd) ? "✓ Taken" : "Start Now →"}
                    </div>
                  </button>
                )}

                {/* Away from Desk (Always available) */}
                <div className="relative mt-4">
                  <div className="absolute -top-2 left-3 bg-amber-500 text-xs font-bold text-black px-2 py-0.5 rounded-full z-10">
                    ALWAYS AVAILABLE
                  </div>
                  <button
                    onClick={() => handleStartBreak(null, "AWAY")}
                    className="w-full flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 hover:bg-amber-500/15 hover:border-amber-500/50 transition-all mt-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚶</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Away from Desk</div>
                        <div className="text-xs text-slate-400">Restroom, water, quick break</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-amber-400">
                      Start Now →
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scheduled Breaks */}
        {isClockedIn && scheduledBreaks.length > 0 && (
          <Card className="border-white/10 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Coffee className="h-5 w-5 text-indigo-400" />
                Today's Scheduled Breaks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scheduledBreaks.map((breakItem) => {
                  const isOnBreak = breakItem.actualStart && !breakItem.actualEnd
                  const isCompleted = breakItem.actualEnd
                  
                  // Parse time strings like "10:00 AM" into Date objects
                  const parseTimeString = (timeStr: string) => {
                    if (!timeStr) return new Date()
                    const [time, period] = timeStr.split(' ')
                    const [hours, minutes] = time.split(':')
                    let hour = parseInt(hours)
                    if (period === 'PM' && hour !== 12) hour += 12
                    if (period === 'AM' && hour === 12) hour = 0
                    
                    const date = new Date()
                    date.setHours(hour, parseInt(minutes), 0, 0)
                    return date
                  }
                  
                  const scheduledStart = parseTimeString(breakItem.scheduledStart)
                  const scheduledEnd = parseTimeString(breakItem.scheduledEnd)
                  
                  const breakEmojis: Record<string, string> = {
                    MORNING: "☕",
                    LUNCH: "🍽️",
                    AFTERNOON: "🍵",
                    AWAY: "🚶"
                  }
                  
                  const breakLabels: Record<string, string> = {
                    MORNING: "Morning Break",
                    LUNCH: "Lunch Break",
                    AFTERNOON: "Afternoon Break",
                    AWAY: "Away From Desk"
                  }
                  
                  return (
                    <div
                      key={breakItem.id}
                      className={`flex items-center justify-between rounded-lg border p-4 ${
                        isCompleted
                          ? "border-green-500/20 bg-green-500/5"
                          : isOnBreak
                          ? "border-yellow-500/30 bg-yellow-500/10 animate-pulse"
                          : "border-indigo-500/20 bg-indigo-500/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{breakEmojis[breakItem.type] || "☕"}</span>
                        <div>
                          <div className="font-medium text-white">
                            {breakLabels[breakItem.type] || breakItem.type}
                          </div>
                          <div className="text-sm text-slate-400">
                            {scheduledStart.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit"
                            })} - {scheduledEnd.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit"
                            })}
                          </div>
                          {isOnBreak && (
                            <div className="text-xs font-medium text-yellow-400 mt-1">
                              ⚠️ Currently on break
                            </div>
                          )}
                          {isCompleted && breakItem.isLate && (
                            <div className="text-xs font-medium text-red-400 mt-1">
                              Returned {breakItem.lateBy} min late
                            </div>
                          )}
                        </div>
                      </div>
                      {!isCompleted && !isOnBreak && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                            🤖 Auto-starts at {scheduledStart.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit"
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            System will prompt you
                          </span>
                        </div>
                      )}
                      {isCompleted && (
                        <span className="text-sm font-medium text-green-400">
                          ✓ Complete
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-white/10 bg-slate-800/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Today
              </CardTitle>
              <Calendar className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.today}h
              </div>
              <p className="text-xs text-slate-400">
                Hours worked today
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-800/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                This Week
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.week}h
              </div>
              <p className="text-xs text-slate-400">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-800/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                This Month
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.month}h
              </div>
              <p className="text-xs text-slate-400">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Time Entry History */}
        <Card className="border-white/10 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Time Entry History</CardTitle>
          </CardHeader>
          <CardContent>
            {timeEntries.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Clock className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                <p>No time entries yet</p>
                <p className="text-sm">Clock in to start tracking your work hours</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg bg-slate-900/50 p-4"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {formatDate(entry.clockIn)}
                      </div>
                      <div className="text-sm text-slate-400">
                        {formatTime(entry.clockIn)} -{" "}
                        {entry.clockOut ? (
                          formatTime(entry.clockOut)
                        ) : (
                          <span className="text-green-400">In Progress</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {entry.totalHours ? (
                        <>
                          <div className="text-xl font-bold text-white">
                            {Number(entry.totalHours).toFixed(2)}h
                          </div>
                          <div className="text-xs text-slate-400">
                            {Math.round(Number(entry.totalHours) * 60)} minutes
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                          <span className="text-sm text-green-400">Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Shift Management Modals */}
      <ShiftModal
        isOpen={showLateModal}
        type="late-clock-in"
        data={{ lateBy: lateMinutes, expectedTime: activeEntry?.expectedClockIn }}
        onAction={() => {
          setShowLateModal(false)
          // Show break scheduler after late modal if needed
          if (pendingTimeEntryId && !activeEntry?.breaksScheduled) {
            setShowBreakScheduler(true)
          }
        }}
      />
      
      {pendingTimeEntryId && (
        <BreakScheduler
          isOpen={showBreakScheduler}
          timeEntryId={pendingTimeEntryId}
          onScheduled={handleBreakScheduled}
          onSkip={handleBreakScheduled}
        />
      )}
      
      <ShiftModal
        isOpen={showClockOutModal}
        type="clock-out"
        data={{}}
        onAction={handleClockOutConfirm}
        onDismiss={() => setShowClockOutModal(false)}
      />
    </div>
  )
}
