"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Ticket, TicketStatus } from "@/types/ticket"
import TicketKanban from "@/components/tickets/ticket-kanban"
import TicketDetailModal from "@/components/tickets/ticket-detail-modal"
import ViewToggle from "@/components/tickets/view-toggle"
import SupportTickets from "@/components/support-tickets"
import { useToast } from "@/components/ui/use-toast"

export default function TicketsPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const { toast } = useToast()

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

  // If list view, use old component
  if (view === "list") {
    return <SupportTickets />
  }

  // Kanban view
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
          <p className="mt-1 text-slate-400">Submit and track your requests</p>
        </div>
        <div className="flex items-center gap-4">
          <ViewToggle view={view} onViewChange={setView} />
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white transition-all hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="h-5 w-5" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10">
          <div className="text-2xl font-bold text-white">{tickets.length}</div>
          <div className="text-sm text-slate-400">Total Tickets</div>
        </div>
        <div className="rounded-xl bg-blue-500/10 p-4 ring-1 ring-blue-500/30">
          <div className="text-2xl font-bold text-blue-400">
            {tickets.filter((t) => t.status === "OPEN").length}
          </div>
          <div className="text-sm text-blue-300">Open</div>
        </div>
        <div className="rounded-xl bg-amber-500/10 p-4 ring-1 ring-amber-500/30">
          <div className="text-2xl font-bold text-amber-400">
            {tickets.filter((t) => t.status === "IN_PROGRESS").length}
          </div>
          <div className="text-sm text-amber-300">In Progress</div>
        </div>
        <div className="rounded-xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/30">
          <div className="text-2xl font-bold text-emerald-400">
            {tickets.filter((t) => t.status === "RESOLVED").length}
          </div>
          <div className="text-sm text-emerald-300">Resolved</div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <TicketKanban
          tickets={tickets}
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
          isManagement={false}
        />
      )}
    </div>
  )
}
