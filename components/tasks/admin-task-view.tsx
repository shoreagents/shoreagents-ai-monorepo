"use client"

import { useState } from "react"
import { Calendar, Users, AlertCircle, Eye, Clock as ClockIcon, X, FileText, Paperclip } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
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

function AdminTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
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
    <div 
      onClick={onClick}
      className="group rounded-lg bg-card border p-4 transition-all duration-200 hover:shadow-lg hover:border-purple-500/50 cursor-pointer relative"
    >
      {/* Priority Bar */}
      <div className={`h-1 w-full rounded-full mb-3 ${priorityConfig.color}`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-foreground line-clamp-2 flex-1">
          {task.title}
        </h4>
        <span className={`text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap ${priorityConfig.lightColor}`}>
          {priorityConfig.fullLabel}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Source Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${sourceConfig.lightColor}`}>
          {sourceConfig.emoji} {sourceConfig.label}
        </span>
        {task.company && (
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white/10 text-foreground">
            🏢 {task.company.companyName}
          </span>
        )}
      </div>

      {/* Creator Info */}
      {task.clientUser && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.clientUser.avatar || undefined} alt={task.clientUser.name} />
            <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
              {task.clientUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-400">Created by Client</p>
            <p className="text-xs text-blue-300">{task.clientUser.name}</p>
          </div>
        </div>
      )}

      {/* Deadline */}
      {task.deadline && (
        <div className={`flex items-center gap-1.5 text-xs mb-3 px-2 py-1.5 rounded-md ${
          deadlineInfo.isOverdue
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : deadlineInfo.isUrgent
            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
            : "bg-white/10 text-muted-foreground border border-white/20"
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
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 px-2 py-1.5 rounded-md bg-white/10 border border-white/20">
          <span>📎 {task.attachments.length} attachment{task.attachments.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Footer - Assigned Staff */}
      {allAssignedStaff.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-semibold">
              {allAssignedStaff.length} staff
            </span>
          </div>
          <div className="flex -space-x-2">
            {allAssignedStaff.slice(0, 3).map((staff) => (
              <Avatar key={staff.id} className="h-7 w-7 border-2 border-card ring-1 ring-white/20">
                <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                <AvatarFallback className="bg-white/20 text-foreground text-xs font-bold">
                  {staff.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))}
            {allAssignedStaff.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-white/20 border-2 border-card flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">+{allAssignedStaff.length - 3}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Only indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-white/10 text-muted-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border border-white/20">
          <Eye className="h-3 w-3" />
          View Only
        </div>
      </div>
    </div>
  )
}

function TaskDetailModal({ task, open, onClose }: { task: Task | null; open: boolean; onClose: () => void }) {
  if (!task) return null

  const priorityConfig = getPriorityConfig(task.priority as any)
  const sourceConfig = getSourceConfig(task.source as any)
  const statusConfig = getStatusConfig(task.status as any)
  const deadlineInfo = formatDeadline(task.deadline)

  const allAssignedStaff = []
  if (task.assignedStaff) {
    allAssignedStaff.push(...task.assignedStaff.map(a => a.staffUser))
  } else if (task.staffUser) {
    allAssignedStaff.push(task.staffUser)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground pr-8 flex items-center gap-3">
            <Eye className="h-6 w-6 text-purple-400" />
            Task Details (View Only)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Title & Status */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3">{task.title}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${statusConfig.lightColor} text-sm`}>
                {statusConfig.emoji} {statusConfig.label}
              </Badge>
              <Badge className={`${priorityConfig.lightColor} text-sm`}>
                {priorityConfig.fullLabel}
              </Badge>
              <Badge className={`${sourceConfig.lightColor} text-sm`}>
                {sourceConfig.emoji} {sourceConfig.label}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="rounded-lg bg-white/5 border border-white/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-foreground">Description</h4>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company */}
            {task.company && (
              <div className="rounded-lg bg-white/5 border border-white/20 p-4">
                <div className="text-xs text-muted-foreground mb-1">Company</div>
                <div className="font-semibold text-foreground">🏢 {task.company.companyName}</div>
              </div>
            )}

            {/* Deadline */}
            {task.deadline && (
              <div className={`rounded-lg p-4 ${
                deadlineInfo.isOverdue
                  ? "bg-red-500/20 border border-red-500/30"
                  : deadlineInfo.isUrgent
                  ? "bg-orange-500/20 border border-orange-500/30"
                  : "bg-white/5 border border-white/20"
              }`}>
                <div className="text-xs text-muted-foreground mb-1">Deadline</div>
                <div className="flex items-center gap-2">
                  {deadlineInfo.isOverdue ? (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-foreground">{deadlineInfo.text}</span>
                </div>
              </div>
            )}

            {/* Created */}
            <div className="rounded-lg bg-white/5 border border-white/20 p-4">
              <div className="text-xs text-muted-foreground mb-1">Created</div>
              <div className="font-semibold text-foreground">
                {new Date(task.createdAt).toLocaleDateString()} {new Date(task.createdAt).toLocaleTimeString()}
              </div>
            </div>

            {/* Completed */}
            {task.completedAt && (
              <div className="rounded-lg bg-green-500/20 border border-green-500/30 p-4">
                <div className="text-xs text-green-300 mb-1">Completed</div>
                <div className="font-semibold text-green-400">
                  {new Date(task.completedAt).toLocaleDateString()} {new Date(task.completedAt).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>

          {/* Creator Info */}
          {task.clientUser && (
            <div className="rounded-lg bg-blue-500/20 border border-blue-500/30 p-4">
              <div className="text-xs text-blue-300 mb-2">Created by Client</div>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={task.clientUser.avatar || undefined} alt={task.clientUser.name} />
                  <AvatarFallback className="bg-blue-500 text-white font-bold">
                    {task.clientUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-blue-400">{task.clientUser.name}</div>
                  <div className="text-sm text-blue-300">{task.clientUser.email}</div>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Staff */}
          {allAssignedStaff.length > 0 && (
            <div className="rounded-lg bg-white/5 border border-white/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-foreground">Assigned Staff ({allAssignedStaff.length})</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allAssignedStaff.map((staff) => (
                  <div key={staff.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                      <AvatarFallback className="bg-white/20 text-foreground text-xs font-bold">
                        {staff.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">{staff.name}</div>
                      <div className="text-xs text-muted-foreground">{staff.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="rounded-lg bg-white/5 border border-white/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-foreground">Attachments ({task.attachments.length})</h4>
              </div>
              <div className="space-y-2">
                {task.attachments.map((attachment, index) => (
                  <div key={index} className="text-sm text-muted-foreground p-2 rounded bg-white/5">
                    📎 {attachment}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminTaskView({ tasks, onRefresh }: AdminTaskViewProps) {
  const statuses = getAllStatuses()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setTimeout(() => setSelectedTask(null), 300)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses.map((status) => {
          const statusTasks = tasks.filter((task) => task.status === status)
          const config = getStatusConfig(status as any)

          return (
            <div key={status} className="flex flex-col min-h-[500px]">
              {/* Column Header */}
              <div className={`mb-3 rounded-lg p-4 ${config.lightColor} border`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span className="text-lg">{config.emoji}</span>
                    <span>{config.label.replace(config.emoji, "").trim()}</span>
                  </h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.lightColor} ring-1`}>
                    {statusTasks.length}
                  </span>
                </div>
              </div>

              {/* Static Column (No Drag) */}
              <div className="flex-1 rounded-lg p-3 bg-white/5 border border-white/20">
                {statusTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-sm">No tasks</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {statusTasks.map((task) => (
                      <AdminTaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <TaskDetailModal task={selectedTask} open={modalOpen} onClose={handleCloseModal} />
    </>
  )
}

