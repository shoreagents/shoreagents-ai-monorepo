"use client"

import { useState, useEffect } from "react"
import { Eye, Filter, ListTodo, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import AdminTaskView from "@/components/tasks/admin-task-view"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  source: string
  deadline: string | null
  completedAt: string | null
  createdAt: string
  attachments: string[]
  company?: { id: string; companyName: string; logo: string | null } | null
  clientUser?: { id: string; name: string; email: string; avatar: string | null } | null
  staffUser?: { id: string; name: string; email: string; avatar: string | null; role: string } | null
  assignedStaff?: Array<{
    staffUser: {
      id: string
      name: string
      email: string
      avatar: string | null
      role: string
    }
  }>
}

interface Stats {
  total: number
  byStatus: {
    TODO: number
    IN_PROGRESS: number
    STUCK: number
    FOR_REVIEW: number
    COMPLETED: number
  }
  byPriority: {
    LOW: number
    MEDIUM: number
    HIGH: number
    URGENT: number
  }
  bySource: {
    SELF: number
    CLIENT: number
    MANAGEMENT: number
  }
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    source: "",
    companyId: "",
  })

  useEffect(() => {
    fetchTasks()
  }, [filters])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append("status", filters.status)
      if (filters.priority) params.append("priority", filters.priority)
      if (filters.source) params.append("source", filters.source)
      if (filters.companyId) params.append("companyId", filters.companyId)

      const response = await fetch(`/api/admin/tasks?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data.tasks)
      setStats(data.stats)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-400">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Task Management (View Only)</h1>
          <p className="mt-1 text-slate-400">Monitor all tasks across the organization</p>
        </div>
        <Button
          onClick={() => setFilters({ status: "", priority: "", source: "", companyId: "" })}
          className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2 font-medium text-white ring-1 ring-white/10 transition-all hover:bg-slate-700/50"
        >
          <Filter className="h-4 w-4" />
          Clear Filters
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Total Tasks</div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50">
                <ListTodo className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-emerald-300">Completed</div>
                <div className="text-2xl font-bold text-emerald-400">{stats.byStatus.COMPLETED}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-blue-500/10 p-4 ring-1 ring-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-300">In Progress</div>
                <div className="text-2xl font-bold text-blue-400">{stats.byStatus.IN_PROGRESS}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-red-500/10 p-4 ring-1 ring-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-red-300">Stuck</div>
                <div className="text-2xl font-bold text-red-400">{stats.byStatus.STUCK}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-purple-500/10 p-4 ring-1 ring-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-300">For Review</div>
                <div className="text-2xl font-bold text-purple-400">{stats.byStatus.FOR_REVIEW}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                <Eye className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-300">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
            >
              <option value="">All Statuses</option>
              <option value="TODO">📋 To Do</option>
              <option value="IN_PROGRESS">⚡ In Progress</option>
              <option value="STUCK">🚧 Stuck</option>
              <option value="FOR_REVIEW">👀 For Review</option>
              <option value="COMPLETED">✅ Completed</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-300">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
            >
              <option value="">All Priorities</option>
              <option value="LOW">💤 Low</option>
              <option value="MEDIUM">📋 Medium</option>
              <option value="HIGH">⚡ High</option>
              <option value="URGENT">🚨 Urgent</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-300">Source</label>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
            >
              <option value="">All Sources</option>
              <option value="SELF">👤 Staff (Self)</option>
              <option value="CLIENT">👔 Client</option>
              <option value="MANAGEMENT">📋 Management</option>
            </select>
          </div>

          <div className="flex items-end">
            <p className="text-sm text-slate-400">
              <strong className="text-white">{tasks.length}</strong> task{tasks.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      </div>

      {/* Task View (No Drag) */}
      <div className="flex-1 overflow-x-auto">
        <AdminTaskView tasks={tasks} onRefresh={fetchTasks} />
      </div>
    </div>
  )
}
