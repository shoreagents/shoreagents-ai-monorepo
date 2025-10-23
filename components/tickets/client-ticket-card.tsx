"use client"

import { Ticket } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Paperclip, Clock, User } from "lucide-react"
import { getDepartmentLabel, getDepartmentEmoji } from "@/lib/category-department-map"
import { getCategoryIcon } from "@/lib/ticket-categories"

interface ClientTicketCardProps {
  ticket: Ticket
  onClick?: () => void
}

export default function ClientTicketCard({ ticket, onClick }: ClientTicketCardProps) {
  // Priority colors - FUN GRADIENTS!
  const priorityColors = {
    URGENT: "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-500/30 shadow-lg shadow-red-500/20",
    HIGH: "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/30 shadow-lg shadow-orange-500/20",
    MEDIUM: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/20",
    LOW: "bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-500/30 shadow-lg shadow-slate-500/20",
  }

  // Priority emojis
  const priorityEmojis = {
    URGENT: "🚨",
    HIGH: "⚡",
    MEDIUM: "📋",
    LOW: "💤",
  }

  // Status colors - PROMINENT TOP BORDER!
  const statusColors = {
    OPEN: "bg-blue-500",
    IN_PROGRESS: "bg-orange-500", 
    RESOLVED: "bg-green-500",
    CLOSED: "bg-gray-500",
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl bg-slate-900/50 backdrop-blur-xl shadow-xl border border-white/10 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer overflow-visible hover:scale-[1.02] transform"
    >
      {/* Status indicator bar - PROMINENT TOP BORDER! */}
      <div className={`h-4 w-full ${statusColors[ticket.status]} shadow-lg`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                {ticket.ticketId}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm ${
                  priorityColors[ticket.priority]
                }`}
              >
                {priorityEmojis[ticket.priority]} {ticket.priority}
              </span>
            </div>
            <h3 className="text-base font-bold text-white line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 transition-all">
              {ticket.title}
            </h3>
          </div>
        </div>

        {/* Category */}
        <div className="mb-3">
          <span className="inline-flex items-center text-xs font-bold text-purple-300 bg-purple-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-500/30 shadow-lg shadow-purple-500/20">
            {getCategoryIcon(ticket.category)} {ticket.category.replace(/_/g, " ")}
          </span>
        </div>

        {/* Description preview */}
        <p className="text-sm text-slate-300 line-clamp-2 mb-3">
          {ticket.description}
        </p>

        {/* Image Thumbnail Preview */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="mb-3">
            <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={ticket.attachments[0]}
                alt="Attachment preview"
                className="w-full h-full object-cover"
              />
              {ticket.attachments.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                  +{ticket.attachments.length - 1}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            {/* Responses count */}
            {ticket.responses && ticket.responses.length > 0 && (
              <div className="flex items-center gap-1.5 bg-blue-500/20 px-2 py-1 rounded-lg border border-blue-500/30">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-blue-300">{ticket.responses.length}</span>
              </div>
            )}

            {/* Attachments count */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/30">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-300">{ticket.attachments.length}</span>
              </div>
            )}

            {/* Time */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">{formatDate(ticket.createdAt)}</span>
            </div>
          </div>

          {/* Assigned Manager (for Staff tickets) or Account Manager (for Client tickets) */}
          {ticket.managementUser && (
            <div className="relative group/assigned">
              <Avatar className="h-8 w-8 border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/50 ring-2 ring-indigo-500/20">
                <AvatarImage src={ticket.managementUser.avatar} alt={ticket.managementUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                  {ticket.managementUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
               <div className="absolute -top-12 -right-2 px-3 py-1.5 bg-black/95 text-white text-xs rounded shadow-lg opacity-0 group-hover/assigned:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] min-w-max">
                 Assigned to: {ticket.managementUser.name}
               </div>
            </div>
          )}
          {!ticket.managementUser && ticket.accountManager && (
            <div className="relative group/assigned">
              <Avatar className="h-8 w-8 border-2 border-purple-500/50 shadow-lg shadow-purple-500/50 ring-2 ring-purple-500/20">
                <AvatarImage src={ticket.accountManager.avatar} alt={ticket.accountManager.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-bold">
                  {ticket.accountManager.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
               <div className="absolute -top-12 -right-2 px-3 py-1.5 bg-black/95 text-white text-xs rounded shadow-lg opacity-0 group-hover/assigned:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] min-w-max">
                 Assigned to: {ticket.accountManager.name}
               </div>
            </div>
          )}
        </div>

      </div>

      {/* Hover effect overlay - MAGICAL SHIMMER! */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
}