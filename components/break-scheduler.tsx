"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Coffee, Lock } from "lucide-react"

interface BreakSchedulerProps {
  isOpen: boolean
  timeEntryId: string
  onScheduled: () => void
  onSkip: () => void
}

export function BreakScheduler({ isOpen, timeEntryId, onScheduled, onSkip }: BreakSchedulerProps) {
  const [breaks, setBreaks] = useState([
    { type: 'MORNING', label: 'Morning Break', duration: 15, scheduledStart: '10:00' },
    { type: 'LUNCH', label: 'Lunch Break', duration: 60, scheduledStart: '12:00' },
    { type: 'AFTERNOON', label: 'Afternoon Break', duration: 15, scheduledStart: '15:00' }
  ])
  const [loading, setLoading] = useState(false)
  
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
    const endHour = endDate.getHours()
    const endMin = endDate.getMinutes()
    
    const period = endHour >= 12 ? 'PM' : 'AM'
    const hour12 = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour
    return `${hour12}:${String(endMin).padStart(2, '0')} ${period}`
  }
  
  const handleSchedule = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/time-tracking/schedule-breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timeEntryId, 
          breaks: breaks.map(b => ({
            type: b.type,
            scheduledStart: convertTo12Hour(b.scheduledStart),
            scheduledEnd: calculateEndTime(b.scheduledStart, b.duration)
          }))
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        onScheduled()
      } else {
        alert(data.error || 'Failed to schedule breaks')
      }
    } catch (error) {
      console.error('Error scheduling breaks:', error)
      alert('Failed to schedule breaks')
    } finally {
      setLoading(false)
    }
  }
  
  const convertTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${hour12}:${minutes} ${period}`
  }
  
  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-full bg-indigo-500/10 p-3">
              <Coffee className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Schedule Your Breaks</DialogTitle>
              <DialogDescription className="text-sm text-slate-400">For today's shift</DialogDescription>
            </div>
          </div>
          
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
            <Lock className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300 mb-1">
                Breaks will be locked in
              </p>
              <p className="text-xs text-slate-400">
                Once you set your break schedule, it cannot be changed for today's shift.
              </p>
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            {breaks.map((b, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white">{b.label}</span>
                  <span className="text-xs text-slate-400">
                    {b.duration} min duration
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-slate-400 w-16">Start:</label>
                    <input
                      type="time"
                      value={b.scheduledStart}
                      onChange={(e) => {
                        const updated = [...breaks]
                        updated[i].scheduledStart = e.target.value
                        setBreaks(updated)
                      }}
                      className="flex-1 bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 items-center text-sm">
                    <span className="text-slate-500 w-16">Ends:</span>
                    <span className="text-slate-300">
                      {calculateEndTime(b.scheduledStart, b.duration)} (auto)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={onSkip}
              variant="outline"
              className="flex-1 border-slate-700 hover:bg-slate-800"
              disabled={loading}
            >
              Skip (Default Times)
            </Button>
            <Button
              onClick={handleSchedule}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 'Locking In...' : 'Lock In Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

