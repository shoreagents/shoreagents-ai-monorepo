"use client"

import { CheckCircle2, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type TaskStatus = "TODO" | "IN_PROGRESS" | "STUCK" | "FOR_REVIEW" | "COMPLETED"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
type TaskSource = "SELF" | "CLIENT" | "MANAGEMENT"

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  source: TaskSource
  deadline: string | null
  completedAt: string | null
  createdAt: string
}

interface TaskViewModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (taskId: string, newStatus: TaskStatus) => Promise<void>
  mounted: boolean
}

export default function TaskViewModal({
  task,
  isOpen,
  onClose,
  onStatusUpdate,
  mounted,
}: TaskViewModalProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline"
    const date = new Date(dateString)
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`
  }

  const statusConfig = {
    TODO: { label: "To Do", color: "bg-slate-500", column: "TODO" as TaskStatus },
    IN_PROGRESS: { label: "In Progress", color: "bg-blue-500", column: "IN_PROGRESS" as TaskStatus },
    STUCK: { label: "Stuck", color: "bg-red-500", column: "STUCK" as TaskStatus },
    FOR_REVIEW: { label: "For Review", color: "bg-purple-500", column: "FOR_REVIEW" as TaskStatus },
    COMPLETED: { label: "Completed", color: "bg-emerald-500", column: "COMPLETED" as TaskStatus },
  }

  const priorityConfig = {
    LOW: { label: "Low", color: "bg-slate-500/20 text-slate-400 ring-slate-500/30" },
    MEDIUM: { label: "Medium", color: "bg-blue-500/20 text-blue-400 ring-blue-500/30" },
    HIGH: { label: "High", color: "bg-orange-500/20 text-orange-400 ring-orange-500/30" },
    URGENT: { label: "Urgent", color: "bg-red-500/20 text-red-400 ring-red-500/30" },
  }

  const sourceConfig = {
    SELF: { label: "Self", color: "bg-purple-500/20 text-purple-400" },
    CLIENT: { label: "Client", color: "bg-blue-500/20 text-blue-400" },
    MANAGEMENT: { label: "Management", color: "bg-amber-500/20 text-amber-400" },
  }

  const columns = Object.keys(statusConfig) as TaskStatus[]

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (task) {
      await onStatusUpdate(task.id, newStatus)
      onClose()
    }
  }

  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Task Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">{task.title}</h3>
          </div>

          {/* Status and Priority Badges */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Status:</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[task.status].color} text-white`}>
                {statusConfig[task.status].label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Priority:</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${priorityConfig[task.priority].color}`}>
                {priorityConfig[task.priority].label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Source:</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sourceConfig[task.source].color}`}>
                {sourceConfig[task.source].label}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">Description</label>
            <div className="rounded-lg bg-slate-800/50 p-4 min-h-[100px]">
              {task.description ? (
                <p className="text-slate-300 whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-slate-500 italic">No description provided</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">Created At</label>
              <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">
                  {mounted ? new Date(task.createdAt).toLocaleString() : task.createdAt}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">Deadline</label>
              <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">
                  {task.deadline ? (mounted ? formatDate(task.deadline) : task.deadline) : "No deadline"}
                </span>
              </div>
            </div>
          </div>

          {/* Completed At */}
          {task.completedAt && (
            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">Completed At</label>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 ring-1 ring-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300">
                  {mounted ? new Date(task.completedAt).toLocaleString() : task.completedAt}
                </span>
              </div>
            </div>
          )}

          {/* Update Status Section */}
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">Update Status</label>
            <div className="flex flex-wrap gap-2">
              {columns.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={task.status === status}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    task.status === status
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : `${statusConfig[status].color} text-white hover:opacity-80`
                  }`}
                >
                  {statusConfig[status].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


