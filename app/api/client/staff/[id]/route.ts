import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add client user authentication (Wendy, CEO, etc.)
    // For now, allow access to test the feature
    
    const { id: userId } = await params

    // Get staff member details with all relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            workSchedule: true,
          },
        },
        staffAssignments: {
          where: { isActive: true },
          include: {
            client: true,
            manager: {
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
        tasks: {
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
    const reviewScore = latestReview ? Number(latestReview.overallScore) : 0

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const totalHoursThisMonth = user.performanceMetrics
      .filter(m => new Date(m.date) >= startOfMonth)
      .reduce((sum, m) => sum + m.activeTime, 0) / 60

    const currentEntry = user.timeEntries[0]
    const isClockedIn = currentEntry && !currentEntry.clockOut

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todaySchedule = user.profile?.workSchedule.find(s => s.dayOfWeek === today)

    // Get assignment info
    const assignment = user.staffAssignments[0]

    // Calculate task stats
    const taskStats = {
      total: user.tasks.length,
      todo: user.tasks.filter(t => t.status === 'TODO').length,
      inProgress: user.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: user.tasks.filter(t => t.status === 'COMPLETED').length,
      stuck: user.tasks.filter(t => t.status === 'STUCK').length,
    }

    // Calculate attendance stats from timeEntries
    const thisMonthEntries = user.timeEntries.filter(
      e => new Date(e.clockIn) >= startOfMonth
    )
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

      // Assignment
      assignment: assignment ? {
        role: assignment.role,
        rate: assignment.rate,
        startDate: assignment.startDate,
        client: assignment.client.companyName,
        manager: {
          name: assignment.manager?.name,
          email: assignment.manager?.email,
          role: assignment.manager?.role,
        },
      } : null,

      // Profile
      profile: user.profile ? {
        phone: user.profile.phone,
        location: user.profile.location,
        employmentStatus: user.profile.employmentStatus,
        startDate: user.profile.startDate,
        daysEmployed: user.profile.daysEmployed,
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
        totalHoursThisMonth: Math.round(totalHoursThisMonth),
        level: user.gamificationProfile?.level || 1,
        points: user.gamificationProfile?.points || 0,
        rank: user.gamificationProfile?.rank || null,
        badges: user.gamificationProfile?.badges || [],
      },

      // Tasks
      tasks: {
        stats: taskStats,
        recent: user.tasks.slice(0, 5).map(t => ({
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
        overallScore: Number(r.overallScore),
        previousScore: r.previousScore ? Number(r.previousScore) : null,
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










