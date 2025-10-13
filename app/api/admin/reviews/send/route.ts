// Admin API - Send Review Request
// POST: Trigger review request email to client

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatReviewType, formatDate } from "@/lib/review-schedule"

// POST /api/admin/reviews/send - Send review request
export async function POST(request: NextRequest) {
  try {
    // Authentication check - ADMIN only
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { assignmentId, reviewType } = body

    // Validation
    if (!assignmentId || !reviewType) {
      return NextResponse.json(
        { error: "Missing required fields: assignmentId, reviewType" },
        { status: 400 }
      )
    }

    // Verify valid review type
    const validTypes = ["MONTH_1", "MONTH_3", "MONTH_5", "RECURRING_6M", "AD_HOC"]
    if (!validTypes.includes(reviewType)) {
      return NextResponse.json(
        { error: "Invalid review type" },
        { status: 400 }
      )
    }

    // Fetch assignment with full details
    const assignment = await prisma.staffAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        user: {
          include: {
            profile: true,
            reviewsReceived: true,
          }
        },
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

    if (!assignment.isActive) {
      return NextResponse.json(
        { error: "Cannot send review for inactive assignment" },
        { status: 400 }
      )
    }

    // Check if review already exists for this type (prevent duplicates)
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: assignment.userId,
        type: reviewType,
        status: { in: ["PENDING", "ACKNOWLEDGED"] }
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: `${formatReviewType(reviewType)} has already been sent and is pending` },
        { status: 409 }
      )
    }

    // Prepare email data
    const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/client/reviews/submit/${assignmentId}?type=${reviewType}`
    
    const emailData = {
      to: assignment.manager.email,
      managerName: assignment.manager.name,
      staffName: assignment.user.name,
      staffRole: assignment.role,
      clientCompany: assignment.client.companyName,
      reviewType: formatReviewType(reviewType),
      startDate: formatDate(assignment.startDate),
      reviewLink,
      dueDate: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
    }

    // Log email (for MVP - later replace with actual email service)
    console.log("=============================================")
    console.log("REVIEW REQUEST EMAIL")
    console.log("=============================================")
    console.log(`To: ${emailData.to}`)
    console.log(`Subject: Review Requested: ${emailData.staffName} - ${emailData.reviewType}`)
    console.log("")
    console.log(`Hi ${emailData.managerName},`)
    console.log("")
    console.log(`Please submit a review for ${emailData.staffName} who has been working as`)
    console.log(`${emailData.staffRole} at ${emailData.clientCompany} since ${emailData.startDate}.`)
    console.log("")
    console.log(`Review Type: ${emailData.reviewType}`)
    console.log("")
    console.log(`Submit Review: ${emailData.reviewLink}`)
    console.log("")
    console.log(`This review is due by: ${emailData.dueDate}`)
    console.log("")
    console.log(`Your feedback helps us ensure the best service for your organization.`)
    console.log("")
    console.log(`Thank you!`)
    console.log(`Shore Agents Team`)
    console.log("=============================================")

    // TODO: Replace with actual email service (SendGrid, Resend, etc.)
    // Example:
    // await sendEmail({
    //   to: emailData.to,
    //   subject: `Review Requested: ${emailData.staffName} - ${emailData.reviewType}`,
    //   template: "review-request",
    //   data: emailData
    // })

    // Optional: Create a review request tracking record
    // This allows admins to see when requests were sent
    // For now, we'll just log it and return success

    return NextResponse.json({
      success: true,
      message: `Review request sent to ${assignment.manager.name} (${assignment.manager.email})`,
      data: {
        assignmentId,
        reviewType,
        sentTo: assignment.manager.email,
        reviewLink,
        staffName: assignment.user.name,
        clientCompany: assignment.client.companyName,
      }
    })

  } catch (error) {
    console.error("Error sending review request:", error)
    return NextResponse.json(
      { error: "Failed to send review request" },
      { status: 500 }
    )
  }
}

