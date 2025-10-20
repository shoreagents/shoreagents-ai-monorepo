"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Star, Clock, CheckCircle2, User, Calendar, Eye, MessageSquare } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getReviewTypeBadge } from "@/lib/review-utils"

interface Review {
  id: string
  staffUserId: string
  type: string
  status: string
  client: string
  reviewer: string
  reviewerTitle?: string
  submittedDate?: string
  evaluationPeriod: string
  overallScore?: number
  acknowledgedDate?: string
  createdAt: string
  updatedAt: string
  dueDate: string
  ratings?: any
  performanceLevel?: string
  strengths?: string
  improvements?: string
  additionalComments?: string
  managementNotes?: string
  staffUser: {
    id: string
    name: string
    email: string
    avatar?: string
    companyId: string
  }
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/admin/reviews')
      if (!response.ok) throw new Error('Failed to fetch reviews')
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const handleViewDetails = (review: Review) => {
    router.push(`/admin/reviews/${review.id}`)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending Client Review'
      case 'SUBMITTED': return 'Client Reviewed'
      case 'UNDER_REVIEW': return 'Waiting for Acknowledgement'
      case 'COMPLETED': return 'Completed'
      default: return status.replace('_', ' ')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 ring-yellow-500/30'
      case 'SUBMITTED': return 'bg-blue-500/20 text-blue-400 ring-blue-500/30'
      case 'UNDER_REVIEW': return 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
      case 'COMPLETED': return 'bg-green-500/20 text-green-400 ring-green-500/30'
      default: return 'bg-slate-500/20 text-muted-foreground ring-slate-500/30'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MONTHLY': return 'bg-blue-500/20 text-blue-400 ring-blue-500/30'
      case 'QUARTERLY': return 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
      case 'ANNUAL': return 'bg-green-500/20 text-green-400 ring-green-500/30'
      default: return 'bg-slate-500/20 text-muted-foreground ring-slate-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Star className="h-8 w-8 text-purple-400" />
            Performance Reviews
          </h1>
          <p className="text-muted-foreground">Manage staff performance reviews and evaluations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-foreground">{reviews.length}</div>
                <div className="text-sm text-muted-foreground">Total Reviews</div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-blue-400">
                  {reviews.filter(r => r.status === 'SUBMITTED').length}
                </div>
                <div className="text-sm text-muted-foreground">Submitted</div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-purple-400">
                  {reviews.filter(r => r.status === 'UNDER_REVIEW').length}
                </div>
                <div className="text-sm text-muted-foreground">Under Review</div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-green-400">
                  {reviews.filter(r => r.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Reviews Found</h3>
              <p className="text-muted-foreground">No performance reviews have been submitted yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <Card key={review.id} className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 hover:ring-white/20 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-foreground">{review.staffUser.name}</CardTitle>
                        <CardDescription className="text-muted-foreground">{review.staffUser.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getReviewTypeBadge(review.type).bgColor} ${getReviewTypeBadge(review.type).color}`}>
                        {getReviewTypeBadge(review.type).icon} {getReviewTypeBadge(review.type).label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Client</div>
                      <div className="text-foreground font-medium">{review.client}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Reviewer</div>
                      <div className="text-foreground font-medium">{review.reviewer}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Evaluation Period</div>
                      <div className="text-foreground font-medium">{review.evaluationPeriod}</div>
                    </div>
                    {review.overallScore && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Overall Score</div>
                        <div className="text-2xl font-bold text-purple-400">{review.overallScore}/5</div>
                      </div>
                    )}
                  </div>


                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {new Date(review.dueDate).toLocaleDateString()}
                      </div>
                      {review.submittedDate && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Submitted: {new Date(review.submittedDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={getStatusColor(review.status)}>
                        {getStatusLabel(review.status)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-muted-foreground hover:bg-muted"
                        onClick={() => handleViewDetails(review)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}

