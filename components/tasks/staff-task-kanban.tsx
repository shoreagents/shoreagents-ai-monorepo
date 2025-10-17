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
import { triggerConfetti, triggerHearts, triggerFrustrated } from "@/lib/confetti"

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
    id,
    data: { type: 'column', status: id }
  })
  return (
    <div ref={setNodeRef} className="flex-1" data-column-status={id}>
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
      console.log("❌ No drop target")
      setActiveId(null)
      setOverId(null)
      return
    }

    const taskId = active.id as string
    let newStatus: string
    
    console.log(`🎯 Drag detected:`, {
      taskId,
      overId: over.id,
      overData: over.data?.current,
    })
    
    // Check if we have column data
    if (over.data?.current?.type === 'column') {
      newStatus = over.data.current.status
      console.log(`✅ Column drop detected: ${newStatus}`)
    } else {
      // If dropped on a task (UUID), find the status from that task
      const overId = over.id as string
      const droppedOnTask = tasks.find((t) => t.id === overId)
      if (droppedOnTask) {
        newStatus = droppedOnTask.status
        console.log(`✅ Task drop detected: ${newStatus}`)
      } else {
        // Fallback: check if overId is a valid status
        console.log(`⚠️ Unknown drop target: "${overId}"`)
        setActiveId(null)
        setOverId(null)
        return
      }
    }
    
    // Only update if it's a valid status
    const validStatuses = getAllStatuses()
    console.log(`📋 Valid statuses:`, validStatuses)
    console.log(`🔍 Checking if "${newStatus}" is valid...`)
    
    if (!validStatuses.includes(newStatus as any)) {
      console.warn(`⚠️ Invalid status detected: "${newStatus}" - Drag cancelled`)
      console.warn(`Available statuses:`, validStatuses)
      setActiveId(null)
      setOverId(null)
      return
    }
    
    console.log(`✅ Status "${newStatus}" is valid!`)

    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== newStatus) {
      console.log(`✅ Moving task "${task.title}" from ${task.status} → ${newStatus}`)
      onStatusChange(taskId, newStatus)
      
      // Trigger fun animations based on status!
      switch (newStatus) {
        case 'COMPLETED':
          triggerConfetti()
          break
        case 'IN_PROGRESS':
          triggerHearts()
          break
        case 'STUCK':
          triggerFrustrated()
          break
        case 'FOR_REVIEW':
          triggerHearts()
          break
      }
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
      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-max grid grid-cols-5 gap-4" style={{ gridTemplateColumns: 'repeat(5, minmax(280px, 1fr))' }}>
        {statuses.map((status) => {
          const statusTasks = tasks.filter((task) => task.status === status)
          const config = getStatusConfig(status as any)
          const isOver = overId === status

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

                {/* Task List */}
                <div
                  data-column-id={status}
                  className={`flex-1 min-h-[400px] rounded-xl p-3 transition-all duration-300 ${
                    isOver
                      ? "bg-indigo-500/20 border-2 border-indigo-500 border-dashed backdrop-blur-xl shadow-lg shadow-indigo-500/30"
                      : "bg-slate-900/30 border-2 border-slate-800/50 border-dashed backdrop-blur-sm"
                  }`}
                >
                  {statusTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 h-full flex flex-col items-center justify-center">
                      <p className="text-3xl mb-2">📭</p>
                      <p className="text-sm">No tasks yet</p>
                      <p className="text-xs mt-2 opacity-50">Drop tasks here</p>
                    </div>
                  ) : (
                    <SortableContext
                      items={statusTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {statusTasks.map((task) => (
                          <StaffTaskCard key={task.id} task={task} onUpdate={onTaskUpdate} />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              </div>
            </DroppableColumn>
          )
        })}
        </div>
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

