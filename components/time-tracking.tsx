"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, LogIn, LogOut, Calendar, TrendingUp, AlertCircle, Coffee } from "lucide-react"
import { ShiftModal } from "@/components/shift-modal"
import { BreakScheduler } from "@/components/break-scheduler"

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

  useEffect(() => {
    fetchStatus()
    fetchTimeEntries()
  }, [])

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
      const response = await fetch("/api/time-tracking/clock-in", {
        method: "POST",
      })

      const data = await response.json()
      
      if (!response.ok) {
        alert(data.error || "Failed to clock in")
        return
      }

      console.log("✅ Clock-in response:", data)
      
      // Check if staff was late
      if (data.wasLate && data.lateBy > 0) {
        setLateMinutes(data.lateBy)
        setShowLateModal(true)
      }
      
      // Check if break scheduler should be shown
      if (data.showBreakScheduler && data.timeEntry?.id) {
        setPendingTimeEntryId(data.timeEntry.id)
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
        onAction={() => setShowLateModal(false)}
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
