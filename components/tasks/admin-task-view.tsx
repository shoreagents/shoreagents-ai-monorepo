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
    <div className="group relative rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10 backdrop-blur-xl transition-all duration-200 hover:ring-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20">
      {/* Priority Bar */}
      <div className={`h-1 w-full rounded-full mb-3 ${priorityConfig.darkColor}`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-white line-clamp-2 flex-1">
          {task.title}
        </h4>
        <span className={`text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap ${priorityConfig.darkColor} ring-1`}>
          {priorityConfig.fullLabel}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-slate-400 line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Source Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${sourceConfig.darkColor} ring-1`}>
          {sourceConfig.emoji} {sourceConfig.label}
        </span>
        {task.company && (
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 ring-1 ring-white/10">
            🏢 {task.company.companyName}
          </span>
        )}
      </div>

      {/* Creator Info */}
      {task.clientUser && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/30">
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.clientUser.avatar || undefined} alt={task.clientUser.name} />
            <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
              {task.clientUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-300">Created by Client</p>
            <p className="text-xs text-blue-400">{task.clientUser.name}</p>
          </div>
        </div>
      )}

      {/* Deadline */}
      {task.deadline && (
        <div className={`flex items-center gap-1.5 text-xs mb-3 px-2 py-1.5 rounded-md ${
          deadlineInfo.isOverdue
            ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/30"
            : deadlineInfo.isUrgent
            ? "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/30"
            : "bg-slate-700/50 text-slate-300 ring-1 ring-white/10"
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
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 px-2 py-1.5 rounded-md bg-slate-700/50 ring-1 ring-white/10">
          <span>📎 {task.attachments.length} attachment{task.attachments.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Footer - Assigned Staff */}
      {allAssignedStaff.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-700">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-slate-400 font-semibold">
              {allAssignedStaff.length} staff
            </span>
          </div>
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
        </div>
      )}

      {/* View Only indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-slate-700/80 text-slate-300 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 backdrop-blur-sm ring-1 ring-white/10">
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
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-max grid grid-cols-5 gap-4" style={{ gridTemplateColumns: 'repeat(5, minmax(280px, 1fr))' }}>
        {statuses.map((status) => {
          const statusTasks = tasks.filter((task) => task.status === status)
          const config = getStatusConfig(status as any)

          return (
            <div key={status} className="flex flex-col min-h-[500px]">
              {/* Column Header */}
              <div className={`mb-3 rounded-xl p-4 ${config.darkColor} backdrop-blur-xl border-2 border-transparent`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span className="text-lg">{config.emoji}</span>
                    <span>{config.label.replace(config.emoji, "").trim()}</span>
                  </h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.darkColor} ring-2`}>
                    {statusTasks.length}
                  </span>
                </div>
              </div>

              {/* Static Column (No Drag) */}
              <div className="flex-1 min-h-[400px] rounded-xl p-3 bg-slate-900/30 border-2 border-slate-800/50 border-dashed backdrop-blur-sm">
                {statusTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 h-full flex flex-col items-center justify-center">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-sm">No tasks</p>
                    <p className="text-xs mt-2 opacity-50">View only mode</p>
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
    </div>
  )
}

