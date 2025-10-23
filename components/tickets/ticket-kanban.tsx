"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverEvent,
  closestCenter,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import TicketCard from "./ticket-card"
import { Ticket, TicketStatus } from "@/types/ticket"

interface TicketKanbanProps {
  tickets: Ticket[]
  onTicketClick: (ticket: Ticket) => void
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => Promise<void>
}

const columns: { id: TicketStatus; label: string; color: string }[] = [
  { id: "OPEN", label: "Open", color: "bg-blue-500" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-amber-500" },
  { id: "RESOLVED", label: "Resolved", color: "bg-emerald-500" },
  { id: "CLOSED", label: "Closed", color: "bg-slate-500" },
]

// Droppable Column Component
function DroppableColumn({ 
  id, 
  children,
  isActive
}: { 
  id: string; 
  children: React.ReactNode;
  isActive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] space-y-3 rounded-xl bg-slate-800/30 p-4 ring-1 ring-white/10 transition-all duration-200 ${
        isActive || isOver
          ? "ring-4 ring-indigo-400 bg-indigo-500/20 scale-[1.03] shadow-2xl shadow-indigo-500/40 animate-pulse" 
          : ""
      }`}
      data-status={id}
    >
      {children}
    </div>
  )
}

export default function TicketKanban({
  tickets,
  onTicketClick,
  onStatusChange,
}: TicketKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [updatingTickets, setUpdatingTickets] = useState<Set<string>>(() => new Set())

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Reduced for quicker response
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Slight delay to distinguish from scrolling
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over?.id as string | null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setOverId(null)
      return
    }

    const ticketId = active.id as string
    const newStatus = over.id as TicketStatus

    // Only update if status actually changed and not already updating
    const ticket = tickets.find((t) => t.id === ticketId)
    if (ticket && ticket.status !== newStatus && !updatingTickets.has(ticketId)) {
      // Mark as updating
      setUpdatingTickets(prev => new Set(prev).add(ticketId))
      
      try {
        await onStatusChange(ticketId, newStatus)
      } finally {
        // Remove from updating set after completion
        setUpdatingTickets(prev => {
          const next = new Set(prev)
          next.delete(ticketId)
          return next
        })
      }
    }

    setActiveId(null)
    setOverId(null)
  }

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter((ticket) => ticket.status === status)
  }

  const activeTicket = tickets.find((t) => t.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {columns.map((column) => {
          const columnTickets = getTicketsByStatus(column.id)

          return (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className="mb-4 flex items-center gap-2">
                <div className={`h-8 w-1 rounded-full ${column.color}`} />
                <h3 className="text-lg font-semibold text-white">{column.label}</h3>
                <span className="ml-auto text-sm text-slate-400">
                  {columnTickets.length}
                </span>
              </div>

              {/* Droppable Column Area */}
              <SortableContext
                id={column.id}
                items={columnTickets.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableColumn id={column.id} isActive={overId === column.id}>
                  {columnTickets.map((ticket) => (
                    <TicketCard 
                      key={ticket.id}
                      ticket={ticket} 
                      isDragging={activeId === ticket.id}
                      onClick={() => onTicketClick(ticket)}
                    />
                  ))}

                  {columnTickets.length === 0 && (
                    <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                      No tickets
                    </div>
                  )}
                </DroppableColumn>
              </SortableContext>
            </div>
          )
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeTicket ? (
          <div className="rotate-2 scale-105 cursor-grabbing shadow-2xl shadow-indigo-500/50 transition-transform">
            <TicketCard ticket={activeTicket} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

