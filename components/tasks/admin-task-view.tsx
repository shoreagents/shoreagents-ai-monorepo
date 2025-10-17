"use client"

import { useState } from "react"
import { Calendar, Users, AlertCircle, Eye, Paperclip, ArrowUpDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPriorityConfig, formatDeadline, getStatusConfig, getSourceConfig } from "@/lib/task-utils"

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

interface AdminTaskViewProps {
  tasks: Task[]
  onRefresh: () => void
}

type SortField = "title" | "status" | "priority" | "deadline" | "createdAt"
type SortDirection = "asc" | "desc"

export default function AdminTaskView({ tasks, onRefresh }: AdminTaskViewProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case "title":
        comparison = a.title.localeCompare(b.title)
        break
      case "status":
        comparison = a.status.localeCompare(b.status)
        break
      case "priority":
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 999) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 999)
        break
      case "deadline":
        const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity
        const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity
        comparison = aDeadline - bDeadline
        break
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  if (tasks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-slate-800/50 ring-1 ring-white/10">
        <div className="text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-400 text-lg font-semibold">No tasks found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full rounded-xl bg-slate-800/50 ring-1 ring-white/10 backdrop-blur-xl overflow-hidden">
        {/* Table */}
        <table className="w-full">
          {/* Header */}
          <thead className="bg-slate-900/50">
            <tr className="border-b border-slate-700">
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort("title")}
                  className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Task
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Status
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort("priority")}
                  className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Priority
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-4 text-left">
                <span className="text-xs font-bold text-slate-300">Source</span>
              </th>
              <th className="px-4 py-4 text-left">
                <span className="text-xs font-bold text-slate-300">Assigned</span>
              </th>
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort("deadline")}
                  className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Deadline
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-4 text-center">
                <span className="text-xs font-bold text-slate-300">Files</span>
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {sortedTasks.map((task, index) => {
              const priorityConfig = getPriorityConfig(task.priority as any)
              const statusConfig = getStatusConfig(task.status as any)
              const sourceConfig = getSourceConfig(task.source as any)
              const deadlineInfo = formatDeadline(task.deadline)

              // Get all assigned staff
              const allAssignedStaff = []
              if (task.assignedStaff) {
                allAssignedStaff.push(...task.assignedStaff.map(a => a.staffUser))
              } else if (task.staffUser) {
                allAssignedStaff.push(task.staffUser)
              }

              return (
                <tr
                  key={task.id}
                  className={`border-b border-slate-800 hover:bg-slate-700/30 transition-colors group ${
                    index % 2 === 0 ? "bg-slate-900/20" : ""
                  }`}
                >
                  {/* Task Title & Description */}
                  <td className="px-4 py-4">
                    <div className="max-w-md">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white text-sm line-clamp-1">{task.title}</h4>
                        {task.clientUser && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30">
                            Client
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">{task.description}</p>
                      )}
                      {task.company && (
                        <p className="text-xs text-slate-500 mt-1">🏢 {task.company.companyName}</p>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusConfig.darkColor} ring-1`}>
                      <span>{statusConfig.emoji}</span>
                      {statusConfig.label.replace(statusConfig.emoji, "").trim()}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${priorityConfig.darkColor} ring-1`}>
                      {priorityConfig.emoji} {priorityConfig.label}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${sourceConfig.darkColor} ring-1`}>
                      {sourceConfig.emoji} {sourceConfig.label}
                    </span>
                  </td>

                  {/* Assigned Staff */}
                  <td className="px-4 py-4">
                    {allAssignedStaff.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {allAssignedStaff.slice(0, 3).map((staff) => (
                            <Avatar key={staff.id} className="h-7 w-7 border-2 border-slate-800 ring-1 ring-white/20">
                              <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                              <AvatarFallback className="bg-slate-700 text-slate-300 text-xs font-bold">
                                {staff.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {allAssignedStaff.length > 3 && (
                            <div className="h-7 w-7 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center ring-1 ring-white/20">
                              <span className="text-xs font-bold text-slate-300">+{allAssignedStaff.length - 3}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{allAssignedStaff.length}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Unassigned</span>
                    )}
                  </td>

                  {/* Deadline */}
                  <td className="px-4 py-4">
                    {task.deadline ? (
                      <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                        deadlineInfo.isOverdue
                          ? "text-red-400"
                          : deadlineInfo.isUrgent
                          ? "text-orange-400"
                          : "text-slate-300"
                      }`}>
                        {deadlineInfo.isOverdue ? (
                          <AlertCircle className="h-3.5 w-3.5" />
                        ) : (
                          <Calendar className="h-3.5 w-3.5" />
                        )}
                        {deadlineInfo.text}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No deadline</span>
                    )}
                  </td>

                  {/* Attachments */}
                  <td className="px-4 py-4 text-center">
                    {task.attachments && task.attachments.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-semibold">
                        <Paperclip className="h-3.5 w-3.5" />
                        {task.attachments.length}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

