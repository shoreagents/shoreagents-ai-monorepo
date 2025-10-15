"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, LogOut } from "lucide-react"

interface ShiftModalProps {
  isOpen: boolean
  type: 'late-clock-in' | 'break-reminder' | 'clock-out'
  data?: any
  onAction: (selectedReason?: string) => void
  onDismiss?: () => void
}

export function ShiftModal({ isOpen, type, data, onAction, onDismiss }: ShiftModalProps) {
  const [selectedReason, setSelectedReason] = useState("")
  
  const configs = {
    'late-clock-in': {
      title: 'You Are Late for Your Shift',
      message: `Your shift started at ${data?.expectedTime}. You are ${data?.lateBy} minutes late.`,
      icon: AlertCircle,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      actionLabel: 'Clock In Now',
      canDismiss: false
    },
    'break-reminder': {
      title: 'Time for Your Break',
      message: `It's time for your ${data?.breakType} break (${data?.duration} minutes).`,
      icon: Clock,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      actionLabel: 'Start Break',
      canDismiss: true
    },
    'clock-out': {
      title: 'Are You Clocking Out?',
      message: 'Please select a reason for clocking out. This will end your shift.',
      icon: LogOut,
      iconColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      actionLabel: 'Confirm Clock Out',
      canDismiss: true
    }
  }
  
  const config = configs[type]
  const Icon = config.icon
  
  const handleAction = () => {
    if (type === 'clock-out' && !selectedReason) {
      alert('Please select a clock-out reason')
      return
    }
    onAction(type === 'clock-out' ? selectedReason : undefined)
  }
  
  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent 
        className="sm:max-w-md bg-slate-900 border-slate-700"
        onInteractOutside={(e) => !config.canDismiss && e.preventDefault()}
        onEscapeKeyDown={(e) => !config.canDismiss && e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <div className={`rounded-full ${config.bgColor} p-4`}>
            <Icon className={`h-12 w-12 ${config.iconColor}`} />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{config.title}</h2>
            <p className="text-slate-400">{config.message}</p>
          </div>
          
          {type === 'clock-out' && (
            <select 
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border-slate-700 text-white p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Select reason...</option>
              <option value="END_OF_SHIFT">End of Shift</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="SICK">Feeling Sick</option>
              <option value="EARLY_LEAVE_APPROVED">Early Leave (Approved)</option>
              <option value="INTERNET_ISSUE">Internet Issue</option>
              <option value="POWER_OUTAGE">Power Outage</option>
              <option value="PERSONAL">Personal Reason</option>
              <option value="OTHER">Other</option>
            </select>
          )}
          
          <div className="flex gap-3 w-full">
            {config.canDismiss && onDismiss && (
              <Button
                variant="outline"
                onClick={onDismiss}
                className="flex-1 border-slate-700 hover:bg-slate-800"
              >
                Not Yet
              </Button>
            )}
            <Button
              onClick={handleAction}
              className={`flex-1 bg-indigo-600 hover:bg-indigo-700 ${!config.canDismiss ? 'w-full' : ''}`}
            >
              {config.actionLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

