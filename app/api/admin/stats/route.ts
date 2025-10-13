// Admin API - Dashboard Statistics
// GET: Aggregate statistics for admin dashboard

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getNextReviewDue } from "@/lib/review-schedule"

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Authentication check - ADMIN only
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    // Run all queries in parallel for performance
    const [
      totalStaff,
      allProfiles,
      activeClients,
      activeAssignments,
      openTickets,
      allTickets,
      staffClockedIn,
      recentMetrics,
    ] = await Promise.all([
      // Total staff count
      prisma.user.count({
        where: { 
          role: { in: ["STAFF", "TEAM_LEAD", "MANAGER"] }
        }
      }),
      
      // All profiles (for employment status breakdown)
      prisma.profile.findMany({
        where: {
          user: {
            role: { in: ["STAFF", "TEAM_LEAD", "MANAGER"] }
          }
        },
        select: {
          employmentStatus: true
        }
      }),
      
      // Active clients
      prisma.client.count(),
      
      // Active assignments with reviews
      prisma.staffAssignment.findMany({
        where: { isActive: true },
        include: {
          user: {
            include: {
              reviewsReceived: true
            }
          }
        }
      }),
      
      // Open tickets
      prisma.ticket.count({
        where: { 
          status: { in: ["OPEN", "IN_PROGRESS"] }
        }
      }),
      
      // All tickets (for priority breakdown)
      prisma.ticket.findMany({
        where: {
          status: { in: ["OPEN", "IN_PROGRESS"] }
        },
        select: {
          priority: true
        }
      }),
      
      // Staff currently clocked in
      prisma.timeEntry.count({
        where: { clockOut: null }
      }),
      
      // Recent performance metrics (last 30 days)
      prisma.performanceMetric.findMany({
        where: {
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          productivityScore: true
        }
      }),
    ])

    // Calculate employment status breakdown
    const regularStaff = allProfiles.filter(p => p.employmentStatus === "REGULAR").length
    const probationStaff = allProfiles.filter(p => p.employmentStatus === "PROBATION").length

    // Calculate pending reviews using review scheduling logic
    let pendingReviews = 0
    const reviewBreakdown = {
      month1: 0,
      month3: 0,
      month5: 0,
      recurring: 0
    }

    for (const assignment of activeAssignments) {
      const nextReview = getNextReviewDue(
        assignment.startDate,
        assignment.user.reviewsReceived
      )

      if (nextReview && (nextReview.isOverdue || nextReview.daysUntilDue <= 30)) {
        pendingReviews++
        
        // Count by type
        if (nextReview.type === "MONTH_1") reviewBreakdown.month1++
        else if (nextReview.type === "MONTH_3") reviewBreakdown.month3++
        else if (nextReview.type === "MONTH_5") reviewBreakdown.month5++
        else if (nextReview.type === "RECURRING_6M") reviewBreakdown.recurring++
      }
    }

    // Calculate ticket priority breakdown
    const ticketPriority = {
      low: allTickets.filter(t => t.priority === "LOW").length,
      medium: allTickets.filter(t => t.priority === "MEDIUM").length,
      high: allTickets.filter(t => t.priority === "HIGH").length,
      urgent: allTickets.filter(t => t.priority === "URGENT").length,
    }

    // Calculate average productivity
    let avgProductivity = 0
    if (recentMetrics.length > 0) {
      const sum = recentMetrics.reduce((acc, m) => acc + (m.productivityScore || 0), 0)
      avgProductivity = Math.round(sum / recentMetrics.length)
    }

    // Return statistics
    return NextResponse.json({
      success: true,
      stats: {
        totalStaff,
        regularStaff,
        probationStaff,
        activeClients,
        pendingReviews,
        reviewBreakdown,
        openTickets,
        ticketPriority,
        staffClockedIn,
        avgProductivity,
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        activeAssignments: activeAssignments.length,
        metricsDataPoints: recentMetrics.length,
      }
    })

  } catch (error) {
    console.error("Error fetching dashboard statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}

