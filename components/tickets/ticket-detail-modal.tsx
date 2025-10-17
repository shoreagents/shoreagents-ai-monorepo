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
import ImageLightbox from "@/components/ui/image-lightbox"

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
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)

  const CategoryIcon = categoryConfig[ticket.category]?.icon || HelpCircle

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setShowLightbox(true)
  }

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

  const handleAddAttachmentsOnly = async () => {
    if (attachments.length === 0) return

    setUploading(true)
    try {
      // Upload attachments to Supabase
      const formData = new FormData()
      attachments.forEach((file) => {
        formData.append("files", file)
      })

      const uploadResponse = await fetch("/api/tickets/attachments", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload attachments")
      }

      const uploadData = await uploadResponse.json()
      const attachmentUrls = uploadData.urls || []

      // Add attachments to ticket
      const response = await fetch(`/api/client/tickets/${ticket.id}/attachments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentUrls }),
      })

      if (!response.ok) throw new Error("Failed to add attachments to ticket")

      toast({
        title: "✅ Success!",
        description: `${attachments.length} image${attachments.length > 1 ? 's' : ''} saved to ticket`,
      })

      setAttachments([])
      onUpdate()
      
      // Auto-close modal after 500ms to show success message
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitResponse = async () => {
    if (!message.trim() && attachments.length === 0) {
      toast({
        title: "Error",
        description: "Please enter a message or add at least one image",
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

  // Use light theme for client view, dark for management
  const isDark = isManagement
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl ${
        isDark 
          ? "bg-slate-900 ring-1 ring-white/10" 
          : "bg-white border border-gray-200"
      }`}>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className={`font-mono text-sm ${isDark ? "text-slate-500" : "text-gray-500"}`}>{ticket.ticketId}</span>
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
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{ticket.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleStartVideoCall}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Video className="h-4 w-4" />
              Video Call
            </Button>
            <button
              onClick={onClose}
              className={`rounded-lg p-2.5 transition-all hover:scale-110 ${
                isDark 
                  ? "text-slate-400 hover:bg-slate-800 hover:text-white ring-1 ring-slate-700 hover:ring-red-500" 
                  : "text-gray-600 hover:bg-red-50 hover:text-red-600 border-2 border-gray-300 hover:border-red-400"
              }`}
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Assigned To - Account Manager */}
        {/* Relationship Display */}
        {(ticket.accountManager || ticket.clientUser || ticket.managementUser) && (
          <div className={`mb-6 rounded-xl p-5 ${
            isDark 
              ? "bg-gradient-to-r from-purple-900/30 to-indigo-900/30 ring-1 ring-purple-500/30" 
              : "bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200"
          }`}>
            <div className="flex items-center justify-between gap-4">
              {/* Account Manager / Assigned To */}
              {(ticket.accountManager || ticket.managementUser) && (
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-14 w-14 ring-2 ring-purple-500/50 shadow-lg">
                    <AvatarImage src={ticket.accountManager?.avatar || ticket.managementUser?.avatar} alt={ticket.accountManager?.name || ticket.managementUser?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-sm">
                      {(ticket.accountManager?.name || ticket.managementUser?.name || "")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? "text-purple-300" : "text-purple-600"} uppercase tracking-wide`}>
                      Assigned to
                    </p>
                    <p className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {ticket.accountManager?.name || ticket.managementUser?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isDark 
                          ? "bg-purple-500/30 text-purple-300" 
                          : "bg-purple-200 text-purple-700"
                      }`}>
                        {ticket.accountManager ? "Account Manager" : "Management"}
                      </span>
                      <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        {ticket.accountManager?.email || ticket.managementUser?.email}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Arrow */}
              {ticket.clientUser && (ticket.accountManager || ticket.managementUser) && (
                <div className={`text-3xl font-bold ${isDark ? "text-slate-600" : "text-gray-300"}`}>
                  →
                </div>
              )}

              {/* Client / For */}
              {ticket.clientUser && (
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${isDark ? "text-indigo-300" : "text-indigo-600"} uppercase tracking-wide`}>
                      Ticket FOR
                    </p>
                    <p className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {ticket.clientUser.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        {ticket.clientUser.email}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isDark 
                          ? "bg-indigo-500/30 text-indigo-300" 
                          : "bg-indigo-200 text-indigo-700"
                      }`}>
                        Client
                      </span>
                    </div>
                  </div>
                  <Avatar className="h-14 w-14 ring-2 ring-indigo-500/50 shadow-lg">
                    <AvatarImage src={ticket.clientUser.avatar} alt={ticket.clientUser.name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-sm">
                      {ticket.clientUser.name
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
          </div>
        )}

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
          <div className={`rounded-xl p-4 ${
            isDark 
              ? "bg-slate-800/50 ring-1 ring-white/10" 
              : "bg-gray-50 border border-gray-200"
          }`}>
            <div className={`mb-2 flex items-center justify-between text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>
              <span>Created {new Date(ticket.createdAt).toLocaleString()}</span>
              {(ticket.staffUser || ticket.clientUser) && (
                <div className="flex items-center gap-2">
                  <span className={isDark ? "text-slate-400" : "text-gray-600"}>Created by:</span>
                  <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    {ticket.staffUser?.name || ticket.clientUser?.name}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                    ticket.createdByType === "CLIENT"
                      ? isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700"
                      : ticket.createdByType === "MANAGEMENT"
                      ? isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-700"
                      : isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"
                  }`}>
                    {ticket.createdByType}
                  </span>
                </div>
              )}
            </div>
            <p className={`whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-gray-700"}`}>{ticket.description}</p>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className={`text-sm font-semibold ${isDark ? "text-slate-400" : "text-gray-700"}`}>Attachments:</div>
                <div className="grid grid-cols-2 gap-2">
                  {ticket.attachments.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => openLightbox(ticket.attachments, index)}
                      className={`group relative overflow-hidden rounded-lg transition-all cursor-pointer ${
                        isDark 
                          ? "ring-1 ring-white/10 hover:ring-indigo-400/50" 
                          : "border-2 border-gray-200 hover:border-blue-400"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 rounded-full p-2">
                          <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Responses/Comments */}
        {ticket.responses && ticket.responses.length > 0 && (
          <div className="mb-6">
            <h3 className={`mb-3 text-sm font-semibold ${isDark ? "text-slate-400" : "text-gray-700"}`}>
              Responses ({ticket.responses.length})
            </h3>
            <div className="space-y-3">
              {ticket.responses.map((response) => {
                const user = response.staffUser || response.managementUser || response.clientUser
                const initials = user?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                // Determine styling based on creator type
                const isManagementResp = response.createdByType === "MANAGEMENT"
                const isClientResp = response.createdByType === "CLIENT"
                
                const bgColor = isDark
                  ? isManagementResp 
                    ? "bg-indigo-500/10 ring-indigo-500/30" 
                    : isClientResp 
                    ? "bg-green-500/10 ring-green-500/30"
                    : "bg-slate-800/50 ring-white/10"
                  : isManagementResp
                    ? "bg-purple-50 border border-purple-200"
                    : isClientResp
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                
                const avatarColor = isManagementResp
                  ? "bg-indigo-600"
                  : isClientResp
                  ? "bg-green-600"
                  : "bg-blue-600"
                
                const textColor = isDark
                  ? isManagementResp
                    ? "text-indigo-400"
                    : isClientResp
                    ? "text-green-400"
                    : "text-white"
                  : isManagementResp
                    ? "text-purple-900"
                    : isClientResp
                    ? "text-green-900"
                    : "text-gray-900"
                
                const badgeColor = isDark
                  ? isManagementResp
                    ? "bg-indigo-500/20 text-indigo-300"
                    : isClientResp
                    ? "bg-green-500/20 text-green-300"
                    : "bg-slate-500/20 text-slate-300"
                  : isManagementResp
                    ? "bg-purple-100 text-purple-700"
                    : isClientResp
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"

                return (
                  <div
                    key={response.id}
                    className={`rounded-xl p-4 ${isDark ? 'ring-1' : ''} ${bgColor}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className={`${avatarColor} text-white`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${textColor}`}>
                            {user?.name}
                          </span>
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${badgeColor}`}>
                            {response.createdByType}
                          </span>
                        </div>
                        <span className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                          {new Date(response.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className={isDark ? "text-slate-300" : "text-gray-700"}>{response.message}</p>

                    {response.attachments && response.attachments.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {response.attachments.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => openLightbox(response.attachments, index)}
                            className={`group overflow-hidden rounded transition-all cursor-pointer relative ${
                              isDark 
                                ? "ring-1 ring-white/10 hover:ring-indigo-400/50" 
                                : "border-2 border-gray-200 hover:border-blue-400"
                            }`}
                          >
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="h-20 w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </button>
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
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${isDark ? "text-slate-400" : "text-gray-700"}`}>
              Add Response (Optional)
            </h3>
            <span className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>
              {attachments.length > 0 && `${attachments.length} image${attachments.length > 1 ? 's' : ''} attached`}
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your response... (optional - you can just add images)"
            rows={4}
            className={`w-full rounded-lg px-4 py-3 outline-none transition-all ${
              isDark 
                ? "bg-slate-800/50 text-white placeholder-slate-500 ring-1 ring-white/10 focus:ring-indigo-400/50" 
                : "bg-white text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:border-blue-500"
            }`}
          />

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {uploading && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  isDark ? "bg-blue-900/30 ring-1 ring-blue-500/30" : "bg-blue-50 border border-blue-200"
                }`}>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className={`text-sm font-medium ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                    Uploading {attachments.length} image{attachments.length > 1 ? 's' : ''}...
                  </span>
                </div>
              )}
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 rounded-lg p-2 ${
                    isDark 
                      ? "bg-slate-800/50 ring-1 ring-white/10" 
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <Paperclip className={`h-4 w-4 ${isDark ? "text-slate-400" : "text-gray-600"}`} />
                  <span className={`flex-1 truncate text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}>{file.name}</span>
                  <span className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => removeAttachment(index)}
                    disabled={uploading || submitting}
                    className={`rounded p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark 
                        ? "text-red-400 hover:bg-red-500/20" 
                        : "text-red-600 hover:bg-red-100"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {attachments.length < 5 && (
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isDark 
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                }`}>
                  <Upload className="h-4 w-4" />
                  Add Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
              {attachments.length > 0 && (
                <Button
                  onClick={handleAddAttachmentsOnly}
                  disabled={uploading || submitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading {attachments.length} image{attachments.length > 1 ? 's' : ''}...
                    </>
                  ) : (
                    <>
                      <Paperclip className="h-4 w-4" />
                      💾 Save {attachments.length} Image{attachments.length > 1 ? 's' : ''} & Close
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              {message.trim() && (
                <div className="relative group">
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={submitting || uploading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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
              )}
              
              <Button
                onClick={onClose}
                variant="outline"
                className={`${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Image Lightbox */}
      {showLightbox && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  )
}

