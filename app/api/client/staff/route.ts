import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true },
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Client user or company not found" }, { status: 404 })
    }

    // Get all staff for this company who have completed onboarding AND have started
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const staffList = await prisma.staffUser.findMany({
      where: {
        companyId: clientUser.company.id,
        // Only show staff who have completed onboarding
        onboarding: {
          isComplete: true
        },
        // And whose start date is today or in the past
        profile: {
          startDate: {
            lte: today
          }
        }
      },
      include: {
        profile: {
          select: {
            phone: true,
            location: true,
            employmentStatus: true,
            startDate: true,
            currentRole: true,
            salary: true,
            totalLeave: true,
            usedLeave: true,
            hmo: true,
            workSchedule: true,
          }
        },
        gamificationProfile: {
          select: {
            level: true,
            points: true,
          }
        },
        performanceMetrics: {
          orderBy: { date: 'desc' },
          take: 7, // Last 7 days
          select: {
            productivityScore: true,
          }
        },
        taskAssignments: {
          where: {
            OR: [
              { status: 'TODO' },
              { status: 'IN_PROGRESS' }
            ]
          },
          select: { id: true }
        },
        reviewsReceived: {
          where: {
            isAcknowledged: true
          },
          select: {
            rating: true
          }
        },
        timeEntries: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Start of current month
            }
          },
          select: {
            startTime: true,
            endTime: true
          }
        },
        breaks: {
          where: {
            status: 'ACTIVE'
          },
          select: { id: true }
        }
      },
      orderBy: { name: "asc" },
    })

    // Format the response with calculated fields
    const formattedStaff = staffList.map(staff => {
      // Calculate days employed
      const startDate = staff.profile?.startDate || new Date()
      const daysEmployed = Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))

      // Calculate average productivity
      const avgProductivity = staff.performanceMetrics.length > 0
        ? Math.round(staff.performanceMetrics.reduce((sum, m) => sum + m.productivityScore, 0) / staff.performanceMetrics.length)
        : 0

      // Calculate average review score
      const reviewScore = staff.reviewsReceived.length > 0
        ? Math.round((staff.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / staff.reviewsReceived.length) * 10) / 10
        : 0

      // Calculate total hours this month
      const totalHoursThisMonth = staff.timeEntries.reduce((total, entry) => {
        if (entry.startTime && entry.endTime) {
          const hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60)
          return total + hours
        }
        return total
      }, 0)

      // Get shift time from work schedule
      const workSchedule = staff.profile?.workSchedule.find(s => s.isWorkday) || null
      const shift = workSchedule 
        ? `${workSchedule.startTime} - ${workSchedule.endTime}` 
        : "9:00 AM - 6:00 PM"

      // Check if clocked in (no active breaks means they're working)
      const isClockedIn = staff.breaks.length === 0 && totalHoursThisMonth > 0

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        avatar: staff.avatar,
        assignmentRole: staff.profile?.currentRole || null,
        rate: staff.profile?.salary ? Number(staff.profile.salary) : null,
        startDate: staff.profile?.startDate?.toISOString() || new Date().toISOString(),
        managedBy: clientUser.company.accountManager?.name || "Not assigned",
        client: clientUser.company.companyName,
        phone: staff.profile?.phone || null,
        location: staff.profile?.location || null,
        employmentStatus: staff.profile?.employmentStatus || "PROBATION",
        daysEmployed,
        currentRole: staff.profile?.currentRole || "Staff Member",
        salary: staff.profile?.salary ? Number(staff.profile.salary) : 0,
        totalLeave: staff.profile?.totalLeave || 12,
        usedLeave: staff.profile?.usedLeave || 0,
        hmo: staff.profile?.hmo || false,
        shift,
        activeTasks: staff.taskAssignments.length,
        avgProductivity,
        reviewScore,
        totalHoursThisMonth: Math.round(totalHoursThisMonth),
        isClockedIn,
        level: staff.gamificationProfile?.level || 1,
        points: staff.gamificationProfile?.points || 0,
      }
    })

    return NextResponse.json(formattedStaff)
  } catch (error) {
    console.error("Error fetching client staff:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
