import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/time-tracking - Fetch time entries for client's assigned staff
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const staffId = searchParams.get('staffId')

    // Try to get client via ClientUser table
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Get all assigned staff for this client
    const staffAssignments = await prisma.staffAssignment.findMany({
      where: {
        companyId: clientUser.company.id,
        isActive: true
      },
      select: { staffUserId: true }
    })
    
    const staffIds = staffAssignments.map(s => s.staffUserId)

    if (staffIds.length === 0) {
      return NextResponse.json({ 
        timeEntries: [], 
        summary: { totalHours: 0, activeStaff: 0, totalEntries: 0 },
        staffList: []
      })
    }

    // Build where clause for time entries
    const whereClause: any = {
      userId: { in: staffIds }
    }

    // Filter by staff member if specified
    if (staffId) {
      whereClause.userId = staffId
    }

    // Filter by date range if specified
    if (startDate) {
      whereClause.clockIn = {
        gte: new Date(startDate)
      }
    }

    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      
      if (whereClause.clockIn) {
        whereClause.clockIn.lte = endDateTime
      } else {
        whereClause.clockIn = { lte: endDateTime }
      }
    }

    // Fetch time entries with user info
    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
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
        clockIn: 'desc'
      }
    })

    // Calculate summary statistics
    const activeStaff = timeEntries.filter(entry => !entry.clockOut).length
    const totalHours = timeEntries.reduce((sum, entry) => {
      const hours = entry.totalHours ? Number(entry.totalHours) : 0
      return sum + hours
    }, 0)

    // Get unique staff list for the client
    const staffList = await prisma.user.findMany({
      where: {
        id: { in: staffIds }
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true
      }
    })

    return NextResponse.json({
      timeEntries,
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        activeStaff,
        totalEntries: timeEntries.length
      },
      staffList
    })
  } catch (error) {
    console.error("Error fetching client time tracking:", error)
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    )
  }
}

