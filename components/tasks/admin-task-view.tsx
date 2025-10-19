"use client"

import { Calendar, Users, AlertCircle, Eye, Clock as ClockIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPriorityConfig, formatDeadline, getStatusConfig, getAllStatuses, getSourceConfig } from "@/lib/task-utils"

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

function AdminTaskCard({ task }: { task: Task }) {
  const priorityConfig = getPriorityConfig(task.priority as any)
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
    <div className="group rounded-xl bg-white p-4 border-2 border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300">
      {/* Priority Bar */}
      <div className={`h-1 w-full rounded-full mb-3 ${priorityConfig.color}`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-slate-900 line-clamp-2 flex-1">
          {task.title}
        </h4>
        <span className={`text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap ${priorityConfig.lightColor}`}>
          {priorityConfig.fullLabel}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Source Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${sourceConfig.lightColor}`}>
          {sourceConfig.emoji} {sourceConfig.label}
        </span>
        {task.company && (
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-700">
            🏢 {task.company.companyName}
          </span>
        )}
      </div>

      {/* Creator Info */}
      {task.clientUser && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.clientUser.avatar || undefined} alt={task.clientUser.name} />
            <AvatarFallback className="bg-blue-200 text-blue-700 text-xs font-bold">
              {task.clientUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-700">Created by Client</p>
            <p className="text-xs text-blue-600">{task.clientUser.name}</p>
          </div>
        </div>
      )}

      {/* Deadline */}
      {task.deadline && (
        <div className={`flex items-center gap-1.5 text-xs mb-3 px-2 py-1.5 rounded-md ${
          deadlineInfo.isOverdue
            ? "bg-red-100 text-red-700 border border-red-300"
            : deadlineInfo.isUrgent
            ? "bg-orange-100 text-orange-700 border border-orange-300"
            : "bg-slate-100 text-slate-700 border border-slate-300"
        }`}>
          {deadlineInfo.isOverdue ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <Calendar className="h-3.5 w-3.5" />
          )}
          <span className="font-semibold">{deadlineInfo.text}</span>
        </div>
      )}

      {/* Attachments */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3 px-2 py-1.5 rounded-md bg-slate-100 border border-slate-300">
          <span>📎 {task.attachments.length} attachment{task.attachments.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Footer - Assigned Staff */}
      {allAssignedStaff.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-slate-600 font-semibold">
              {allAssignedStaff.length} staff
            </span>
          </div>
          <div className="flex -space-x-2">
            {allAssignedStaff.slice(0, 3).map((staff) => (
              <Avatar key={staff.id} className="h-7 w-7 border-2 border-white ring-1 ring-slate-300">
                <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                <AvatarFallback className="bg-slate-200 text-slate-700 text-xs font-bold">
                  {staff.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))}
            {allAssignedStaff.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700">+{allAssignedStaff.length - 3}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Only indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
          <Eye className="h-3 w-3" />
          View Only
        </div>
      </div>
    </div>
  )
}

export default function AdminTaskView({ tasks, onRefresh }: AdminTaskViewProps) {
  const statuses = getAllStatuses()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statuses.map((status) => {
        const statusTasks = tasks.filter((task) => task.status === status)
        const config = getStatusConfig(status as any)

        return (
          <div key={status} className="flex flex-col min-h-[500px]">
            {/* Column Header */}
            <div className={`mb-3 rounded-xl p-4 ${config.lightColor} border-2`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className="text-lg">{config.emoji}</span>
                  <span>{config.label.replace(config.emoji, "").trim()}</span>
                </h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.lightColor} ring-2`}>
                  {statusTasks.length}
                </span>
              </div>
            </div>

            {/* Static Column (No Drag) */}
            <div className="flex-1 rounded-xl p-3 bg-slate-50 border-2 border-slate-200">
              {statusTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm">No tasks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <AdminTaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

