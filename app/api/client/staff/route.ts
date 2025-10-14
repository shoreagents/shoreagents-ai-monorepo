import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser
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
        companyId: clientUser.company.id,
      },
      include: {
        profile: {
          include: {
            workSchedule: true,
          },
        },
        timeEntries: {
          orderBy: { clockIn: 'desc' },
          take: 1,
        },
        performanceMetrics: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 days
        },
        tasks: {
          where: {
            status: { in: ['TODO', 'IN_PROGRESS'] }
          }
        },
        reviewsReceived: {
          orderBy: { submittedDate: 'desc' },
          take: 1,
        },
        gamificationProfile: true,
        company: {
          select: {
            companyName: true,
            accountManager: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    })

    // Calculate stats for each staff member
    const staffWithStats = staffUsers.map((user) => {
      const profile = user.profile
      
      // Calculate average productivity score
      const avgProductivity = user.performanceMetrics.length > 0
        ? Math.round(
            user.performanceMetrics.reduce((sum, m) => sum + m.productivityScore, 0) /
            user.performanceMetrics.length
          )
        : 0

      // Get latest review score
      const latestReview = user.reviewsReceived[0]
      const reviewScore = latestReview ? Number(latestReview.overallScore) : 0

      // Calculate total hours this month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const totalHours = user.performanceMetrics
        .filter(m => new Date(m.date) >= startOfMonth)
        .reduce((sum, m) => sum + m.activeTime, 0) / 60 // Convert minutes to hours

      // Get current clock in status
      const currentEntry = user.timeEntries[0]
      const isClockedIn = currentEntry && !currentEntry.clockOut

      // Get work schedule for today
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
      const todaySchedule = profile?.workSchedule.find(s => s.dayOfWeek === today)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        
        // Company details
        managedBy: user.company?.accountManager?.name || 'Not assigned',
        client: user.company?.companyName || 'No company',
        
        // Profile details
        phone: profile?.phone,
        location: profile?.location,
        employmentStatus: profile?.employmentStatus,
        daysEmployed: profile?.daysEmployed,
        currentRole: profile?.currentRole,
        salary: profile?.salary ? Number(profile.salary) : 0,
        startDate: profile?.startDate,
        
        // Leave credits
        totalLeave: profile?.totalLeave || 0,
        usedLeave: profile?.usedLeave || 0,
        vacationUsed: profile?.vacationUsed || 0,
        sickUsed: profile?.sickUsed || 0,
        
        // Benefits
        hmo: profile?.hmo || false,
        
        // Work schedule
        shift: todaySchedule ? `${todaySchedule.startTime} - ${todaySchedule.endTime}` : 'N/A',
        workSchedule: profile?.workSchedule || [],
        
        // Stats
        activeTasks: user.tasks.length,
        avgProductivity,
        reviewScore,
        totalHoursThisMonth: Math.round(totalHours),
        isClockedIn,
        
        // Gamification
        level: user.gamificationProfile?.level || 1,
        points: user.gamificationProfile?.points || 0,
        rank: user.gamificationProfile?.rank || null,
      }
    })

    return NextResponse.json(staffWithStats)
  } catch (error) {
    console.error("Error fetching client staff:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}










