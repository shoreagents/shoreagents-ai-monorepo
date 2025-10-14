import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET /api/admin/tickets - Get ALL tickets (admin view)
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    const where: any = {}

    // Filter by specific staff
    if (staffId) {
      where.userId = staffId
    }

    // Filter by category
    if (category) {
      where.category = category
    }

    // Filter by status
    if (status) {
      where.status = status
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        },
        responses: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tickets, count: tickets.length })
  } catch (error) {
    console.error("Error fetching admin tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

