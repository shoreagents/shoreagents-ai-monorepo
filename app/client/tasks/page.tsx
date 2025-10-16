"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Filter, 
  Search, 
  Plus, 
  LayoutList, 
  LayoutGrid, 
  X, 
  Tag,
  Trash2,
  GripVertical,
  ListPlus
} from "lucide-react"

type TaskStatus = "TODO" | "IN_PROGRESS" | "STUCK" | "FOR_REVIEW" | "COMPLETED"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

interface Staff {
  id: string
  name: string
  email: string
  avatar: string | null
}

interface Task {
  id: string
  userId: string
  user: Staff
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  source: string
  deadline: string | null
  completedAt: string | null
  createdAt: string
  tags: string[]
}

interface BulkTask {
  title: string
  description: string
  priority: TaskPriority
  deadline: string
}

export default function ClientTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStaff, setFilterStaff] = useState<string>('all')
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  
  // Single task creation
  const [isSingleTaskOpen, setIsSingleTaskOpen] = useState(false)
  const [singleTask, setSingleTask] = useState({
    userId: '',
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    deadline: '',
  })

  // Bulk task creation
  const [isBulkTaskOpen, setIsBulkTaskOpen] = useState(false)
  const [bulkUserId, setBulkUserId] = useState('')
  const [bulkTasks, setBulkTasks] = useState<BulkTask[]>([
    { title: '', description: '', priority: 'MEDIUM', deadline: '' }
  ])

  useEffect(() => {
    fetchTasks()
    fetchStaff()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/client/tasks')
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      setTasks(data.tasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/client/staff')
      if (!response.ok) throw new Error('Failed to fetch staff')
      const data = await response.json()
      setStaff(data)
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const createSingleTask = async () => {
    if (!singleTask.title || !singleTask.userId) return

    try {
      const response = await fetch('/api/client/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffUserId: singleTask.userId,
          title: singleTask.title,
          description: singleTask.description,
          priority: singleTask.priority,
          deadline: singleTask.deadline
        }),
      })
      if (!response.ok) throw new Error('Failed to create task')
      await fetchTasks()
      setIsSingleTaskOpen(false)
      setSingleTask({ userId: '', title: '', description: '', priority: 'MEDIUM', deadline: '' })
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task')
    }
  }

  const createBulkTasks = async () => {
    if (!bulkUserId || bulkTasks.every(t => !t.title)) return

    const validTasks = bulkTasks.filter(t => t.title.trim() !== '')
    
    try {
      const response = await fetch('/api/client/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: bulkUserId,
          tasks: validTasks.map(t => ({
            ...t,
            userId: bulkUserId,
          })),
        }),
      })
      if (!response.ok) throw new Error('Failed to create tasks')
      const data = await response.json()
      await fetchTasks()
      setIsBulkTaskOpen(false)
      setBulkUserId('')
      setBulkTasks([{ title: '', description: '', priority: 'MEDIUM', deadline: '' }])
      alert(`✅ Successfully created ${data.count} tasks!`)
    } catch (error) {
      console.error('Error creating bulk tasks:', error)
      alert('Failed to create tasks')
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/client/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error('Failed to update task')
      await fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/client/tasks/${taskId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete task')
      await fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const addBulkTaskRow = () => {
    setBulkTasks([...bulkTasks, { title: '', description: '', priority: 'MEDIUM', deadline: '' }])
  }

  const removeBulkTaskRow = (index: number) => {
    setBulkTasks(bulkTasks.filter((_, i) => i !== index))
  }

  const updateBulkTask = (index: number, field: keyof BulkTask, value: string) => {
    const updated = [...bulkTasks]
    updated[index] = { ...updated[index], [field]: value }
    setBulkTasks(updated)
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== status) {
      updateTaskStatus(draggedTask.id, status)
    }
    setDraggedTask(null)
  }

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStaff = filterStaff === 'all' || task.userId === filterStaff
    return matchesSearch && matchesStaff
  })

  // Group tasks by status for Kanban
  const tasksByStatus = {
    TODO: filteredTasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: filteredTasks.filter(t => t.status === 'IN_PROGRESS'),
    STUCK: filteredTasks.filter(t => t.status === 'STUCK'),
    FOR_REVIEW: filteredTasks.filter(t => t.status === 'FOR_REVIEW'),
    COMPLETED: filteredTasks.filter(t => t.status === 'COMPLETED'),
  }

  const getStatusIcon = (status: TaskStatus) => {
    const icons = {
      TODO: <Clock className="h-4 w-4" />,
      IN_PROGRESS: <AlertCircle className="h-4 w-4" />,
      STUCK: <X className="h-4 w-4" />,
      FOR_REVIEW: <CheckCircle2 className="h-4 w-4" />,
      COMPLETED: <CheckCircle2 className="h-4 w-4" />,
    }
    return icons[status]
  }

  const getStatusColor = (status: TaskStatus) => {
    const colors = {
      TODO: 'bg-gray-100 text-gray-800 border-gray-300',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
      STUCK: 'bg-red-100 text-red-800 border-red-300',
      FOR_REVIEW: 'bg-purple-100 text-purple-800 border-purple-300',
      COMPLETED: 'bg-green-100 text-green-800 border-green-300',
    }
    return colors[status]
  }

  const getPriorityBadge = (priority: TaskPriority) => {
    const styles = {
      LOW: 'bg-gray-200 text-gray-800 border border-gray-300',
      MEDIUM: 'bg-blue-200 text-blue-800 border border-blue-300',
      HIGH: 'bg-orange-200 text-orange-800 border border-orange-300',
      URGENT: 'bg-red-200 text-red-800 border border-red-300 font-semibold',
    }
    return <Badge className={styles[priority]}>{priority}</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/80">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Task Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">Manage your team's tasks and assignments</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>

              {/* Staff Filter */}
              <Select value={filterStaff} onValueChange={setFilterStaff}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={viewMode === 'kanban' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Kanban
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <LayoutList className="h-4 w-4 mr-1" />
                  List
                </Button>
              </div>

              {/* Create Task Buttons */}
              <Dialog open={isSingleTaskOpen} onOpenChange={setIsSingleTaskOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white dark:bg-slate-900">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900 dark:text-white text-xl font-semibold">Create New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-slate-900 dark:text-slate-200 font-medium mb-2 block">Assign To</Label>
                      <Select value={singleTask.userId} onValueChange={(v) => setSingleTask({...singleTask, userId: v})}>
                        <SelectTrigger className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600">
                          <SelectValue placeholder="Select staff member" className="text-slate-500" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                          {staff.map(s => (
                            <SelectItem key={s.id} value={s.id} className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-900 dark:text-slate-200 font-medium mb-2 block">Task Title</Label>
                      <Input
                        value={singleTask.title}
                        onChange={(e) => setSingleTask({...singleTask, title: e.target.value})}
                        placeholder="e.g., Update client report"
                        className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-900 dark:text-slate-200 font-medium mb-2 block">Description</Label>
                      <Textarea
                        value={singleTask.description}
                        onChange={(e) => setSingleTask({...singleTask, description: e.target.value})}
                        placeholder="Task details..."
                        rows={3}
                        className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 placeholder:text-slate-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-900 dark:text-slate-200 font-medium mb-2 block">Priority</Label>
                        <Select value={singleTask.priority} onValueChange={(v: TaskPriority) => setSingleTask({...singleTask, priority: v})}>
                          <SelectTrigger className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                            <SelectItem value="LOW" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">Low</SelectItem>
                            <SelectItem value="MEDIUM" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">Medium</SelectItem>
                            <SelectItem value="HIGH" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">High</SelectItem>
                            <SelectItem value="URGENT" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-900 dark:text-slate-200 font-medium mb-2 block">Deadline</Label>
                        <Input
                          type="date"
                          value={singleTask.deadline}
                          onChange={(e) => setSingleTask({...singleTask, deadline: e.target.value})}
                          className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600"
                        />
                      </div>
                    </div>
                    <Button onClick={createSingleTask} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                      Create Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkTaskOpen} onOpenChange={setIsBulkTaskOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <ListPlus className="h-4 w-4 mr-2" />
                    Bulk Create
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900">Bulk Create Tasks</DialogTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Create multiple tasks at once for a staff member
                    </p>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-gray-900 font-medium">Assign All Tasks To</Label>
                      <Select value={bulkUserId} onValueChange={setBulkUserId}>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900 mt-2">
                          <SelectValue placeholder="Select staff member" className="text-gray-900" />
                        </SelectTrigger>
                        <SelectContent>
                          {staff.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      {bulkTasks.map((task, index) => (
                        <Card key={index} className="p-4 bg-blue-50 border-2 border-blue-200">
                          <div className="flex items-start gap-3">
                            <GripVertical className="h-5 w-5 text-gray-600 mt-2" />
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded">#{index + 1}</span>
                                <Input
                                  value={task.title}
                                  onChange={(e) => updateBulkTask(index, 'title', e.target.value)}
                                  placeholder="Task title"
                                  className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                />
                              </div>
                              <Textarea
                                value={task.description}
                                onChange={(e) => updateBulkTask(index, 'description', e.target.value)}
                                placeholder="Description (optional)"
                                rows={2}
                                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <Select 
                                  value={task.priority} 
                                  onValueChange={(v) => updateBulkTask(index, 'priority', v)}
                                >
                                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="date"
                                  value={task.deadline}
                                  onChange={(e) => updateBulkTask(index, 'deadline', e.target.value)}
                                  className="bg-white border-gray-300 text-gray-900"
                                />
                              </div>
                            </div>
                            {bulkTasks.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBulkTaskRow(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={addBulkTaskRow}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Task
                      </Button>
                      <Button 
                        onClick={createBulkTasks} 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={!bulkUserId || bulkTasks.every(t => !t.title)}
                      >
                        Create {bulkTasks.filter(t => t.title).length} Tasks
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {viewMode === 'kanban' ? (
          /* Kanban View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {(['TODO', 'IN_PROGRESS', 'STUCK', 'FOR_REVIEW', 'COMPLETED'] as TaskStatus[]).map(status => (
              <div
                key={status}
                className="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-gray-300 p-4 shadow-sm"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="text-blue-600">
                      {getStatusIcon(status)}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {status.replace('_', ' ')}
                    </h3>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                    {tasksByStatus[status].length}
                  </Badge>
                </div>

                <div className="space-y-3 min-h-[400px]">
                  {tasksByStatus[status].map(task => (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="p-4 cursor-move hover:shadow-lg transition-all border-gray-300 bg-white hover:border-blue-300"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 flex-1 text-sm">{task.title}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-100 h-6 w-6 p-0 shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-700 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {getPriorityBadge(task.priority)}
                          <Badge className="text-xs bg-gray-200 text-gray-800 border border-gray-300">
                            {task.source}
                          </Badge>
                        </div>

                        {task.deadline && (
                          <div className="flex items-center gap-1 text-xs text-gray-700 font-medium">
                            <Calendar className="h-3 w-3 text-blue-600" />
                            {formatDate(task.deadline)}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                          <Avatar className="h-6 w-6 ring-2 ring-blue-100">
                            <AvatarImage src={task.staffUser?.avatar || ''} alt={task.staffUser?.name || 'Staff'} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                              {task.staffUser?.name?.split(' ').map(n => n[0]).join('') || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-800 font-medium">{task.staffUser?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <Card className="bg-white border-gray-300 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gradient-to-r from-blue-50 to-blue-100">
                    <th className="text-left p-4 font-bold text-gray-900">Task</th>
                    <th className="text-left p-4 font-bold text-gray-900">Assigned To</th>
                    <th className="text-left p-4 font-bold text-gray-900">Status</th>
                    <th className="text-left p-4 font-bold text-gray-900">Priority</th>
                    <th className="text-left p-4 font-bold text-gray-900">Deadline</th>
                    <th className="text-left p-4 font-bold text-gray-900">Source</th>
                    <th className="text-right p-4 font-bold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-12 text-gray-600 font-medium">
                        No tasks found
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map(task => (
                      <tr key={task.id} className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-gray-900">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-gray-700 mt-1 line-clamp-1">{task.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 ring-2 ring-blue-100">
                              <AvatarImage src={task.staffUser?.avatar || ''} alt={task.staffUser?.name || 'Staff'} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                {task.staffUser?.name?.split(' ').map(n => n[0]).join('') || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900 font-medium">{task.staffUser?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Select 
                            value={task.status} 
                            onValueChange={(v: TaskStatus) => updateTaskStatus(task.id, v)}
                          >
                            <SelectTrigger className={`w-40 font-medium ${getStatusColor(task.status)}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TODO">To Do</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="STUCK">Stuck</SelectItem>
                              <SelectItem value="FOR_REVIEW">For Review</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4">
                          {getPriorityBadge(task.priority)}
                        </td>
                        <td className="p-4 text-sm text-gray-800 font-medium">
                          {task.deadline ? formatDate(task.deadline) : '-'}
                        </td>
                        <td className="p-4">
                          <Badge className="text-xs bg-gray-200 text-gray-800 border border-gray-300">
                            {task.source}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
