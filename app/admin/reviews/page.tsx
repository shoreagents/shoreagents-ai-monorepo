"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Eye, RefreshCw } from "@/components/admin/icons"
import { formatDate, formatReviewType } from "@/lib/review-schedule"
import { useToast } from "@/hooks/use-toast"

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchReviews()
  }, [filter])

  async function fetchReviews() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/reviews?filter=${filter}`)
      const data = await res.json()
      if (data.success) {
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  async function sendReview(assignmentId: string, reviewType: string) {
    try {
      const res = await fetch('/api/admin/reviews/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, reviewType })
      })
      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Review Request Sent",
          description: data.message,
        })
        fetchReviews()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send review",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send review request",
        variant: "destructive"
      })
    }
  }

  const getReviewTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      MONTH_1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      MONTH_3: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      MONTH_5: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      RECURRING_6M: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    }
    return variants[type] || variants.MONTH_1
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      NOT_SENT: "bg-gray-500/20 text-gray-400",
      DUE_SOON: "bg-yellow-500/20 text-yellow-400",
      OVERDUE: "bg-red-500/20 text-red-400",
      PENDING: "bg-amber-500/20 text-amber-400",
      COMPLETED: "bg-emerald-500/20 text-emerald-400",
    }
    return variants[status] || "bg-gray-500/20 text-gray-400"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Staff Reviews</h1>
        <p className="text-sm text-muted-foreground">Manage performance reviews and feedback collection</p>
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="due_this_month">Due This Month</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <Card className="border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Staff Member</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Review Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Loading reviews...
                      </td>
                    </tr>
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No reviews found
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review) => (
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
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={getReviewTypeBadge(review.type)}>
                            {formatReviewType(review.type)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {review.dueDate ? (
                            <div>
                              <div className="text-sm text-foreground">{formatDate(new Date(review.dueDate))}</div>
                              {review.daysUntilDue !== undefined && (
                                <div className={`text-xs ${review.isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                                  {review.isOverdue ? `${Math.abs(review.daysUntilDue)} days overdue` : `${review.daysUntilDue} days`}
                                </div>
                              )}
                            </div>
                          ) : review.submittedDate ? (
                            <div className="text-sm text-foreground">{formatDate(new Date(review.submittedDate))}</div>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={getStatusBadge(review.status)}>
                            {review.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {review.overallScore ? (
                            <div className="text-sm font-medium text-foreground">{review.overallScore}/5.0</div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {review.isCalculated && review.status !== "COMPLETED" ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 gap-1.5 text-primary"
                                onClick={() => sendReview(review.assignmentId, review.type)}
                              >
                                <Send className="size-3.5" />
                                Send
                              </Button>
                            ) : review.id ? (
                              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                                <Eye className="size-3.5" />
                                View
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
