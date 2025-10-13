import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Plus, MessageSquare, Eye, Edit } from "@/components/admin/icons"
import { prisma } from "@/lib/prisma"

async function getTickets() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })
    return tickets
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return []
  }
}

const getPriorityBadge = (priority: string) => {
  const variants: Record<string, string> = {
    LOW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    URGENT: "bg-red-500/20 text-red-400 border-red-500/30",
  }
  return variants[priority] || variants.MEDIUM
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    OPEN: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    IN_PROGRESS: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    RESOLVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    CLOSED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  }
  return variants[status] || variants.OPEN
}

export default async function TicketsPage() {
  const tickets = await getTickets()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage staff support tickets and issues</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
          <Button className="gap-2 bg-primary">
            <Plus className="size-4" />
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border bg-card">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tickets..." className="pl-9" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Staff Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket: any) => {
                  const priorityBadge = getPriorityBadge(ticket.priority)
                  const statusBadge = getStatusBadge(ticket.status)

                  return (
                    <tr key={ticket.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="text-sm font-mono text-muted-foreground">
                          #{ticket.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-foreground">{ticket.subject}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{ticket.description || "No description"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarImage src={ticket.user?.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{ticket.user?.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground">{ticket.user?.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        N/A
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={priorityBadge}>
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusBadge}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                            <Eye className="size-3.5" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                            <MessageSquare className="size-3.5" />
                            Reply
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Tickets</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{tickets.length}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Open</div>
          <div className="text-2xl font-semibold text-blue-500 mt-1">
            {tickets.filter(t => t.status === 'OPEN').length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">In Progress</div>
          <div className="text-2xl font-semibold text-yellow-500 mt-1">
            {tickets.filter(t => t.status === 'IN_PROGRESS').length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Resolved</div>
          <div className="text-2xl font-semibold text-emerald-500 mt-1">
            {tickets.filter(t => t.status === 'RESOLVED').length}
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Urgent</div>
          <div className="text-2xl font-semibold text-red-500 mt-1">
            {tickets.filter(t => t.priority === 'URGENT').length}
          </div>
        </Card>
      </div>
    </div>
  )
}
