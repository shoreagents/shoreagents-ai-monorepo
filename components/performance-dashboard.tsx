"use client"

import { useState, useEffect } from "react"
import {
  Activity, MousePointer, Keyboard, Clock, Monitor, Download,
  Upload, Wifi, Copy, FileText, Globe, Eye, BarChart3
} from "lucide-react"

interface PerformanceMetric {
  id: string
  date: string
  mouseMovements: number
  mouseClicks: number
  keystrokes: number
  idleTime: number
  activeTime: number
  screenshotCount: number
  applicationsUsed: string[]
  urlsVisited: string[]
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [todayMetrics, setTodayMetrics] = useState<PerformanceMetric | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/performance")
      if (!response.ok) throw new Error("Failed to fetch performance metrics")
      const data = await response.json()
      setMetrics(data.metrics)
      setTodayMetrics(data.today || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load performance data")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const calculateProductivityScore = (metric: PerformanceMetric) => {
    if (!metric) return 0
    const activePercent = (metric.activeTime / (metric.activeTime + metric.idleTime)) * 100
    const keystrokesScore = Math.min((metric.keystrokes / 5000) * 100, 100)
    const clicksScore = Math.min((metric.mouseClicks / 1000) * 100, 100)
    return Math.round((activePercent + keystrokesScore + clicksScore) / 3)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Performance Data</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const productivity = todayMetrics ? calculateProductivityScore(todayMetrics) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-purple-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Activity className="h-8 w-8 text-purple-400" />
                Performance Dashboard
              </h1>
              <p className="mt-1 text-slate-300">Real-time activity monitoring</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{productivity}%</div>
              <div className="text-xs text-slate-400">Productivity</div>
            </div>
          </div>
        </div>

        {/* Real-time Input Tracking */}
        {todayMetrics && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-4 ring-1 ring-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{todayMetrics.mouseMovements.toLocaleString()}</div>
                    <div className="mt-1 text-sm text-blue-300">Mouse Movements</div>
                  </div>
                  <MousePointer className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-4 ring-1 ring-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{todayMetrics.mouseClicks.toLocaleString()}</div>
                    <div className="mt-1 text-sm text-purple-300">Mouse Clicks</div>
                  </div>
                  <MousePointer className="h-8 w-8 text-purple-400" />
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 p-4 ring-1 ring-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{todayMetrics.keystrokes.toLocaleString()}</div>
                    <div className="mt-1 text-sm text-emerald-300">Keystrokes</div>
                  </div>
                  <Keyboard className="h-8 w-8 text-emerald-400" />
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-amber-900/50 to-amber-800/50 p-4 ring-1 ring-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{todayMetrics.idleTime}%</div>
                    <div className="mt-1 text-sm text-amber-300">Idle Time</div>
                  </div>
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-900/50 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{formatTime(todayMetrics.activeTime)}</div>
                    <div className="mt-1 text-sm text-slate-400">Active Time</div>
                  </div>
                  <Activity className="h-8 w-8 text-emerald-400" />
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/50 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{todayMetrics.applicationsUsed.length}</div>
                    <div className="mt-1 text-sm text-slate-400">Apps Used</div>
                  </div>
                  <Monitor className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/50 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{todayMetrics.urlsVisited.length}</div>
                    <div className="mt-1 text-sm text-slate-400">URLs Visited</div>
                  </div>
                  <Globe className="h-8 w-8 text-purple-400" />
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/50 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{todayMetrics.screenshotCount}</div>
                    <div className="mt-1 text-sm text-slate-400">Screenshots</div>
                  </div>
                  <Eye className="h-8 w-8 text-amber-400" />
                </div>
              </div>
            </div>

            {/* Applications & URLs */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
                <h2 className="mb-4 text-xl font-bold text-white">Active Applications</h2>
                {todayMetrics.applicationsUsed.length === 0 ? (
                  <p className="text-slate-400">No applications recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {todayMetrics.applicationsUsed.slice(0, 5).map((app, index) => (
                      <div key={index} className="rounded-lg bg-slate-800/50 p-3 ring-1 ring-white/5">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-blue-400" />
                          <span className="text-white">{app}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
                <h2 className="mb-4 text-xl font-bold text-white">Recent URLs</h2>
                {todayMetrics.urlsVisited.length === 0 ? (
                  <p className="text-slate-400">No URLs recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {todayMetrics.urlsVisited.slice(0, 5).map((url, index) => (
                      <div key={index} className="rounded-lg bg-slate-800/50 p-3 ring-1 ring-white/5">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-purple-400" />
                          <span className="text-sm text-white line-clamp-1">{url}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Weekly Performance */}
        <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
          <h2 className="mb-4 text-xl font-bold text-white">Weekly Performance</h2>
          {metrics.length === 0 ? (
            <p className="text-slate-400">No performance data available yet</p>
          ) : (
            <div className="space-y-2">
              {metrics.slice(0, 7).map((metric) => {
                const score = calculateProductivityScore(metric)
                return (
                  <div key={metric.id} className="rounded-lg bg-slate-800/50 p-4 ring-1 ring-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">
                          {new Date(metric.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          {formatTime(metric.activeTime)} active • {metric.keystrokes.toLocaleString()} keystrokes
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{score}%</div>
                        <div className="text-xs text-slate-400">Score</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
