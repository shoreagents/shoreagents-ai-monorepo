"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, ArrowRight, Send } from "lucide-react"
import { getReviewTemplate, getAllQuestions } from "@/lib/review-templates"
import { getReviewTypeBadge } from "@/lib/review-utils"
import ReviewQuestionCard from "@/components/client/review-question-card"
import ReviewProgress from "@/components/client/review-progress"

interface Review {
  id: string
  type: string
  status: string
  dueDate: string
  evaluationPeriod: string
  staffUser: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function SubmitReviewPage({ 
  params 
}: { 
  params: Promise<{ reviewId: string }> 
}) {
  const router = useRouter()
  const [reviewId, setReviewId] = useState<string>("")
  const [review, setReview] = useState<Review | null>(null)
  const [ratings, setRatings] = useState<{ [key: string]: number }>({})
  const [strengths, setStrengths] = useState("")
  const [improvements, setImprovements] = useState("")
  const [additionalComments, setAdditionalComments] = useState("")
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => {
      setReviewId(p.reviewId)
      fetchReview(p.reviewId)
    })
  }, [params])

  const fetchReview = async (id: string) => {
    try {
      const response = await fetch(`/api/client/reviews/${id}`)
      if (!response.ok) throw new Error("Failed to fetch review")
      
      const data = await response.json()
      setReview(data.review)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review")
    } finally {
      setLoading(false)
    }
  }

  const handleRatingChange = (questionId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [questionId]: rating }))
  }

  const handleSubmit = async () => {
    if (!review) return

    setSubmitting(true)
    setError(null)

    try {
      const template = getReviewTemplate(review.type as any)
      const questions = getAllQuestions(template)
      const ratingsArray = questions.map(q => ratings[q.id] || 0)

      // Validate all questions answered
      if (ratingsArray.some(r => r === 0)) {
        throw new Error("Please answer all questions before submitting")
      }

      if (!strengths.trim()) {
        throw new Error("Please provide strengths feedback")
      }

      if (!improvements.trim()) {
        throw new Error("Please provide areas for improvement")
      }

      const response = await fetch("/api/client/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          ratings: ratingsArray,
          strengths: strengths.trim(),
          improvements: improvements.trim(),
          additionalComments: additionalComments.trim() || undefined
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit review")
      }

      alert("✅ Review submitted successfully!")
      router.push("/client/reviews")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading review...</p>
        </div>
      </div>
    )
  }

  if (error && !review) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <Card className="max-w-md p-6 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push("/client/reviews")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reviews
          </Button>
        </Card>
      </div>
    )
  }

  if (!review) return null

  const template = getReviewTemplate(review.type as any)
  const typeBadge = getReviewTypeBadge(review.type as any)
  const totalSteps = template.categories.length + 1 // categories + feedback step
  const currentCategory = currentStep < template.categories.length 
    ? template.categories[currentStep]
    : null

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push("/client/reviews")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Performance Review</h1>
            <p className="text-muted-foreground">{template.title}</p>
          </div>
        </div>

        {/* Staff Info Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={review.staffUser.avatar} />
              <AvatarFallback className="text-xl">
                {review.staffUser.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">{review.staffUser.name}</h2>
              <p className="text-muted-foreground">{review.staffUser.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${typeBadge.bgColor} ${typeBadge.color}`}>
                  {typeBadge.icon} {typeBadge.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  Evaluation Period: {review.evaluationPeriod}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Progress */}
        <ReviewProgress 
          currentStep={currentStep + 1} 
          totalSteps={totalSteps}
          currentCategory={currentCategory?.name || "Final Feedback"}
        />

        {error && (
          <Card className="border-red-500 bg-red-50 p-4 dark:bg-red-950">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </Card>
        )}

        {/* Questions or Feedback Step */}
        {currentCategory ? (
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">{currentCategory.name}</h2>
              <p className="text-muted-foreground">{currentCategory.description}</p>
            </div>
            
            <div className="space-y-6">
              {currentCategory.questions.map((question) => (
                <ReviewQuestionCard
                  key={question.id}
                  question={question.question}
                  category={question.category}
                  rating={ratings[question.id] || 0}
                  onRatingChange={(rating) => handleRatingChange(question.id, rating)}
                />
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Final Feedback</h2>
              <p className="text-muted-foreground">Provide additional context and comments</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ✨ What are this staff member's key strengths? <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="Describe what they do well..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  📈 What areas need improvement? <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Describe areas where they could improve..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  💬 Additional Comments (Optional)
                </label>
                <Textarea
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  placeholder="Any other feedback or context..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0 || submitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button onClick={() => setCurrentStep(prev => prev + 1)}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Review
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

