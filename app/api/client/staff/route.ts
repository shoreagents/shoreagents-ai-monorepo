import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyClientAuth } from "@/lib/api-auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify client authentication
    const { session, error } = await verifyClientAuth()
    if (error) return error

    // TODO: Get clientId from session/user relationship
    // For now, hardcode TechCorp to test the feature
    const clientId = 'tech-corp-001'

    const assignments = await prisma.staffAssignment.findMany({
      where: {
        clientId: clientId,
        isActive: true,
      },
      include: {
        user: {
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
          },
        },
        manager: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        client: {
          select: {
            companyName: true,
          },
        },
      },
    })

    // Calculate stats for each staff member
    const staffWithStats = assignments.map((assignment) => {
      const user = assignment.user
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
        
        // Assignment details
        assignmentRole: assignment.role,
        rate: assignment.rate,
        startDate: assignment.startDate,
        managedBy: assignment.manager?.name,
        client: assignment.client.companyName,
        
        // Profile details
        phone: profile?.phone,
        location: profile?.location,
        employmentStatus: profile?.employmentStatus,
        daysEmployed: profile?.daysEmployed,
        currentRole: profile?.currentRole,
        salary: profile?.salary,
        
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










