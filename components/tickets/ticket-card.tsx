"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Monitor,
  Users,
  MessageSquare,
  Package,
  HelpCircle,
  MapPin,
  Cloud,
  Gift,
  Bus,
  Paperclip,
} from "lucide-react"
import { Ticket } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TicketCardProps {
  ticket: Ticket
  isDragging?: boolean
}

const categoryConfig: Record<string, { icon: any; color: string }> = {
  IT: { icon: Monitor, color: "bg-blue-500/20 text-blue-400 ring-blue-500/30" },
  HR: { icon: Users, color: "bg-purple-500/20 text-purple-400 ring-purple-500/30" },
  MANAGEMENT: { icon: MessageSquare, color: "bg-amber-500/20 text-amber-400 ring-amber-500/30" },
  EQUIPMENT: { icon: Package, color: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30" },
  STATION: { icon: MapPin, color: "bg-pink-500/20 text-pink-400 ring-pink-500/30" },
  SURROUNDINGS: { icon: Cloud, color: "bg-cyan-500/20 text-cyan-400 ring-cyan-500/30" },
  COMPENSATION: { icon: Gift, color: "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30" },
  TRANSPORT: { icon: Bus, color: "bg-indigo-500/20 text-indigo-400 ring-indigo-500/30" },
  OTHER: { icon: HelpCircle, color: "bg-slate-500/20 text-slate-400 ring-slate-500/30" },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "bg-slate-500/20 text-slate-400" },
  MEDIUM: { label: "Medium", color: "bg-blue-500/20 text-blue-400" },
  HIGH: { label: "High", color: "bg-orange-500/20 text-orange-400" },
  URGENT: { label: "Urgent", color: "bg-red-500/20 text-red-400 animate-pulse" },
}

export default function TicketCard({ ticket, isDragging }: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: ticket.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const CategoryIcon = categoryConfig[ticket.category]?.icon || HelpCircle
  const categoryColor = categoryConfig[ticket.category]?.color || categoryConfig.OTHER.color
  const priorityColor = priorityConfig[ticket.priority]?.color || priorityConfig.MEDIUM.color

  const initials = ticket.staffUser?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group cursor-pointer rounded-lg bg-slate-800/50 p-4 ring-1 ring-white/10 transition-all hover:bg-slate-800 hover:ring-indigo-400/50 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {/* Ticket ID */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs text-slate-500">{ticket.ticketId}</span>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ring-1 ${priorityColor}`}>
          {priorityConfig[ticket.priority]?.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="mb-2 line-clamp-2 text-sm font-semibold text-white group-hover:text-indigo-400">
        {ticket.title}
      </h4>

      {/* Category Badge */}
      <div className={`mb-3 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ring-1 ${categoryColor}`}>
        <CategoryIcon className="h-3 w-3" />
        <span>{ticket.category}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {ticket.attachments && ticket.attachments.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {ticket.attachments.length}
            </span>
          )}
          {ticket.responses && ticket.responses.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {ticket.responses.length}
            </span>
          )}
        </div>

        {/* Creator Avatar */}
        {ticket.staffUser && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={ticket.staffUser.avatar} alt={ticket.staffUser.name} />
            <AvatarFallback className="bg-indigo-500 text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}

