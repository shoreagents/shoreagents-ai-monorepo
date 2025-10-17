"use client"

import { useState, useEffect } from "react"
import { Plus, Paperclip, X, ArrowRight } from "lucide-react"
import { Ticket, TicketStatus, TicketCategory, TicketPriority } from "@/types/ticket"
import TicketDetailModal from "@/components/tickets/ticket-detail-modal"
import { useToast } from "@/components/ui/use-toast"
import { getCategoriesForUserType, getCategoryLabel, getCategoryIcon } from "@/lib/ticket-categories"
import ClientTicketCard from "@/components/tickets/client-ticket-card"
import { mapCategoryToDepartment, getDepartmentLabel, getDepartmentEmoji } from "@/lib/category-department-map"

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { toast } = useToast()
  
  const staffCategories = getCategoriesForUserType('staff')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets")
      if (!response.ok) throw new Error("Failed to fetch tickets")
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tickets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
  }

  const handleCloseModal = () => {
    setSelectedTicket(null)
  }

  const handleUpdate = () => {
    fetchTickets()
    setSelectedTicket(null)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-400">Loading tickets...</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
  }

  const columns: { status: TicketStatus; label: string; color: string; ring: string }[] = [
    { status: "OPEN", label: "Open", color: "bg-blue-500/10", ring: "ring-blue-500/30" },
    { status: "IN_PROGRESS", label: "In Progress", color: "bg-amber-500/10", ring: "ring-amber-500/30" },
    { status: "RESOLVED", label: "Resolved", color: "bg-emerald-500/10", ring: "ring-emerald-500/30" },
    { status: "CLOSED", label: "Closed", color: "bg-slate-500/10", ring: "ring-slate-500/30" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Support Tickets 🎫
            </h1>
            <p className="mt-2 text-slate-400">Submit and track your support requests</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 font-bold text-white transition-all hover:from-indigo-700 hover:to-purple-700 hover:scale-105 shadow-2xl shadow-indigo-500/50 animate-pulse"
          >
            <Plus className="h-6 w-6" />
            New Ticket
          </button>
        </div>

        {/* Stats Cards - Glassmorphism Style */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-2xl bg-slate-900/50 backdrop-blur-xl p-6 ring-1 ring-white/10 hover:ring-indigo-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400">
              {stats.total}
            </div>
            <div className="text-sm font-medium text-slate-400 mt-1">Total Tickets</div>
          </div>
          <div className="group rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl p-6 ring-1 ring-blue-500/30 hover:ring-blue-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              {stats.open}
            </div>
            <div className="text-sm font-medium text-blue-300 mt-1">Open Tickets</div>
          </div>
          <div className="group rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl p-6 ring-1 ring-amber-500/30 hover:ring-amber-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300">
              {stats.inProgress}
            </div>
            <div className="text-sm font-medium text-amber-300 mt-1">In Progress</div>
          </div>
          <div className="group rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-xl p-6 ring-1 ring-emerald-500/30 hover:ring-emerald-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
              {stats.resolved}
            </div>
            <div className="text-sm font-medium text-emerald-300 mt-1">Resolved</div>
          </div>
        </div>

        {/* Fun Kanban Board with Emojis */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {columns.map((column, idx) => {
            const columnTickets = tickets.filter((ticket) => ticket.status === column.status)
            const emojis = ['🆕', '⚡', '✅', '📦']
            const gradients = [
              'from-blue-500/20 to-cyan-500/20',
              'from-amber-500/20 to-orange-500/20',
              'from-emerald-500/20 to-green-500/20',
              'from-slate-500/20 to-gray-500/20'
            ]

            return (
              <div key={column.status} className="flex flex-col">
                {/* Column Header with Gradient */}
                <div className={`mb-4 rounded-2xl bg-gradient-to-r ${gradients[idx]} backdrop-blur-xl p-4 ring-1 ${column.ring.replace('/30', '/50')} shadow-lg`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emojis[idx]}</span>
                    <h3 className="text-lg font-bold text-white">{column.label}</h3>
                    <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
                      {columnTickets.length}
                    </span>
                  </div>
                </div>

                {/* Tickets Column with Glassmorphism */}
                <div className={`min-h-[400px] space-y-3 rounded-2xl bg-slate-900/30 backdrop-blur-xl p-4 ring-1 ring-white/5 transition-all duration-300`}>
                  {columnTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => handleTicketClick(ticket)}
                      className="cursor-pointer transform transition-all duration-200 hover:scale-105"
                    >
                      <ClientTicketCard ticket={ticket} />
                    </div>
                  ))}

                  {columnTickets.length === 0 && (
                    <div className="flex h-32 items-center justify-center rounded-xl bg-slate-800/30 backdrop-blur-sm">
                      <div className="text-center">
                        <div className="text-3xl mb-2">📭</div>
                        <div className="text-sm text-slate-500 font-medium">No tickets here</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
          onUpdate={handleUpdate}
          isManagement={false}
        />
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchTickets()
          }}
          categories={staffCategories}
        />
      )}
    </div>
  )
}

// Create Ticket Modal Component
function CreateTicketModal({
  onClose,
  onSuccess,
  categories,
}: {
  onClose: () => void
  onSuccess: () => void
  categories: TicketCategory[]
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as TicketCategory | "",
    priority: "MEDIUM" as TicketPriority,
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      
      // Limit to 3 files
      if (attachments.length + files.length > 3) {
        toast({
          title: "Too many files",
          description: "You can only upload up to 3 images",
          variant: "destructive",
        })
        return
      }

      // Check file sizes (5MB each)
      const oversized = files.filter(f => f.size > 5 * 1024 * 1024)
      if (oversized.length > 0) {
        toast({
          title: "File too large",
          description: "Each image must be under 5MB",
          variant: "destructive",
        })
        return
      }

      // Check file types (images only)
      const nonImages = files.filter(f => !f.type.startsWith('image/'))
      if (nonImages.length > 0) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed",
          variant: "destructive",
        })
        return
      }

      setAttachments([...attachments, ...files])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category || !formData.title || !formData.description) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Upload attachments first if any
      let attachmentUrls: string[] = []
      
      if (attachments.length > 0) {
        setUploading(true)
        const uploadFormData = new FormData()
        attachments.forEach((file) => {
          uploadFormData.append("files", file)
        })

        const uploadRes = await fetch("/api/tickets/attachments", {
          method: "POST",
          body: uploadFormData,
        })

        setUploading(false)

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          attachmentUrls = uploadData.urls || []
        } else {
          toast({
            title: "Warning",
            description: "Some attachments failed to upload",
            variant: "destructive",
          })
        }
      }

      // Create ticket
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attachments: attachmentUrls,
        }),
      })

      if (!response.ok) throw new Error("Failed to create ticket")

      toast({
        title: "✅ Success!",
        description: `Ticket created${attachmentUrls.length > 0 ? ` with ${attachmentUrls.length} image${attachmentUrls.length > 1 ? 's' : ''}` : ''}`,
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 p-8 shadow-2xl ring-2 ring-indigo-500/30 max-h-[90vh] overflow-y-auto backdrop-blur-2xl animate-in slide-in-from-bottom duration-500">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Create New Ticket 🎫
            </h2>
            <p className="text-sm text-slate-400 mt-1">Fill in the details to submit your support request</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-800 hover:text-white hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Title <span className="text-pink-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl bg-slate-800/50 backdrop-blur-xl px-5 py-4 text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80 transition-all duration-300"
              placeholder="Brief description of your issue"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Category <span className="text-pink-400">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
              className="w-full rounded-xl bg-slate-800/50 backdrop-blur-xl px-5 py-4 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80 transition-all duration-300"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
            
            {/* Department Preview - Shows where ticket will be routed */}
            {formData.category && mapCategoryToDepartment(formData.category) && (
              <div className="mt-3 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl px-4 py-3 border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 font-medium">Will be assigned to:</span>
                    <ArrowRight className="h-4 w-4 text-indigo-400" />
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                      {getDepartmentEmoji(mapCategoryToDepartment(formData.category)!)} {getDepartmentLabel(mapCategoryToDepartment(formData.category)!)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
              className="w-full rounded-xl bg-slate-800/50 backdrop-blur-xl px-5 py-4 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80 transition-all duration-300"
            >
              <option value="LOW">🟢 Low</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HIGH">🟠 High</option>
              <option value="URGENT">🔴 Urgent</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Description <span className="text-pink-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl bg-slate-800/50 backdrop-blur-xl px-5 py-4 text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80 transition-all duration-300"
              placeholder="Provide detailed information about your issue..."
              rows={5}
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              📎 Attachments (Optional)
              <span className="ml-2 text-xs text-slate-500 font-normal">Max 3 images, 5MB each</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-xl px-6 py-4 text-sm font-bold text-indigo-300 ring-1 ring-indigo-500/30 transition-all hover:from-indigo-600/30 hover:to-purple-600/30 hover:scale-105">
                <Paperclip className="h-5 w-5" />
                Choose Files
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={attachments.length >= 3}
                />
              </label>
              <span className="text-sm text-slate-400 font-medium">
                {attachments.length} / 3 files selected
              </span>
            </div>

            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {attachments.map((file, index) => (
                  <div key={index} className="relative group rounded-xl bg-slate-800/50 backdrop-blur-xl p-3 ring-1 ring-white/10 transition-all hover:ring-indigo-500/50">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="h-20 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute -right-2 -top-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 p-1.5 text-white shadow-lg hover:from-red-600 hover:to-pink-600 hover:scale-110 transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="mt-2 truncate text-xs text-slate-400 font-medium">{file.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-800/50 backdrop-blur-xl px-6 py-4 font-bold text-white ring-1 ring-white/10 transition-all hover:bg-slate-700/50 hover:scale-105"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 font-bold text-white transition-all hover:from-indigo-700 hover:to-purple-700 hover:scale-105 disabled:opacity-50 shadow-2xl shadow-indigo-500/50"
            >
              {uploading ? "⬆️ Uploading..." : loading ? "⏳ Creating..." : "✨ Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
