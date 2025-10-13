// Admin API - Single Client User Operations
// GET: Get client user details
// PUT: Update client user
// DELETE: Deactivate client user

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/client-users/[id] - Get single client user
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

    // Fetch client user with full relations
    const clientUser = await prisma.clientUser.findUnique({
      where: { id },
      include: {
        client: true,
        managedOffshoreStaff: {
          include: {
            user: {
              include: {
                profile: true,
                reviewsReceived: {
                  orderBy: { submittedDate: "desc" },
                  take: 5
                }
              }
            }
          }
        }
      }
    })

    if (!clientUser) {
      return NextResponse.json(
        { error: "Client user not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      clientUser
    })

  } catch (error) {
    console.error("Error fetching client user:", error)
    return NextResponse.json(
      { error: "Failed to fetch client user" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/client-users/[id] - Update client user
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

    // Check client user exists
    const existing = await prisma.clientUser.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Client user not found" },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.title !== undefined) updateData.title = body.title
    if (body.phone !== undefined) updateData.phone = body.phone
    
    if (body.role !== undefined) {
      if (!["OWNER", "ADMIN", "MANAGER", "VIEWER"].includes(body.role)) {
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 400 }
        )
      }
      updateData.role = body.role
    }

    // Update client user
    const updated = await prisma.clientUser.update({
      where: { id },
      data: updateData,
      include: {
        client: true
      }
    })

    return NextResponse.json({
      success: true,
      message: "Client user updated successfully",
      clientUser: updated
    })

  } catch (error) {
    console.error("Error updating client user:", error)
    return NextResponse.json(
      { error: "Failed to update client user" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/client-users/[id] - Deactivate client user
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

    // Check client user exists
    const existing = await prisma.clientUser.findUnique({
      where: { id },
      include: {
        managedOffshoreStaff: {
          where: { isActive: true }
        }
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Client user not found" },
        { status: 404 }
      )
    }

    // Check for active managed staff
    if (existing.managedOffshoreStaff.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete user who manages active staff assignments",
          managedStaff: existing.managedOffshoreStaff.length 
        },
        { status: 400 }
      )
    }

    // Delete client user
    await prisma.clientUser.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Client user deleted successfully",
      clientUser: {
        id: existing.id,
        name: existing.name,
        email: existing.email
      }
    })

  } catch (error) {
    console.error("Error deleting client user:", error)
    return NextResponse.json(
      { error: "Failed to delete client user" },
      { status: 500 }
    )
  }
}

