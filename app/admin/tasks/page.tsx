import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Plus, Calendar, User, Edit, Trash2, Eye } from "@/components/admin/icons"
import { prisma } from "@/lib/prisma"

async function getTasks() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        deadline: 'asc'
      },
      take: 100
    })
    return tasks
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
}

const getPriorityBadge = (priority: string) => {
  const variants: Record<string, string> = {
    LOW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    URGENT: "bg-red-500/20 text-red-400 border-red-500/30",
  }
  return variants[priority] || variants.MEDIUM
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    PENDING: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    IN_PROGRESS: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    COMPLETED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
  }
  return variants[status] || variants.PENDING
}

export default async function TasksPage() {
  const tasks = await getTasks()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Task Oversight</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and manage staff tasks across all clients</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
          <Button className="gap-2 bg-primary">
            <Plus className="size-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border bg-card">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tasks..." className="pl-9" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tasks Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Task
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned To
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Due Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map((task: any) => {
                  const priorityBadge = getPriorityBadge(task.priority)
                  const statusBadge = getStatusBadge(task.status)
                  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'COMPLETED'

                  return (
                    <tr key={task.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-foreground">{task.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{task.description || "No description"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarImage src={task.user?.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{task.user?.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground">{task.user?.name || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        N/A
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={priorityBadge}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusBadge}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-sm ${isOverdue ? 'text-red-400' : 'text-foreground'}`}>
                          {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
                          {isOverdue && <div className="text-xs text-red-400">Overdue!</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                            <Eye className="size-3.5" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                            <Edit className="size-3.5" />
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Tasks</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{tasks.length}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">In Progress</div>
          <div className="text-2xl font-semibold text-blue-500 mt-1">
            {tasks.filter(t => t.status === 'IN_PROGRESS').length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-semibold text-emerald-500 mt-1">
            {tasks.filter(t => t.status === 'COMPLETED').length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Overdue</div>
          <div className="text-2xl font-semibold text-red-500 mt-1">
            {tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED').length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Urgent</div>
          <div className="text-2xl font-semibold text-orange-500 mt-1">
            {tasks.filter(t => t.priority === 'URGENT').length}
          </div>
        </Card>
      </div>
    </div>
  )
}
