"use client"

import { useState, useEffect } from "react"
import { 
  Star, ThumbsUp, CheckCircle, Clock, TrendingUp,
  ChevronDown, ChevronUp, Eye, Calendar, User
} from "lucide-react"

type ReviewStatus = "PENDING" | "ACKNOWLEDGED" | "ARCHIVED"
type ReviewType = "month_1" | "month_3" | "month_5" | "recurring_6m" | "ad_hoc"

interface Review {
  id: string
  type: ReviewType
  staffMemberId: string
  reviewerId: string
  client: string
  submittedDate: string
  status: ReviewStatus
  overallScore: number | null
  answers: any
  acknowledgedDate: string | null
}

export default function ReviewsSystem() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ReviewStatus | "all">("all")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews")
      if (!response.ok) throw new Error("Failed to fetch reviews")
      const data = await response.json()
      setReviews(data.reviews)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/acknowledge`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to acknowledge review")
      await fetchReviews()
    } catch (err) {
      console.error("Error acknowledging review:", err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}/${year}`
  }

  const getReviewTypeLabel = (type: ReviewType) => {
    const labels = {
      month_1: "Month 1 Assessment",
      month_3: "Month 3 Progress Check",
      month_5: "Month 5 Regularization",
      recurring_6m: "6-Month Recurring Check-In",
      ad_hoc: "Ad-Hoc Feedback",
    }
    return labels[type] || type
  }

  const getReviewTypeColor = (type: ReviewType) => {
    const colors = {
      month_1: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
      month_3: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
      month_5: "bg-purple-500/20 text-purple-400 ring-purple-500/30",
      recurring_6m: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
      ad_hoc: "bg-pink-500/20 text-pink-400 ring-pink-500/30",
    }
    return colors[type] || "bg-slate-500/20 text-slate-400"
  }

  const getStatusColor = (status: ReviewStatus) => {
    const colors = {
      PENDING: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
      ACKNOWLEDGED: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
      ARCHIVED: "bg-slate-500/20 text-slate-400 ring-slate-500/30",
    }
    return colors[status] || "bg-slate-500/20 text-slate-400"
  }

  const filteredReviews = reviews.filter((review) => 
    filter === "all" || review.status === filter
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Reviews</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-purple-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Performance Reviews</h1>
              <p className="mt-1 text-slate-300">Your review history and feedback</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{reviews.length}</div>
              <div className="text-xs text-slate-400">Total Reviews</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 rounded-xl bg-slate-900/50 p-2 backdrop-blur-xl ring-1 ring-white/10">
          {(["all", "PENDING", "ACKNOWLEDGED", "ARCHIVED"] as const).map((status) => {
            const count = status === "all" ? reviews.length : reviews.filter(r => r.status === status).length
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  filter === status
                    ? "bg-white/20 text-white"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                <span className="ml-2 text-xs">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="rounded-xl bg-slate-900/50 p-12 text-center backdrop-blur-xl ring-1 ring-white/10">
              <p className="text-slate-400">No reviews found</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getReviewTypeColor(review.type)}`}>
                        {getReviewTypeLabel(review.type)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusColor(review.status)}`}>
                        {review.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {review.client}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {mounted ? formatDate(review.submittedDate) : review.submittedDate}
                      </div>
                    </div>
                  </div>

                  {review.overallScore && (
                    <div className="rounded-xl bg-purple-500/10 p-4 text-center ring-1 ring-purple-500/30">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.round(review.overallScore || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="mt-1 text-2xl font-bold text-white">{review.overallScore.toFixed(1)}</div>
                      <div className="text-xs text-slate-400">Overall Score</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {review.status === "PENDING" && (
                    <button
                      onClick={() => acknowledgeReview(review.id)}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white transition-all hover:from-emerald-700 hover:to-emerald-800"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Acknowledge Review
                    </button>
                  )}
                  {review.status === "ACKNOWLEDGED" && review.acknowledgedDate && (
                    <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 ring-1 ring-emerald-500/20">
                      Acknowledged on {mounted ? formatDate(review.acknowledgedDate) : review.acknowledgedDate}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
