// Admin API - Reviews Management
// GET: List all reviews + calculate overdue reviews from assignments

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getNextReviewDue, formatReviewType } from "@/lib/review-schedule"

// GET /api/admin/reviews - List all reviews with overdue calculation
export async function GET(request: NextRequest) {
  try {
    // Authentication check - ADMIN only
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get("clientId")
    const userId = searchParams.get("userId")
    const type = searchParams.get("type") // MONTH_1, MONTH_3, etc.
    const status = searchParams.get("status") // PENDING, ACKNOWLEDGED, ARCHIVED
    const filter = searchParams.get("filter") // "overdue", "due_this_month", "completed", "all"

    // 1. Fetch submitted reviews from database
    const reviewWhere: any = {}
    
    if (userId) {
      reviewWhere.userId = userId
    }
    
    if (type) {
      reviewWhere.type = type
    }
    
    if (status) {
      reviewWhere.status = status
    }

    const submittedReviews = await prisma.review.findMany({
      where: reviewWhere,
      include: {
        user: {
          include: {
            profile: true,
            staffAssignments: {
              where: { isActive: true },
              include: {
                client: true,
                manager: true,
              }
            }
          }
        }
      },
      orderBy: { submittedDate: "desc" }
    })

    // 2. Fetch all active assignments to calculate overdue reviews
    const assignmentWhere: any = {
      isActive: true,
    }
    
    if (clientId) {
      assignmentWhere.clientId = clientId
    }
    
    if (userId) {
      assignmentWhere.userId = userId
    }

    const activeAssignments = await prisma.staffAssignment.findMany({
      where: assignmentWhere,
      include: {
        user: {
          include: {
            profile: true,
            reviewsReceived: {
              orderBy: { submittedDate: "desc" }
            }
          }
        },
        client: true,
        manager: true,
      }
    })

    // 3. Calculate which reviews are due/overdue for each assignment
    const calculatedReviews: any[] = []
    
    for (const assignment of activeAssignments) {
      const nextReview = getNextReviewDue(
        assignment.startDate,
        assignment.user.reviewsReceived
      )

      if (nextReview) {
        // Check if this review has been submitted
        const existingReview = assignment.user.reviewsReceived.find(
          r => r.type === nextReview.type && r.status !== "ARCHIVED"
        )

        if (!existingReview) {
          // This review is due but not submitted
          calculatedReviews.push({
            // No id - this is a "virtual" review
            type: nextReview.type,
            userId: assignment.userId,
            clientId: assignment.clientId,
            assignmentId: assignment.id,
            dueDate: nextReview.dueDate,
            daysUntilDue: nextReview.daysUntilDue,
            isOverdue: nextReview.isOverdue,
            status: nextReview.status,
            staff: {
              id: assignment.user.id,
              name: assignment.user.name,
              email: assignment.user.email,
              avatar: assignment.user.avatar,
              profile: assignment.user.profile ? {
                currentRole: assignment.user.profile.currentRole,
                employmentStatus: assignment.user.profile.employmentStatus,
              } : null,
            },
            client: {
              id: assignment.client.id,
              companyName: assignment.client.companyName,
              industry: assignment.client.industry,
            },
            manager: assignment.manager ? {
              id: assignment.manager.id,
              name: assignment.manager.name,
              email: assignment.manager.email,
            } : null,
            startDate: assignment.startDate,
            isCalculated: true, // Flag to indicate this is calculated, not submitted
          })
        }
      }
    }

    // 4. Format submitted reviews
    const formattedSubmittedReviews = submittedReviews.map(review => {
      const assignment = review.user.staffAssignments[0] // Get primary assignment
      
      return {
        id: review.id,
        type: review.type,
        userId: review.userId,
        clientId: assignment?.clientId,
        assignmentId: assignment?.id,
        dueDate: null, // Already submitted
        daysUntilDue: null,
        isOverdue: false,
        status: review.status === "PENDING" ? "PENDING" : "COMPLETED",
        submittedDate: review.submittedDate,
        overallScore: review.overallScore,
        reviewer: review.reviewer,
        reviewerTitle: review.reviewerTitle,
        acknowledgedDate: review.acknowledgedDate,
        staff: {
          id: review.user.id,
          name: review.user.name,
          email: review.user.email,
          avatar: review.user.avatar,
          profile: review.user.profile ? {
            currentRole: review.user.profile.currentRole,
            employmentStatus: review.user.profile.employmentStatus,
          } : null,
        },
        client: assignment ? {
          id: assignment.client.id,
          companyName: assignment.client.companyName,
          industry: assignment.client.industry,
        } : null,
        manager: assignment?.manager ? {
          id: assignment.manager.id,
          name: assignment.manager.name,
          email: assignment.manager.email,
        } : null,
        isCalculated: false,
      }
    })

    // 5. Combine and filter based on filter parameter
    let allReviews = [...calculatedReviews, ...formattedSubmittedReviews]

    if (filter === "overdue") {
      allReviews = allReviews.filter(r => r.isOverdue && r.isCalculated)
    } else if (filter === "due_this_month") {
      const now = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      allReviews = allReviews.filter(r => {
        if (!r.dueDate) return false
        const dueDate = new Date(r.dueDate)
        return dueDate >= now && dueDate <= thirtyDaysFromNow
      })
    } else if (filter === "completed") {
      allReviews = allReviews.filter(r => !r.isCalculated && r.status === "COMPLETED")
    }
    // "all" or no filter - return everything

    // 6. Sort: overdue first, then by due date
    allReviews.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.submittedDate && b.submittedDate) {
        return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
      }
      return 0
    })

    // 7. Calculate statistics
    const stats = {
      total: allReviews.length,
      overdue: allReviews.filter(r => r.isOverdue && r.isCalculated).length,
      dueThisMonth: allReviews.filter(r => {
        if (!r.dueDate) return false
        const dueDate = new Date(r.dueDate)
        const now = new Date()
        const thirtyDays = new Date()
        thirtyDays.setDate(thirtyDays.getDate() + 30)
        return dueDate >= now && dueDate <= thirtyDays
      }).length,
      completed: allReviews.filter(r => !r.isCalculated).length,
      pending: allReviews.filter(r => r.status === "PENDING").length,
    }

    return NextResponse.json({
      success: true,
      stats,
      reviews: allReviews
    })

  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

