import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET /api/admin/reviews - Get ALL reviews (admin view)
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const clientId = searchParams.get("clientId")
    const status = searchParams.get("status")

    const where: any = {}

    // Filter by specific staff
    if (staffId) {
      where.userId = staffId
    }

    // Filter by client (via staff assignments)
    if (clientId) {
      const assignments = await prisma.staffAssignment.findMany({
        where: {
          clientId,
          isActive: true
        },
        select: { userId: true }
      })
      where.userId = { in: assignments.map(a => a.userId) }
    }

    // Filter by status
    if (status) {
      where.status = status
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { submittedDate: "desc" },
    })

    return NextResponse.json({ reviews, count: reviews.length })
  } catch (error) {
    console.error("Error fetching admin reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

// PUT /api/admin/reviews - Approve/Finalize a review
export async function PUT(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reviewId, action } = body

    if (!reviewId || !action) {
      return NextResponse.json({ error: "Missing reviewId or action" }, { status: 400 })
    }

    // Get the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Update status based on action
    let newStatus: "PENDING_APPROVAL" | "APPROVED" | "FINALIZED" | "ARCHIVED"

    if (action === "approve") {
      newStatus = "APPROVED"
    } else if (action === "finalize") {
      newStatus = "FINALIZED" // This makes it visible to staff
    } else if (action === "archive") {
      newStatus = "ARCHIVED"
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { status: newStatus },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, review: updatedReview })
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
}
