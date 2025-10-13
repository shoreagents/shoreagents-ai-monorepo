// Admin API - Single Staff Assignment Operations
// GET: Get assignment details
// PUT: Update assignment
// DELETE: End assignment (soft delete)

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getNextReviewDue, calculateDaysEmployed, getReviewSchedule } from "@/lib/review-schedule"

// GET /api/admin/assignments/[id] - Get single assignment
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

    // Fetch assignment with full relations
    const assignment = await prisma.staffAssignment.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
            reviewsReceived: {
              orderBy: { submittedDate: "desc" }
            },
            tasks: {
              where: { status: { in: ["TODO", "IN_PROGRESS"] } },
              take: 5
            },
            timeEntries: {
              where: { clockOut: null }
            }
          }
        },
        client: {
          include: {
            offshoreStaff: {
              where: { isActive: true }
            }
          }
        },
        manager: true,
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    // Calculate review data
    const daysEmployed = calculateDaysEmployed(assignment.startDate)
    const nextReview = getNextReviewDue(
      assignment.startDate,
      assignment.user.reviewsReceived
    )
    const reviewSchedule = getReviewSchedule(assignment.startDate)

    return NextResponse.json({
      success: true,
      assignment: {
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
        
        staff: {
          id: assignment.user.id,
          name: assignment.user.name,
          email: assignment.user.email,
          avatar: assignment.user.avatar,
          role: assignment.user.role,
          profile: assignment.user.profile ? {
            currentRole: assignment.user.profile.currentRole,
            employmentStatus: assignment.user.profile.employmentStatus,
            startDate: assignment.user.profile.startDate,
            phone: assignment.user.profile.phone,
            location: assignment.user.profile.location,
            salary: assignment.user.profile.salary,
          } : null,
          activeTasks: assignment.user.tasks.length,
          isClockedIn: assignment.user.timeEntries.length > 0,
        },
        
        client: {
          id: assignment.client.id,
          companyName: assignment.client.companyName,
          industry: assignment.client.industry,
          location: assignment.client.location,
          billingEmail: assignment.client.billingEmail,
          totalStaff: assignment.client.offshoreStaff.length,
        },
        
        manager: assignment.manager ? {
          id: assignment.manager.id,
          name: assignment.manager.name,
          email: assignment.manager.email,
          role: assignment.manager.role,
          title: assignment.manager.title,
        } : null,
        
        daysEmployed,
        nextReview,
        reviewSchedule,
        reviewHistory: assignment.user.reviewsReceived.map(review => ({
          id: review.id,
          type: review.type,
          submittedDate: review.submittedDate,
          overallScore: review.overallScore,
          status: review.status,
        })),
      }
    })

  } catch (error) {
    console.error("Error fetching assignment:", error)
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/assignments/[id] - Update assignment
export async function PUT(
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
    const body = await request.json()

    // Check assignment exists
    const existing = await prisma.staffAssignment.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    // Allowed update fields
    const updateData: any = {}
    
    if (body.role !== undefined) {
      updateData.role = body.role
    }
    
    if (body.startDate !== undefined) {
      updateData.startDate = new Date(body.startDate)
    }
    
    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate) : null
    }
    
    if (body.rate !== undefined) {
      updateData.rate = parseFloat(body.rate)
    }
    
    if (body.managerId !== undefined) {
      // Verify new manager exists and belongs to same client
      const manager = await prisma.clientUser.findUnique({
        where: { id: body.managerId }
      })
      
      if (!manager || manager.clientId !== existing.clientId) {
        return NextResponse.json(
          { error: "Manager must belong to the same client organization" },
          { status: 400 }
        )
      }
      
      updateData.managerId = body.managerId
    }

    // Update assignment
    const updated = await prisma.staffAssignment.update({
      where: { id },
      data: updateData,
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

    // Calculate review data
    const daysEmployed = calculateDaysEmployed(updated.startDate)
    const nextReview = getNextReviewDue(
      updated.startDate,
      updated.user.reviewsReceived
    )

    return NextResponse.json({
      success: true,
      message: "Assignment updated successfully",
      assignment: {
        id: updated.id,
        userId: updated.userId,
        clientId: updated.clientId,
        managerId: updated.managerId,
        role: updated.role,
        startDate: updated.startDate,
        endDate: updated.endDate,
        rate: updated.rate,
        isActive: updated.isActive,
        staff: {
          id: updated.user.id,
          name: updated.user.name,
        },
        client: {
          id: updated.client.id,
          companyName: updated.client.companyName,
        },
        manager: updated.manager ? {
          id: updated.manager.id,
          name: updated.manager.name,
        } : null,
        daysEmployed,
        nextReview,
      }
    })

  } catch (error) {
    console.error("Error updating assignment:", error)
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/assignments/[id] - End assignment (soft delete)
export async function DELETE(
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

    // Check assignment exists
    const existing = await prisma.staffAssignment.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    // Soft delete - set isActive to false and endDate to now
    const updated = await prisma.staffAssignment.update({
      where: { id },
      data: {
        isActive: false,
        endDate: new Date(),
      },
      include: {
        user: true,
        client: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Assignment ended successfully",
      assignment: {
        id: updated.id,
        userId: updated.userId,
        clientId: updated.clientId,
        endDate: updated.endDate,
        isActive: updated.isActive,
        staff: {
          name: updated.user.name,
        },
        client: {
          companyName: updated.client.companyName,
        }
      }
    })

  } catch (error) {
    console.error("Error ending assignment:", error)
    return NextResponse.json(
      { error: "Failed to end assignment" },
      { status: 500 }
    )
  }
}

