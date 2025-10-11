"use client"

import { useState, useEffect } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Shield, MousePointer, Keyboard, Clock, Monitor, AlertCircle } from "lucide-react"

interface TrackingConsentProps {
  onConsent: (accepted: boolean) => void
}

export default function TrackingConsent({ onConsent }: TrackingConsentProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('tracking_consent')
    
    if (consent === null) {
      // Show consent dialog
      setOpen(true)
    } else {
      // Already consented
      onConsent(consent === 'true')
    }
  }, [onConsent])

  const handleAccept = () => {
    localStorage.setItem('tracking_consent', 'true')
    localStorage.setItem('tracking_consent_date', new Date().toISOString())
    setOpen(false)
    onConsent(true)
  }

  const handleDecline = () => {
    localStorage.setItem('tracking_consent', 'false')
    setOpen(false)
    onConsent(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-2xl text-white">
            <Shield className="h-8 w-8 text-blue-400" />
            Performance Tracking Consent
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300 space-y-4 pt-4">
            <p className="text-base leading-relaxed">
              To monitor productivity and help improve your work experience, this application needs your consent to track performance metrics on your desktop.
            </p>

            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                What We Track
              </h3>
              
              <div className="grid gap-2">
                <div className="flex items-start gap-3">
                  <MousePointer className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <div className="text-white font-medium">Mouse Activity</div>
                    <div className="text-sm text-slate-400">Movement counts and click counts (not position or content)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Keyboard className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <div>
                    <div className="text-white font-medium">Keyboard Activity</div>
                    <div className="text-sm text-slate-400">Keystroke counts only (no actual content recorded)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="text-white font-medium">Time Tracking</div>
                    <div className="text-sm text-slate-400">Active time, idle time, and screen time</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Monitor className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div>
                    <div className="text-white font-medium">Application Usage</div>
                    <div className="text-sm text-slate-400">Which applications are being used (names only)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
              <h3 className="font-semibold text-blue-200 mb-2">Privacy Protection</h3>
              <ul className="space-y-1 text-sm text-blue-100">
                <li>• No keystroke content is recorded (only counts)</li>
                <li>• No screenshots are taken automatically</li>
                <li>• No personal data or file content is accessed</li>
                <li>• You can pause tracking at any time</li>
                <li>• All data is encrypted and securely stored</li>
              </ul>
            </div>

            <p className="text-sm text-slate-400 italic">
              By clicking Accept, you consent to performance tracking as described above. You can revoke this consent at any time in the settings.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleDecline}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            Decline
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAccept}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Accept & Enable Tracking
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

