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

    // Get all staff assigned to this company
    const staffUsers = await prisma.staffUser.findMany({
      where: { 
        companyId: clientUser.company.id
      },
      include: {
        profile: {
          select: {
            currentRole: true,
            workSchedule: true,
            startDate: true,
            employmentStatus: true
          }
        },
        onboarding: {
          select: {
            isComplete: true
          }
        }
      }
    })
    const staffIds = staffUsers.map(s => s.id)

    if (staffIds.length === 0) {
      return NextResponse.json({ 
        staffTimeEntries: [],
        summary: { totalHours: 0, activeStaff: 0, totalEntries: 0 }
      })
    }

    // Build where clause for time entries
    const whereClause: any = {
      staffUserId: { in: staffIds }
    }

    // Filter by staff member if specified
    if (staffId) {
      whereClause.staffUserId = staffId
    }

    // Filter by date range if specified
    if (startDate) {
      const startDateTime = new Date(startDate)
      startDateTime.setHours(0, 0, 0, 0)
      whereClause.clockIn = {
        gte: startDateTime
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

    // Fetch time entries with breaks
    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            profile: {
              select: {
                currentRole: true,
                employmentStatus: true
              }
            }
          }
        },
        breaks: {
          orderBy: {
            actualStart: 'asc'
          }
        }
      },
      orderBy: {
        clockIn: 'desc'
      }
    })

    // Create a map of ALL staff, not just those with time entries
    const staffTimeMap = new Map()
    
    // First, initialize ALL staff from the company
    staffUsers.forEach(staffUser => {
      staffTimeMap.set(staffUser.id, {
        staff: staffUser,
        timeEntries: []
      })
    })
    
    // Then, add time entries to staff who have them
    timeEntries.forEach(entry => {
      const staffId = entry.staffUserId
      if (staffTimeMap.has(staffId)) {
        const existingData = staffTimeMap.get(staffId)
        existingData.timeEntries.push(entry)
        // Keep original staff data from staffUsers - it has all the fields we need
      }
    })

    // Format response with ALL staff and their time entries (or empty if none)
    const staffTimeEntries = Array.from(staffTimeMap.values()).map(({ staff, timeEntries }) => {
      const totalHours = timeEntries.reduce((sum: number, entry: any) => {
        return sum + (entry.totalHours ? Number(entry.totalHours) : 0)
      }, 0)

      // Check if currently clocked in
      const activeEntry = timeEntries.find((e: any) => !e.clockOut)
      const isClockedIn = !!activeEntry

      // Check if on break
      const activeBreak = activeEntry?.breaks.find((b: any) => b.actualStart && !b.actualEnd)
      const isOnBreak = !!activeBreak

      return {
        staff: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          avatar: staff.avatar,
          role: staff.profile?.currentRole || 'Staff Member',
          employmentStatus: staff.profile?.employmentStatus || 'PROBATION'
        },
        isClockedIn,
        isOnBreak,
        currentBreakType: activeBreak?.type || null,
        currentEntry: activeEntry ? {
          id: activeEntry.id,
          clockIn: activeEntry.clockIn,
          breaks: activeEntry.breaks.map((b: any) => ({
            id: b.id,
            type: b.type,
            scheduledStart: b.scheduledStart,
            scheduledEnd: b.scheduledEnd,
            actualStart: b.actualStart,
            actualEnd: b.actualEnd,
            duration: b.duration,
            isLate: b.isLate,
            lateBy: b.lateBy
          }))
        } : null,
        timeEntries: timeEntries.map((e: any) => ({
          id: e.id,
          clockIn: e.clockIn,
          clockOut: e.clockOut,
          totalHours: e.totalHours ? Number(e.totalHours) : 0,
          wasLate: e.wasLate,
          lateBy: e.lateBy,
          clockOutReason: e.clockOutReason,
          breaks: e.breaks.map((b: any) => ({
            id: b.id,
            type: b.type,
            scheduledStart: b.scheduledStart,
            scheduledEnd: b.scheduledEnd,
            actualStart: b.actualStart,
            actualEnd: b.actualEnd,
            duration: b.duration,
            isLate: b.isLate,
            lateBy: b.lateBy
          }))
        })),
        totalHours: Math.round(totalHours * 100) / 100,
        totalEntries: timeEntries.length
      }
    })

    // Sort staff entries: active staff first, then by total hours (descending)
    const sortedStaffTimeEntries = staffTimeEntries.sort((a, b) => {
      // First priority: active staff (clocked in) go to the top
      if (a.isClockedIn && !b.isClockedIn) return -1
      if (!a.isClockedIn && b.isClockedIn) return 1
      
      // Second priority: sort by total hours (descending)
      return b.totalHours - a.totalHours
    })

    // Calculate summary statistics
    const activeStaff = staffTimeEntries.filter(s => s.isClockedIn).length
    const totalHours = staffTimeEntries.reduce((sum, s) => sum + s.totalHours, 0)
    const totalEntries = timeEntries.length

    return NextResponse.json({
      staffTimeEntries: sortedStaffTimeEntries,
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        activeStaff,
        totalEntries,
        totalStaff: staffTimeEntries.length
      }
    })
  } catch (error: any) {
    console.error("Error in client time tracking:", error)
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    )
  }
}
