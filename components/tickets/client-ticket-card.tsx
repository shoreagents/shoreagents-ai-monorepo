"use client"

import { Ticket } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Paperclip, Clock, User } from "lucide-react"

interface ClientTicketCardProps {
  ticket: Ticket
  onClick?: () => void
}

export default function ClientTicketCard({ ticket, onClick }: ClientTicketCardProps) {
  // Priority colors
  const priorityColors = {
    URGENT: "bg-red-100 text-red-700 border-red-200",
    HIGH: "bg-orange-100 text-orange-700 border-orange-200",
    MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
    LOW: "bg-gray-100 text-gray-700 border-gray-200",
  }

  // Status colors
  const statusColors = {
    OPEN: "bg-blue-500",
    IN_PROGRESS: "bg-amber-500",
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
      className="group relative bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Status indicator bar */}
      <div className={`h-1.5 w-full ${statusColors[ticket.status]}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {ticket.ticketId}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded border ${
                  priorityColors[ticket.priority]
                }`}
              >
                {ticket.priority}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {ticket.title}
            </h3>
          </div>
        </div>

        {/* Category */}
        <div className="mb-3">
          <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
            {ticket.category.replace(/_/g, " ")}
          </span>
        </div>

        {/* Description preview */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
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
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {/* Responses count */}
            {ticket.responses && ticket.responses.length > 0 && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-700">{ticket.responses.length}</span>
              </div>
            )}

            {/* Attachments count */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-green-500" />
                <span className="font-medium text-gray-700">{ticket.attachments.length}</span>
              </div>
            )}

            {/* Time */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs">{formatDate(ticket.createdAt)}</span>
            </div>
          </div>

          {/* Account Manager */}
          {ticket.accountManager && (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                <AvatarImage src={ticket.accountManager.avatar} alt={ticket.accountManager.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs">
                  {ticket.accountManager.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* Account Manager tooltip on hover */}
        {ticket.accountManager && (
          <div className="absolute bottom-full right-4 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg whitespace-nowrap shadow-lg">
              Assigned to {ticket.accountManager.name}
              <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
            </div>
          </div>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
}

