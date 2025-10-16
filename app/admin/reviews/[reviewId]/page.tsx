"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft,
  Star,
  CheckCircle,
  RefreshCw,
  User,
  Calendar,
  Mail
} from "lucide-react"
import { 
  getReviewTypeBadge, 
  getStatusBadge, 
  getPerformanceBadge,
  formatReviewDate
} from "@/lib/review-utils"
import { getReviewTemplate, getAllQuestions } from "@/lib/review-templates"

interface Review {
  id: string
  type: string
  status: string
  client: string
  reviewer: string
  reviewerTitle?: string
  dueDate: string
  submittedDate?: string
  evaluationPeriod: string
  ratings?: number[]
  overallScore?: number
  performanceLevel?: string
  strengths?: string
  improvements?: string
  additionalComments?: string
  managementNotes?: string
  reviewedBy?: string
  reviewedDate?: string
  acknowledgedDate?: string
  staffUser: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function AdminReviewDetailPage({ 
  params 
}: { 
  params: Promise<{ reviewId: string }> 
}) {
  const router = useRouter()
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [managementNotes, setManagementNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [reviewId, setReviewId] = useState<string>("")

  useEffect(() => {
    params.then(p => {
      setReviewId(p.reviewId)
      fetchReview(p.reviewId)
    })
  }, [params])

  const fetchReview = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reviews?reviewId=${id}`)
      if (!response.ok) throw new Error("Failed to fetch review")
      
      const data = await response.json()
      
      // If we get a single review back (filtered by reviewId)
      if (data.reviews && data.reviews.length > 0) {
        setReview(data.reviews[0])
        setManagementNotes(data.reviews[0].managementNotes || "")
      } else {
        throw new Error("Review not found")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review")
    } finally {
      setLoading(false)
    }
  }

  const handleProcessReview = async () => {
    if (!review) return
    
    setProcessing(true)
    setError(null)
    
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          managementNotes: managementNotes || null
        })
      })
      
      if (!response.ok) throw new Error("Failed to process review")
      
      alert("✅ Review processed successfully!")
      router.push("/admin/reviews")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process review")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Review not found</p>
          <Button className="mt-4" onClick={() => router.push("/admin/reviews")}>
            Back to Reviews
          </Button>
        </Card>
      </div>
    )
  }

  const typeBadge = getReviewTypeBadge(review.type as any)
  const statusBadge = getStatusBadge(review.status as any)
  const perfBadge = review.performanceLevel 
    ? getPerformanceBadge(review.performanceLevel as any)
    : null

  const template = getReviewTemplate(review.type as any)
  const questions = getAllQuestions(template)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/reviews")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Review Details</h1>
          <p className="text-muted-foreground">Process and review staff performance</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50 p-4 dark:bg-red-950">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Staff Info */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={review.staffUser.avatar} />
                <AvatarFallback>
                  {review.staffUser.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{review.staffUser.name}</h2>
                <p className="text-muted-foreground">{review.staffUser.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={`${typeBadge.bgColor} ${typeBadge.color}`}>
                    {typeBadge.icon} {typeBadge.label}
                  </Badge>
                  <Badge className={`${statusBadge.bgColor} ${statusBadge.color}`}>
                    {statusBadge.label}
                  </Badge>
                  {perfBadge && (
                    <Badge className={`${perfBadge.bgColor} ${perfBadge.color}`}>
                      {perfBadge.icon} {perfBadge.label}
                    </Badge>
                  )}
                </div>
              </div>
              {review.overallScore && (
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">{review.overallScore}%</p>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                </div>
              )}
            </div>
          </Card>

          {/* Client Feedback */}
          {review.strengths && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">✨ Strengths</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{review.strengths}</p>
            </Card>
          )}

          {review.improvements && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">📈 Areas for Improvement</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{review.improvements}</p>
            </Card>
          )}

          {review.additionalComments && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">💬 Additional Comments</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{review.additionalComments}</p>
            </Card>
          )}

          {/* Ratings Breakdown */}
          {review.ratings && review.ratings.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">📊 Ratings Breakdown</h3>
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const rating = review.ratings![index]
                  if (!rating) return null
                  
                  return (
                    <div key={question.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-foreground">{question.question}</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{question.category}</p>
                      <div className="h-px bg-border" />
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Management Notes */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">📝 Management Notes</h3>
            <Textarea
              value={managementNotes}
              onChange={(e) => setManagementNotes(e.target.value)}
              placeholder="Add internal notes about this review (optional)..."
              rows={6}
              className="resize-none"
              disabled={review.status !== "SUBMITTED"}
            />
            {review.status === "SUBMITTED" && (
              <Button
                className="mt-4 w-full"
                onClick={handleProcessReview}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Reviewed
                  </>
                )}
              </Button>
            )}
            {review.reviewedBy && (
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  Reviewed by {review.reviewedBy} on {formatReviewDate(review.reviewedDate!)}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Review Info */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Review Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span className="font-medium text-foreground">
                  {formatReviewDate(review.dueDate)}
                </span>
              </div>
              {review.submittedDate && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="font-medium text-foreground">
                    {formatReviewDate(review.submittedDate)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Client:</span>
                <span className="font-medium text-foreground">{review.client}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Reviewer:</span>
                <span className="font-medium text-foreground">{review.reviewer}</span>
              </div>
              {review.reviewerTitle && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-medium text-foreground">{review.reviewerTitle}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Staff Info */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Staff Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Period:</span>
                <span className="font-medium text-foreground">{review.evaluationPeriod}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

