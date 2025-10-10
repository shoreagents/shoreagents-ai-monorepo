import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/tickets/[id] - Update ticket status or priority
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, priority, assignedToId } = body

    // Verify ticket belongs to user (or user is admin/manager)
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.id },
    })

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Only allow ticket creator or admin/manager to update
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    const canUpdate =
      existingTicket.createdById === session.user.id ||
      user?.role === "ADMIN" ||
      user?.role === "MANAGER"

    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId && { assignedToId }),
        ...(status === "RESOLVED" && {
          resolvedAt: new Date(),
          resolvedById: session.user.id,
        }),
      },
      include: {
        responses: {
          orderBy: { createdAt: "asc" },
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
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error("Error updating ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

