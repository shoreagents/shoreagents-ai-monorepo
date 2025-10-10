import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/reviews/[id]/acknowledge - Acknowledge a review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify review belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (existingReview.staffMemberId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (existingReview.status !== "PENDING") {
      return NextResponse.json(
        { error: "Review already acknowledged" },
        { status: 400 }
      )
    }

    const review = await prisma.review.update({
      where: { id: params.id },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedDate: new Date(),
      },
    })

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error("Error acknowledging review:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

