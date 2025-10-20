import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { mapCategoryToDepartment } from "@/lib/category-department-map"

// GET /api/tickets - Get all tickets for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Get staff user first
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        staffUserId: staffUser.id,
        ...(status && { status }),
      },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            department: true, // Include department for display
          },
        },
        responses: {
          orderBy: { createdAt: "asc" },
          include: {
            staffUser: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
              },
            },
            management_users: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
              },
            },
            client_users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, priority, attachments } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      )
    }

    // Get staff user first
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Generate unique ticket ID
    const ticketCount = await prisma.ticket.count()
    const ticketId = `TKT-${String(ticketCount + 1).padStart(4, "0")}`

    // 🎯 AUTO-ASSIGN: Map category to department and find manager
    const department = mapCategoryToDepartment(category)
    let managementUserId: string | null = null

    if (department) {
      // Find a management user with matching department
      const manager = await prisma.managementUser.findFirst({
        where: { department },
      })

      if (manager) {
        managementUserId = manager.id
        console.log(`✅ Auto-assigned ticket to ${manager.name} (${department})`)
      } else {
        console.log(`⚠️  No manager found for department: ${department}`)
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        staffUserId: staffUser.id,
        managementUserId, // Auto-assigned manager
        ticketId,
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        status: "OPEN",
        attachments: attachments || [],
        createdByType: "STAFF",
      },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            department: true, // Include department for display
          },
        },
        responses: {
          include: {
            staffUser: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
              },
            },
            management_users: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
              },
            },
            client_users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (error) {
    console.error("Error creating ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

