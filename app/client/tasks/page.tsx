"use client"

import { useState, useEffect } from "react"
import { Plus, Users, CheckCircle2, Clock, AlertCircle, ListTodo, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import ClientTaskKanban from "@/components/tasks/client-task-kanban"
import CreateTaskModal from "@/components/tasks/create-task-modal"
import { getAllStatuses } from "@/lib/task-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
  company?: {
    id: string
    companyName: string
  } | null
  clientUser?: {
    id: string
    name: string
    email: string
    avatar: string | null
  } | null
  assignedStaff?: Array<{
    staffUser: {
      id: string
      name: string
      email: string
      avatar: string | null
      role: string
    }
  }>
  staffUser?: {
    id: string
    name: string
    email: string
    avatar: string | null
    role: string
  } | null
}

interface StaffUser {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
}

export default function ClientTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")

  useEffect(() => {
    fetchTasks()
    fetchStaffUsers()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/client/tasks")
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data.tasks)
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

  const fetchStaffUsers = async () => {
    try {
      // Fetch staff users from the client's company
      const response = await fetch("/api/client/staff")
      if (!response.ok) throw new Error("Failed to fetch staff")
      const data = await response.json()
      setStaffUsers(data.staff || [])
    } catch (error) {
      console.error("Error fetching staff:", error)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Optimistic update
    const previousTasks = [...tasks]
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
    )

    try {
      const response = await fetch(`/api/client/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        setTasks(previousTasks)
        throw new Error("Failed to update task")
      }

      toast({
        title: "Success",
        description: "Task status updated",
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      })
    }
  }

  const handleCreateTask = () => {
    fetchTasks()
    setIsCreateModalOpen(false)
  }

  // Filter tasks by selected staff member
  const filteredTasks = selectedStaffId
    ? tasks.filter((task) => {
        // Check if task is assigned to the selected staff
        const isAssignedViaArray = task.assignedStaff?.some(
          (a) => a.staffUser.id === selectedStaffId
        )
        const isAssignedViaLegacy = task.staffUser?.id === selectedStaffId
        return isAssignedViaArray || isAssignedViaLegacy
      })
    : tasks

  // Calculate stats (based on filtered tasks)
  const stats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter((t) => t.status === "COMPLETED").length,
    inProgress: filteredTasks.filter((t) => t.status === "IN_PROGRESS").length,
    stuck: filteredTasks.filter((t) => t.status === "STUCK").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <span className="text-lg font-medium">Loading tasks...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <ListTodo className="h-8 w-8 text-blue-600" />
                Task Management
              </h1>
              <p className="text-slate-600">Assign and manage tasks for your team</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Task
            </Button>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Filter by Staff:</span>
              </div>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="flex-1 max-w-xs px-4 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-900 font-medium text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="">All Staff - Show All Company Tasks</option>
                {staffUsers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.role})
                  </option>
                ))}
              </select>
              {selectedStaffId && (
                <Button
                  onClick={() => setSelectedStaffId("")}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 hover:bg-slate-100"
                >
                  Clear Filter
                </Button>
              )}
              {selectedStaffId && staffUsers.find(s => s.id === selectedStaffId) && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={staffUsers.find(s => s.id === selectedStaffId)?.avatar || undefined} 
                    />
                    <AvatarFallback className="bg-blue-200 text-blue-700 text-xs font-bold">
                      {staffUsers.find(s => s.id === selectedStaffId)?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-blue-900">
                    Showing tasks for {staffUsers.find(s => s.id === selectedStaffId)?.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Tasks</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ListTodo className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Stuck</p>
                  <p className="text-3xl font-bold text-red-600">{stats.stuck}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <ClientTaskKanban
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onTaskUpdate={fetchTasks}
        />

        {/* Create Task Modal */}
        {isCreateModalOpen && (
          <CreateTaskModal
            isClient
            staffUsers={staffUsers}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateTask}
          />
        )}
      </div>
    </div>
  )
}
