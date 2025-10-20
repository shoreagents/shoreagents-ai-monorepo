"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const [showSuccessModal, setShowSuccessModal] = useState(false)
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
      
      setShowSuccessModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process review")
    } finally {
      setProcessing(false)
    }
  }

  const getReviewerName = (email: string) => {
    // Extract name from email (e.g., "james.d@shoreagents.com" -> "James D")
    const namePart = email.split('@')[0]
    const nameParts = namePart.split('.')
    if (nameParts.length > 1) {
      return nameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    }
    return namePart.charAt(0).toUpperCase() + namePart.slice(1)
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
        <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-12 text-center">
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
        <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 border-red-500 bg-red-50 p-4 dark:bg-red-950">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">

          {/* Client Feedback */}
          {review.strengths && (
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">✨ Strengths</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{review.strengths}</p>
            </Card>
          )}

          {review.improvements && (
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">📈 Areas for Improvement</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{review.improvements}</p>
            </Card>
          )}

          {review.additionalComments && (
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">💬 Additional Comments</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{review.additionalComments}</p>
            </Card>
          )}

          {/* Ratings Breakdown */}
          {review.ratings && review.ratings.length > 0 && (
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
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
          <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">📝 Management Notes</h3>
            <Textarea
              value={managementNotes}
              onChange={(e) => setManagementNotes(e.target.value)}
              placeholder="Add internal notes about this review (optional)..."
              rows={6}
              className="resize-none"
              disabled={review.status !== "SUBMITTED"}
            />
            {review.reviewedBy && (
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  Reviewed by {getReviewerName(review.reviewedBy)} on {formatReviewDate(review.reviewedDate!)}
                </p>
              </div>
            )}
          </Card>

          {/* Mark as Reviewed Button */}
          {review.status === "SUBMITTED" && (
            <Button
              onClick={handleProcessReview}
              disabled={processing}
              className="w-fit mx-auto"
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
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 sticky top-6 h-fit">
          {/* Staff Name Section */}
          <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
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
              </div>
            </div>
          </Card>

          {/* Overall Score */}
          {review.overallScore && (
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6 flex flex-col justify-between">
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <p className="text-4xl font-bold text-primary">{review.overallScore}%</p>
                  {perfBadge && (
                    <Badge className={`${perfBadge.bgColor} ${perfBadge.color} text-sm ml-2`}>
                      {perfBadge.icon} {perfBadge.label}
                    </Badge>
                  )}
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground text-center">Overall Score</h3>
            </Card>
          )}

          {/* Review Info */}
          <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Review Information</h3>
            <div className="flex flex-wrap gap-2">
              <Badge className={`${typeBadge.bgColor} ${typeBadge.color} text-sm`}>
                {typeBadge.icon} {typeBadge.label}
              </Badge>
              <Badge className={`${statusBadge.bgColor} ${statusBadge.color} text-sm`}>
                {statusBadge.label}
              </Badge>
            </div>
            
            <div className="border-t border-border pt-3 mt-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Due:</span>
                  <div className="font-medium text-foreground">
                    {formatReviewDate(review.dueDate)}
                  </div>
                </div>
                {review.submittedDate && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Submitted:</span>
                    <div className="font-medium text-foreground">
                      {formatReviewDate(review.submittedDate)}
                    </div>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-muted-foreground">Period:</span>
                  <div className="font-medium text-foreground">{review.evaluationPeriod}</div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-border pt-3 mt-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Client:</span>
                <div className="font-medium text-foreground">{review.client}</div>
              </div>
              <div className="text-sm mt-2">
                <span className="text-muted-foreground">Email:</span>
                <div className="font-medium text-foreground">{review.reviewer}</div>
              </div>
              {review.reviewerTitle && (
                <div className="text-sm mt-2">
                  <span className="text-muted-foreground">Title:</span>
                  <div className="font-medium text-foreground">{review.reviewerTitle}</div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Review Processed Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              The review has been marked as reviewed and is now complete.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                router.push("/admin/reviews")
              }}
            >
              Back to Reviews
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

