import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser to verify they have access
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id: userId } = await params

    // Get staff member details with all relations (ONLY from staff_users and staff_profiles)
    const user = await prisma.staffUser.findUnique({
      where: { 
        id: userId,
        companyId: clientUser.company.id // Ensure staff belongs to client's company
      },
      include: {
        profile: {
          include: {
            workSchedule: true,
          },
        },
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
        timeEntries: {
          orderBy: { clockIn: 'desc' },
          take: 10,
        },
        performanceMetrics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        legacyTasks: {
          orderBy: { createdAt: 'desc' },
        },
        reviewsReceived: {
          orderBy: { submittedDate: 'desc' },
        },
        breaks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
        },
        gamificationProfile: {
          include: {
            badges: true,
          },
        },
        activityPosts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Calculate stats
    const avgProductivity = user.performanceMetrics.length > 0
      ? Math.round(
          user.performanceMetrics.reduce((sum, m) => sum + m.productivityScore, 0) /
          user.performanceMetrics.length
        )
      : 0

    const latestReview = user.reviewsReceived[0]
    // Convert from 100-point scale to 5-point scale
    const reviewScore = latestReview ? Math.round((Number(latestReview.overallScore) / 100 * 5) * 10) / 10 : 0

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Calculate hours from timeEntries (same as attendance stats)
    const thisMonthEntries = user.timeEntries.filter(
      e => new Date(e.clockIn) >= startOfMonth
    )
    const totalHoursThisMonth = Math.round(
      thisMonthEntries.reduce((sum, e) => {
        if (e.totalHours) {
          return sum + Number(e.totalHours)
        }
        return sum
      }, 0)
    )

    const currentEntry = user.timeEntries[0]
    const isClockedIn = currentEntry && !currentEntry.clockOut

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todaySchedule = user.profile?.workSchedule.find(s => s.dayOfWeek === today)

    // Calculate task stats
    const taskStats = {
      total: user.legacyTasks.length,
      todo: user.legacyTasks.filter(t => t.status === 'TODO').length,
      inProgress: user.legacyTasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: user.legacyTasks.filter(t => t.status === 'COMPLETED').length,
      stuck: user.legacyTasks.filter(t => t.status === 'STUCK').length,
    }

    // Calculate attendance stats from timeEntries (using thisMonthEntries from above)
    const attendanceStats = {
      daysPresent: thisMonthEntries.length,
      totalHours: Math.round(
        thisMonthEntries.reduce((sum, e) => {
          if (e.totalHours) {
            return sum + Number(e.totalHours)
          }
          return sum
        }, 0)
      ),
      averageHoursPerDay: thisMonthEntries.length > 0
        ? Math.round(
            thisMonthEntries.reduce((sum, e) => {
              if (e.totalHours) {
                return sum + Number(e.totalHours)
              }
              return sum
            }, 0) / thisMonthEntries.length
          )
        : 0,
    }

    // Get performance trend (last 7 days)
    const last7Days = user.performanceMetrics.slice(0, 7).reverse()
    const performanceTrend = last7Days.map(m => ({
      date: m.date,
      score: m.productivityScore,
      activeTime: Math.round(m.activeTime / 60), // hours
    }))

    const staffDetail = {
      // Basic info
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      coverPhoto: user.coverPhoto,
      role: user.role,

      // Assignment (from company relationship)
      assignment: user.company ? {
        role: user.profile?.currentRole || null,
        rate: null,
        startDate: user.profile?.startDate || user.createdAt,
        client: user.company.companyName,
        manager: {
          name: user.company.accountManager?.name || null,
          email: user.company.accountManager?.email || null,
          role: user.company.accountManager?.role || null,
        },
      } : null,

      // Profile (NO personal records like SSS/TIN)
      profile: user.profile ? {
        phone: user.profile.phone,
        location: user.profile.location,
        employmentStatus: user.profile.employmentStatus,
        startDate: user.profile.startDate,
        daysEmployed: Math.floor((new Date().getTime() - new Date(user.profile.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        currentRole: user.profile.currentRole,
        salary: user.profile.salary,
        lastPayIncrease: user.profile.lastPayIncrease,
        lastIncreaseAmount: user.profile.lastIncreaseAmount,
        totalLeave: user.profile.totalLeave,
        usedLeave: user.profile.usedLeave,
        vacationUsed: user.profile.vacationUsed,
        sickUsed: user.profile.sickUsed,
        hmo: user.profile.hmo,
        workSchedule: user.profile.workSchedule,
      } : null,

      // Current status
      currentStatus: {
        isClockedIn,
        shift: todaySchedule ? `${todaySchedule.startTime} - ${todaySchedule.endTime}` : 'N/A',
        currentEntry: currentEntry ? {
          clockIn: currentEntry.clockIn,
          clockOut: currentEntry.clockOut,
        } : null,
      },

      // Stats
      stats: {
        avgProductivity,
        reviewScore,
        totalHoursThisMonth, // Already rounded in calculation above
        level: user.gamificationProfile?.level || 1,
        points: user.gamificationProfile?.points || 0,
        rank: user.gamificationProfile?.rank || null,
        badges: user.gamificationProfile?.badges || [],
      },

      // Tasks
      tasks: {
        stats: taskStats,
        recent: user.legacyTasks.slice(0, 5).map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          deadline: t.deadline,
          completedAt: t.completedAt,
        })),
      },

      // Attendance
      attendance: attendanceStats,

      // Performance trend
      performanceTrend,

      // Reviews
      reviews: user.reviewsReceived.map(r => ({
        id: r.id,
        type: r.type,
        overallScore: r.overallScore 
          ? Math.round((Number(r.overallScore) / 100 * 5) * 10) / 10 
          : 0, // Convert from 100-point to 5-point scale
        previousScore: r.previousScore 
          ? Math.round((Number(r.previousScore) / 100 * 5) * 10) / 10 
          : null,
        submittedDate: r.submittedDate,
        reviewer: r.reviewer,
        status: r.status,
      })),

      // Time entries (history)
      timeEntries: user.timeEntries.map(e => ({
        id: e.id,
        clockIn: e.clockIn,
        clockOut: e.clockOut,
        totalHours: e.totalHours ? Number(e.totalHours) : null,
        notes: e.notes,
      })),

      // Recent activity posts
      recentActivity: user.activityPosts.map(p => ({
        id: p.id,
        type: p.type,
        content: p.content,
        createdAt: p.createdAt,
      })),

      // Tickets
      tickets: {
        total: user.tickets.length,
        open: user.tickets.filter(t => t.status === 'OPEN').length,
        resolved: user.tickets.filter(t => t.status === 'RESOLVED').length,
      },
    }

    return NextResponse.json(staffDetail)
  } catch (error) {
    console.error("Error fetching staff details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}










