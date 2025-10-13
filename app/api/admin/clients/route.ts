// Admin API - Client Management
// GET: List all clients
// POST: Create new client organization

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/clients - List all clients
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const industry = searchParams.get("industry")

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { billingEmail: { contains: search, mode: "insensitive" } }
      ]
    }

    if (industry) {
      where.industry = industry
    }

    // Fetch clients with relations
    const clients = await prisma.client.findMany({
      where,
      include: {
        offshoreStaff: {
          where: { isActive: true },
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        onshoreStaff: true,
        _count: {
          select: {
            offshoreStaff: true,
            onshoreStaff: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Format response
    const formattedClients = clients.map(client => ({
      id: client.id,
      companyName: client.companyName,
      industry: client.industry,
      location: client.location,
      billingEmail: client.billingEmail,
      website: client.website,
      createdAt: client.createdAt,
      
      // Statistics
      offshoreStaffCount: client._count.offshoreStaff,
      onshoreStaffCount: client._count.onshoreStaff,
      totalStaff: client._count.offshoreStaff + client._count.onshoreStaff,
      
      // Active offshore staff
      offshoreStaff: client.offshoreStaff.map(assignment => ({
        id: assignment.id,
        role: assignment.role,
        startDate: assignment.startDate,
        staff: {
          id: assignment.user.id,
          name: assignment.user.name,
          avatar: assignment.user.avatar,
          currentRole: assignment.user.profile?.currentRole,
        }
      })),
      
      // Client users (managers)
      managers: client.onshoreStaff.map(manager => ({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        title: manager.title,
      }))
    }))

    return NextResponse.json({
      success: true,
      count: formattedClients.length,
      clients: formattedClients
    })

  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}

// POST /api/admin/clients - Create new client
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
    const { 
      companyName, 
      industry, 
      location, 
      billingEmail,
      website 
    } = body

    // Validation
    if (!companyName || !industry || !location || !billingEmail) {
      return NextResponse.json(
        { error: "Missing required fields: companyName, industry, location, billingEmail" },
        { status: 400 }
      )
    }

    // Check if company name already exists
    const existing = await prisma.client.findFirst({
      where: { companyName }
    })

    if (existing) {
      return NextResponse.json(
        { error: "Company name already exists" },
        { status: 409 }
      )
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        companyName,
        industry,
        location,
        billingEmail,
        website: website || null,
      }
    })

    // TODO: Send welcome email to billing contact

    return NextResponse.json({
      success: true,
      message: "Client organization created successfully",
      client: {
        id: client.id,
        companyName: client.companyName,
        industry: client.industry,
        location: client.location,
        billingEmail: client.billingEmail,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    )
  }
}

