// Admin API - Single Review Details
// GET: View full review with parsed answers

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatReviewType } from "@/lib/review-schedule"

// GET /api/admin/reviews/[id] - Get single review with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check - ADMIN only
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const { id } = params

    // Fetch review with full relations
    const review = await prisma.review.findUnique({
      where: { id },
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
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    // Get assignment details
    const assignment = review.user.staffAssignments[0]

    // Parse answers JSON
    let parsedAnswers = []
    try {
      if (typeof review.answers === 'string') {
        parsedAnswers = JSON.parse(review.answers)
      } else if (Array.isArray(review.answers)) {
        parsedAnswers = review.answers
      }
    } catch (error) {
      console.error("Error parsing review answers:", error)
      parsedAnswers = []
    }

    // Calculate section scores
    const sections = parsedAnswers.reduce((acc: any, answer: any) => {
      const section = answer.section || "General"
      if (!acc[section]) {
        acc[section] = {
          name: section,
          emoji: answer.sectionEmoji || "📋",
          answers: [],
          averageScore: 0,
        }
      }
      acc[section].answers.push(answer)
      return acc
    }, {})

    // Calculate average score per section
    Object.values(sections).forEach((section: any) => {
      const ratingAnswers = section.answers.filter(
        (a: any) => typeof a.value === 'number'
      )
      if (ratingAnswers.length > 0) {
        const sum = ratingAnswers.reduce((s: number, a: any) => s + a.value, 0)
        section.averageScore = (sum / ratingAnswers.length).toFixed(2)
      }
    })

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        userId: review.userId,
        type: review.type,
        status: review.status,
        client: review.client,
        reviewer: review.reviewer,
        reviewerTitle: review.reviewerTitle,
        submittedDate: review.submittedDate,
        evaluationPeriod: review.evaluationPeriod,
        overallScore: review.overallScore,
        previousScore: review.previousScore,
        acknowledgedDate: review.acknowledgedDate,
        createdAt: review.createdAt,
        
        staff: {
          id: review.user.id,
          name: review.user.name,
          email: review.user.email,
          avatar: review.user.avatar,
          profile: review.user.profile ? {
            currentRole: review.user.profile.currentRole,
            employmentStatus: review.user.profile.employmentStatus,
            startDate: review.user.profile.startDate,
            location: review.user.profile.location,
          } : null,
        },
        
        assignment: assignment ? {
          id: assignment.id,
          role: assignment.role,
          startDate: assignment.startDate,
          client: {
            id: assignment.client.id,
            companyName: assignment.client.companyName,
            industry: assignment.client.industry,
          },
          manager: assignment.manager ? {
            id: assignment.manager.id,
            name: assignment.manager.name,
            email: assignment.manager.email,
            title: assignment.manager.title,
          } : null,
        } : null,
        
        // Parsed data
        answers: parsedAnswers,
        sections: Object.values(sections),
        
        // Metadata
        typeLabel: formatReviewType(review.type),
        totalQuestions: parsedAnswers.length,
        ratingQuestions: parsedAnswers.filter((a: any) => typeof a.value === 'number').length,
        textQuestions: parsedAnswers.filter((a: any) => typeof a.value === 'string' && a.value.length > 50).length,
      }
    })

  } catch (error) {
    console.error("Error fetching review:", error)
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    )
  }
}

