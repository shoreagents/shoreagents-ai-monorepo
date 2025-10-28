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

    // Get all staff users with their gamification profiles
    const staffUsers = await prisma.staff_users.findMany({
      where: {
        role: "STAFF", // Only show staff members in leaderboard
      },
      include: {
        gamification_profiles: true,
        reviews: {
          select: {
            overallScore: true,
          },
        },
        task_assignments: {
          include: {
            tasks: {
              select: {
                status: true,
              }
            }
          }
        },
        performance_metrics: {
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
      .map((user: any) => {
        const avgReviewScore =
          user.reviews?.length > 0
            ? user.reviews.reduce(
                (sum: number, review: any) => sum + Number(review.overallScore || 0),
                0
              ) / user.reviews.length
            : 0

        // Calculate actual completed tasks from task assignments
        const actualCompletedTasks = user.task_assignments?.filter(
          (ta: any) => ta.tasks?.status === 'COMPLETED'
        ).length || 0

        // Calculate points based on completed tasks (50 points per task)
        // Add any existing points from gamification profile
        const basePoints = user.gamification_profiles?.points || 0
        const taskPoints = actualCompletedTasks * 50
        const totalPoints = basePoints + taskPoints

        // Calculate average performance score from recent metrics (last 30 days)
        const avgPerformanceScore = user.performance_metrics?.length > 0
          ? Math.round(
              user.performance_metrics.reduce((sum: number, m: any) => sum + (m.productivityScore || 0), 0) /
              user.performance_metrics.length
            )
          : 0

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          points: user.gamification_profiles?.points || 0,
          level: user.gamification_profiles?.level || 1,
          tasksCompleted: user.gamification_profiles?.tasksCompleted || 0,
          performanceScore: user.gamification_profiles?.performanceScore || 0,
          reviewRating: Number(avgReviewScore.toFixed(1)),
          streakDays: user.gamification_profiles?.streak || 0,
          badges: [],
          rankChange: 0,
        }
      })
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({ ...user, rank: index + 1 }))

    // Find current user's StaffUser record
    let currentUser = null
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })
    
    // Find current user in rankings using staff user ID
    if (staffUser) {
      currentUser = rankings.find((user) => user.id === staffUser.id) || null
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

