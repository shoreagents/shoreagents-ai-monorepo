"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  X,
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
  Send,
  Upload,
  Trash2,
  Video,
  Loader2,
} from "lucide-react"
import { Ticket, TicketResponse } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface TicketDetailModalProps {
  ticket: Ticket
  onClose: () => void
  onUpdate: () => void
  isManagement?: boolean
}

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  IT: {
    label: "IT / Computer",
    icon: Monitor,
    color: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
  },
  HR: {
    label: "HR / Payroll",
    icon: Users,
    color: "bg-purple-500/20 text-purple-400 ring-purple-500/30",
  },
  MANAGEMENT: {
    label: "Management",
    icon: MessageSquare,
    color: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
  },
  EQUIPMENT: {
    label: "Equipment",
    icon: Package,
    color: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
  },
  STATION: {
    label: "Workstation",
    icon: MapPin,
    color: "bg-pink-500/20 text-pink-400 ring-pink-500/30",
  },
  SURROUNDINGS: {
    label: "Environment",
    icon: Cloud,
    color: "bg-cyan-500/20 text-cyan-400 ring-cyan-500/30",
  },
  COMPENSATION: {
    label: "Perks & Requests",
    icon: Gift,
    color: "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30",
  },
  TRANSPORT: {
    label: "Transport",
    icon: Bus,
    color: "bg-indigo-500/20 text-indigo-400 ring-indigo-500/30",
  },
  OTHER: {
    label: "Other",
    icon: HelpCircle,
    color: "bg-slate-500/20 text-slate-400 ring-slate-500/30",
  },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "bg-blue-500" },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-500" },
  RESOLVED: { label: "Resolved", color: "bg-emerald-500" },
  CLOSED: { label: "Closed", color: "bg-slate-500" },
}

export default function TicketDetailModal({
  ticket,
  onClose,
  onUpdate,
  isManagement = false,
}: TicketDetailModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(ticket.status)

  const CategoryIcon = categoryConfig[ticket.category]?.icon || HelpCircle

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const validFiles = files.filter((f) => f.size <= 5 * 1024 * 1024).slice(0, 3)
      setAttachments((prev) => [...prev, ...validFiles].slice(0, 3))
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitResponse = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      // Upload attachments first if any
      let attachmentUrls: string[] = []

      if (attachments.length > 0) {
        setUploading(true)
        const formData = new FormData()
        attachments.forEach((file) => {
          formData.append("files", file)
        })

        const uploadResponse = await fetch("/api/tickets/attachments", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          attachmentUrls = uploadData.urls || []
        }
        setUploading(false)
      }

      // Submit response
      const response = await fetch(`/api/tickets/${ticket.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          attachments: attachmentUrls,
        }),
      })

      if (!response.ok) throw new Error("Failed to submit response")

      toast({
        title: "Success",
        description: "Response added successfully",
      })

      setMessage("")
      setAttachments([])
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const handleStatusChange = async () => {
    if (selectedStatus === ticket.status) return

    try {
      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      })

      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStartVideoCall = async () => {
    // Create Daily.co room with ticket ID
    const roomName = `ticket-call-${ticket.ticketId}`
    router.push(`/call/ticket-${ticket.ticketId}?ticketId=${ticket.id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-sm text-slate-500">{ticket.ticketId}</span>
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ring-1 ${
                  categoryConfig[ticket.category]?.color
                }`}
              >
                <CategoryIcon className="h-3 w-3" />
                {categoryConfig[ticket.category]?.label}
              </span>
              <span
                className={`rounded px-3 py-1 text-xs font-medium text-white ${
                  statusConfig[ticket.status]?.color
                }`}
              >
                {statusConfig[ticket.status]?.label}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">{ticket.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleStartVideoCall}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Video className="h-4 w-4" />
              Video Call
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status Change (Management Only) */}
        {isManagement && (
          <div className="mb-6 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Update Status
            </label>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <Button
                onClick={handleStatusChange}
                disabled={selectedStatus === ticket.status}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Update
              </Button>
            </div>
          </div>
        )}

        {/* Ticket Description */}
        <div className="mb-6 space-y-4">
          <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10">
            <div className="mb-2 text-xs text-slate-500">
              Created {new Date(ticket.createdAt).toLocaleString()}
            </div>
            <p className="whitespace-pre-wrap text-slate-300">{ticket.description}</p>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-semibold text-slate-400">Attachments:</div>
                <div className="grid grid-cols-2 gap-2">
                  {ticket.attachments.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative overflow-hidden rounded-lg ring-1 ring-white/10 transition-all hover:ring-indigo-400/50"
                    >
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Responses/Comments */}
        {ticket.responses && ticket.responses.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-400">
              Responses ({ticket.responses.length})
            </h3>
            <div className="space-y-3">
              {ticket.responses.map((response) => {
                const user = response.staffUser || response.managementUser
                const initials = user?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <div
                    key={response.id}
                    className={`rounded-xl p-4 ring-1 ${
                      response.createdByType === "MANAGEMENT"
                        ? "bg-indigo-500/10 ring-indigo-500/30"
                        : "bg-slate-800/50 ring-white/10"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback
                          className={
                            response.createdByType === "MANAGEMENT"
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-600 text-white"
                          }
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              response.createdByType === "MANAGEMENT"
                                ? "text-indigo-400"
                                : "text-white"
                            }`}
                          >
                            {user?.name}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${
                              response.createdByType === "MANAGEMENT"
                                ? "bg-indigo-500/20 text-indigo-300"
                                : "bg-slate-500/20 text-slate-300"
                            }`}
                          >
                            {response.createdByType}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(response.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-300">{response.message}</p>

                    {response.attachments && response.attachments.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {response.attachments.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="overflow-hidden rounded ring-1 ring-white/10 hover:ring-indigo-400/50"
                          >
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="h-20 w-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Add Response */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400">Add Response</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your response..."
            rows={4}
            className="w-full rounded-lg bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
          />

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-2 ring-1 ring-white/10"
                >
                  <Paperclip className="h-4 w-4 text-slate-400" />
                  <span className="flex-1 truncate text-sm text-slate-300">{file.name}</span>
                  <span className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="rounded p-1 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-3">
            {attachments.length < 3 && (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700">
                <Upload className="h-4 w-4" />
                Add Image
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
            <div className="flex-1" />
            <Button
              onClick={handleSubmitResponse}
              disabled={!message.trim() || submitting || uploading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploading ? "Uploading..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Response
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

