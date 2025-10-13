// Admin API - Single Client Operations
// GET: Get client details
// PUT: Update client
// DELETE: Deactivate client

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/clients/[id] - Get single client
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

    // Fetch client with full relations
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        offshoreStaff: {
          include: {
            user: {
              include: {
                profile: true,
                reviewsReceived: {
                  orderBy: { submittedDate: "desc" },
                  take: 5
                }
              }
            },
            manager: true,
          },
          orderBy: { startDate: "desc" }
        },
        onshoreStaff: true,
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      client
    })

  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/clients/[id] - Update client
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

    // Check client exists
    const existing = await prisma.client.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (body.companyName !== undefined) updateData.companyName = body.companyName
    if (body.industry !== undefined) updateData.industry = body.industry
    if (body.location !== undefined) updateData.location = body.location
    if (body.billingEmail !== undefined) updateData.billingEmail = body.billingEmail
    if (body.website !== undefined) updateData.website = body.website

    // Update client
    const updated = await prisma.client.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: "Client updated successfully",
      client: updated
    })

  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/clients/[id] - Deactivate client
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

    // Check client exists
    const existing = await prisma.client.findUnique({
      where: { id },
      include: {
        offshoreStaff: {
          where: { isActive: true }
        }
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Check for active assignments
    if (existing.offshoreStaff.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete client with active staff assignments",
          activeAssignments: existing.offshoreStaff.length 
        },
        { status: 400 }
      )
    }

    // Delete client (hard delete if no assignments, or we could add an isActive field)
    await prisma.client.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Client deleted successfully",
      client: {
        id: existing.id,
        companyName: existing.companyName
      }
    })

  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    )
  }
}

