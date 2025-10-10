"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CheckSquare, Coffee, Star, Headphones, Trophy, Activity, MessageSquare,
  Calendar, Clock, TrendingUp, AlertCircle, Users
} from "lucide-react"

interface DashboardData {
  tasks: any[]
  reviews: any[]
  tickets: any[]
  posts: any[]
  leaderboard: any
}

export default function GamifiedDashboard() {
  const [data, setData] = useState<DashboardData>({
    tasks: [],
    reviews: [],
    tickets: [],
    posts: [],
    leaderboard: null,
  })
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    // Update time
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)

    // Fetch all dashboard data
    fetchDashboardData()

    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, reviewsRes, ticketsRes, postsRes, leaderboardRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/reviews"),
        fetch("/api/tickets"),
        fetch("/api/posts"),
        fetch("/api/leaderboard?period=all_time"),
      ])

      const [tasks, reviews, tickets, posts, leaderboard] = await Promise.all([
        tasksRes.json(),
        reviewsRes.json(),
        ticketsRes.json(),
        postsRes.json(),
        leaderboardRes.json(),
      ])

      setData({
        tasks: tasks.tasks || [],
        reviews: reviews.reviews || [],
        tickets: tickets.tickets || [],
        posts: posts.posts || [],
        leaderboard: leaderboard.rankings?.find((r: any) => r.name === "Maria Santos"),
      })
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { href: "/tasks", icon: CheckSquare, label: "Manage Tasks" },
    { href: "/breaks", icon: Coffee, label: "Track Breaks" },
    { href: "/reviews", icon: Star, label: "View Reviews" },
    { href: "/tickets", icon: Headphones, label: "Support Tickets" },
  ]

  const todaysTasks = data.tasks.filter(t => t.status !== "COMPLETED").slice(0, 5)
  const pendingReviews = data.reviews.filter(r => r.status === "PENDING")
  const openTickets = data.tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS")
  const recentPosts = data.posts.slice(0, 3)

  const quickStats = [
    { value: todaysTasks.length, label: "Tasks Open" },
    { value: pendingReviews.length, label: "Reviews Pending" },
    { value: openTickets.length, label: "Tickets Open" },
    { value: data.leaderboard?.rank || "-", label: "Your Rank" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 rounded-xl bg-slate-800/50 animate-pulse" />
              <div className="h-64 rounded-xl bg-slate-800/50 animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-48 rounded-xl bg-slate-800/50 animate-pulse" />
              <div className="h-48 rounded-xl bg-slate-800/50 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Welcome Header & Quick Stats */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white md:text-5xl">Welcome back, Maria! 👋</h1>
            <p className="text-lg text-slate-400">{currentDate} • {currentTime}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {quickStats.map((stat, index) => (
              <div key={index} className="glass flex flex-col items-center justify-center rounded-xl p-4 text-center shadow-xl transition-transform hover:scale-105">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs font-medium uppercase tracking-wider text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="glass flex items-center justify-center gap-3 rounded-xl p-5 text-lg font-bold text-white shadow-xl transition-transform hover:scale-105 hover:ring-2 hover:ring-blue-500/50"
            >
              <action.icon className="h-6 w-6" />
              {action.label}
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-8 lg:col-span-2">
            {/* Today's Tasks */}
            <div className="glass space-y-4 rounded-2xl p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Today's Tasks</h2>
                <Link href="/tasks" className="text-sm text-blue-400 hover:underline">View All →</Link>
              </div>
              {todaysTasks.length === 0 ? (
                <p className="text-slate-400">No open tasks. Great job! 🎉</p>
              ) : (
                <div className="space-y-2">
                  {todaysTasks.map((task) => (
                    <div key={task.id} className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{task.title}</h3>
                          <p className="mt-1 text-sm text-slate-400 line-clamp-1">{task.description}</p>
                        </div>
                        <span className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold ${
                          task.status === "TODO" ? "bg-slate-500/20 text-slate-400" :
                          task.status === "IN_PROGRESS" ? "bg-blue-500/20 text-blue-400" :
                          task.status === "STUCK" ? "bg-red-500/20 text-red-400" :
                          "bg-purple-500/20 text-purple-400"
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Team Activity */}
            <div className="glass space-y-4 rounded-2xl p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Recent Team Activity</h2>
                <Link href="/activity" className="text-sm text-blue-400 hover:underline">View Feed →</Link>
              </div>
              {recentPosts.length === 0 ? (
                <p className="text-slate-400">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                      <p className="text-sm text-white line-clamp-2">{post.content}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8 lg:col-span-1">
            {/* Your Rank */}
            {data.leaderboard && (
              <div className="glass space-y-4 rounded-2xl p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Your Rank</h2>
                  <Link href="/leaderboard" className="text-sm text-blue-400 hover:underline">Full Board →</Link>
                </div>
                <div className="text-center">
                  <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-3xl font-bold text-white ring-4 ring-blue-400/50">
                    #{data.leaderboard.rank}
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-white">{data.leaderboard.points} pts</div>
                    <div className="text-sm text-slate-400">Level {data.leaderboard.level}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Reviews */}
            {pendingReviews.length > 0 && (
              <div className="glass space-y-4 rounded-2xl p-6 shadow-xl backdrop-blur-xl ring-1 ring-amber-500/50 bg-amber-900/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Pending Reviews</h2>
                  <Link href="/reviews" className="text-sm text-blue-400 hover:underline">View All →</Link>
                </div>
                <div className="space-y-2">
                  {pendingReviews.slice(0, 2).map((review) => (
                    <div key={review.id} className="rounded-xl bg-amber-500/10 p-4 ring-1 ring-amber-500/30">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="font-semibold text-white">{review.type.replace('_', ' ')} Review</p>
                          <p className="text-xs text-slate-400">{review.client}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support Tickets */}
            <div className="glass space-y-4 rounded-2xl p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
                <Link href="/tickets" className="text-sm text-blue-400 hover:underline">View All →</Link>
              </div>
              {openTickets.length === 0 ? (
                <p className="text-slate-400">No open tickets</p>
              ) : (
                <div className="space-y-2">
                  {openTickets.slice(0, 3).map((ticket) => (
                    <div key={ticket.id} className="rounded-xl bg-slate-800/50 p-3 ring-1 ring-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white line-clamp-1">{ticket.title}</p>
                          <p className="text-xs text-slate-400">{ticket.category.replace('_', ' ')}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                          ticket.status === "OPEN" ? "bg-blue-500" :
                          ticket.status === "IN_PROGRESS" ? "bg-amber-500" :
                          "bg-emerald-500"
                        } text-white`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
