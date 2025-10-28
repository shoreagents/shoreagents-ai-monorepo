"use client"

import { useState, useEffect } from "react"
import { Clock, Target, TrendingUp, Award, Activity } from "lucide-react"

interface PerformanceData {
  today: {
    activeTime: number
    idleTime: number
    productivityScore: number
  }
  weeklyAverage: {
    productivityScore: number
    activeTime: number
  }
}

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/analytics")
      if (!response.ok) throw new Error("Failed to fetch data")
      const result = await response.json()
      
      // Transform data for staff-friendly display
      // Note: API returns activeTime in seconds (after conversion from minutes in API)
      const activeTime = (result.today?.activeTime || 0)
      const idleTime = (result.today?.idleTime || 0)
      
      // Use database productivityScore if available, otherwise calculate
      const todayScore = result.today?.productivityScore ?? calculateProductivityScore(result.today || {})
      
      setData({
        today: {
          activeTime: Math.floor(Number(activeTime) / 60), // Convert seconds to minutes for display
          idleTime: Math.floor(Number(idleTime) / 60), // Convert seconds to minutes for display
          productivityScore: todayScore
        },
        weeklyAverage: {
          productivityScore: calculateAverageProductivity(result.metrics || []),
          activeTime: result.today?.activeTime || 0
        }
      })
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateProductivityScore = (metric: any) => {
    if (!metric) return 0
    // If database already has a productivityScore, use it
    if (metric.productivityScore !== undefined && metric.productivityScore !== null) {
      return metric.productivityScore
    }
    // Otherwise calculate from active/idle time
    const totalTime = (metric.activeTime || 0) + (metric.idleTime || 0)
    const activePercent = totalTime > 0 ? (metric.activeTime / totalTime) * 100 : 0
    return Math.round(activePercent)
  }

  const calculateAverageProductivity = (metrics: any[]) => {
    if (metrics.length === 0) return 0
    const sum = metrics.reduce((acc, m) => acc + calculateProductivityScore(m), 0)
    return Math.round(sum / metrics.length)
  }

  const formatTime = (minutes: number) => {
    if (!minutes || isNaN(minutes) || minutes < 0) {
      return "0h 0m"
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getProductivityMessage = (score: number) => {
    if (score >= 90) return { message: "Outstanding! You're maintaining excellent productivity!", color: "text-emerald-400", badge: "Excellence" }
    if (score >= 75) return { message: "Great work! You're performing well today.", color: "text-blue-400", badge: "Great" }
    if (score >= 60) return { message: "Good effort! Keep up the momentum.", color: "text-amber-400", badge: "Good" }
    return { message: "Keep pushing forward! You can do better.", color: "text-orange-400", badge: "Improving" }
  }

  const getTrendArrow = (score: number) => {
    if (score >= 80) return "📈"
    if (score >= 60) return "📊"
    return "📉"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-full space-y-6">
          {/* Header Skeleton */}
          <div className="h-32 rounded-2xl bg-slate-800/50 animate-pulse" />
          
          {/* Today's Performance Section Skeleton */}
          <div className="rounded-2xl bg-slate-800/50 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-48 bg-slate-700/50 rounded" />
              <div className="h-8 w-8 bg-slate-700/50 rounded" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-900/50 rounded-xl p-4">
                  <div className="h-4 w-24 bg-slate-700/50 rounded mb-3" />
                  <div className="h-10 w-20 bg-slate-700/50 rounded mb-2" />
                  <div className="h-4 w-32 bg-slate-700/50 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Overview & Goals Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-800/50 p-6 animate-pulse">
              <div className="h-6 w-32 bg-slate-700/50 rounded mb-4" />
              <div className="h-16 w-24 bg-slate-700/50 rounded mb-3" />
              <div className="h-6 w-full bg-slate-700/50 rounded mb-2" />
              <div className="h-4 w-48 bg-slate-700/50 rounded" />
            </div>
            <div className="rounded-2xl bg-slate-800/50 p-6 animate-pulse">
              <div className="h-6 w-32 bg-slate-700/50 rounded mb-4" />
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <div className="h-4 w-24 bg-slate-700/50 rounded mb-2" />
                  <div className="h-10 w-24 bg-slate-700/50 rounded mb-2" />
                  <div className="h-4 w-48 bg-slate-700/50 rounded" />
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <div className="h-4 w-24 bg-slate-700/50 rounded mb-2" />
                  <div className="h-2 w-full bg-slate-700/50 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Tips Skeleton */}
          <div className="rounded-2xl bg-slate-800/50 p-6 animate-pulse">
            <div className="h-6 w-40 bg-slate-700/50 rounded mb-4" />
            <div className="grid md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-900/50 rounded-xl p-4">
                  <div className="h-8 w-8 bg-slate-700/50 rounded mb-2" />
                  <div className="h-6 w-32 bg-slate-700/50 rounded mb-2" />
                  <div className="h-16 w-full bg-slate-700/50 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const todayScore = data?.today.productivityScore || 0
  const weeklyScore = data?.weeklyAverage.productivityScore || 0
  const todayMessage = getProductivityMessage(todayScore)
  const weekMessage = getProductivityMessage(weeklyScore)

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-full space-y-6">
        
        {/* Header */}
        <div className="rounded-2xl bg-linear-to-br from-purple-900/50 via-blue-900/50 to-purple-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Activity className="h-8 w-8 text-purple-400" />
                Performance Analytics
              </h1>
              <p className="mt-1 text-slate-300">
                Your productivity insights and performance metrics
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="rounded-xl bg-white/10 px-6 py-3 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{todayScore}%</div>
                <div className="text-xs text-slate-400">Today's Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Performance */}
        <div className="rounded-2xl bg-linear-to-br from-indigo-900/50 to-purple-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-indigo-500/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" />
              Today's Performance
            </h2>
            <span className="text-2xl">{getTrendArrow(todayScore)}</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4 ring-1 ring-white/10">
              <div className="text-sm text-slate-400 mb-2">Productivity Score</div>
              <div className="text-4xl font-bold text-white mb-2">{todayScore}%</div>
              <div className={`text-sm font-semibold ${todayMessage.color}`}>
                {todayMessage.message}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 ring-1 ring-white/10">
              <div className="text-sm text-slate-400 mb-2">Active Time</div>
              <div className="text-4xl font-bold text-white mb-2">
                {data ? formatTime(data.today.activeTime) : "0h 0m"}
              </div>
              <div className="text-sm text-slate-300">
                Time actively working
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 ring-1 ring-white/10">
              <div className="text-sm text-slate-400 mb-2">Idle/Inactive Time</div>
              <div className="text-4xl font-bold text-white mb-2">
                {data ? formatTime(data.today.idleTime) : "0h 0m"}
              </div>
              <div className="text-sm text-slate-300">
                Time away from work
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 ring-1 ring-white/10">
              <div className="text-sm text-slate-400 mb-2">Status</div>
              <div className={`text-2xl font-bold ${todayMessage.color} mb-2`}>
                {todayMessage.badge}
              </div>
              <div className="text-sm text-slate-300">
                Keep up the great work!
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-linear-to-br from-blue-900/50 to-cyan-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-blue-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Weekly Average
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-400 mb-2">Productivity Score</div>
                <div className="text-5xl font-bold text-white">{weeklyScore}%</div>
              </div>
              <div className={`text-lg font-semibold ${weekMessage.color}`}>
                {weekMessage.message}
              </div>
              <div className="text-sm text-slate-300 mt-2">
                Your consistent performance shows dedication and professionalism.
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-linear-to-br from-purple-900/50 to-pink-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-purple-500/30 col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                Your Goals
              </h2>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-xl p-4 ring-1 ring-white/10">
                <div className="text-sm text-slate-400 mb-2">Recommended Score</div>
                <div className="text-3xl font-bold text-white">75%+</div>
                <div className="text-sm text-slate-300 mt-2">
                  Maintain productivity above this threshold
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 ring-1 ring-white/10">
                <div className="text-sm text-slate-400 mb-2">Your Progress</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${Math.min(weeklyScore, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">{weeklyScore}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="rounded-2xl bg-linear-to-br from-emerald-900/50 to-teal-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-emerald-500/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-400" />
              Performance Tips
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4 ring-1 ring-white/10">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-white font-semibold mb-2">Stay Consistent</div>
              <div className="text-sm text-slate-300">
                Regular breaks and consistent work hours improve overall productivity
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 ring-1 ring-white/10">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-white font-semibold mb-2">Focus on Quality</div>
              <div className="text-sm text-slate-300">
                Quality work and attention to detail always yields better results
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 ring-1 ring-white/10">
              <div className="text-2xl mb-2">💪</div>
              <div className="text-white font-semibold mb-2">Keep Improving</div>
              <div className="text-sm text-slate-300">
                Small daily improvements lead to significant long-term growth
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
