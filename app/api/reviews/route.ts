import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/reviews - Get reviews for staff (only UNDER_REVIEW and COMPLETED)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user first
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Get reviews - only UNDER_REVIEW and COMPLETED
    // Staff cannot see PENDING or SUBMITTED reviews
    const reviews = await prisma.review.findMany({
      where: {
        staffUserId: staffUser.id,
        status: {
          in: ["UNDER_REVIEW", "COMPLETED"]
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ reviews, count: reviews.length })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
