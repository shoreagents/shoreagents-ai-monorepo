"use client"

import { useEffect, useState } from "react"
import TrackingConsent from "./tracking-consent"
import TrackingStatus from "./tracking-status"

// File-level log to verify this module is loaded
console.log('🔥🔥🔥 [ElectronProvider] FILE LOADED 🔥🔥🔥')

declare global {
  interface Window {
    electron?: {
      isElectron: boolean
      performance?: {
        getStatus: () => Promise<any>
        onStatusChange: (callback: (status: any) => void) => () => void
        getCurrentMetrics: () => Promise<any>
        onMetricsUpdate: (callback: (data: any) => void) => () => void
      }
      sync: {
        start: (sessionToken: string) => Promise<any>
        getStatus: () => Promise<any>
        forceSync: () => Promise<any>
      }
      breaks?: {
        start: (breakData: any) => Promise<any>
        end: () => Promise<any>
        notifyBreakStart: (breakData: any) => void
        notifyBreakEnd: (breakData: any) => void
      }
      activityTracker?: {
        getStatus: () => Promise<{
          isTracking: boolean
          lastActivityTime: number
          inactivityDuration: number
          isInactive: boolean
          inactiveSeconds: number
        }>
        start: () => Promise<{ success: boolean }>
        stop: () => Promise<{ success: boolean }>
        setTimeout: (milliseconds: number) => Promise<{ success: boolean }>
        onBreakRequested: (callback: () => void) => () => void
        onActivityDebug: (callback: (data: any) => void) => () => void
      }
    }
  }
}

export default function ElectronProvider({ children }: { children: React.ReactNode }) {
  console.log('[ElectronProvider] 🚀 Component mounted!')
  
  const [isElectron, setIsElectron] = useState(false)
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null)

  useEffect(() => {
    console.log('[ElectronProvider] 🔍 First useEffect running...')
    
    // Check if running in Electron
    const inElectron = typeof window !== 'undefined' && window.electron?.isElectron
    console.log('[ElectronProvider] window.electron exists:', !!window.electron)
    console.log('[ElectronProvider] isElectron:', !!inElectron)
    setIsElectron(!!inElectron)

    // Check consent from localStorage
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('tracking_consent')
      console.log('[ElectronProvider] Consent from localStorage:', consent)
      setConsentGiven(consent === 'true')
    }
  }, [])

  // Start sync service when consent is given (try to get session token from cookies)
  useEffect(() => {
    if (isElectron && consentGiven) {
      // Try to extract session token from cookies
      const cookies = document.cookie.split(';')
      console.log('[ElectronProvider] All cookies:', cookies)
      
      // Try different possible cookie names (NextAuth v5 uses different names)
      const possibleCookieNames = [
        'next-auth.session-token',
        'authjs.session-token',
        '__Secure-next-auth.session-token',
        '__Secure-authjs.session-token'
      ]
      
      let sessionCookie = null
      for (const cookieName of possibleCookieNames) {
        sessionCookie = cookies.find(c => c.trim().startsWith(cookieName + '='))
        if (sessionCookie) {
          console.log('[ElectronProvider] Found session cookie:', cookieName)
          break
        }
      }
      
      if (sessionCookie) {
        const token = sessionCookie.split('=')[1]
        console.log('[ElectronProvider] Extracted token (first 20 chars):', token.substring(0, 20))
        window.electron?.sync.start(token).then(() => {
          console.log('[ElectronProvider] ✅ Sync service started successfully')
        }).catch((err) => {
          console.error('[ElectronProvider] ❌ Error starting sync service:', err)
        })
      } else {
        console.warn('[ElectronProvider] ⚠️ No session token found in cookies')
        console.log('[ElectronProvider] Available cookies:', document.cookie)
      }
    }
  }, [isElectron, consentGiven])

  const handleConsent = (accepted: boolean) => {
    console.log('[ElectronProvider] 📝 handleConsent called:', accepted)
    setConsentGiven(accepted)
    
    if (accepted) {
      console.log('[ElectronProvider] ✅ User accepted tracking consent')
    } else {
      console.log('[ElectronProvider] ❌ User declined tracking consent')
    }
  }

  console.log('[ElectronProvider] 📊 Render state:', { isElectron, consentGiven })

  return (
    <>
      {children}
      {isElectron && consentGiven === null && (
        <TrackingConsent onConsent={handleConsent} />
      )}
      {isElectron && consentGiven && <TrackingStatus />}
    </>
  )
}




