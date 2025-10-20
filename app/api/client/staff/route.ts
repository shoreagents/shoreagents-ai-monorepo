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

    const staff = await prisma.staffUser.findMany({
      where: {
        companyId: clientUser.company.id,
      },
      include: {
        profile: true,
        personalRecord: true,
        workSchedule: true,
        timeEntries: {
          where: {
            clockInTime: {
              gte: new Date(new Date().setDate(1)), // This month
            },
          },
        },
        tasks: {
          where: {
            status: {
              not: 'COMPLETED',
            },
          },
        },
        reviews: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    })

    // Transform data to match frontend expectations
    const formattedStaff = staff.map((member) => {
      // Calculate total hours this month
      const totalHours = member.timeEntries.reduce((sum, entry) => {
        if (entry.clockOutTime) {
          const hours = (new Date(entry.clockOutTime).getTime() - new Date(entry.clockInTime).getTime()) / (1000 * 60 * 60)
          return sum + hours
        }
        return sum
      }, 0)

      // Check if currently clocked in
      const isClockedIn = member.timeEntries.some(
        (entry) => !entry.clockOutTime
      )

      // Calculate days employed
      const daysEmployed = member.personalRecord?.startDate
        ? Math.floor((Date.now() - new Date(member.personalRecord.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: member.avatar,
        assignmentRole: member.personalRecord?.assignmentRole || null,
        rate: member.personalRecord?.rate || null,
        startDate: member.personalRecord?.startDate || new Date().toISOString(),
        managedBy: clientUser.company.managementName || "Management",
        client: clientUser.company.name,
        phone: member.personalRecord?.phone || null,
        location: member.personalRecord?.location || null,
        employmentStatus: member.personalRecord?.employmentStatus || "PROBATION",
        daysEmployed,
        currentRole: member.personalRecord?.currentRole || "Staff Member",
        salary: member.personalRecord?.salary || 0,
        totalLeave: member.workSchedule?.annualLeave || 0,
        usedLeave: member.workSchedule?.usedLeave || 0,
        hmo: member.personalRecord?.hmo || false,
        shift: member.workSchedule?.shift || "Day Shift",
        activeTasks: member.tasks.length,
        avgProductivity: member.profile?.level || 1,
        reviewScore: member.reviews[0]?.rating || 0,
        totalHoursThisMonth: Math.round(totalHours),
        isClockedIn,
        level: member.profile?.level || 1,
        points: member.profile?.points || 0,
      }
    })

    return NextResponse.json(formattedStaff)
  } catch (error) {
    console.error("Error fetching client staff:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
