"use client"

import { useState, useEffect } from "react"
import { Eye, Filter, RefreshCw, Search, AlertCircle, Calendar, Users, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

// Status configurations - Dark mode friendly
const statusConfig = {
  TODO: { label: "To Do", color: "bg-slate-700 text-slate-100 border border-slate-500" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-600 text-white border border-blue-500" },
  STUCK: { label: "Stuck", color: "bg-red-600 text-white border border-red-500" },
  FOR_REVIEW: { label: "For Review", color: "bg-purple-600 text-white border border-purple-500" },
  COMPLETED: { label: "Completed", color: "bg-green-600 text-white border border-green-500" },
}

// Priority configurations - Dark mode friendly
const priorityConfig = {
  LOW: { label: "Low", color: "bg-slate-600 text-slate-100 border border-slate-500" },
  MEDIUM: { label: "Medium", color: "bg-blue-600 text-white border border-blue-500" },
  HIGH: { label: "High", color: "bg-orange-600 text-white border border-orange-500" },
  URGENT: { label: "Urgent", color: "bg-red-600 text-white border border-red-500" },
}

// Source configurations - Dark mode friendly
const sourceConfig = {
  SELF: { label: "Staff", color: "bg-purple-600 text-white border border-purple-500", icon: "👤" },
  CLIENT: { label: "Client", color: "bg-blue-600 text-white border border-blue-500", icon: "👔" },
  MANAGEMENT: { label: "Management", color: "bg-indigo-600 text-white border border-indigo-500", icon: "📋" },
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tasks, searchQuery, statusFilter, priorityFilter, sourceFilter])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/tasks")
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

  const applyFilters = () => {
    let filtered = [...tasks]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.company?.companyName.toLowerCase().includes(query) ||
          task.clientUser?.name.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    // Source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter((task) => task.source === sourceFilter)
    }

    setFilteredTasks(filtered)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setPriorityFilter("all")
    setSourceFilter("all")
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Task Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View-only monitoring of all tasks across the organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTasks} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={clearFilters} variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Tasks</div>
            <div className="text-2xl font-semibold text-foreground mt-1">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">{stats.byStatus.COMPLETED}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">In Progress</div>
            <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.byStatus.IN_PROGRESS}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Stuck</div>
            <div className="text-2xl font-semibold text-red-600 mt-1">{stats.byStatus.STUCK}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">For Review</div>
            <div className="text-2xl font-semibold text-purple-600 mt-1">{stats.byStatus.FOR_REVIEW}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks, companies, or clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="STUCK">Stuck</SelectItem>
              <SelectItem value="FOR_REVIEW">For Review</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>

          {/* Source Filter */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="SELF">Staff (Self)</SelectItem>
              <SelectItem value="CLIENT">Client</SelectItem>
              <SelectItem value="MANAGEMENT">Management</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredTasks.length}</span> of{" "}
          <span className="font-semibold text-foreground">{tasks.length}</span> tasks
        </div>
      </Card>

      {/* Task List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleTaskClick(task)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{task.title}</h3>
              <Badge className={priorityConfig[task.priority as keyof typeof priorityConfig].color}>
                {priorityConfig[task.priority as keyof typeof priorityConfig].label}
              </Badge>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
            )}

            {/* Meta Info */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <Badge className={statusConfig[task.status as keyof typeof statusConfig].color}>
                  {statusConfig[task.status as keyof typeof statusConfig].label}
                </Badge>
                <Badge className={sourceConfig[task.source as keyof typeof sourceConfig].color}>
                  {sourceConfig[task.source as keyof typeof sourceConfig].icon}{" "}
                  {sourceConfig[task.source as keyof typeof sourceConfig].label}
                </Badge>
              </div>

              {task.company && (
                <div className="text-xs text-muted-foreground">
                  🏢 {task.company.companyName}
                </div>
              )}

              {task.deadline && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.deadline).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Assigned Staff */}
            {(task.assignedStaff?.length || task.staffUser) && (
              <div className="flex items-center gap-2 pt-3 border-t">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {task.assignedStaff?.length || 1} staff assigned
                </span>
              </div>
            )}

            {/* View Only Badge */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge variant="outline" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                View Only
              </Badge>
            </div>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          {selectedTask && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  Task Details (View Only)
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Title & Badges */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{selectedTask.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusConfig[selectedTask.status as keyof typeof statusConfig].color}>
                      {statusConfig[selectedTask.status as keyof typeof statusConfig].label}
                    </Badge>
                    <Badge className={priorityConfig[selectedTask.priority as keyof typeof priorityConfig].color}>
                      {priorityConfig[selectedTask.priority as keyof typeof priorityConfig].label}
                    </Badge>
                    <Badge className={sourceConfig[selectedTask.source as keyof typeof sourceConfig].color}>
                      {sourceConfig[selectedTask.source as keyof typeof sourceConfig].icon}{" "}
                      {sourceConfig[selectedTask.source as keyof typeof sourceConfig].label}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <Card className="p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTask.description}</p>
                  </Card>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedTask.company && (
                    <Card className="p-4">
                      <div className="text-xs text-muted-foreground mb-1">Company</div>
                      <div className="text-sm font-semibold text-foreground">
                        🏢 {selectedTask.company.companyName}
                      </div>
                    </Card>
                  )}

                  {selectedTask.deadline && (
                    <Card className="p-4">
                      <div className="text-xs text-muted-foreground mb-1">Deadline</div>
                      <div className="text-sm font-semibold text-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(selectedTask.deadline).toLocaleDateString()}
                      </div>
                    </Card>
                  )}

                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Created</div>
                    <div className="text-sm font-semibold text-foreground">
                      {new Date(selectedTask.createdAt).toLocaleDateString()}
                    </div>
                  </Card>

                  {selectedTask.completedAt && (
                    <Card className="p-4 bg-green-50">
                      <div className="text-xs text-green-700 mb-1">Completed</div>
                      <div className="text-sm font-semibold text-green-700">
                        {new Date(selectedTask.completedAt).toLocaleDateString()}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Client Creator */}
                {selectedTask.clientUser && (
                  <Card className="p-4 bg-blue-50">
                    <div className="text-xs text-blue-700 mb-2">Created by Client</div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedTask.clientUser.avatar || undefined} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {selectedTask.clientUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-semibold text-blue-900">{selectedTask.clientUser.name}</div>
                        <div className="text-xs text-blue-700">{selectedTask.clientUser.email}</div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Assigned Staff */}
                {(selectedTask.assignedStaff?.length || selectedTask.staffUser) && (
                  <Card className="p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Assigned Staff ({selectedTask.assignedStaff?.length || 1})
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedTask.assignedStaff?.map((assignment) => (
                        <div key={assignment.staffUser.id} className="flex items-center gap-2 p-2 rounded bg-muted">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={assignment.staffUser.avatar || undefined} />
                            <AvatarFallback className="bg-purple-500 text-white text-xs">
                              {assignment.staffUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-foreground truncate">
                              {assignment.staffUser.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {assignment.staffUser.email}
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedTask.staffUser && !selectedTask.assignedStaff?.length && (
                        <div className="flex items-center gap-2 p-2 rounded bg-muted">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedTask.staffUser.avatar || undefined} />
                            <AvatarFallback className="bg-purple-500 text-white text-xs">
                              {selectedTask.staffUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-foreground truncate">
                              {selectedTask.staffUser.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {selectedTask.staffUser.email}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Attachments */}
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <Card className="p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments ({selectedTask.attachments.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedTask.attachments.map((attachment, index) => (
                        <div key={index} className="text-xs text-muted-foreground p-2 rounded bg-muted truncate">
                          📎 {attachment}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
