"use client"

import { useState, useEffect } from "react"
import { Activity, Pause, Play, WifiOff, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

declare global {
  interface Window {
    electron?: {
      isElectron: boolean
      performance: {
        getStatus: () => Promise<any>
        pause: () => Promise<any>
        resume: () => Promise<any>
        onMetricsUpdate: (callback: (data: any) => void) => () => void
      }
      sync: {
        getStatus: () => Promise<any>
      }
    }
  }
}

export default function TrackingStatus() {
  const [isElectron, setIsElectron] = useState(false)
  const [trackingStatus, setTrackingStatus] = useState<any>(null)
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if running in Electron
    const inElectron = typeof window !== 'undefined' && window.electron?.isElectron
    setIsElectron(!!inElectron)

    if (inElectron) {
      loadStatus()
      
      // Subscribe to metrics updates
      const unsubscribe = window.electron?.performance.onMetricsUpdate((data) => {
        if (data.status) {
          setTrackingStatus(data.status)
        }
      })

      // Poll sync status periodically
      const syncInterval = setInterval(() => {
        loadSyncStatus()
      }, 10000) // Every 10 seconds

      return () => {
        unsubscribe?.()
        clearInterval(syncInterval)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const loadStatus = async () => {
    try {
      const status = await window.electron?.performance.getStatus()
      setTrackingStatus(status)
      await loadSyncStatus()
    } catch (error) {
      console.error('Error loading tracking status:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSyncStatus = async () => {
    try {
      const status = await window.electron?.sync.getStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error('Error loading sync status:', error)
    }
  }

  const handleTogglePause = async () => {
    try {
      if (trackingStatus?.isPaused) {
        await window.electron?.performance.resume()
      } else {
        await window.electron?.performance.pause()
      }
      await loadStatus()
    } catch (error) {
      console.error('Error toggling tracking:', error)
    }
  }

  // Don't show anything if not in Electron
  if (!isElectron) {
    return null
  }

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 ring-1 ring-white/10">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-4 bg-slate-700 rounded-full"></div>
          <div className="h-4 w-24 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  const isPaused = trackingStatus?.isPaused
  const isTracking = trackingStatus?.isTracking
  const isSyncing = syncStatus?.isSyncing
  const lastSyncTime = syncStatus?.lastSyncTime

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 ring-1 ring-white/10 shadow-xl">
      <div className="flex items-center gap-3">
        {/* Tracking Status */}
        <div className="flex items-center gap-2">
          {isPaused ? (
            <Pause className="h-4 w-4 text-amber-400 animate-pulse" />
          ) : isTracking ? (
            <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
          ) : (
            <Activity className="h-4 w-4 text-slate-500" />
          )}
          <span className="text-sm text-white font-medium">
            {isPaused ? 'Paused' : isTracking ? 'Tracking' : 'Inactive'}
          </span>
        </div>

        {/* Sync Status */}
        {syncStatus && (
          <Badge 
            variant="outline" 
            className={`text-xs ${
              isSyncing 
                ? 'border-blue-500/50 text-blue-400' 
                : syncStatus.isEnabled 
                ? 'border-emerald-500/50 text-emerald-400'
                : 'border-slate-500/50 text-slate-400'
            }`}
          >
            {isSyncing ? (
              <Wifi className="h-3 w-3 mr-1 animate-pulse" />
            ) : syncStatus.isEnabled ? (
              <Wifi className="h-3 w-3 mr-1" />
            ) : (
              <WifiOff className="h-3 w-3 mr-1" />
            )}
            {isSyncing ? 'Syncing...' : syncStatus.isEnabled ? 'Synced' : 'Offline'}
          </Badge>
        )}

        {/* Pause/Resume Button */}
        <Button
          size="sm"
          variant={isPaused ? "default" : "outline"}
          onClick={handleTogglePause}
          className="h-7 px-2"
        >
          {isPaused ? (
            <>
              <Play className="h-3 w-3 mr-1" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </>
          )}
        </Button>
      </div>

      {/* Last Sync Time */}
      {lastSyncTime && (
        <div className="text-xs text-slate-400 mt-1 text-right">
          Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

