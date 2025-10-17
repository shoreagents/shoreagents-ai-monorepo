"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter } from "lucide-react"
import { Ticket, TicketStatus } from "@/types/ticket"
import TicketKanban from "@/components/tickets/ticket-kanban"
import TicketDetailModal from "@/components/tickets/ticket-detail-modal"
import ViewToggle from "@/components/tickets/view-toggle"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

export default function AdminTicketsPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, filterStatus, filterCategory])

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/admin/tickets")
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
    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      // Update local state
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      )

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      })
    } catch (error) {
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
        <ViewToggle view={view} onViewChange={setView} />
      </div>

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
          <option value="IT">IT / Computer</option>
          <option value="HR">HR / Payroll</option>
          <option value="MANAGEMENT">Management</option>
          <option value="EQUIPMENT">Equipment</option>
          <option value="STATION">Workstation</option>
          <option value="SURROUNDINGS">Environment</option>
          <option value="COMPENSATION">Perks & Requests</option>
          <option value="TRANSPORT">Transport</option>
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
    </div>
  )
}

