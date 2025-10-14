import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/reviews - Fetch reviews submitted BY client (not reviews OF staff)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Get all reviews submitted by this client user
    // Reviews are stored with reviewer email matching the client user's email
    const reviews = await prisma.review.findMany({
      where: {
        reviewer: clientUser.email
      },
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

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Error fetching client reviews:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/client/reviews - Create new review for staff member
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    const body = await req.json()
    const { userId, type, answers, overallScore, evaluationPeriod } = body

    if (!userId || !type || !answers || !overallScore) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify staff is assigned to this client
    const assignment = await prisma.staffAssignment.findFirst({
      where: {
        userId,
        companyId: clientUser.company.id,
        isActive: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: "Staff not assigned to your organization" }, { status: 403 })
    }

    // Create review with PENDING_APPROVAL status
    const review = await prisma.review.create({
      data: {
        userId,
        type,
        status: "PENDING_APPROVAL", // Requires admin approval
        client: clientUser.client.companyName,
        reviewer: clientUser.email,
        reviewerTitle: clientUser.role,
        evaluationPeriod: evaluationPeriod || `${new Date().toISOString().split('T')[0]}`,
        overallScore,
        answers,
      },
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

    return NextResponse.json({ success: true, review }, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
