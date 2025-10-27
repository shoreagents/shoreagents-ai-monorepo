import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/client/tickets - Get client's own tickets
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")

    // Get client's company to find their account manager
    const clientWithCompany = await prisma.client_users.findUnique({
      where: { id: clientUser.id },
      include: {
        company: {
          include: {
            accountManager: {
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

    const tickets = await prisma.tickets.findMany({
      where: {
        clientUserId: clientUser.id,
        ...(status && { status: status as any }),
        ...(category && { category: category as any }),
      },
      include: {
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            company: {
              select: {
                accountManager: {
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
        },
        responses: {
          orderBy: { createdAt: "asc" },
          include: {
            staff_users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
            management_users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
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

    // Add account manager info to response
    const ticketsWithAccountManager = tickets.map((ticket) => ({
      ...ticket,
      accountManager: clientWithCompany?.company?.accountManager || null,
    }))

    return NextResponse.json({ tickets: ticketsWithAccountManager })
  } catch (error) {
    console.error("Error fetching client tickets:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/client/tickets - Create ticket as client
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user with company and account manager
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        company: {
          include: {
            accountManager: true,
          },
        },
      },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, category, priority, attachments } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      )
    }

    // Generate ticket ID
    const lastTicket = await prisma.tickets.findFirst({
      orderBy: { createdAt: "desc" },
      select: { ticketId: true },
    })

    let ticketNumber = 1
    if (lastTicket?.ticketId) {
      const match = lastTicket.ticketId.match(/TKT-(\d+)/)
      if (match) {
        ticketNumber = parseInt(match[1]) + 1
      }
    }

    const ticketId = `TKT-${ticketNumber.toString().padStart(4, "0")}`

    // Create ticket - auto-assign to account manager
    const ticket = await prisma.tickets.create({
      data: {
        ticketId,
        clientUserId: clientUser.id,
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        status: "OPEN",
        attachments: attachments || [],
        createdByType: "CLIENT",
        assignedTo: clientUser.company?.accountManagerId || null,
      },
      include: {
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        responses: {
          include: {
            staff_users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
            management_users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
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
    console.error("Error creating client ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

