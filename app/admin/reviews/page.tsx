"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Star, Clock, CheckCircle2, User, Calendar, Eye, MessageSquare } from "lucide-react"
import ReviewDetailModal from "@/components/admin/review-detail-modal"

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
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
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

  const handleProcessReview = async (reviewId: string, notes: string) => {
    setProcessing(reviewId)
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          managementNotes: notes,
          reviewedBy: 'Admin'
        })
      })

      if (!response.ok) throw new Error('Failed to process review')

      toast({
        title: "Success",
        description: "Review has been processed",
      })

      // Refresh reviews
      await fetchReviews()
    } catch (error) {
      console.error('Error processing review:', error)
      toast({
        title: "Error",
        description: "Failed to process review",
        variant: "destructive",
      })
      throw error
    } finally {
      setProcessing(null)
    }
  }

  const handleViewDetails = (review: Review) => {
    setSelectedReview(review)
    setShowDetailModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 ring-yellow-500/30'
      case 'SUBMITTED': return 'bg-blue-500/20 text-blue-400 ring-blue-500/30'
      case 'UNDER_REVIEW': return 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
      case 'COMPLETED': return 'bg-green-500/20 text-green-400 ring-green-500/30'
      default: return 'bg-slate-500/20 text-slate-400 ring-slate-500/30'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MONTHLY': return 'bg-blue-500/20 text-blue-400 ring-blue-500/30'
      case 'QUARTERLY': return 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
      case 'ANNUAL': return 'bg-green-500/20 text-green-400 ring-green-500/30'
      default: return 'bg-slate-500/20 text-slate-400 ring-slate-500/30'
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
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Star className="h-8 w-8 text-purple-400" />
            Performance Reviews
          </h1>
          <p className="text-slate-400">Manage staff performance reviews and evaluations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-white">{reviews.length}</div>
                <div className="text-sm text-slate-400">Total Reviews</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-blue-400">
                  {reviews.filter(r => r.status === 'SUBMITTED').length}
                </div>
                <div className="text-sm text-slate-400">Submitted</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-purple-400">
                  {reviews.filter(r => r.status === 'UNDER_REVIEW').length}
                </div>
                <div className="text-sm text-slate-400">Under Review</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-green-400">
                  {reviews.filter(r => r.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Reviews Found</h3>
              <p className="text-slate-400">No performance reviews have been submitted yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white">{review.staffUser.name}</CardTitle>
                        <CardDescription className="text-slate-400">{review.staffUser.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(review.status)}>
                        {review.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getTypeColor(review.type)}>
                        {review.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Client</div>
                      <div className="text-white font-medium">{review.client}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Reviewer</div>
                      <div className="text-white font-medium">{review.reviewer}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Evaluation Period</div>
                      <div className="text-white font-medium">{review.evaluationPeriod}</div>
                    </div>
                  </div>

                  {review.overallScore && (
                    <div className="mb-4">
                      <div className="text-sm text-slate-400 mb-1">Overall Score</div>
                      <div className="text-2xl font-bold text-purple-400">{review.overallScore}/5</div>
                    </div>
                  )}

                  {review.strengths && (
                    <div className="mb-4">
                      <div className="text-sm text-slate-400 mb-1">Strengths</div>
                      <div className="text-slate-300">{review.strengths}</div>
                    </div>
                  )}

                  {review.improvements && (
                    <div className="mb-4">
                      <div className="text-sm text-slate-400 mb-1">Areas for Improvement</div>
                      <div className="text-slate-300">{review.improvements}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-4 text-sm text-slate-400">
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => handleViewDetails(review)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {review.status === 'SUBMITTED' && (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleViewDetails(review)}
                          disabled={processing === review.id}
                        >
                          {processing === review.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4 mr-1" />
                          )}
                          Process Review
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      <ReviewDetailModal
        review={selectedReview}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedReview(null)
        }}
        onProcess={handleProcessReview}
      />
    </div>
  )
}

