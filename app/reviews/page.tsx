"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Star, 
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
import { ReviewType, MONTH_1_TEMPLATE, MONTH_3_TEMPLATE, MONTH_5_TEMPLATE, RECURRING_TEMPLATE } from "@/lib/review-templates"

interface Review {
  id: string
  type: ReviewType
  status: string
  client: string
  reviewer: string
  reviewerName?: string
  reviewerTitle?: string
  submittedDate?: string
  evaluationPeriod?: string
  overallScore?: number
  performanceLevel?: string
  ratings?: number[]
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

  // Get template for review type
  const getTemplate = (type: ReviewType) => {
    switch (type) {
      case "MONTH_1": return MONTH_1_TEMPLATE
      case "MONTH_3": return MONTH_3_TEMPLATE
      case "MONTH_5": return MONTH_5_TEMPLATE
      case "RECURRING": return RECURRING_TEMPLATE
      default: return MONTH_1_TEMPLATE
    }
  }

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
        <div className="mx-auto w-full">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto w-full space-y-6">
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

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.length === 0 ? (
            <div className="col-span-full rounded-xl bg-slate-900/50 p-12 text-center backdrop-blur-xl ring-1 ring-white/10">
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
                <Card 
                  key={review.id} 
                  className={`rounded-xl bg-slate-800/50 ring-1 ring-white/10 hover:ring-white/20 transition-all ${
                    isNew
                      ? "ring-purple-500/50 shadow-lg shadow-purple-500/20"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white">{typeBadge.label} Review</CardTitle>
                          <CardDescription className="text-slate-400">{review.client}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isNew && (
                          <Badge className="animate-pulse bg-red-500/20 text-red-400 ring-red-500/30">
                            🔴 New
                          </Badge>
                        )}
                        {review.status === "UNDER_REVIEW" && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 ring-yellow-500/30">
                            ⏳ Waiting for Acknowledgement
                          </Badge>
                        )}
                        {review.acknowledgedDate && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 ring-emerald-500/30">
                            ✅ Acknowledged
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Company</div>
                        <div className="text-white font-medium">{review.client}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Reviewer</div>
                        <div className="text-white font-medium">{review.reviewerName || review.reviewer}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Reviewer's Email</div>
                        <div className="text-white font-medium">{review.reviewer}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Evaluation Period</div>
                        <div className="text-white font-medium">{review.evaluationPeriod || "N/A"}</div>
                      </div>
                      {review.overallScore && (
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Overall Score</div>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-purple-400">{review.overallScore}%</div>
                            {perfBadge && (
                              <Badge className={`${perfBadge.bgColor} ${perfBadge.color} text-sm`}>
                                {perfBadge.icon} {perfBadge.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>


                    <div className="pt-4 border-t border-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {review.acknowledgedDate && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 ring-emerald-500/30">
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReview(review)}
                          className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                      {review.acknowledgedDate && (
                        <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 ring-1 ring-emerald-500/20 text-center">
                          Acknowledged on {formatReviewDate(review.acknowledgedDate)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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

              {/* Ratings Breakdown */}
              {selectedReview.ratings && selectedReview.ratings.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📊 Detailed Ratings</h3>
                  <div className="space-y-4">
                    {getTemplate(selectedReview.type).categories.map((category, catIndex) => (
                      <div key={category.name} className="rounded-lg bg-slate-800/50 p-4 ring-1 ring-white/10">
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">{category.name}</h4>
                        <div className="space-y-3">
                          {category.questions.map((question, qIndex) => {
                            // Calculate the index in the flat ratings array
                            let ratingIndex = 0
                            for (let i = 0; i < catIndex; i++) {
                              ratingIndex += getTemplate(selectedReview.type).categories[i].questions.length
                            }
                            ratingIndex += qIndex
                            
                            const rating = selectedReview.ratings![ratingIndex] || 0
                            
                            return (
                              <div key={question.id} className="flex items-start justify-between gap-4">
                                <p className="text-sm text-slate-400 flex-1">{question.question}</p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= rating
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-slate-600"
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-2 text-sm font-semibold text-white w-6 text-right">
                                    {rating}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
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
                  className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
