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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
          <span className="text-lg font-semibold">Loading tasks...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 pt-20 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <Eye className="h-8 w-8 text-slate-700" />
                Task Overview (View Only)
              </h1>
              <p className="text-slate-600">Monitor all tasks across the organization</p>
            </div>
            <Button
              onClick={() => setFilters({ status: "", priority: "", source: "", companyId: "" })}
              variant="outline"
              className="border-2 border-slate-300 hover:bg-slate-100"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-slate-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">Total Tasks</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ListTodo className="h-6 w-6 text-slate-700" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-emerald-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 mb-1">Completed</p>
                    <p className="text-3xl font-bold text-emerald-600">{stats.byStatus.COMPLETED}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-blue-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 mb-1">In Progress</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.byStatus.IN_PROGRESS}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-red-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-1">Stuck</p>
                    <p className="text-3xl font-bold text-red-600">{stats.byStatus.STUCK}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-purple-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-700 mb-1">For Review</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.byStatus.FOR_REVIEW}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-slate-200 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">💤 Low</option>
                  <option value="MEDIUM">📋 Medium</option>
                  <option value="HIGH">⚡ High</option>
                  <option value="URGENT">🚨 Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Source</label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                  className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Sources</option>
                  <option value="SELF">👤 Staff (Self)</option>
                  <option value="CLIENT">👔 Client</option>
                  <option value="MANAGEMENT">📋 Management</option>
                </select>
              </div>

              <div className="flex items-end">
                <p className="text-sm text-slate-600">
                  <strong>{tasks.length}</strong> task{tasks.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Task View (No Drag) */}
        <AdminTaskView tasks={tasks} onRefresh={fetchTasks} />
      </div>
    </div>
  )
}
