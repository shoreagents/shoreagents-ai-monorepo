// Admin API - Client Users Management
// GET: List all client users
// POST: Create new client user

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET /api/admin/client-users - List all client users
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
    const clientId = searchParams.get("clientId")
    const role = searchParams.get("role") // OWNER, ADMIN, MANAGER, VIEWER
    const search = searchParams.get("search")

    // Build where clause
    const where: any = {}

    if (clientId) {
      where.clientId = clientId
    }

    if (role && ["OWNER", "ADMIN", "MANAGER", "VIEWER"].includes(role)) {
      where.role = role
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    }

    // Fetch client users
    const clientUsers = await prisma.clientUser.findMany({
      where,
      include: {
        client: true,
        managedOffshoreStaff: {
          where: { isActive: true },
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Format response
    const formattedUsers = clientUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      phone: user.phone,
      createdAt: user.createdAt,
      
      client: {
        id: user.client.id,
        companyName: user.client.companyName,
        industry: user.client.industry,
      },
      
      // Managed staff
      managedStaffCount: user.managedOffshoreStaff.length,
      managedStaff: user.managedOffshoreStaff.map(assignment => ({
        id: assignment.id,
        role: assignment.role,
        staff: {
          id: assignment.user.id,
          name: assignment.user.name,
          avatar: assignment.user.avatar,
          currentRole: assignment.user.profile?.currentRole,
        }
      }))
    }))

    return NextResponse.json({
      success: true,
      count: formattedUsers.length,
      clientUsers: formattedUsers
    })

  } catch (error) {
    console.error("Error fetching client users:", error)
    return NextResponse.json(
      { error: "Failed to fetch client users" },
      { status: 500 }
    )
  }
}

// POST /api/admin/client-users - Create new client user
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
      clientId,
      name, 
      email, 
      password, 
      role,
      title,
      phone
    } = body

    // Validation
    if (!clientId || !name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, name, email, password, role" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ["OWNER", "ADMIN", "MANAGER", "VIEWER"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be OWNER, ADMIN, MANAGER, or VIEWER" },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client organization not found" },
        { status: 404 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.clientUser.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create client user
    const clientUser = await prisma.clientUser.create({
      data: {
        clientId,
        name,
        email,
        passwordHash,
        role,
        title: title || null,
        phone: phone || null,
      },
      include: {
        client: true
      }
    })

    // TODO: Send welcome email to client user

    return NextResponse.json({
      success: true,
      message: "Client user created successfully",
      clientUser: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        role: clientUser.role,
        title: clientUser.title,
        client: {
          id: clientUser.client.id,
          companyName: clientUser.client.companyName,
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating client user:", error)
    return NextResponse.json(
      { error: "Failed to create client user" },
      { status: 500 }
    )
  }
}

