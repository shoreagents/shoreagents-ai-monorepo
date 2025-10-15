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
    duration: number // expected duration in minutes
  } | null
  onEnd: () => void
  onPause: () => void
  onResume: () => void
  onClose: () => void // Close modal without ending break
}

export function BreakModal({ isOpen, breakData, onEnd, onPause, onResume, onClose }: BreakModalProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const [debugCount, setDebugCount] = useState(0)
  const [elapsedWhenPaused, setElapsedWhenPaused] = useState(0)
  const [totalPausedDuration, setTotalPausedDuration] = useState(0)
  const [originalStartTime, setOriginalStartTime] = useState<number | null>(null)
  const [hasUsedPause, setHasUsedPause] = useState(false)
  const [showReturnPopup, setShowReturnPopup] = useState(false) // NEW: Show "I'm Back" popup
  
  const expectedDurationMinutes = breakData?.duration || 15
  const expectedDurationSeconds = expectedDurationMinutes * 60
  
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
  
  // Lock in the original start time when break first starts
  useEffect(() => {
    if (breakData && !originalStartTime) {
      const startTime = new Date(breakData.startTime || new Date()).getTime()
      setOriginalStartTime(startTime)
      console.log("🔒 LOCKED ORIGINAL START TIME:", new Date(startTime).toLocaleTimeString())
    }
  }, [breakData, originalStartTime])
  
  // Timer effect
  useEffect(() => {
    if (!isOpen || !breakData || !originalStartTime) return
    
    console.log("⏰ TIMER STARTED - Original start:", new Date(originalStartTime).toLocaleTimeString(), "| Total paused:", totalPausedDuration, "seconds")
    
    const interval = setInterval(() => {
      if (!isPaused) {
        const now = Date.now()
        const actualElapsed = Math.floor((now - originalStartTime) / 1000)
        
        // Subtract total paused duration to get true elapsed work time
        const trueElapsed = actualElapsed - totalPausedDuration
        
        setElapsedSeconds(trueElapsed)
        setDebugCount(prev => prev + 1)
        
        console.log(`⏱️ TICK #${debugCount} - True Elapsed: ${trueElapsed}s (actual: ${actualElapsed}s - paused: ${totalPausedDuration}s), Remaining: ${expectedDurationSeconds - trueElapsed}s`)
        
                // Show "I'm Back" popup when duration is reached
                if (trueElapsed >= expectedDurationSeconds) {
                  console.log("⏰ BREAK TIME COMPLETE - Showing return popup")
                  clearInterval(interval)
                  setShowReturnPopup(true)
                }
      }
    }, 1000)
    
    return () => {
      console.log("🛑 TIMER STOPPED")
      clearInterval(interval)
    }
  }, [isOpen, breakData?.id, isPaused, totalPausedDuration, originalStartTime])
  
  const handlePause = () => {
    console.log("⏸️ PAUSING at", elapsedSeconds, "seconds (ONE-TIME USE)")
    setIsPaused(true)
    setHasUsedPause(true) // Mark pause as used - can't pause again!
    setElapsedWhenPaused(elapsedSeconds)
    setPausedAt(Date.now())
    onPause()
    onClose()
  }
  
  const handleResume = () => {
    const pauseDuration = pausedAt ? Math.floor((Date.now() - pausedAt) / 1000) : 0
    const newTotalPaused = totalPausedDuration + pauseDuration
    
    console.log("▶️ RESUMING - Was paused for", pauseDuration, "seconds | Total paused:", newTotalPaused, "seconds")
    
    setIsPaused(false)
    setTotalPausedDuration(newTotalPaused) // Add this pause to total
    setPausedAt(null)
    onResume()
  }
  
  const handleEnd = () => {
    // Show confirmation
    if (confirm("⚠️ Are you sure you want to END this break?\n\nThis will be logged as your break and you cannot start another one of this type today.")) {
      // Reset all state
      setOriginalStartTime(null)
      setTotalPausedDuration(0)
      setElapsedWhenPaused(0)
      setElapsedSeconds(0)
      setHasUsedPause(false)
      setShowReturnPopup(false)
      onEnd()
    }
  }
  
  const handleImBack = () => {
    console.log("✅ STAFF CONFIRMED RETURN - Actual return time:", new Date().toLocaleTimeString())
    // Reset all state
    setOriginalStartTime(null)
    setTotalPausedDuration(0)
    setElapsedWhenPaused(0)
    setElapsedSeconds(0)
    setHasUsedPause(false)
    setShowReturnPopup(false)
    onEnd()
  }
  
  // Calculate remaining time
  const remainingSeconds = Math.max(0, expectedDurationSeconds - elapsedSeconds)
  const remainingMinutes = Math.floor(remainingSeconds / 60)
  const remainingSecondsDisplay = remainingSeconds % 60
  
  // Calculate progress percentage
  const progressPercent = Math.min(100, (elapsedSeconds / expectedDurationSeconds) * 100)
  
  // Format elapsed time
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  const elapsedSecondsDisplay = elapsedSeconds % 60
  
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
                {isPaused ? (
                  <div className="flex items-center justify-center gap-2 text-yellow-400 animate-pulse">
                    <Pause className="h-5 w-5" />
                    <p className="text-lg font-semibold">PAUSED - Resume when ready</p>
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
            {hasUsedPause && !isPaused && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg text-center">
                <p className="text-sm text-yellow-400 font-semibold">
                  ⚠️ You've used your pause. This break cannot be paused again.
                </p>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              {!isPaused ? (
                <>
                  {!hasUsedPause && (
                    <Button
                      onClick={handlePause}
                      size="lg"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-8 text-lg"
                    >
                      <Pause className="mr-2 h-5 w-5" />
                      Pause Break
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
                    onClick={handleResume}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 text-lg"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Resume Break
                  </Button>
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

