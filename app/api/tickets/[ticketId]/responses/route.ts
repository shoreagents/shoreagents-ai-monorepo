import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/tickets/[ticketId]/responses - Add response/comment to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId } = await params
    const body = await request.json()
    const { message, attachments } = body

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Determine if user is staff or management
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
    })

    const managementUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!staffUser && !managementUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create response
    const response = await prisma.ticketResponse.create({
      data: {
        ticketId,
        message,
        createdByType: staffUser ? "STAFF" : "MANAGEMENT",
        staffUserId: staffUser?.id || null,
        managementUserId: managementUser?.id || null,
        attachments: attachments || [],
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
    })

    return NextResponse.json({ success: true, response }, { status: 201 })
  } catch (error) {
    console.error("Error creating ticket response:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

