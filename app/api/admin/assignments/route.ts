// Admin API - Staff Assignments Management
// GET: List all assignments with filters
// POST: Create new staff assignment

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getNextReviewDue, calculateDaysEmployed } from "@/lib/review-schedule"

// GET /api/admin/assignments - List all assignments
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
    const status = searchParams.get("status") // "active" | "ended" | "all"

    // Build where clause
    const where: any = {}
    
    if (clientId) {
      where.clientId = clientId
    }
    
    if (userId) {
      where.userId = userId
    }
    
    if (status === "active") {
      where.isActive = true
    } else if (status === "ended") {
      where.isActive = false
    }
    // If status === "all" or not provided, show all

    // Fetch assignments with relations
    const assignments = await prisma.staffAssignment.findMany({
      where,
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
      },
      orderBy: { startDate: "desc" }
    })

    // Calculate review data for each assignment
    const assignmentsWithReviews = assignments.map(assignment => {
      const daysEmployed = calculateDaysEmployed(assignment.startDate)
      const nextReview = getNextReviewDue(
        assignment.startDate,
        assignment.user.reviewsReceived
      )

      return {
        id: assignment.id,
        userId: assignment.userId,
        clientId: assignment.clientId,
        managerId: assignment.managerId,
        role: assignment.role,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        rate: assignment.rate,
        isActive: assignment.isActive,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        
        // Staff details
        staff: {
          id: assignment.user.id,
          name: assignment.user.name,
          email: assignment.user.email,
          avatar: assignment.user.avatar,
          role: assignment.user.role,
          profile: assignment.user.profile ? {
            currentRole: assignment.user.profile.currentRole,
            employmentStatus: assignment.user.profile.employmentStatus,
            phone: assignment.user.profile.phone,
            location: assignment.user.profile.location,
          } : null
        },
        
        // Client details
        client: {
          id: assignment.client.id,
          companyName: assignment.client.companyName,
          industry: assignment.client.industry,
          location: assignment.client.location,
        },
        
        // Manager details
        manager: assignment.manager ? {
          id: assignment.manager.id,
          name: assignment.manager.name,
          email: assignment.manager.email,
          role: assignment.manager.role,
          title: assignment.manager.title,
        } : null,
        
        // Calculated fields
        daysEmployed,
        nextReview: nextReview ? {
          type: nextReview.type,
          dueDate: nextReview.dueDate,
          daysUntilDue: nextReview.daysUntilDue,
          isOverdue: nextReview.isOverdue,
          status: nextReview.status,
        } : null,
        
        // Review history count
        reviewsCompleted: assignment.user.reviewsReceived.length,
      }
    })

    return NextResponse.json({
      success: true,
      count: assignmentsWithReviews.length,
      assignments: assignmentsWithReviews
    })

  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    )
  }
}

// POST /api/admin/assignments - Create new assignment
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
    const { userId, clientId, managerId, role, startDate, rate } = body

    // Validation
    if (!userId || !clientId || !managerId || !role || !startDate || !rate) {
      return NextResponse.json(
        { error: "Missing required fields: userId, clientId, managerId, role, startDate, rate" },
        { status: 400 }
      )
    }

    // Verify user exists and is STAFF
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (!["STAFF", "TEAM_LEAD", "MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { error: "User must have STAFF, TEAM_LEAD, or MANAGER role" },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Verify manager exists and belongs to client
    const manager = await prisma.clientUser.findUnique({
      where: { id: managerId }
    })

    if (!manager) {
      return NextResponse.json(
        { error: "Manager not found" },
        { status: 404 }
      )
    }

    if (manager.clientId !== clientId) {
      return NextResponse.json(
        { error: "Manager must belong to the selected client organization" },
        { status: 400 }
      )
    }

    // Check for existing active assignment (unique constraint: userId + clientId)
    const existingAssignment = await prisma.staffAssignment.findFirst({
      where: {
        userId,
        clientId,
        isActive: true
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Staff member already has an active assignment with this client" },
        { status: 409 }
      )
    }

    // Create assignment
    const assignment = await prisma.staffAssignment.create({
      data: {
        userId,
        clientId,
        managerId,
        role,
        startDate: new Date(startDate),
        rate: parseFloat(rate),
        isActive: true,
      },
      include: {
        user: {
          include: {
            profile: true,
            reviewsReceived: true
          }
        },
        client: true,
        manager: true,
      }
    })

    // Calculate review schedule for response
    const daysEmployed = calculateDaysEmployed(assignment.startDate)
    const nextReview = getNextReviewDue(assignment.startDate, [])

    return NextResponse.json({
      success: true,
      message: "Assignment created successfully",
      assignment: {
        id: assignment.id,
        userId: assignment.userId,
        clientId: assignment.clientId,
        managerId: assignment.managerId,
        role: assignment.role,
        startDate: assignment.startDate,
        rate: assignment.rate,
        isActive: assignment.isActive,
        staff: {
          id: assignment.user.id,
          name: assignment.user.name,
          email: assignment.user.email,
          avatar: assignment.user.avatar,
        },
        client: {
          id: assignment.client.id,
          companyName: assignment.client.companyName,
        },
        manager: {
          id: assignment.manager.id,
          name: assignment.manager.name,
          email: assignment.manager.email,
        },
        daysEmployed,
        nextReview,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating assignment:", error)
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    )
  }
}

