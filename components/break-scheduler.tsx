"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
    { type: 'MORNING', label: 'Morning Break', scheduledStart: '10:00', scheduledEnd: '10:15' },
    { type: 'LUNCH', label: 'Lunch Break', scheduledStart: '12:00', scheduledEnd: '13:00' },
    { type: 'AFTERNOON', label: 'Afternoon Break', scheduledStart: '15:00', scheduledEnd: '15:15' }
  ])
  const [loading, setLoading] = useState(false)
  
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
            scheduledEnd: convertTo12Hour(b.scheduledEnd)
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
              <h2 className="text-2xl font-bold text-white">Schedule Your Breaks</h2>
              <p className="text-sm text-slate-400">For today's shift</p>
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
                    {b.type === 'LUNCH' ? '60 min' : '15 min'}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
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
                  <span className="text-slate-400">to</span>
                  <input
                    type="time"
                    value={b.scheduledEnd}
                    onChange={(e) => {
                      const updated = [...breaks]
                      updated[i].scheduledEnd = e.target.value
                      setBreaks(updated)
                    }}
                    className="flex-1 bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
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

