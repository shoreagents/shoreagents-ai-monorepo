import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/admin/tickets - Get all tickets for management view
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is management
    const managementUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser) {
      return NextResponse.json({ error: "Management user not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const staffId = searchParams.get("staffId")

    const tickets = await prisma.ticket.findMany({
      where: {
        ...(status && { status }),
        ...(category && { category }),
        ...(staffId && { staffUserId: staffId }),
      },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
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
                avatar: true,
                role: true,
              },
            },
            managementUser: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Error fetching admin tickets:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/admin/tickets - Create a new ticket as management
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is management
    const managementUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser) {
      return NextResponse.json({ error: "Management user not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, category, priority, attachments, staffUserId } = body

    if (!title || !description || !category || !staffUserId) {
      return NextResponse.json(
        { error: "Title, description, category, and staffUserId are required" },
        { status: 400 }
      )
    }

    // Generate unique ticket ID
    const ticketCount = await prisma.ticket.count()
    const ticketId = `TKT-${String(ticketCount + 1).padStart(4, "0")}`

    const ticket = await prisma.ticket.create({
      data: {
        staffUserId,
        ticketId,
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        status: "OPEN",
        attachments: attachments || [],
        createdByType: "MANAGEMENT",
        managementUserId: managementUser.id,
      },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        responses: {
          include: {
            staffUser: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
            managementUser: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (error) {
    console.error("Error creating admin ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
