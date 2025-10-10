import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/tickets/[id]/responses - Add a response to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: "Response content is required" },
        { status: 400 }
      )
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Create response
    const response = await prisma.ticketResponse.create({
      data: {
        ticketId: params.id,
        authorId: session.user.id,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, response }, { status: 201 })
  } catch (error) {
    console.error("Error adding ticket response:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

