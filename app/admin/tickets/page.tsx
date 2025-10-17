"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter } from "lucide-react"
import { Ticket, TicketStatus, TicketCategory, TicketPriority } from "@/types/ticket"
import TicketKanban from "@/components/tickets/ticket-kanban"
import TicketDetailModal from "@/components/tickets/ticket-detail-modal"
import ViewToggle from "@/components/tickets/view-toggle"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminTicketsPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchTickets()
  }, [activeTab])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, filterStatus, filterCategory])

  const fetchTickets = async () => {
    try {
      let url = "/api/admin/tickets"
      if (activeTab !== "all") {
        url += `?creatorType=${activeTab}`
      }
      const response = await fetch(url)
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

  const filterTickets = () => {
    let filtered = tickets

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === filterStatus)
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((ticket) => ticket.category === filterCategory)
    }

    setFilteredTickets(filtered)
  }

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    // Optimistically update UI first for instant feedback
    const previousTickets = [...tickets]
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      )
    )

    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        // Revert on failure
        setTickets(previousTickets)
        throw new Error("Failed to update status")
      }

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      })
    } catch (error) {
      // Revert already happened above
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      })
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

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Ticket Management</h1>
          <p className="mt-1 text-slate-400">Oversee and respond to all support tickets</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-all hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5" />
            Create Ticket
          </Button>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4 bg-slate-800/50">
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="client">Clients</TabsTrigger>
          <TabsTrigger value="management">Internal</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10">
          <div className="text-2xl font-bold text-white">{ticketStats.total}</div>
          <div className="text-sm text-slate-400">Total Tickets</div>
        </div>
        <div className="rounded-xl bg-blue-500/10 p-4 ring-1 ring-blue-500/30">
          <div className="text-2xl font-bold text-blue-400">{ticketStats.open}</div>
          <div className="text-sm text-blue-300">Open</div>
        </div>
        <div className="rounded-xl bg-amber-500/10 p-4 ring-1 ring-amber-500/30">
          <div className="text-2xl font-bold text-amber-400">{ticketStats.inProgress}</div>
          <div className="text-sm text-amber-300">In Progress</div>
        </div>
        <div className="rounded-xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/30">
          <div className="text-2xl font-bold text-emerald-400">{ticketStats.resolved}</div>
          <div className="text-sm text-emerald-300">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tickets..."
            className="w-full rounded-lg bg-slate-800/50 py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg bg-slate-800/50 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
        >
          <option value="all">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg bg-slate-800/50 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
        >
          <option value="all">All Categories</option>
          <optgroup label="Staff & Management">
            <option value="IT">IT Support</option>
            <option value="HR">HR Request</option>
            <option value="MANAGEMENT">Management</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="CLINIC">Clinic / Nurse</option>
            <option value="MEETING_ROOM">Meeting Room</option>
          </optgroup>
          <optgroup label="Management Only">
            <option value="ONBOARDING">Onboarding</option>
            <option value="OFFBOARDING">Offboarding</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="CLEANING">Cleaning</option>
            <option value="FINANCE">Finance</option>
            <option value="OPERATIONS">Operations</option>
            <option value="SURROUNDINGS">Environment</option>
            <option value="COMPENSATION">Compensation</option>
            <option value="TRANSPORT">Transport</option>
          </optgroup>
          <optgroup label="Client Only">
            <option value="ACCOUNT_SUPPORT">Account Support</option>
            <option value="STAFF_PERFORMANCE">Staff Performance</option>
            <option value="PURCHASE_REQUEST">Purchase Request</option>
            <option value="BONUS_REQUEST">Bonus / Gift Request</option>
            <option value="REFERRAL">Referral</option>
            <option value="REPORTING_ISSUES">Reporting Issues</option>
            <option value="SYSTEM_ACCESS">System Access</option>
            <option value="GENERAL_INQUIRY">General Inquiry</option>
          </optgroup>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <TicketKanban
          tickets={filteredTickets}
          onTicketClick={handleTicketClick}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
          onUpdate={handleUpdate}
          isManagement={true}
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
        />
      )}
    </div>
  )
}

// Create Ticket Modal Component
function CreateTicketModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    staffUserId: "",
    managementUserId: "",
    clientUserId: "",
    assigneeType: "staff" as "staff" | "management" | "client",
    title: "",
    description: "",
    category: "OTHER" as TicketCategory,
    priority: "MEDIUM" as TicketPriority,
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [staffUsers, setStaffUsers] = useState<any[]>([])
  const [managementUsers, setManagementUsers] = useState<any[]>([])
  const [clientUsers, setClientUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch current user session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (session?.user) {
          // Fetch management users first to get current user details
          fetch("/api/admin/management")
            .then((res) => res.json())
            .then((data) => {
              setManagementUsers(data.management || [])
              // Find current user in management list
              const user = (data.management || []).find((m: any) => m.email === session.user.email)
              if (user) {
                setCurrentUser(user)
              }
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
    
    // Fetch staff users
    fetch("/api/admin/staff")
      .then((res) => res.json())
      .then((data) => setStaffUsers(data.staff || []))
      .catch(() => {})
    
    // Fetch client users
    fetch("/api/admin/clients")
      .then((res) => res.json())
      .then((data) => setClientUsers(data.clients || []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let assigneeId = ""
    if (formData.assigneeType === "staff") assigneeId = formData.staffUserId
    else if (formData.assigneeType === "management") assigneeId = formData.managementUserId
    else if (formData.assigneeType === "client") assigneeId = formData.clientUserId
    
    if (!assigneeId || !formData.title || !formData.description) {
      toast({
        title: "Error",
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

      const payload = {
        staffUserId: formData.assigneeType === "staff" ? formData.staffUserId : undefined,
        managementUserId: formData.assigneeType === "management" 
          ? formData.managementUserId 
          : (formData.assigneeType === "client" && currentUser ? currentUser.id : undefined),
        clientUserId: formData.assigneeType === "client" ? formData.clientUserId : undefined,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        attachments: attachmentUrls,
      }

      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-slate-900 p-6 shadow-2xl ring-1 ring-white/10">
        <h2 className="mb-4 text-2xl font-bold text-white">Create New Ticket</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Assignee Type Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Assign To *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assigneeType"
                  value="staff"
                  checked={formData.assigneeType === "staff"}
                  onChange={(e) =>
                    setFormData({ ...formData, assigneeType: "staff", managementUserId: "", clientUserId: "" })
                  }
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="text-white">Staff Member</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assigneeType"
                  value="management"
                  checked={formData.assigneeType === "management"}
                  onChange={(e) =>
                    setFormData({ ...formData, assigneeType: "management", staffUserId: "", clientUserId: "" })
                  }
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="text-white">Management Team</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assigneeType"
                  value="client"
                  checked={formData.assigneeType === "client"}
                  onChange={(e) =>
                    setFormData({ ...formData, assigneeType: "client", staffUserId: "", managementUserId: "" })
                  }
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="text-white">Client</span>
              </label>
            </div>
          </div>

          {/* Assignee Dropdown */}
          {formData.assigneeType === "staff" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Staff Member *
              </label>
              <select
                required
                value={formData.staffUserId}
                onChange={(e) =>
                  setFormData({ ...formData, staffUserId: e.target.value })
                }
                className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
              >
                <option value="">Select a staff member...</option>
                {staffUsers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.email})
                  </option>
                ))}
              </select>
            </div>
          ) : formData.assigneeType === "management" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Management Member *
              </label>
              <select
                required
                value={formData.managementUserId}
                onChange={(e) =>
                  setFormData({ ...formData, managementUserId: e.target.value })
                }
                className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
              >
                <option value="">Select a management member...</option>
                {managementUsers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Client *
              </label>
              <select
                required
                value={formData.clientUserId}
                onChange={(e) =>
                  setFormData({ ...formData, clientUserId: e.target.value })
                }
                className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
              >
                <option value="">Select a client...</option>
                {clientUsers.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Relationship Preview */}
          {formData.clientUserId && formData.assigneeType === "client" && currentUser && (
            <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 ring-1 ring-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-sm">
                    {currentUser.name?.split(" ").map((n: string) => n[0]).join("").slice(0,2) || "ME"}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Assigned to (You)</div>
                    <div className="font-semibold text-white">{currentUser.name}</div>
                  </div>
                </div>
                <div className="text-2xl text-slate-600">→</div>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-xs text-slate-400">Creating ticket FOR</div>
                    <div className="font-semibold text-white">
                      {clientUsers.find(c => c.id === formData.clientUserId)?.name || "Client"}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-sm">
                    {clientUsers.find(c => c.id === formData.clientUserId)?.name?.split(" ").map(n => n[0]).join("").slice(0,2) || "CL"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
              placeholder="Brief summary of the issue..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
              placeholder="Detailed description..."
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as TicketCategory })
                }
                className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
              >
                <optgroup label="Staff & Management">
                  <option value="IT">IT Support</option>
                  <option value="HR">HR Request</option>
                  <option value="MANAGEMENT">Management</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="CLINIC">Clinic / Nurse</option>
                  <option value="MEETING_ROOM">Meeting Room</option>
                  <option value="OTHER">Other</option>
                </optgroup>
                <optgroup label="Management Only">
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="OFFBOARDING">Offboarding</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="FINANCE">Finance</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="SURROUNDINGS">Environment</option>
                  <option value="COMPENSATION">Compensation</option>
                  <option value="TRANSPORT">Transport</option>
                </optgroup>
                <optgroup label="Client Only">
                  <option value="ACCOUNT_SUPPORT">Account Support</option>
                  <option value="STAFF_PERFORMANCE">Staff Performance</option>
                  <option value="PURCHASE_REQUEST">Purchase Request</option>
                  <option value="BONUS_REQUEST">Bonus / Gift Request</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="REPORTING_ISSUES">Reporting Issues</option>
                  <option value="SYSTEM_ACCESS">System Access</option>
                  <option value="GENERAL_INQUIRY">General Inquiry</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Priority *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as TicketPriority })
                }
                className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Image Attachments */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Attachments (Optional)
            </label>
            
            {/* Attachment Preview */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3 ring-1 ring-white/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-indigo-500/20">
                      <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400 transition-colors hover:bg-red-500/30"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload Button */}
            {attachments.length < 5 && (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/30 px-4 py-8 transition-all hover:border-indigo-500/50 hover:bg-slate-800/50">
                <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-300">
                    Click to upload images
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    PNG, JPG up to 5MB (max 5 files)
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      const files = Array.from(e.target.files).slice(0, 5 - attachments.length)
                      setAttachments(prev => [...prev, ...files].slice(0, 5))
                    }
                  }}
                  className="hidden"
                />
              </label>
            )}
            
            {uploading && (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 p-3 ring-1 ring-indigo-500/30">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                <span className="text-sm font-medium text-indigo-400">
                  Uploading {attachments.length} image{attachments.length > 1 ? 's' : ''}...
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading || uploading}
              className="rounded-lg bg-slate-700 px-6 py-2.5 font-medium text-white transition-all hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : loading ? (
                "Creating..."
              ) : (
                <>
                  {attachments.length > 0 && `Create with ${attachments.length} image${attachments.length > 1 ? 's' : ''}`}
                  {attachments.length === 0 && "Create Ticket"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

