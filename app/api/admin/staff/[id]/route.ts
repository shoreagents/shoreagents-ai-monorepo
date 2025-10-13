// Admin API - Single Staff Member Operations
// GET: Get staff details
// PUT: Update staff member
// DELETE: Terminate staff member

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/staff/[id] - Get single staff member
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

    // Fetch staff member with full relations
    const staffMember = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        staffAssignments: {
          include: {
            client: true,
            manager: true,
          },
          orderBy: { startDate: "desc" }
        },
        reviewsReceived: {
          orderBy: { submittedDate: "desc" }
        },
        gamificationProfile: {
          include: {
            badges: {
              include: {
                badge: true
              }
            }
          }
        },
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 10
        },
        timeEntries: {
          orderBy: { clockIn: "desc" },
          take: 10
        },
        performanceMetrics: {
          orderBy: { date: "desc" },
          take: 30
        }
      }
    })

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    // Check if staff role
    if (!["STAFF", "TEAM_LEAD", "MANAGER"].includes(staffMember.role)) {
      return NextResponse.json(
        { error: "User is not a staff member" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      staff: staffMember
    })

  } catch (error) {
    console.error("Error fetching staff member:", error)
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/staff/[id] - Update staff member
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

    // Check staff member exists
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    // Prepare update data
    const userUpdate: any = {}
    const profileUpdate: any = {}

    // User fields
    if (body.name !== undefined) userUpdate.name = body.name
    if (body.email !== undefined) userUpdate.email = body.email
    if (body.role !== undefined) {
      if (!["STAFF", "TEAM_LEAD", "MANAGER"].includes(body.role)) {
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 400 }
        )
      }
      userUpdate.role = body.role
    }

    // Profile fields
    if (body.phone !== undefined) profileUpdate.phone = body.phone
    if (body.location !== undefined) profileUpdate.location = body.location
    if (body.currentRole !== undefined) profileUpdate.currentRole = body.currentRole
    if (body.salary !== undefined) profileUpdate.salary = parseFloat(body.salary)
    if (body.employmentStatus !== undefined) {
      if (!["PROBATION", "REGULAR", "TERMINATED"].includes(body.employmentStatus)) {
        return NextResponse.json(
          { error: "Invalid employment status" },
          { status: 400 }
        )
      }
      profileUpdate.employmentStatus = body.employmentStatus
    }

    // Update in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update user if there are user fields
      let user = existing
      if (Object.keys(userUpdate).length > 0) {
        user = await tx.user.update({
          where: { id },
          data: userUpdate
        })
      }

      // Update profile if there are profile fields
      let profile = existing.profile
      if (Object.keys(profileUpdate).length > 0 && profile) {
        profile = await tx.profile.update({
          where: { userId: id },
          data: profileUpdate
        })
      }

      return { user, profile }
    })

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully",
      staff: {
        id: updated.user.id,
        name: updated.user.name,
        email: updated.user.email,
        role: updated.user.role,
        profile: updated.profile
      }
    })

  } catch (error) {
    console.error("Error updating staff member:", error)
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/staff/[id] - Terminate staff member
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

    // Check staff member exists
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { 
        profile: true,
        staffAssignments: { where: { isActive: true } }
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    // Terminate staff member (soft delete)
    await prisma.$transaction(async (tx) => {
      // Set employment status to TERMINATED
      if (existing.profile) {
        await tx.profile.update({
          where: { userId: id },
          data: {
            employmentStatus: "TERMINATED"
          }
        })
      }

      // End all active assignments
      if (existing.staffAssignments.length > 0) {
        await tx.staffAssignment.updateMany({
          where: {
            userId: id,
            isActive: true
          },
          data: {
            isActive: false,
            endDate: new Date()
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: "Staff member terminated successfully",
      staff: {
        id: existing.id,
        name: existing.name,
        terminatedAt: new Date()
      }
    })

  } catch (error) {
    console.error("Error terminating staff member:", error)
    return NextResponse.json(
      { error: "Failed to terminate staff member" },
      { status: 500 }
    )
  }
}

