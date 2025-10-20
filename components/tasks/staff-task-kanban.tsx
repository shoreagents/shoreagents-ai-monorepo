"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import StaffTaskCard from "./staff-task-card"
import { getStatusConfig, getAllStatuses } from "@/lib/task-utils"

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
  company?: { id: string; companyName: string } | null
  clientUser?: { id: string; name: string; email: string; avatar: string | null } | null
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

interface StaffTaskKanbanProps {
  tasks: Task[]
  onStatusChange: (taskId: string, newStatus: string) => void
  onTaskUpdate: () => void
}

function DroppableColumn({ id, children, isOver }: { id: string; children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ 
    id: `column-${id}`, // Prefix to avoid collision with task IDs
    data: { status: id } // Store the actual status value
  })
  return (
    <div ref={setNodeRef} className="flex-1">
      {children}
    </div>
  )
}

export default function StaffTaskKanban({
  tasks,
  onStatusChange,
  onTaskUpdate,
}: StaffTaskKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor,{
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const statuses = getAllStatuses()
  const activeTask = tasks.find((task) => task.id === activeId)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over ? (over.id as string) : null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) {
      setActiveId(null)
      setOverId(null)
      return
    }

    const taskId = active.id as string
    
    // Check if we dropped over a column or a task
    let newStatus: string
    if (over.data?.current?.status) {
      // Dropped over a column - use the status from column data
      newStatus = over.data.current.status as string
    } else if ((over.id as string).startsWith('column-')) {
      // Dropped over a column by ID
      newStatus = (over.id as string).replace('column-', '')
    } else {
      // Dropped over a task - find which column that task is in
      const targetTask = tasks.find((t) => t.id === over.id)
      newStatus = targetTask?.status || ''
    }

    const task = tasks.find((t) => t.id === taskId)

    console.log("🔍 [Drag End Debug]:", {
      taskId,
      newStatus,
      overId: over.id,
      overData: over.data?.current,
      taskCurrentStatus: task?.status,
      statusType: typeof newStatus,
      droppedOver: (over.id as string).startsWith('column-') ? 'COLUMN' : 'TASK'
    })

    if (task && task.status !== newStatus && newStatus) {
      onStatusChange(taskId, newStatus)
    }

    setActiveId(null)
    setOverId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setOverId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses.map((status) => {
          const statusTasks = tasks.filter((task) => task.status === status)
          const config = getStatusConfig(status as any)
          const isOver = overId === `column-${status}`

          return (
            <DroppableColumn key={status} id={status} isOver={isOver}>
              <div className="flex flex-col min-h-[500px]">
                {/* Column Header */}
                <div className={`mb-3 rounded-xl p-4 ${config.darkColor} backdrop-blur-xl border-2 border-transparent transition-all duration-300 ${
                  isOver ? "ring-4 ring-indigo-400 scale-[1.02] shadow-2xl shadow-indigo-500/50 animate-pulse" : ""
                }`}>
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

                {/* Sortable Column */}
                <SortableContext
                  items={statusTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className={`flex-1 rounded-xl p-3 transition-all duration-300 ${
                      isOver
                        ? "bg-indigo-500/20 border-2 border-indigo-500 border-dashed backdrop-blur-xl shadow-lg shadow-indigo-500/30"
                        : "bg-slate-900/30 border-2 border-slate-800/50 border-dashed backdrop-blur-sm"
                    }`}
                  >
                    {statusTasks.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-3xl mb-2">📭</p>
                        <p className="text-sm">No tasks yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {statusTasks.map((task) => (
                          <StaffTaskCard key={task.id} task={task} onUpdate={onTaskUpdate} />
                        ))}
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            </DroppableColumn>
          )
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeTask ? (
          <div className="rotate-2 scale-105 cursor-grabbing shadow-2xl shadow-indigo-500/50">
            <StaffTaskCard task={activeTask} onUpdate={onTaskUpdate} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

