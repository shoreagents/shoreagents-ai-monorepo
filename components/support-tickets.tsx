"use client"

import { useState, useEffect } from "react"
import { 
  Plus, Headphones, Monitor, Users, MessageSquare, Package, HelpCircle,
  AlertCircle, CheckCircle, Clock, X, Search, Calendar, User as UserIcon
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
type TicketCategory = "IT_SUPPORT" | "HR_REQUEST" | "MANAGEMENT" | "EQUIPMENT" | "OTHER"
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

interface Ticket {
  id: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "IT_SUPPORT" as TicketCategory,
    priority: "MEDIUM" as TicketPriority,
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets")
      if (!response.ok) throw new Error("Failed to fetch tickets")
      const data = await response.json()
      setTickets(data.tickets)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async () => {
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      })
      if (!response.ok) throw new Error("Failed to create ticket")
      await fetchTickets()
      setIsCreateOpen(false)
      setNewTicket({ title: "", description: "", category: "IT_SUPPORT", priority: "MEDIUM" })
    } catch (err) {
      console.error("Error creating ticket:", err)
    }
  }

  const categoryConfig = {
    IT_SUPPORT: { label: "IT Support", icon: Monitor, color: "bg-blue-500/20 text-blue-400 ring-blue-500/30" },
    HR_REQUEST: { label: "HR Request", icon: Users, color: "bg-purple-500/20 text-purple-400 ring-purple-500/30" },
    MANAGEMENT: { label: "Management", icon: MessageSquare, color: "bg-amber-500/20 text-amber-400 ring-amber-500/30" },
    EQUIPMENT: { label: "Equipment", icon: Package, color: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30" },
    OTHER: { label: "Other", icon: HelpCircle, color: "bg-slate-500/20 text-slate-400 ring-slate-500/30" },
  }

  const statusConfig = {
    OPEN: { label: "Open", color: "bg-blue-500", icon: Clock },
    IN_PROGRESS: { label: "In Progress", color: "bg-amber-500", icon: AlertCircle },
    RESOLVED: { label: "Resolved", color: "bg-emerald-500", icon: CheckCircle },
    CLOSED: { label: "Closed", color: "bg-slate-500", icon: CheckCircle },
  }

  const priorityConfig = {
    LOW: { label: "Low", color: "bg-slate-500/20 text-slate-400" },
    MEDIUM: { label: "Medium", color: "bg-blue-500/20 text-blue-400" },
    HIGH: { label: "High", color: "bg-orange-500/20 text-orange-400" },
    URGENT: { label: "Urgent", color: "bg-red-500/20 text-red-400" },
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "OPEN").length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter(t => t.status === "RESOLVED").length,
    closed: tickets.filter(t => t.status === "CLOSED").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Tickets</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-blue-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Headphones className="h-8 w-8" />
                Support Tickets
              </h1>
              <p className="mt-1 text-slate-300">Log and track your support requests</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 text-white">
                <DialogHeader>
                  <DialogTitle>Create Support Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">Title</label>
                    <input
                      type="text"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                      className="w-full rounded-lg bg-slate-800 p-2 text-white"
                      placeholder="Brief description of your issue..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Category</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as TicketCategory })}
                      className="w-full rounded-lg bg-slate-800 p-2 text-white"
                    >
                      {Object.entries(categoryConfig).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as TicketPriority })}
                      className="w-full rounded-lg bg-slate-800 p-2 text-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Description</label>
                    <textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      className="w-full rounded-lg bg-slate-800 p-2 text-white"
                      rows={4}
                      placeholder="Detailed description of your issue..."
                    />
                  </div>
                  <Button
                    onClick={createTicket}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    disabled={!newTicket.title || !newTicket.description}
                  >
                    Create Ticket
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-5 gap-4">
            <div className="rounded-lg bg-white/10 p-3 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-slate-400">Total</div>
            </div>
            <div className="rounded-lg bg-blue-500/20 p-3 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{stats.open}</div>
              <div className="text-xs text-slate-400">Open</div>
            </div>
            <div className="rounded-lg bg-amber-500/20 p-3 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{stats.inProgress}</div>
              <div className="text-xs text-slate-400">In Progress</div>
            </div>
            <div className="rounded-lg bg-emerald-500/20 p-3 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{stats.resolved}</div>
              <div className="text-xs text-slate-400">Resolved</div>
            </div>
            <div className="rounded-lg bg-slate-500/20 p-3 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{stats.closed}</div>
              <div className="text-xs text-slate-400">Closed</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-900/50 p-4 backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-slate-800/50 py-2 pl-10 pr-4 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-blue-500/50"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg bg-slate-800/50 px-3 py-2 text-white outline-none ring-1 ring-white/10"
          >
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Tickets Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => {
            const category = categoryConfig[ticket.category]
            const status = statusConfig[ticket.status]
            const priority = priorityConfig[ticket.priority]

            return (
              <div
                key={ticket.id}
                className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10 transition-all hover:bg-slate-800/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.color}`}>
                      <category.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white line-clamp-1">{ticket.title}</h3>
                      <p className="text-xs text-slate-400">TKT-{ticket.id.substring(0, 8)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.color} text-white`}>
                    {status.label}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-slate-400">{ticket.description}</p>

                <div className="mt-4 space-y-2 text-sm text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priority.color}`}>
                      {priority.label} Priority
                    </span>
                    {ticket.assignedTo && (
                      <div className="flex items-center gap-1 text-xs">
                        <UserIcon className="h-3 w-3" />
                        {ticket.assignedTo}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    Created: {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredTickets.length === 0 && (
          <div className="rounded-xl bg-slate-900/50 p-12 text-center backdrop-blur-xl ring-1 ring-white/10">
            <p className="text-slate-400">No tickets found</p>
          </div>
        )}
      </div>
    </div>
  )
}
