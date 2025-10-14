import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET /api/admin/time-tracking - Get ALL time entries (admin view)
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const clientId = searchParams.get("clientId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    // Filter by specific staff
    if (staffId) {
      where.staffUserId = staffId
    }

    // Filter by client/company
    if (clientId) {
      const staffUsers = await prisma.staffUser.findMany({
        where: { companyId: clientId },
        select: { id: true }
      })
      where.staffUserId = { in: staffUsers.map(s => s.id) }
    }

    // Filter by date range
    if (startDate && endDate) {
      where.clockIn = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: {
        clockIn: "desc",
      },
    })

    // Calculate total hours
    const totalHours = entries
      .filter((e) => e.totalHours)
      .reduce((sum, e) => sum + Number(e.totalHours), 0)

    return NextResponse.json({
      entries,
      totalHours: totalHours.toFixed(2),
      count: entries.length,
    })
  } catch (error) {
    console.error("Error fetching admin time entries:", error)
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 })
  }
}

