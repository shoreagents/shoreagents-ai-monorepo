"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getQuestionsForReview, ReviewQuestion, ReviewType } from "@/lib/review-templates"
import { formatReviewType, formatDate } from "@/lib/review-schedule"

export default function SubmitReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const assignmentId = params.assignmentId as string
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [assignment, setAssignment] = useState<any>(null)
  const [reviewType, setReviewType] = useState<ReviewType>("month_1")
  const [questions, setQuestions] = useState<ReviewQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchAssignment()
  }, [assignmentId])

  async function fetchAssignment() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/assignments/${assignmentId}`)
      const data = await res.json()
      
      if (data.success) {
        setAssignment(data.assignment)
        
        // Determine review type from next review
        const nextReview = data.assignment.nextReview
        if (nextReview) {
          const type = nextReview.type.toLowerCase().replace(/_/g, "_") as ReviewType
          setReviewType(type)
          const qs = getQuestionsForReview(type)
          setQuestions(qs)
        }
      }
    } catch (error) {
      console.error('Error fetching assignment:', error)
      toast({
        title: "Error",
        description: "Failed to load assignment details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  function handleAnswerChange(questionId: string, value: any) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validate required questions
    const unanswered = questions.filter(q => q.required && !answers[q.id])
    if (unanswered.length > 0) {
      toast({
        title: "Incomplete Form",
        description: `Please answer all required questions (${unanswered.length} remaining)`,
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      
      // Format answers for API
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        question: q.question,
        section: q.section,
        sectionEmoji: q.sectionEmoji,
        type: q.type,
        value: answers[q.id] || null
      }))

      const res = await fetch('/api/client/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          type: reviewType.toUpperCase(),
          answers: formattedAnswers,
          evaluationPeriod: formatDate(new Date())
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Review Submitted",
          description: "Thank you for your feedback!",
        })
        router.push('/client')
      } else {
        throw new Error(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading review form...</p>
        </Card>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-8 text-center">
          <p className="text-destructive">Assignment not found</p>
        </Card>
      </div>
    )
  }

  // Group questions by section
  const sections = questions.reduce((acc, q) => {
    const section = q.section
    if (!acc[section]) {
      acc[section] = {
        name: section,
        emoji: q.sectionEmoji,
        questions: []
      }
    }
    acc[section].questions.push(q)
    return acc
  }, {} as Record<string, { name: string; emoji: string; questions: ReviewQuestion[] }>)

  const completedQuestions = Object.keys(answers).length
  const totalQuestions = questions.length
  const progress = Math.round((completedQuestions / totalQuestions) * 100)

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="size-16">
            <AvatarImage src={assignment.staff?.avatar || "/placeholder.svg"} />
            <AvatarFallback>{assignment.staff?.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">{assignment.staff?.name || "Staff Member"}</h1>
            <p className="text-muted-foreground">{assignment.role} at {assignment.client?.companyName}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge>{formatReviewType(reviewType.toUpperCase())}</Badge>
              <span className="text-sm text-muted-foreground">
                Started {assignment.startDate ? formatDate(new Date(assignment.startDate)) : "N/A"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{completedQuestions} of {totalQuestions} questions</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {Object.values(sections).map((section) => (
          <Card key={section.name} className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {section.emoji} {section.name}
            </h2>
            <div className="space-y-6">
              {section.questions.map((question) => (
                <div key={question.id} className="space-y-3">
                  <Label className="text-base font-medium">
                    {question.question}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {question.description && (
                    <p className="text-sm text-muted-foreground">{question.description}</p>
                  )}
                  
                  {/* Rating Questions */}
                  {question.type === "rating" && (
                    <RadioGroup
                      value={answers[question.id]?.toString()}
                      onValueChange={(val) => handleAnswerChange(question.id, parseInt(val))}
                    >
                      <div className="space-y-2">
                        {question.options?.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value.toString()} id={`${question.id}-${option.value}`} />
                            <Label htmlFor={`${question.id}-${option.value}`} className="font-normal cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}
                  
                  {/* Text Questions */}
                  {question.type === "text" && (
                    <Textarea
                      value={answers[question.id] || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Enter your response..."
                      rows={4}
                    />
                  )}
                  
                  {/* Select Questions */}
                  {question.type === "select" && (
                    <RadioGroup
                      value={answers[question.id]}
                      onValueChange={(val) => handleAnswerChange(question.id, val)}
                    >
                      <div className="space-y-2">
                        {question.options?.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value.toString()} id={`${question.id}-${option.value}`} />
                            <Label htmlFor={`${question.id}-${option.value}`} className="font-normal cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* Submit */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Ready to submit?</p>
              <p className="text-sm text-muted-foreground">
                {completedQuestions === totalQuestions 
                  ? "All questions answered" 
                  : `${totalQuestions - completedQuestions} questions remaining`}
              </p>
            </div>
            <Button type="submit" disabled={submitting} size="lg">
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

