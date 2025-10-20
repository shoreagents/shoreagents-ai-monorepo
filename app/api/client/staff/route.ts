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
        staff_personal_records: true,
        gamificationProfile: true,
        timeEntries: {
          where: {
            clockInTime: {
              gte: new Date(new Date().setDate(1)), // This month
            },
          },
        },
        legacyTasks: {
          where: {
            status: {
              not: 'COMPLETED',
            },
          },
        },
        reviewsReceived: {
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
      const daysEmployed = member.profile?.startDate
        ? Math.floor((Date.now() - new Date(member.profile.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: member.avatar,
        assignmentRole: member.staff_personal_records?.assignmentRole || null,
        rate: member.staff_personal_records?.rate || null,
        startDate: member.profile?.startDate?.toISOString() || new Date().toISOString(),
        managedBy: clientUser.company.managementName || "Management",
        client: clientUser.company.name,
        phone: member.profile?.phone || null,
        location: member.profile?.location || null,
        employmentStatus: member.profile?.employmentStatus || "PROBATION",
        daysEmployed,
        currentRole: member.profile?.currentRole || "Staff Member",
        salary: Number(member.profile?.salary || 0),
        totalLeave: member.profile?.totalLeave || 0,
        usedLeave: member.profile?.usedLeave || 0,
        hmo: member.staff_personal_records?.hmo || false,
        shift: member.staff_personal_records?.shift || "Day Shift",
        activeTasks: member.legacyTasks.length,
        avgProductivity: member.gamificationProfile?.level || 1,
        reviewScore: member.reviewsReceived[0]?.rating || 0,
        totalHoursThisMonth: Math.round(totalHours),
        isClockedIn,
        level: member.gamificationProfile?.level || 1,
        points: member.gamificationProfile?.points || 0,
      }
    })

    return NextResponse.json(formattedStaff)
  } catch (error) {
    console.error("Error fetching client staff:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
