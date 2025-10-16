"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Star, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  Filter,
  Download,
  Calendar
} from "lucide-react"
import { 
  getReviewTypeBadge, 
  getStatusBadge, 
  getPerformanceBadge,
  formatReviewDate,
  getDueDateText,
  isReviewOverdue
} from "@/lib/review-utils"
import { ReviewType } from "@/lib/review-templates"

interface Review {
  id: string
  type: ReviewType
  status: string
  client: string
  reviewer: string
  dueDate: string
  submittedDate?: string
  overallScore?: number
  performanceLevel?: string
  staffUser: {
    id: string
    name: string
    email: string
    avatar?: string
    startDate: string
  }
}

interface Stats {
  total: number
  byStatus: {
    pending: number
    submitted: number
    underReview: number
    completed: number
  }
  alerts: {
    overdue: number
    critical: number
  }
  byType: {
    month1: number
    month3: number
    month5: number
    recurring: number
  }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
    fetchStats()
  }, [filter])

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== "all") {
        params.append("status", filter)
      }
      
      const response = await fetch(`/api/admin/reviews?${params}`)
      if (!response.ok) throw new Error("Failed to fetch reviews")
      
      const data = await response.json()
      setReviews(data.reviews)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/reviews/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")
      
      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    }
  }

  const handleTriggerCreation = async () => {
    setTriggerLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/admin/reviews/trigger-creation", {
        method: "POST"
      })
      
      if (!response.ok) throw new Error("Failed to trigger review creation")
      
      const data = await response.json()
      alert(`✅ Success! Created ${data.created} reviews, skipped ${data.skipped}`)
      
      // Refresh data
      await fetchReviews()
      await fetchStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger creation")
    } finally {
      setTriggerLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Reviews</h1>
          <p className="text-muted-foreground">Manage and process performance reviews</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleTriggerCreation}
            disabled={triggerLoading}
            className="gap-2"
          >
            {triggerLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Trigger Review Creation
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50 p-4 dark:bg-red-950">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.byStatus.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{stats.alerts.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Scores</p>
                <p className="text-3xl font-bold text-red-600">{stats.alerts.critical}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <Card className="p-2">
        <div className="flex gap-2">
          {[
            { value: "all", label: "All", count: stats?.total || 0 },
            { value: "PENDING", label: "Pending", count: stats?.byStatus.pending || 0 },
            { value: "SUBMITTED", label: "Submitted", count: stats?.byStatus.submitted || 0 },
            { value: "UNDER_REVIEW", label: "Under Review", count: stats?.byStatus.underReview || 0 },
            { value: "COMPLETED", label: "Completed", count: stats?.byStatus.completed || 0 }
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={filter === tab.value ? "default" : "ghost"}
              onClick={() => setFilter(tab.value)}
              className="gap-2"
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1">
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No reviews found</p>
          </Card>
        ) : (
          reviews.map((review) => {
            const typeBadge = getReviewTypeBadge(review.type)
            const statusBadge = getStatusBadge(review.status as any)
            const overdue = isReviewOverdue(review.dueDate)
            const perfBadge = review.performanceLevel 
              ? getPerformanceBadge(review.performanceLevel as any)
              : null

            return (
              <Card key={review.id} className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={review.staffUser.avatar} />
                    <AvatarFallback>
                      {review.staffUser.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {review.staffUser.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{review.client}</p>
                      </div>
                      
                      {/* Score Badge */}
                      {review.overallScore && perfBadge && (
                        <div className={`flex items-center gap-2 rounded-lg px-3 py-1 ${perfBadge.bgColor}`}>
                          <span className="text-2xl">{perfBadge.icon}</span>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${perfBadge.color}`}>
                              {review.overallScore}%
                            </p>
                            <p className={`text-xs ${perfBadge.color}`}>
                              {perfBadge.label}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${typeBadge.bgColor} ${typeBadge.color}`}>
                        {typeBadge.icon} {typeBadge.label}
                      </Badge>
                      <Badge className={`${statusBadge.bgColor} ${statusBadge.color}`}>
                        {statusBadge.label}
                      </Badge>
                      {overdue && review.status !== "COMPLETED" && (
                        <Badge className="bg-red-500/20 text-red-400">
                          🔴 Overdue
                        </Badge>
                      )}
                    </div>

                    {/* Info Row */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Due: {getDueDateText(review.dueDate)}</span>
                      {review.submittedDate && (
                        <span>Submitted: {formatReviewDate(review.submittedDate)}</span>
                      )}
                      <span>Reviewer: {review.reviewer}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/admin/reviews/${review.id}`}
                      >
                        View Details
                      </Button>
                      {review.status === "SUBMITTED" && (
                        <Button
                          size="sm"
                          onClick={() => window.location.href = `/admin/reviews/${review.id}`}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Process Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

