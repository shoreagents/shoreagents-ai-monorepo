import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/leaderboard - Get leaderboard rankings
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timePeriod = searchParams.get("period") || "all_time" // this_week, this_month, all_time

    // Check if this is a client user - if so, filter by their company
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    // Build the where clause based on user type
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const whereClause: any = {
      role: "STAFF", // Only show staff members in leaderboard
      active: true, // Only show active staff (not deactivated after offboarding)
      // Only show staff who have started (start date is today or in the past)
      profile: {
        startDate: {
          lte: today
        }
      }
    }

    // If client user, only show staff assigned to their company
    if (clientUser?.companyId) {
      console.log(`🔍 [LEADERBOARD] Filtering for company: ${clientUser.companyId}`)
      whereClause.companyId = clientUser.companyId
    }

    // Get staff users with their gamification profiles and task assignments
    const staffUsers = await prisma.staffUser.findMany({
      where: whereClause,
      include: {
        gamificationProfile: true,
        reviewsReceived: {
          select: {
            overallScore: true,
          },
        },
        taskAssignments: {
          include: {
            task: {
              select: {
                status: true,
              }
            }
          }
        },
        performanceMetrics: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 days
          select: {
            productivityScore: true,
          }
        },
      },
    })

    console.log(`📊 [LEADERBOARD] Found ${staffUsers.length} staff members`)


    // Calculate rankings
    const rankings = staffUsers
      .map((user) => {
        const avgReviewScore =
          user.reviewsReceived.length > 0
            ? user.reviewsReceived.reduce(
                (sum, review) => sum + Number(review.overallScore || 0),
                0
              ) / user.reviewsReceived.length
            : 0

        // Calculate actual completed tasks from task assignments
        const actualCompletedTasks = user.taskAssignments.filter(
          ta => ta.task?.status === 'COMPLETED'
        ).length

        // Calculate points based on completed tasks (50 points per task)
        // Add any existing points from gamification profile
        const basePoints = user.gamificationProfile?.points || 0
        const taskPoints = actualCompletedTasks * 50
        const totalPoints = basePoints + taskPoints

        // Calculate average performance score from recent metrics (last 30 days)
        const avgPerformanceScore = user.performanceMetrics.length > 0
          ? Math.round(
              user.performanceMetrics.reduce((sum, m) => sum + (m.productivityScore || 0), 0) /
              user.performanceMetrics.length
            )
          : 0

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          points: totalPoints, // Calculate from completed tasks (50 pts each)
          level: user.gamificationProfile?.level || 1,
          tasksCompleted: actualCompletedTasks, // Use actual count from tasks
          performanceScore: avgPerformanceScore, // Calculate from recent PerformanceMetrics
          reviewRating: Number(avgReviewScore.toFixed(1)),
          streakDays: user.gamificationProfile?.streak || 0,
          badges: [],
          rankChange: 0,
        }
      })
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({ ...user, rank: index + 1 }))

    // Find current user's StaffUser record (only if not a client user)
    let currentUser = null
    if (!clientUser) {
      const staffUser = await prisma.staffUser.findUnique({
        where: { authUserId: session.user.id }
      })
      
      // Find current user in rankings using staff user ID
      currentUser = staffUser ? rankings.find((user) => user.id === staffUser.id) || null : null
    }

    return NextResponse.json({ rankings, currentUser })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

