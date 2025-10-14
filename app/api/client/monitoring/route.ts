import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/monitoring - Get performance metrics for all assigned staff
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user and their organization
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Get all staff assigned to this company
    const staffUsers = await prisma.staffUser.findMany({
      where: { companyId: clientUser.company.id },
      select: { id: true }
    })
    
    const staffIds = staffUsers.map(s => s.id)

    if (staffIds.length === 0) {
      return NextResponse.json({ 
        staff: [],
        summary: {
          totalStaff: 0,
          activeStaff: 0,
          averageProductivity: 0
        }
      })
    }

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch all staff with their user info and today's performance metrics
    const staffMembers = await prisma.staffUser.findMany({
      where: {
        id: { in: staffIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        profile: {
          select: {
            currentRole: true,
            location: true
          }
        },
        company: {
          select: {
            companyName: true
          }
        }
      }
    })

    // Fetch today's performance metrics for all staff
    const performanceMetrics = await prisma.performanceMetric.findMany({
      where: {
        staffUserId: { in: staffIds },
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    // Create a map of staffUserId -> performance metrics
    const metricsMap = new Map()
    performanceMetrics.forEach(metric => {
      metricsMap.set(metric.staffUserId, metric)
    })

    // Calculate productivity score
    const calculateProductivityScore = (metric: any) => {
      if (!metric) return 0
      const totalTime = metric.activeTime + metric.idleTime
      if (totalTime === 0) return 0
      
      const activePercent = (metric.activeTime / totalTime) * 100
      const keystrokesScore = Math.min((metric.keystrokes / 5000) * 100, 100)
      const clicksScore = Math.min((metric.mouseClicks / 1000) * 100, 100)
      
      return Math.round((activePercent + keystrokesScore + clicksScore) / 3)
    }

    // Combine staff data with their metrics
    const staffWithMetrics = staffMembers.map(staff => {
      const metrics = metricsMap.get(staff.id)
      const productivityScore = calculateProductivityScore(metrics)
      
      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        avatar: staff.avatar,
        position: staff.profile?.currentRole || 'Staff Member',
        department: staff.company?.companyName || staff.profile?.location || 'General',
        metrics: metrics ? {
          mouseMovements: metrics.mouseMovements,
          mouseClicks: metrics.mouseClicks,
          keystrokes: metrics.keystrokes,
          activeTime: metrics.activeTime,
          idleTime: metrics.idleTime,
          screenTime: metrics.screenTime,
          downloads: metrics.downloads,
          uploads: metrics.uploads,
          bandwidth: metrics.bandwidth,
          clipboardActions: metrics.clipboardActions,
          filesAccessed: metrics.filesAccessed,
          urlsVisited: metrics.urlsVisited,
          tabsSwitched: metrics.tabsSwitched,
          productivityScore: metrics.productivityScore || productivityScore
        } : null,
        productivityScore,
        isActive: metrics && metrics.activeTime > 0
      }
    })

    // Calculate summary stats
    const activeStaff = staffWithMetrics.filter(s => s.isActive).length
    const totalProductivity = staffWithMetrics.reduce((sum, s) => sum + s.productivityScore, 0)
    const averageProductivity = staffWithMetrics.length > 0 
      ? Math.round(totalProductivity / staffWithMetrics.length) 
      : 0

    return NextResponse.json({
      staff: staffWithMetrics,
      summary: {
        totalStaff: staffMembers.length,
        activeStaff,
        averageProductivity
      }
    })
  } catch (error) {
    console.error("Error fetching client monitoring data:", error)
    return NextResponse.json(
      { error: "Failed to fetch monitoring data" },
      { status: 500 }
    )
  }
}

