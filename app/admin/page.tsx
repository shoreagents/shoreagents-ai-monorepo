import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Send, Eye } from "@/components/admin/icons"
import { formatDate, formatReviewType } from "@/lib/review-schedule"

// Fetch dashboard statistics from API
async function getStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/stats`, {
      cache: 'no-store' // Always fetch fresh data
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.stats
  } catch (error) {
    console.error('Error fetching stats:', error)
    return null
  }
}

// Fetch reviews due this month
async function getReviewsDue() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/reviews?filter=due_this_month`, {
      cache: 'no-store'
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.reviews || []
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

const getReviewTypeBadge = (type: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    MONTH_1: { label: "Month 1", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    MONTH_3: { label: "Month 3", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    MONTH_5: { label: "Month 5", className: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
    RECURRING_6M: { label: "6-Month", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  }
  return variants[type] || variants.MONTH_1
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    NOT_SENT: { label: "Not Sent", className: "bg-gray-500/20 text-gray-400" },
    PENDING: { label: "Pending", className: "bg-amber-500/20 text-amber-400" },
    DUE_SOON: { label: "Due Soon", className: "bg-yellow-500/20 text-yellow-400" },
    OVERDUE: { label: "Overdue", className: "bg-red-500/20 text-red-400" },
    COMPLETED: { label: "Completed", className: "bg-emerald-500/20 text-emerald-400" },
  }
  return variants[status] || variants.PENDING
}

export default async function Page() {
  // Fetch data from APIs
  const stats = await getStats()
  const reviewsDue = await getReviewsDue()
  
  // Fallback values if API fails
  const safeStats = stats || {
    totalStaff: 0,
    regularStaff: 0,
    probationStaff: 0,
    activeClients: 0,
    pendingReviews: 0,
    reviewBreakdown: { month1: 0, month3: 0, month5: 0, recurring: 0 },
    openTickets: 0,
    ticketPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
    staffClockedIn: 0,
    avgProductivity: 0,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">Monitor staff, clients, and system operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Staff</div>
          <div className="mb-2 text-3xl font-bold text-foreground">{safeStats.totalStaff}</div>
          <div className="text-xs text-muted-foreground">
            {safeStats.regularStaff} Regular, {safeStats.probationStaff} Probation
          </div>
        </Card>

        <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active Clients
          </div>
          <div className="mb-2 text-3xl font-bold text-foreground">{safeStats.activeClients}</div>
          <div className="text-xs text-emerald-400 font-medium">All companies active</div>
        </Card>

        <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pending Reviews
          </div>
          <div className="mb-2 text-3xl font-bold text-foreground">{safeStats.pendingReviews}</div>
          <div className="text-xs text-muted-foreground">
            M1: {safeStats.reviewBreakdown.month1}, M3: {safeStats.reviewBreakdown.month3}, M5: {safeStats.reviewBreakdown.month5}
          </div>
        </Card>

        <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Open Tickets</div>
          <div className="mb-2 text-3xl font-bold text-foreground">{safeStats.openTickets}</div>
          <div className="text-xs text-amber-400 font-medium">{safeStats.ticketPriority.urgent} urgent</div>
        </Card>

        <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Staff Clocked In
          </div>
          <div className="mb-2 text-3xl font-bold text-foreground">
            {safeStats.staffClockedIn}/{safeStats.totalStaff}
          </div>
          <div className="text-xs text-emerald-400 font-medium">
            {safeStats.totalStaff > 0 ? Math.round((safeStats.staffClockedIn / safeStats.totalStaff) * 100) : 0}% online
          </div>
        </Card>

        <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Avg Productivity
          </div>
          <div className="mb-2 text-3xl font-bold text-foreground">{safeStats.avgProductivity}/100</div>
          <div className="text-xs text-emerald-400 font-medium">Above target</div>
        </Card>
      </div>

        {/* Reviews Due This Week Table */}
        <Card className="border-border bg-card overflow-hidden">
          <div className="border-b border-border p-5 bg-muted/20">
            <h2 className="text-base font-semibold text-foreground">Reviews Due This Week</h2>
            <p className="text-sm text-muted-foreground">Staff performance reviews requiring action</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Staff Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Client Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Manager
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Days Employed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Review Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviewsDue.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No reviews due this month
                    </td>
                  </tr>
                ) : (
                  reviewsDue.map((review: any) => {
                    const reviewBadge = getReviewTypeBadge(review.type)
                    const statusBadge = getStatusBadge(review.status)
                    const daysEmployed = review.startDate ? Math.floor((new Date().getTime() - new Date(review.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
                    
                    return (
                      <tr key={review.assignmentId || review.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarImage src={review.staff?.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{review.staff?.name?.charAt(0) || "?"}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-foreground">{review.staff?.name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{review.client?.companyName || "N/A"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{review.manager?.name || "N/A"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{review.staff?.profile?.currentRole || "N/A"}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-foreground">{daysEmployed} days</div>
                          <div className="text-xs text-muted-foreground">
                            Since {review.startDate ? formatDate(new Date(review.startDate)) : "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={reviewBadge.className}>
                            {reviewBadge.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {review.dueDate ? formatDate(new Date(review.dueDate)) : "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {review.status === "COMPLETED" ? (
                              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                                <Eye className="size-3.5" />
                                View
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary">
                                <Send className="size-3.5" />
                                Send
                              </Button>
                            )}
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

    </div>
  )
}
