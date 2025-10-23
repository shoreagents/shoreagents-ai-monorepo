"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Coffee, Pause, Play, X } from "lucide-react"

interface BreakModalProps {
  isOpen: boolean
  breakData: {
    id: string
    type: string
    startTime: string
    actualStart: string // Actual start time from database
    duration: number // expected duration in minutes
    awayReason?: string // For AWAY breaks
    isPaused?: boolean // Database pause state
    pausedDuration?: number // Total paused duration in seconds
    pauseUsed?: boolean // Whether pause has been used for this break
  } | null
  onEnd: () => void
  onEndDirect: () => void // Direct end without confirmation
  onPause: () => void
  onClose: () => void // Close modal without ending break
}

export function BreakModal({ isOpen, breakData, onEnd, onEndDirect, onPause, onClose }: BreakModalProps) {
  const [isPaused, setIsPaused] = useState(breakData?.isPaused || false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const [debugCount, setDebugCount] = useState(0)
  const [elapsedWhenPaused, setElapsedWhenPaused] = useState(0)
  const [totalPausedDuration, setTotalPausedDuration] = useState(breakData?.pausedDuration || 0)
  const [originalStartTime, setOriginalStartTime] = useState<number | null>(null)
  const [hasUsedPause, setHasUsedPause] = useState(breakData?.pauseUsed || false)
  const [localRemainingTime, setLocalRemainingTime] = useState(() => {
    // For new breaks, use full duration; for paused breaks, use pausedDuration
    if (breakData?.pausedDuration && breakData.pausedDuration > 0) {
      return breakData.pausedDuration
    }
    // For new breaks, calculate full duration
    return breakData?.type === 'LUNCH' ? 3600 : 900
  })
  
  // Update hasUsedPause when breakData changes
  useEffect(() => {
    console.log("🔍 BREAK MODAL - pauseUsed changed:", breakData?.pauseUsed)
    setHasUsedPause(breakData?.pauseUsed || false)
  }, [breakData?.pauseUsed])
  
  // Update isPaused when breakData changes
  useEffect(() => {
    console.log("🔍 BREAK MODAL - isPaused changed:", breakData?.isPaused)
    const wasPaused = isPaused
    const nowPaused = breakData?.isPaused || false
    
    setIsPaused(nowPaused)
    
    // If break was just paused, store the current elapsed time
    if (!wasPaused && nowPaused) {
      const now = Date.now()
      const actualElapsed = Math.floor((now - (originalStartTime || 0)) / 1000)
      const trueElapsed = actualElapsed - totalPausedDuration
      setElapsedWhenPaused(trueElapsed)
      console.log("⏸️ BREAK PAUSED - Storing elapsed time:", trueElapsed, "seconds")
    }
  }, [breakData?.isPaused, isPaused, originalStartTime, totalPausedDuration])
  
  // Update totalPausedDuration when breakData changes
  useEffect(() => {
    console.log("🔍 BREAK MODAL - pausedDuration changed:", breakData?.pausedDuration)
    console.log("🔍 BREAK MODAL - Setting totalPausedDuration to:", breakData?.pausedDuration || 0)
    setTotalPausedDuration(breakData?.pausedDuration || 0)
  }, [breakData?.pausedDuration])
  
  // Update local remaining time when breakData changes
  useEffect(() => {
    console.log("🔍 BREAK MODAL - Updating local remaining time:", breakData?.pausedDuration)
    if (breakData?.pausedDuration && breakData.pausedDuration > 0) {
      // For paused breaks, use the remaining time from database
      setLocalRemainingTime(breakData.pausedDuration)
    } else {
      // For new breaks, use full duration
      const fullDuration = breakData?.type === 'LUNCH' ? 3600 : 900
      setLocalRemainingTime(fullDuration)
    }
  }, [breakData?.pausedDuration, breakData?.type])
  
  // Wait for break data to be fully loaded before showing pause button
  useEffect(() => {
    if (breakData && breakData.id) {
      // Add a small delay to ensure all break data is properly loaded
      const timer = setTimeout(() => {
        console.log("🔍 BREAK MODAL - Break data loaded:", {
          id: breakData.id,
          pauseUsed: breakData.pauseUsed,
          isPaused: breakData.isPaused
        })
        setIsBreakDataLoaded(true)
      }, 500) // Wait 500ms for data to be fully loaded
      
      return () => clearTimeout(timer)
    } else {
      setIsBreakDataLoaded(false)
    }
  }, [breakData?.id, breakData?.pauseUsed, breakData?.isPaused])
  const [showReturnPopup, setShowReturnPopup] = useState(false) // NEW: Show "I'm Back" popup
  const [isInitializing, setIsInitializing] = useState(true) // NEW: Loading state while setting up timer
  const [isBreakDataLoaded, setIsBreakDataLoaded] = useState(false) // NEW: Wait for break data to be fully loaded
  
  const expectedDurationMinutes = breakData?.duration || 15
  const expectedDurationSeconds = expectedDurationMinutes * 60
  
  console.log("🔍 BREAK MODAL DURATION DEBUG:")
  console.log("  - breakData:", breakData)
  console.log("  - breakData?.duration:", breakData?.duration)
  console.log("  - expectedDurationMinutes:", expectedDurationMinutes)
  console.log("  - expectedDurationSeconds:", expectedDurationSeconds)
  
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
    AWAY: "Away from Desk"
  }
  
  const awayReasonLabels: Record<string, string> = {
    BATHROOM: "🚻 Restroom",
    NURSE: "🏥 Nurse",
    MEETING: "👥 Meeting",
    MANAGEMENT: "👔 Management",
    OTHER: "📝 Other"
  }
  
  const breakColors: Record<string, { bg: string; border: string; progress: string }> = {
    MORNING: { 
      bg: "bg-orange-500/10", 
      border: "border-orange-500/30", 
      progress: "bg-orange-500" 
    },
    LUNCH: { 
      bg: "bg-blue-500/10", 
      border: "border-blue-500/30", 
      progress: "bg-blue-500" 
    },
    AFTERNOON: { 
      bg: "bg-purple-500/10", 
      border: "border-purple-500/30", 
      progress: "bg-purple-500" 
    },
    AWAY: { 
      bg: "bg-amber-500/10", 
      border: "border-amber-500/30", 
      progress: "bg-amber-500" 
    }
  }
  
  const theme = breakColors[breakData?.type || 'MORNING'] || breakColors.MORNING
  
  // Reset initialization state when break data changes
  useEffect(() => {
    if (breakData) {
      // Always reset when break data changes to ensure fresh start
      setIsInitializing(true)
      setOriginalStartTime(null) // Reset to force recalculation
      setElapsedSeconds(0) // Reset elapsed time
      // Don't reset totalPausedDuration here - let it be set by the pausedDuration useEffect
      setElapsedWhenPaused(0) // Reset paused state
      // Always sync hasUsedPause with breakData.pauseUsed
      setHasUsedPause(breakData.pauseUsed || false)
      if (breakData.pauseUsed) {
        console.log("🔄 EXISTING BREAK - Setting hasUsedPause to true (pause was used)")
      } else {
        console.log("🔄 NEW BREAK - Setting hasUsedPause to false (pause not used)")
      }
      console.log("🔄 BREAK DATA CHANGED - Resetting all timer state")
    }
  }, [breakData?.id]) // Reset when break ID changes

  // Lock in the original start time when break first starts
  useEffect(() => {
    if (breakData && !originalStartTime) {
      // Use the actual break start time from the database to calculate correct elapsed time
      // This ensures the timer continues from where it should be, even after page reload
      const startTime = new Date(breakData.actualStart).getTime()
      setOriginalStartTime(startTime)
      
      // Calculate elapsed time based on actual start time
      const now = Date.now()
      const actualElapsed = Math.floor((now - startTime) / 1000)
      setElapsedSeconds(Math.max(0, actualElapsed)) // Ensure it's never negative
      
      setIsInitializing(false) // Timer is ready to start
      console.log("🔒 LOCKED ORIGINAL START TIME (from database):", new Date(startTime).toLocaleTimeString())
      console.log("🔒 CALCULATED ELAPSED TIME:", actualElapsed, "seconds")
    }
  }, [breakData, originalStartTime])
  
  // Timer effect
  useEffect(() => {
    if (!isOpen || !breakData || !originalStartTime || isInitializing) return
    
    console.log("⏰ TIMER STARTED - Original start:", new Date(originalStartTime).toLocaleTimeString(), "| Total paused:", totalPausedDuration, "seconds", "| isPaused:", isPaused)
    console.log("⏰ TIMER - Break data pausedDuration:", breakData?.pausedDuration, "| Local totalPausedDuration:", totalPausedDuration)
    
    const interval = setInterval(() => {
      if (!isPaused) {
        const now = Date.now()
        const actualElapsed = Math.floor((now - originalStartTime) / 1000)
        
        // Count down the local remaining time
        setLocalRemainingTime(prev => {
          const newRemaining = Math.max(0, prev - 1)
          const expectedDuration = breakData?.type === 'LUNCH' ? 3600 : 900 // 60 min for lunch, 15 min for others
          const trueElapsed = expectedDuration - newRemaining
          setElapsedSeconds(trueElapsed)
          
          // Debug logging inside the callback where trueElapsed is available
          console.log(`⏱️ TICK #${debugCount} - True Elapsed: ${trueElapsed}s (actual: ${actualElapsed}s - paused: ${totalPausedDuration}s), Remaining: ${expectedDurationSeconds - trueElapsed}s`)
          console.log(`⏱️ TICK #${debugCount} - Break data pausedDuration: ${breakData?.pausedDuration}, Local totalPausedDuration: ${totalPausedDuration}`)
          console.log(`⏱️ TICK #${debugCount} - Elapsed when paused: ${elapsedWhenPaused}s`)
          
          // Show "I'm Back" popup when duration is reached
          if (trueElapsed >= expectedDurationSeconds) {
            console.log("⏰ BREAK TIME COMPLETE - Showing return popup")
            console.log(`⏰ Auto-end triggered: ${trueElapsed}s >= ${expectedDurationSeconds}s`)
            clearInterval(interval)
            setShowReturnPopup(true)
          }
          
          return newRemaining
        })
        setDebugCount(prev => prev + 1)
      } else {
        console.log("⏸️ Timer tick skipped - break is paused")
      }
    }, 1000)
    
    return () => {
      console.log("🛑 TIMER STOPPED")
      clearInterval(interval)
    }
  }, [isOpen, breakData?.id, isPaused, totalPausedDuration, originalStartTime, isInitializing])
  
  const handlePause = () => {
    console.log("⏸️ PAUSING at", elapsedSeconds, "seconds (ONE-TIME USE)")
    setIsPaused(true)
    setHasUsedPause(true) // Mark pause as used - can't pause again!
    setElapsedWhenPaused(elapsedSeconds)
    setPausedAt(Date.now())
    onPause()
    // Don't close modal - keep it open to show paused state and resume button
  }
  
  
  const handleEnd = () => {
    // Call the parent's end break handler (which will show the TSX confirmation modal)
    onEnd()
  }
  
  const handleImBack = () => {
    console.log("✅ STAFF CONFIRMED RETURN - Actual return time:", new Date().toLocaleTimeString())
    console.log("🔄 Calling onEndDirect() to end break automatically")
    // Reset all state
    setOriginalStartTime(null)
    setTotalPausedDuration(0)
    setElapsedWhenPaused(0)
    setElapsedSeconds(0)
    setHasUsedPause(false)
    setShowReturnPopup(false)
    // Direct end without confirmation since user already confirmed they're back
    onEndDirect()
  }
  
  // Format elapsed time - ensure it's never negative
  const safeElapsedSeconds = Math.max(0, elapsedSeconds)
  const elapsedMinutes = Math.floor(safeElapsedSeconds / 60)
  const elapsedSecondsDisplay = safeElapsedSeconds % 60
  
  // Calculate remaining time - use local remaining time (counts down in real-time)
  const remainingSeconds = Math.max(0, localRemainingTime)
  const remainingMinutes = Math.floor(remainingSeconds / 60)
  const remainingSecondsDisplay = remainingSeconds % 60
  
  // Calculate progress percentage - use safe elapsed seconds
  const progressPercent = Math.min(100, (safeElapsedSeconds / expectedDurationSeconds) * 100)
  
  // Don't render if no break data (after all hooks)
  if (!breakData) {
    return null
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl p-0 border-0 bg-slate-900"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">
          {breakLabels[breakData.type] || "Break"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          You are currently on a break. Use the controls to pause, resume, or end your break.
        </DialogDescription>
        
        <div className={`relative overflow-hidden rounded-lg border-2 ${theme.border} ${theme.bg}`}>
          {showReturnPopup ? (
            /* "I'm Back" Popup */
            <>
              <div className="p-8 text-center border-b border-white/10">
                <div className="text-8xl mb-4">⏰</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Your Break Time Is Up!
                </h2>
                <p className="text-slate-300 text-lg">
                  Please confirm your return
                </p>
              </div>
              
              <div className="p-8 bg-black/20">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                    <p className="text-white font-semibold">
                      {breakLabels[breakData.type]}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      Scheduled: {expectedDurationMinutes} minutes
                    </p>
                    <p className="text-slate-400 text-sm">
                      You took: {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
                    </p>
                  </div>
                  
                  <p className="text-slate-300 text-sm">
                    Click below to record your actual return time.
                  </p>
                  
                  <Button
                    onClick={handleImBack}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-12 py-4 text-xl w-full"
                  >
                    ✅ I'm Back - Clock Return Time
                  </Button>
                  
                  <p className="text-xs text-slate-500">
                    Return time: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Normal Timer UI */
            <>
              {/* Header */}
              <div className="p-8 text-center border-b border-white/10">
                <div className="text-8xl mb-4">
                  {breakEmojis[breakData.type] || "☕"}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {breakLabels[breakData.type] || "Break Time"}
                </h2>
                {breakData.type === "AWAY" && breakData.awayReason && (
                  <div className="text-lg text-amber-300 mb-2">
                    {awayReasonLabels[breakData.awayReason] || breakData.awayReason}
                  </div>
                )}
                {isPaused ? (
                  <div className="flex items-center justify-center gap-2 text-yellow-400 animate-pulse">
                    <Pause className="h-5 w-5" />
                    <p className="text-lg font-semibold">PAUSED - Use the Resume button on the main page</p>
                  </div>
                ) : (
                  <p className="text-slate-300 text-lg">
                    Take your time and relax
                  </p>
                )}
              </div>
          
          {/* Timer Display */}
            <div className="p-8 bg-black/20">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  {isInitializing ? (
                    <div className="text-center">
                      <div className="text-6xl font-mono font-bold text-slate-400 animate-pulse">
                        --:--
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-semibold">LOADING...</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center">
                        <div className="text-6xl font-mono font-bold text-white">
                          {String(remainingMinutes).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 font-semibold">MINUTES</div>
                      </div>
                      <div className="text-5xl text-white mb-4">:</div>
                      <div className="text-center">
                        <div className="text-6xl font-mono font-bold text-white">
                          {String(remainingSecondsDisplay).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 font-semibold">SECONDS</div>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-sm text-slate-400">
                  Time Remaining
                </div>
                <div className="text-xs text-green-400 mt-2">
                  🟢 Live: Tick #{debugCount} (updating every second)
                </div>
              </div>
            
            {/* Progress Bar */}
            <div className="relative w-full h-6 bg-slate-800 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full ${theme.progress} transition-all duration-1000 ease-linear flex items-center justify-end pr-3`}
                style={{ width: `${progressPercent}%` }}
              >
                {progressPercent > 20 && (
                  <span className="text-xs font-bold text-white">
                    {Math.floor(progressPercent)}%
                  </span>
                )}
              </div>
            </div>
            
            {/* Elapsed Time */}
            <div className="text-center mt-4 text-sm text-slate-400">
              Elapsed: {String(elapsedMinutes).padStart(2, '0')}:{String(elapsedSecondsDisplay).padStart(2, '0')} / {expectedDurationMinutes} min
            </div>
          </div>
          
          {/* Controls */}
          <div className="p-8 border-t border-white/10">
            {hasUsedPause && !isPaused && isBreakDataLoaded && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg text-center">
                <p className="text-sm text-yellow-400 font-semibold">
                  ⚠️ You've used your pause. This break cannot be paused again.
                </p>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              {!isPaused ? (
                <>
                  {!hasUsedPause && isBreakDataLoaded && (
                    <Button
                      onClick={handlePause}
                      size="lg"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-8 text-lg"
                    >
                      <Pause className="mr-2 h-5 w-5" />
                      Pause Break
                    </Button>
                  )}
                  {!isBreakDataLoaded && (
                    <Button
                      disabled
                      size="lg"
                      className="bg-gray-600 text-white font-semibold px-8 text-lg cursor-not-allowed"
                    >
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Loading Break Status...
                    </Button>
                  )}
                  <Button
                    onClick={handleEnd}
                    size="lg"
                    variant="destructive"
                    className="font-semibold px-8 text-lg"
                  >
                    <X className="mr-2 h-5 w-5" />
                    End Break
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleEnd}
                    size="lg"
                    variant="destructive"
                    className="font-semibold px-8 text-lg"
                  >
                    <X className="mr-2 h-5 w-5" />
                    End Break Permanently
                  </Button>
                </>
              )}
            </div>
          </div>
          
              {/* Footer Info */}
              <div className="p-4 bg-black/20 border-t border-white/10">
                <div className="text-center text-xs text-slate-400">
                  {isPaused ? (
                    <span>⏸️ Break is paused. Performance tracking is active.</span>
                  ) : (
                    <span>🔒 Break in progress. Performance tracking is paused.</span>
                  )}
                </div>
                <div className="text-center text-xs text-slate-500 mt-1">
                  💡 This break will auto-end in {remainingMinutes}:{String(remainingSecondsDisplay).padStart(2, '0')}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

