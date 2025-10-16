"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, LogIn, LogOut, Calendar, TrendingUp, AlertCircle, Coffee } from "lucide-react"
import { ShiftModal } from "@/components/shift-modal"
import { BreakScheduler } from "@/components/break-scheduler"
import { BreakModal } from "@/components/break-modal"
import { ClockOutSummaryModal } from "@/components/clock-out-summary-modal"
import { EndBreakModal } from "@/components/end-break-modal"
import { useToast } from "@/hooks/use-toast"
import { useTimeTrackingWebSocket } from "@/hooks/use-time-tracking-websocket"
import { useWebSocket } from "@/lib/websocket-provider"

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  createdAt: string
  wasLate?: boolean
  lateBy?: number
  expectedClockIn?: string
  breaksScheduled?: boolean
}

interface TimeStats {
  today: number
  week: number
  month: number
}

export default function TimeTracking() {
  const { toast } = useToast()
  
  // Get user information from WebSocket context (already authenticated)
  const { socket } = useWebSocket()
  
  // Use WebSocket hook for all time tracking data
  const {
    isClockedIn,
    activeEntry,
    timeEntries,
    scheduledBreaks,
    activeBreak,
    weeklySchedule,
    showBreakScheduler,
    pendingTimeEntryId,
    stats,
    isLoading,
    isConnected,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    pauseBreak,
    resumeBreak,
    resetBreakScheduler,
    refreshScheduledBreaks
  } = useTimeTrackingWebSocket()
  
  // Local UI state
  const [currentSessionTime, setCurrentSessionTime] = useState("00:00:00")
  const [showLateModal, setShowLateModal] = useState(false)
  const [showClockOutModal, setShowClockOutModal] = useState(false)
  const [clockOutModalType, setClockOutModalType] = useState<'clock-out' | 'clock-out-early'>('clock-out')
  const [clockOutModalData, setClockOutModalData] = useState<any>({})
  const [showClockOutSummary, setShowClockOutSummary] = useState(false)
  const [clockOutSummaryData, setClockOutSummaryData] = useState<any>(null)
  const [lateMinutes, setLateMinutes] = useState(0)
  const [breakModalOpen, setBreakModalOpen] = useState(false)
  const [breakIsPaused, setBreakIsPaused] = useState(false)
  const [startingBreakType, setStartingBreakType] = useState<string | null>(null)
  const [isEndingBreak, setIsEndingBreak] = useState(false)
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [forceCloseBreakModal, setForceCloseBreakModal] = useState(false)
  const [breakModalForceClosed, setBreakModalForceClosed] = useState(false)
  
  // Auto clock-out states
  const [showShiftEndWarning, setShowShiftEndWarning] = useState(false)
  const [showFinalWarning, setShowFinalWarning] = useState(false)
  const [shiftEndTime, setShiftEndTime] = useState<Date | null>(null)
  const [timeUntilShiftEnd, setTimeUntilShiftEnd] = useState<string>('')
  const [countdownDisplay, setCountdownDisplay] = useState<string>('')
  const [autoClockOutTimer, setAutoClockOutTimer] = useState<NodeJS.Timeout | null>(null)
  
  // Away reason selector states
  const [showAwayReasonModal, setShowAwayReasonModal] = useState(false)
  const [selectedAwayReason, setSelectedAwayReason] = useState<string>('')
  
  // End break confirmation modal
  const [showEndBreakModal, setShowEndBreakModal] = useState(false)

  // WebSocket automatically handles data fetching, no need for manual API calls
  
  // Auto clock-out effect - runs when clocked in
  useEffect(() => {
    if (isClockedIn && weeklySchedule.length > 0) {
      startAutoClockOutTimer()
    } else {
      stopAutoClockOutTimer()
    }
    
    return () => stopAutoClockOutTimer()
  }, [isClockedIn, weeklySchedule])
  
  // Auto-open break modal when there's an active break
  useEffect(() => {
    // If force close is set, close the modal and mark it as force-closed
    if (forceCloseBreakModal) {
      setBreakModalOpen(false)
      setBreakModalForceClosed(true)
      return
    }
    
    // If modal was force-closed, don't reopen it until a new break starts
    if (breakModalForceClosed) {
      return
    }
    
    // Only open modal if there's an active break and modal is not already open
    if (activeBreak && !breakModalOpen) {
      setBreakModalOpen(true)
      setBreakModalForceClosed(false) // Reset force-closed flag when new break starts
    } 
    // Only close modal if there's no active break and modal is open
    else if (!activeBreak && breakModalOpen) {
      setBreakModalOpen(false)
    }
  }, [activeBreak, breakModalOpen, forceCloseBreakModal, breakModalForceClosed])

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
        // For scheduled AWAY breaks, use the stored awayReason
        const awayReason = breakToStart.type === "AWAY" ? breakToStart.awayReason : undefined
        handleStartBreak(breakToStart.id, breakToStart.type, awayReason)
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

  // WebSocket handles all data fetching automatically
  
  // Auto clock-out functions
  const startAutoClockOutTimer = () => {
    if (!isClockedIn || weeklySchedule.length === 0) return
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todaySchedule = weeklySchedule.find(s => s.dayOfWeek === today)
    
    if (!todaySchedule || !todaySchedule.isWorkday) return
    
    // Parse shift end time
    const parseTimeString = (timeStr: string) => {
      if (!timeStr) return null
      const [time, period] = timeStr.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      const date = new Date()
      date.setHours(hour, parseInt(minutes), 0, 0)
      return date
    }
    
    const endTime = parseTimeString(todaySchedule.endTime)
    if (!endTime) return
    
    setShiftEndTime(endTime)
    
    const checkShiftEnd = () => {
      const now = new Date()
      const timeDiff = endTime.getTime() - now.getTime()
      const minutesUntilEnd = Math.floor(timeDiff / (1000 * 60))
      
      if (minutesUntilEnd <= 0) {
        // Shift has ended - auto clock out
        handleAutoClockOut()
        return
      }
      
      // Calculate detailed countdown
      const totalSeconds = Math.floor(timeDiff / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      // Update displays
      const shortDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      const detailedDisplay = `${hours}h ${minutes}m ${seconds}s`
      
      setTimeUntilShiftEnd(shortDisplay)
      setCountdownDisplay(detailedDisplay)
      
      // Show warnings
      if (minutesUntilEnd === 15 && !showShiftEndWarning) {
        setShowShiftEndWarning(true)
        console.log("⚠️ 15-minute shift end warning")
      } else if (minutesUntilEnd === 5 && !showFinalWarning) {
        setShowFinalWarning(true)
        console.log("🚨 5-minute final warning")
      }
    }
    
    // Check immediately
    checkShiftEnd()
    
    // Check every second for precise countdown
    const timer = setInterval(checkShiftEnd, 1000)
    setAutoClockOutTimer(timer)
  }
  
  const stopAutoClockOutTimer = () => {
    if (autoClockOutTimer) {
      clearInterval(autoClockOutTimer)
      setAutoClockOutTimer(null)
    }
    setShowShiftEndWarning(false)
    setShowFinalWarning(false)
    setShiftEndTime(null)
    setTimeUntilShiftEnd('')
    setCountdownDisplay('')
  }
  
  const handleAutoClockOut = async () => {
    if (!isClockedIn) return
    
    console.log("🕐 AUTO CLOCK OUT - Shift end reached")
    
    // Check if on active break
    if (activeBreak) {
      console.log("⚠️ Auto clock-out blocked - user is on active break")
      toast({
        title: "Cannot Auto Clock Out",
        description: "Please end your active break first, then clock out manually.",
        variant: "destructive",
        duration: 8000
      })
      return
    }
    
    try {
      // Auto clock out with "END_OF_SHIFT" reason
      const response = await fetch("/api/time-tracking/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reason: "END_OF_SHIFT",
          notes: "Auto clock-out at shift end time"
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Update UI optimistically
        setShowShiftEndWarning(false)
        setShowFinalWarning(false)
        
        // WebSocket will handle the actual state updates
        
        toast({
          title: "Auto Clock Out",
          description: "You have been automatically clocked out at shift end time.",
          duration: 5000
        })
        
        console.log("✅ Auto clock-out successful")
      } else {
        console.log("⚠️ Auto clock-out failed:", data.error)
        toast({
          title: "Auto Clock Out Failed",
          description: "Please clock out manually.",
          variant: "destructive",
          duration: 5000
        })
      }
    } catch (error) {
      console.log("⚠️ Auto clock-out error:", error)
      toast({
        title: "Auto Clock Out Error",
        description: "Please clock out manually.",
        variant: "destructive",
        duration: 5000
      })
    }
  }
  
  // Away reason selector functions
  const handleAwayReasonSelect = (reason: string) => {
    setSelectedAwayReason(reason)
    setShowAwayReasonModal(false)
    // Start the away break with the selected reason
    handleStartBreak(null, "AWAY", reason)
  }
  
  const handleAwayReasonCancel = () => {
    setSelectedAwayReason('')
    setShowAwayReasonModal(false)
  }

  const handleCancelEndBreak = () => {
    console.log("🔄 CANCEL END BREAK CALLED - isEndingBreak:", isEndingBreak)
    setShowEndBreakModal(false)
  }
  
  const handleStartBreak = async (breakId: string | null, breakType: string, awayReason?: string) => {
    if (startingBreakType || !isConnected) {
      console.log("⚠️ ALREADY STARTING BREAK OR NOT CONNECTED - Ignoring duplicate click")
      return
    }
    
    // For AWAY breaks, require a reason
    if (breakType === "AWAY" && !awayReason) {
      console.log("⚠️ AWAY break requires a reason")
      toast({
        title: "Reason Required",
        description: "Please select a reason for your away break.",
        variant: "destructive",
        duration: 5000
      })
      return
    }
    
    setStartingBreakType(breakType)
    console.log("🚀 STARTING BREAK:", { breakId, breakType, awayReason })
    
    try {
      // Use WebSocket to start break
      await startBreak(breakType, awayReason)
      
      // The WebSocket event will handle the state update and modal opening
      // No need to show a toast here as the modal will appear immediately
      
    } catch (error) {
      console.log("⚠️ Error starting break:", error)
      toast({
        title: "Failed to Start Break",
        description: "An error occurred. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      // Reset loading state after a short delay to allow WebSocket processing
      setTimeout(() => setStartingBreakType(null), 500)
    }
  }
  
  const handleEndBreak = () => {
    if (!activeBreak || !isConnected) return
    if (isEndingBreak) {
      console.log("⚠️ ALREADY ENDING BREAK - Ignoring duplicate click")
      return
    }
    
    console.log("🛑 SHOWING END BREAK CONFIRMATION:", activeBreak.id)
    setShowEndBreakModal(true)
  }

  const handleConfirmEndBreak = async () => {
    console.log("🔄 CONFIRM END BREAK CALLED - activeBreak:", !!activeBreak, "isEndingBreak:", isEndingBreak)
    if (!activeBreak || !isConnected) return
    if (isEndingBreak) {
      console.log("⚠️ ALREADY ENDING BREAK - Ignoring duplicate click")
      return
    }
    
    setIsEndingBreak(true)
    console.log("🛑 CONFIRMING END BREAK:", activeBreak.id)
    
    const breakId = activeBreak.id
    
    // ⚡ IMMEDIATE UI UPDATE - Close modals instantly for better UX
    setShowEndBreakModal(false)
    setBreakModalOpen(false)
    setBreakIsPaused(false)
    setForceCloseBreakModal(true) // Force close the break modal immediately
    
    // Show success toast immediately
    toast({
      title: "Break Ended",
      description: "Your break has been ended successfully.",
      duration: 3000
    })
    
    // Continue with the actual end logic in the background (don't await)
    endBreak(breakId).catch(error => {
      console.error("❌ Error ending break:", error)
      toast({
        title: "Break End Error",
        description: "There was an issue ending your break. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    })
    
    // Reset force close flag after WebSocket processes the break end
    setTimeout(() => {
      setForceCloseBreakModal(false)
    }, 5000) // 5 seconds should be enough for WebSocket to process
    
    setIsEndingBreak(false)
  }

  const handleEndBreakDirect = async () => {
    if (!activeBreak || !isConnected) return
    if (isEndingBreak) {
      console.log("⚠️ ALREADY ENDING BREAK - Ignoring duplicate click")
      return
    }
    
    setIsEndingBreak(true)
    console.log("🛑 DIRECT END BREAK:", activeBreak.id)
    
    const breakId = activeBreak.id
    
    // ⚡ IMMEDIATE UI UPDATE - Close modals instantly for better UX
    setBreakModalOpen(false)
    setBreakIsPaused(false)
    console.log("✨ BREAK MODAL CLOSED IMMEDIATELY (direct)")
    
    // Show success toast immediately
    toast({
      title: "Break Ended",
      description: "Your break has been ended successfully.",
      duration: 3000
    })
    
    // Continue with the actual end logic in the background
    try {
      await endBreak(breakId)
      console.log("✅ BREAK ENDED SUCCESSFULLY IN BACKGROUND (direct)")
    } catch (error) {
      console.error("❌ Error ending break in background (direct):", error)
      // Show error toast if API fails
      toast({
        title: "Break End Error",
        description: "There was an issue ending your break. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setIsEndingBreak(false)
    }
  }

  // WebSocket handles break ending automatically
  
  const handlePauseBreak = () => {
    if (!activeBreak) return
    
    console.log("⏸️ PAUSING BREAK (Modal closes, staff can work)")
    setBreakIsPaused(true)
    setBreakModalOpen(false)
    
    toast({
      title: "Break Paused",
      description: "Your break has been paused. You can resume it anytime.",
      duration: 3000
    })
  }
  
  const handleResumeBreak = () => {
    if (!activeBreak) return
    
    console.log("▶️ RESUMING BREAK (Modal reopens)")
    setBreakIsPaused(false)
    setBreakModalOpen(true)
    
    toast({
      title: "Break Resumed",
      description: "Your break has been resumed.",
      duration: 3000
    })
  }
  
  const handleCloseBreakModal = () => {
    console.log("🚪 CLOSING BREAK MODAL (break still active)")
    setBreakModalOpen(false)
  }

  // WebSocket handles stats calculation automatically

  const handleClockIn = async () => {
    if (isClockingIn || !isConnected) return // Prevent duplicate clicks or if not connected
    
    try {
      console.log("🚀 CLOCK IN CLICKED - WebSocket Version!")
      
      setIsClockingIn(true)
      
      // Show loading state
      toast({
        title: "Clocking In...",
        description: "Please wait while we process your clock in.",
        duration: 2000
      })
      
      // Use WebSocket to clock in (await the promise)
      await clockIn()
      
    } catch (error) {
      console.log("⚠️ Error clocking in:", error)
      
      const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again."
      
      toast({
        title: "Clock In Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setIsClockingIn(false)
    }
  }

  const handleClockOut = async () => {
    // ⚠️ PREVENT CLOCK OUT IF ON ACTIVE BREAK
    if (activeBreak && !activeBreak.actualEnd) {
      toast({
        title: "Cannot Clock Out",
        description: "Please end your active break before clocking out!",
        variant: "destructive",
        duration: 5000
      })
      return
    }
    
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please check your connection and try again.",
        variant: "destructive",
        duration: 5000
      })
      return
    }
    
    // Get current time
    const now = new Date()
    const clockOutTime = now.toISOString()
    
    // ⚡ SHOW MODAL IMMEDIATELY
    setClockOutModalType('clock-out')
    setClockOutModalData({ clockOutTime })
    setShowClockOutModal(true)
    
    console.log("⚡ Clock-out modal shown!")
  }
  
  const handleClockOutConfirm = async (reason?: string) => {
    try {
      // Validate reason is provided
      if (!reason) {
        toast({
          title: "Reason Required",
          description: "Please select a clock-out reason to continue.",
          variant: "destructive",
          duration: 5000
        })
        return
      }
      
      if (!isConnected) {
        toast({
          title: "Not Connected",
          description: "Please check your connection and try again.",
          variant: "destructive",
          duration: 5000
        })
        return
      }
      
      // Close confirmation modal immediately
      setShowClockOutModal(false)
      
      // Show immediate feedback
      toast({
        title: "Clocking Out...",
        description: "Processing your clock out request.",
        duration: 2000
      })
      
      // Use WebSocket to clock out (non-blocking)
      clockOut(reason, "")
      
    } catch (error) {
      console.log("⚠️ Error clocking out:", error)
      toast({
        title: "Clock Out Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
        duration: 5000
      })
      // Revert
      setShowClockOutModal(true)
    }
  }
  
  const handleBreakScheduled = () => {
    // Close the break scheduler modal
    resetBreakScheduler()
    console.log("✅ Breaks scheduled successfully!")
    
    // Refresh scheduled breaks to show the newly scheduled breaks
    refreshScheduledBreaks()
    
    // Show success toast
    toast({
      title: "Breaks Scheduled",
      description: "Your break schedule has been locked in for today's shift.",
      duration: 3000
    })
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
        {/* Connection Status */}
        {!isConnected && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4 text-center">
            <p className="text-red-400 font-bold text-lg">
              ⚠️ Disconnected from Server
            </p>
            <p className="text-red-300/80 text-sm">
              Some features may not work properly. Please refresh the page.
            </p>
          </div>
        )}

        {/* DEBUG BANNER */}
        <div className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-center">
          <p className="text-white font-bold text-lg">
            🎉 NEW WEBSOCKET TIME TRACKING! v3.0
          </p>
          <p className="text-white/80 text-sm">
            Real-time updates with WebSocket technology!
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
                 disabled={isClockingIn}
                 size="lg"
                 className={`h-20 w-full max-w-sm text-lg font-semibold ${
                   isClockedIn
                     ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                     : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                 }`}
               >
                 {isClockingIn ? (
                   <>
                     <Clock className="mr-2 h-6 w-6 animate-spin" />
                     Clocking In...
                   </>
                 ) : isClockedIn ? (
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
                  {countdownDisplay && (
                    <div className="text-xs text-amber-400 mt-1 font-medium">
                      ⏰ {countdownDisplay} until shift end
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Work Schedule */}
        {weeklySchedule.length > 0 && (() => {
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
          const todaySchedule = weeklySchedule.find(s => s.dayOfWeek === today)
          
          if (!todaySchedule) return null
          
          return (
            <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-slate-800/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 ring-2 ring-indigo-500/50">
                      <Calendar className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">Today's Schedule</h3>
                        <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                      </div>
                      <p className="text-sm text-slate-400">{todaySchedule.dayOfWeek}</p>
                    </div>
                  </div>
                  
                  {todaySchedule.isWorkday ? (
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <Clock className="h-4 w-4 text-indigo-400" />
                        <span className="text-2xl font-bold text-white">
                          {todaySchedule.startTime} - {todaySchedule.endTime}
                        </span>
                      </div>
                      <div className="text-xs text-emerald-400 font-medium">
                        ✓ Work Day
                      </div>
                  {isClockedIn && countdownDisplay && (
                    <div className="text-xs text-amber-400 font-medium mt-1">
                      ⏰ {countdownDisplay} until shift end
                    </div>
                  )}
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-3xl mb-1">🏖️</div>
                      <div className="text-sm text-slate-400">Day Off</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {/* Full-Screen Break Modal */}
        <BreakModal
          isOpen={breakModalOpen}
          breakData={activeBreak}
          onEnd={handleEndBreak}
          onEndDirect={handleEndBreakDirect}
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
        {isClockedIn && (!activeBreak || forceCloseBreakModal) && (
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
                {!scheduledBreaks.some(b => b.type === "MORNING" && b.scheduledStart && b.scheduledEnd) && (
                  <button
                    onClick={() => handleStartBreak(null, "MORNING")}
                    disabled={startingBreakType !== null || scheduledBreaks.some(b => b.type === "MORNING" && b.actualEnd)}
                    className="w-full flex items-center justify-between rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 hover:bg-orange-500/15 hover:border-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">☕</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Morning Break</div>
                        <div className="text-xs text-slate-400">15 min break</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-orange-400">
                      {startingBreakType === "MORNING" ? "Starting..." : scheduledBreaks.some(b => b.type === "MORNING" && b.actualEnd) ? "✓ Taken" : "Start Now →"}
                    </div>
                  </button>
                )}

                {/* Lunch Break - Only show if NOT scheduled */}
                {!scheduledBreaks.some(b => b.type === "LUNCH" && b.scheduledStart && b.scheduledEnd) && (
                  <button
                    onClick={() => handleStartBreak(null, "LUNCH")}
                    disabled={startingBreakType !== null || scheduledBreaks.some(b => b.type === "LUNCH" && b.actualEnd)}
                    className="w-full flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 hover:bg-blue-500/15 hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍽️</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Lunch Break</div>
                        <div className="text-xs text-slate-400">60 min break</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-blue-400">
                      {startingBreakType === "LUNCH" ? "Starting..." : scheduledBreaks.some(b => b.type === "LUNCH" && b.actualEnd) ? "✓ Taken" : "Start Now →"}
                    </div>
                  </button>
                )}

                {/* Afternoon Break - Only show if NOT scheduled */}
                {!scheduledBreaks.some(b => b.type === "AFTERNOON" && b.scheduledStart && b.scheduledEnd) && (
                  <button
                    onClick={() => handleStartBreak(null, "AFTERNOON")}
                    disabled={startingBreakType !== null || scheduledBreaks.some(b => b.type === "AFTERNOON" && b.actualEnd)}
                    className="w-full flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 hover:bg-purple-500/15 hover:border-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍵</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Afternoon Break</div>
                        <div className="text-xs text-slate-400">15 min break</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-purple-400">
                      {startingBreakType === "AFTERNOON" ? "Starting..." : scheduledBreaks.some(b => b.type === "AFTERNOON" && b.actualEnd) ? "✓ Taken" : "Start Now →"}
                    </div>
                  </button>
                )}

                {/* Away from Desk (Always available - unlimited) */}
                <div className="relative mt-4">
                  <div className="absolute -top-2 left-3 bg-amber-500 text-xs font-bold text-black px-2 py-0.5 rounded-full z-10">
                    ALWAYS AVAILABLE
                  </div>
                  <button
                    onClick={() => setShowAwayReasonModal(true)}
                    disabled={startingBreakType !== null}
                    className="w-full flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 hover:bg-amber-500/15 hover:border-amber-500/50 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚶</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Away from Desk</div>
                        <div className="text-xs text-slate-400">Restroom, water, quick break</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-amber-400">
                      {startingBreakType === "AWAY" ? "Starting..." : "Start Now →"}
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
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {scheduledBreaks.map((breakItem) => {
                  const isOnBreak = breakItem.actualStart && !breakItem.actualEnd
                  const isCompleted = breakItem.actualEnd
                  
                  // Debug logging for break status
                  console.log('🔍 BREAK DATA DEBUG:', {
                    id: breakItem.id,
                    type: breakItem.type,
                    scheduledStart: breakItem.scheduledStart,
                    scheduledEnd: breakItem.scheduledEnd,
                    actualStart: breakItem.actualStart,
                    actualEnd: breakItem.actualEnd,
                    isOnBreak,
                    isCompleted
                  })
                  
                  // Parse time strings like "10:00 AM" into Date objects
                  const parseTimeString = (timeStr: string) => {
                    if (!timeStr || timeStr === 'Invalid Date') {
                      console.warn('Invalid time string:', timeStr)
                      return new Date()
                    }
                    
                    try {
                      const [time, period] = timeStr.split(' ')
                      if (!time || !period) {
                        console.warn('Invalid time format:', timeStr)
                        return new Date()
                      }
                      
                      const [hours, minutes] = time.split(':')
                      if (!hours || !minutes) {
                        console.warn('Invalid time format:', timeStr)
                        return new Date()
                      }
                      
                      let hour = parseInt(hours)
                      const min = parseInt(minutes)
                      
                      if (period === 'PM' && hour !== 12) hour += 12
                      if (period === 'AM' && hour === 12) hour = 0
                      
                      const date = new Date()
                      date.setHours(hour, min, 0, 0)
                      return date
                    } catch (error) {
                      console.error('Error parsing time string:', timeStr, error)
                      return new Date()
                    }
                  }
                  
                  // For completed breaks, show actual times; for scheduled breaks, show scheduled times
                  const startTime = isCompleted ? breakItem.actualStart : breakItem.scheduledStart
                  const endTime = isCompleted ? breakItem.actualEnd : breakItem.scheduledEnd
                  
                  // Parse dates correctly based on whether break is completed or scheduled
                  const startDate = isCompleted 
                    ? (startTime ? new Date(startTime) : new Date())
                    : parseTimeString(breakItem.scheduledStart)
                  const endDate = isCompleted 
                    ? (endTime ? new Date(endTime) : new Date())
                    : parseTimeString(breakItem.scheduledEnd)
                  
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
                  
                  const awayReasonLabels: Record<string, string> = {
                    BATHROOM: "🚻 Restroom",
                    NURSE: "🏥 Nurse",
                    MEETING: "👥 Meeting",
                    MANAGEMENT: "👔 Management",
                    OTHER: "📝 Other"
                  }
                  
                  return (
                    <div
                      key={`${breakItem.id}-${breakItem.actualStart || breakItem.scheduledStart}`}
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
                            {breakItem.type === "AWAY" && breakItem.awayReason && (
                              <span className="ml-2 text-sm text-amber-400">
                                ({awayReasonLabels[breakItem.awayReason] || breakItem.awayReason})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-400">
                            {startDate.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit"
                            })} - {endDate.toLocaleTimeString("en-US", {
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
                            🤖 Auto-starts at {parseTimeString(breakItem.scheduledStart).toLocaleTimeString("en-US", {
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
                          ✓ Completed
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
          // Break scheduler will be shown automatically via WebSocket state
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
        type={clockOutModalType}
        data={clockOutModalData}
        onAction={handleClockOutConfirm}
        onDismiss={() => setShowClockOutModal(false)}
      />
      
      {clockOutSummaryData && (
        <ClockOutSummaryModal
          isOpen={showClockOutSummary}
          data={clockOutSummaryData}
          onClose={() => setShowClockOutSummary(false)}
        />
      )}
      
      {/* End Break Confirmation Modal */}
      <EndBreakModal
        isOpen={showEndBreakModal}
        breakData={activeBreak}
        onConfirm={handleConfirmEndBreak}
        onCancel={handleCancelEndBreak}
        isEnding={isEndingBreak}
      />
      
      {/* 15-Minute Shift End Warning */}
      <ShiftModal
        isOpen={showShiftEndWarning}
        type="break-reminder"
        data={{
          title: "Shift Ending Soon",
          message: `Your shift ends in 15 minutes at ${shiftEndTime?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. Please wrap up your work and prepare to clock out.`,
          timeRemaining: countdownDisplay
        }}
        onAction={() => setShowShiftEndWarning(false)}
        onDismiss={() => setShowShiftEndWarning(false)}
      />
      
      {/* 5-Minute Final Warning */}
      <ShiftModal
        isOpen={showFinalWarning}
        type="break-reminder"
        data={{
          title: "Final Warning - Shift Ending",
          message: `Your shift ends in 5 minutes at ${shiftEndTime?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. You will be automatically clocked out.`,
          timeRemaining: countdownDisplay
        }}
        onAction={() => setShowFinalWarning(false)}
        onDismiss={() => setShowFinalWarning(false)}
      />
      
      {/* Away Reason Selector Modal */}
      {showAwayReasonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-white/10 p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🚶</div>
              <h3 className="text-xl font-bold text-white mb-2">Why are you stepping away?</h3>
              <p className="text-sm text-slate-400">Select a reason for your away break</p>
            </div>
            
            <div className="space-y-3 mb-6">
              {[
                { value: 'BATHROOM', label: 'Restroom', icon: '🚻' },
                { value: 'NURSE', label: 'Nurse', icon: '🏥' },
                { value: 'MEETING', label: 'Meeting', icon: '👥' },
                { value: 'MANAGEMENT', label: 'Management', icon: '👔' },
                { value: 'OTHER', label: 'Other', icon: '📝' }
              ].map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => handleAwayReasonSelect(reason.value)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-slate-600 bg-slate-700/50 hover:bg-slate-600/50 hover:border-amber-500/50 transition-all text-left"
                >
                  <span className="text-2xl">{reason.icon}</span>
                  <span className="text-white font-medium">{reason.label}</span>
                  <span className="ml-auto text-slate-400">→</span>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleAwayReasonCancel}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
