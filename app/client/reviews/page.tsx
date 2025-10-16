"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar,
  Clock,
  User,
  ArrowRight,
  AlertCircle
} from "lucide-react"
import { 
  getReviewTypeBadge, 
  formatReviewDate,
  getDueDateText,
  isReviewOverdue
} from "@/lib/review-utils"

interface Review {
  id: string
  type: string
  status: string
  dueDate: string
  submittedDate?: string
  evaluationPeriod: string
  staffUser: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function ClientReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/client/reviews")
      if (!response.ok) throw new Error("Failed to fetch reviews")
      
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  const pendingReviews = reviews.filter(r => r.status === "PENDING")
  const submittedReviews = reviews.filter(r => r.status !== "PENDING")

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Performance Reviews</h1>
            <p className="text-muted-foreground">Complete pending reviews for your team</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{pendingReviews.length}</div>
            <div className="text-sm text-muted-foreground">Pending Reviews</div>
          </div>
        </div>

        {error && (
          <Card className="border-red-500 bg-red-50 p-4 dark:bg-red-950">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </Card>
        )}

        {/* Pending Reviews Section */}
        {pendingReviews.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              📝 Pending Reviews ({pendingReviews.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingReviews.map((review) => {
                const typeBadge = getReviewTypeBadge(review.type as any)
                const overdue = isReviewOverdue(review.dueDate)
                
                return (
                  <Card key={review.id} className={`p-6 transition-all hover:shadow-lg ${overdue ? 'border-red-500' : ''}`}>
                    <div className="space-y-4">
                      {/* Staff Info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={review.staffUser.avatar} />
                          <AvatarFallback>
                            {review.staffUser.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{review.staffUser.name}</h3>
                          <p className="text-sm text-muted-foreground">{review.staffUser.email}</p>
                        </div>
                      </div>

                      {/* Review Badge */}
                      <div className="flex items-center gap-2">
                        <Badge className={`${typeBadge.bgColor} ${typeBadge.color}`}>
                          {typeBadge.icon} {typeBadge.label}
                        </Badge>
                        {overdue && (
                          <Badge className="bg-red-500/20 text-red-400">
                            🔴 Overdue
                          </Badge>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {getDueDateText(review.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Period: {review.evaluationPeriod}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button 
                        className="w-full"
                        onClick={() => router.push(`/client/reviews/submit/${review.id}`)}
                      >
                        Complete Review
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pendingReviews.length === 0 && submittedReviews.length === 0 && (
          <Card className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Reviews Available</h3>
            <p className="text-muted-foreground">
              You don't have any reviews to complete at this time.
            </p>
          </Card>
        )}

        {/* Submitted Reviews Section */}
        {submittedReviews.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              ✅ Submitted Reviews ({submittedReviews.length})
            </h2>
            <div className="space-y-3">
              {submittedReviews.map((review) => {
                const typeBadge = getReviewTypeBadge(review.type as any)
                
                return (
                  <Card key={review.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.staffUser.avatar} />
                          <AvatarFallback>
                            {review.staffUser.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">{review.staffUser.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${typeBadge.bgColor} ${typeBadge.color}`}>
                              {typeBadge.icon} {typeBadge.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Submitted {review.submittedDate ? formatReviewDate(review.submittedDate) : 'recently'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400">
                        ✓ Completed
                      </Badge>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

