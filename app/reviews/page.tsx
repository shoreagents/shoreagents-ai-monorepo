"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Star, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  User
} from "lucide-react"
import { 
  getReviewTypeBadge, 
  getPerformanceBadge,
  formatReviewDate,
  getPerformanceTrend,
  getTrendIcon,
  getTrendColor
} from "@/lib/review-utils"
import { ReviewType } from "@/lib/review-templates"

interface Review {
  id: string
  type: ReviewType
  status: string
  client: string
  reviewer: string
  submittedDate?: string
  overallScore?: number
  performanceLevel?: string
  strengths?: string
  improvements?: string
  additionalComments?: string
  acknowledgedDate?: string
  createdAt: string
}

export default function StaffReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

  useEffect(() => {
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

  const handleAcknowledge = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/acknowledge`, {
        method: "POST"
      })
      
      if (!response.ok) throw new Error("Failed to acknowledge review")
      
      await fetchReviews()
      setSelectedReview(null)
      alert("✅ Review acknowledged successfully!")
    } catch (err) {
      alert("Failed to acknowledge review. Please try again.")
    }
  }

  // Calculate trend
  const scores = reviews
    .filter(r => r.overallScore)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(r => r.overallScore!)
  
  const trend = getPerformanceTrend(scores)
  const avgScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
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
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{reviews.length}</div>
              <div className="text-xs text-slate-400">Total Reviews</div>
            </div>
          </div>

          {/* Stats Row */}
          {scores.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{avgScore}%</div>
                <div className="text-xs text-slate-400">Average Score</div>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{scores[scores.length - 1]}%</div>
                <div className="text-xs text-slate-400">Latest Score</div>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className={`text-2xl font-bold ${getTrendColor(trend)}`}>
                  {getTrendIcon(trend)} {trend ? trend.replace("_", " ") : "N/A"}
                </div>
                <div className="text-xs text-slate-400">Trend</div>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-emerald-400">
                  {reviews.filter(r => r.status === "COMPLETED").length}
                </div>
                <div className="text-xs text-slate-400">Acknowledged</div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Reviews</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        )}

        {/* Reviews Timeline */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-xl bg-slate-900/50 p-12 text-center backdrop-blur-xl ring-1 ring-white/10">
              <p className="text-slate-400">No reviews available yet</p>
              <p className="mt-2 text-sm text-slate-500">
                Your performance reviews will appear here once completed by your client
              </p>
            </div>
          ) : (
            reviews.map((review) => {
              const typeBadge = getReviewTypeBadge(review.type)
              const perfBadge = review.performanceLevel 
                ? getPerformanceBadge(review.performanceLevel as any)
                : null
              const isNew = review.status === "UNDER_REVIEW"

              return (
                <div
                  key={review.id}
                  className={`rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 transition-all ${
                    isNew
                      ? "ring-purple-500/50 shadow-lg shadow-purple-500/20"
                      : "ring-white/10 hover:ring-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Badges */}
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${typeBadge.bgColor} ${typeBadge.color}`}>
                          {typeBadge.icon} {typeBadge.label}
                        </span>
                        {isNew && (
                          <span className="animate-pulse rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-400 ring-1 ring-purple-500/30">
                            🆕 New Review
                          </span>
                        )}
                        {review.acknowledgedDate && (
                          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                            ✅ Acknowledged
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {review.client}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {review.submittedDate ? formatReviewDate(review.submittedDate) : "Pending"}
                        </div>
                      </div>

                      {/* Performance Score */}
                      {perfBadge && review.overallScore && (
                        <div className="mt-4">
                          <div className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 ${perfBadge.bgColor}`}>
                            <span className="text-2xl">{perfBadge.icon}</span>
                            <div>
                              <div className={`text-2xl font-bold ${perfBadge.color}`}>
                                {review.overallScore}%
                              </div>
                              <div className={`text-xs ${perfBadge.color}`}>
                                {perfBadge.label}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Feedback Preview */}
                      {review.strengths && (
                        <div className="mt-4 space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-400">✨ Strengths:</p>
                            <p className="text-sm text-slate-300 line-clamp-2">{review.strengths}</p>
                          </div>
                          {review.improvements && (
                            <div>
                              <p className="text-xs font-semibold text-slate-400">📈 Areas for Improvement:</p>
                              <p className="text-sm text-slate-300 line-clamp-2">{review.improvements}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReview(review)}
                          className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                        >
                          View Full Review
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        {isNew && (
                          <Button
                            size="sm"
                            onClick={() => handleAcknowledge(review.id)}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Acknowledge Review
                          </Button>
                        )}
                        {review.acknowledgedDate && (
                          <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 ring-1 ring-emerald-500/20">
                            Acknowledged on {formatReviewDate(review.acknowledgedDate)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score Badge (Right Side) */}
                    {review.overallScore && (
                      <div className="ml-4 text-right">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.round(review.overallScore! / 20)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Review Detail Modal */}
        {selectedReview && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedReview(null)}
          >
            <div 
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 p-8 shadow-2xl ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white">
                {getReviewTypeBadge(selectedReview.type).label}
              </h2>
              <p className="mt-1 text-slate-400">{selectedReview.client}</p>

              {selectedReview.overallScore && (
                <div className="mt-6">
                  <p className="text-sm text-slate-400">Overall Score</p>
                  <p className="text-5xl font-bold text-white">{selectedReview.overallScore}%</p>
                </div>
              )}

              <div className="mt-6 space-y-6">
                {selectedReview.strengths && (
                  <div>
                    <h3 className="text-lg font-semibold text-white">✨ Strengths</h3>
                    <p className="mt-2 whitespace-pre-wrap text-slate-300">{selectedReview.strengths}</p>
                  </div>
                )}

                {selectedReview.improvements && (
                  <div>
                    <h3 className="text-lg font-semibold text-white">📈 Areas for Improvement</h3>
                    <p className="mt-2 whitespace-pre-wrap text-slate-300">{selectedReview.improvements}</p>
                  </div>
                )}

                {selectedReview.additionalComments && (
                  <div>
                    <h3 className="text-lg font-semibold text-white">💬 Additional Comments</h3>
                    <p className="mt-2 whitespace-pre-wrap text-slate-300">{selectedReview.additionalComments}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReview(null)}
                  className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  Close
                </Button>
                {selectedReview.status === "UNDER_REVIEW" && (
                  <Button
                    onClick={() => handleAcknowledge(selectedReview.id)}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
