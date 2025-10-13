// Client API - Submit Review
// POST: Client submits review for staff member

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/client/reviews - Submit a review
export async function POST(request: NextRequest) {
  try {
    // Authentication check - CLIENT user only
    const session = await auth()
    if (!session?.user || session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Unauthorized - Client access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      assignmentId,
      type,
      answers,
      evaluationPeriod 
    } = body

    // Validation
    if (!assignmentId || !type || !answers) {
      return NextResponse.json(
        { error: "Missing required fields: assignmentId, type, answers" },
        { status: 400 }
      )
    }

    // Fetch assignment to get staff and client details
    const assignment = await prisma.staffAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        user: true,
        client: true,
        manager: true,
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    // Calculate overall score from rating answers
    let totalScore = 0
    let ratingCount = 0
    
    for (const answer of answers) {
      if (typeof answer.value === 'number' && answer.value >= 1 && answer.value <= 5) {
        totalScore += answer.value
        ratingCount++
      }
    }
    
    const overallScore = ratingCount > 0 ? totalScore / ratingCount : 0

    // Get client user (reviewer)
    const clientUser = await prisma.clientUser.findFirst({
      where: {
        email: session.user.email
      }
    })

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: assignment.userId,
        type,
        status: "PENDING",
        client: assignment.client.companyName,
        reviewer: clientUser?.name || session.user.name || "Unknown",
        reviewerTitle: clientUser?.title || "Manager",
        submittedDate: new Date(),
        evaluationPeriod: evaluationPeriod || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        overallScore,
        answers: JSON.stringify(answers),
      }
    })

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
      review: {
        id: review.id,
        type: review.type,
        overallScore: review.overallScore,
        submittedDate: review.submittedDate,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Error submitting review:", error)
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    )
  }
}

