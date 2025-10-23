import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Function to emit performance updates (will be set by server.js)
declare global {
  var emitPerformanceUpdate: ((data: any) => void) | undefined
}

// GET /api/performance - Get performance metrics for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the StaffUser record using authUserId
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Get metrics for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const metrics = await prisma.performanceMetric.findMany({
      where: {
        staffUserId: staffUser.id,
        date: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { date: "desc" },
    })

    // Get today's metrics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayMetric = await prisma.performanceMetric.findFirst({
      where: {
        staffUserId: staffUser.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // Calculate total screenshot count (sum of all clipboardActions)
    const allMetrics = await prisma.performanceMetric.findMany({
      where: {
        staffUserId: staffUser.id
      },
      select: {
        clipboardActions: true
      }
    })
    const totalScreenshotCount = allMetrics.reduce((sum, m) => sum + m.clipboardActions, 0)

    // Format metrics for frontend (convert minutes to seconds for consistent display)
    const formattedMetrics = metrics.map((m) => ({
      id: m.id,
      date: m.date.toISOString(),
      mouseMovements: m.mouseMovements,
      mouseClicks: m.mouseClicks,
      keystrokes: m.keystrokes,
      activeTime: m.activeTime * 60, // Convert minutes to seconds
      idleTime: m.idleTime * 60, // Convert minutes to seconds
      screenTime: m.screenTime * 60, // Convert minutes to seconds
      downloads: m.downloads,
      uploads: m.uploads,
      bandwidth: m.bandwidth,
      clipboardActions: m.clipboardActions,
      filesAccessed: m.filesAccessed,
      urlsVisited: m.urlsVisited,
      tabsSwitched: m.tabsSwitched,
      productivityScore: m.productivityScore,
      screenshotCount: m.clipboardActions, // Use clipboardActions as screenshot count
      applicationsUsed: (m as any).applicationsUsed || [], // Get from database
      visitedUrls: (m as any).visitedUrls || [], // Get from database
    }))

    const formattedToday = todayMetric
      ? {
          id: todayMetric.id,
          date: todayMetric.date.toISOString(),
          mouseMovements: todayMetric.mouseMovements,
          mouseClicks: todayMetric.mouseClicks,
          keystrokes: todayMetric.keystrokes,
          activeTime: todayMetric.activeTime * 60, // Convert minutes to seconds
          idleTime: todayMetric.idleTime * 60, // Convert minutes to seconds
          screenTime: todayMetric.screenTime * 60, // Convert minutes to seconds
          downloads: todayMetric.downloads,
          uploads: todayMetric.uploads,
          bandwidth: todayMetric.bandwidth,
          clipboardActions: todayMetric.clipboardActions,
          filesAccessed: todayMetric.filesAccessed,
          urlsVisited: todayMetric.urlsVisited,
          tabsSwitched: todayMetric.tabsSwitched,
          productivityScore: todayMetric.productivityScore,
          screenshotCount: todayMetric.clipboardActions, // Use clipboardActions as screenshot count
          applicationsUsed: (todayMetric as any).applicationsUsed || [], // Get from database
          visitedUrls: (todayMetric as any).visitedUrls || [], // Get from database
        }
      : null

    return NextResponse.json({
      metrics: formattedMetrics,
      today: formattedToday,
      totalScreenshots: totalScreenshotCount,
    })
  } catch (error) {
    console.error("Error fetching performance metrics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/performance - Log new performance metric
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the StaffUser record using authUserId
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      mouseMovements,
      mouseClicks,
      keystrokes,
      activeTime,
      idleTime,
      screenTime,
      downloads,
      uploads,
      bandwidth,
      clipboardActions,
      filesAccessed,
      urlsVisited,
      tabsSwitched,
      productivityScore,
      applicationsUsed,
      visitedUrls,
    } = body

    // Check if there's already a metric for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingMetric = await prisma.performanceMetric.findFirst({
      where: {
        staffUserId: staffUser.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    let metric

    if (existingMetric) {
      // Update existing metric
      metric = await prisma.performanceMetric.update({
        where: { id: existingMetric.id },
        data: {
          mouseMovements: mouseMovements ?? existingMetric.mouseMovements,
          mouseClicks: mouseClicks ?? existingMetric.mouseClicks,
          keystrokes: keystrokes ?? existingMetric.keystrokes,
          activeTime: activeTime ?? existingMetric.activeTime,
          idleTime: idleTime ?? existingMetric.idleTime,
          screenTime: screenTime ?? existingMetric.screenTime,
          downloads: downloads ?? existingMetric.downloads,
          uploads: uploads ?? existingMetric.uploads,
          bandwidth: bandwidth ?? existingMetric.bandwidth,
          // NEVER overwrite clipboardActions from sync - it's managed by screenshot service
          clipboardActions: existingMetric.clipboardActions,
          filesAccessed: filesAccessed ?? existingMetric.filesAccessed,
          urlsVisited: urlsVisited ?? existingMetric.urlsVisited,
          tabsSwitched: tabsSwitched ?? existingMetric.tabsSwitched,
          productivityScore: productivityScore ?? existingMetric.productivityScore,
          ...(applicationsUsed !== undefined && { applicationsUsed }),
          ...(visitedUrls !== undefined && { visitedUrls }),
        } as any,
      })
    } else {
      // Create new metric
      metric = await prisma.performanceMetric.create({
        data: {
          staffUserId: staffUser.id,
          mouseMovements: mouseMovements || 0,
          mouseClicks: mouseClicks || 0,
          keystrokes: keystrokes || 0,
          activeTime: activeTime || 0,
          idleTime: idleTime || 0,
          screenTime: screenTime || 0,
          downloads: downloads || 0,
          uploads: uploads || 0,
          bandwidth: bandwidth || 0,
          clipboardActions: clipboardActions || 0,
          filesAccessed: filesAccessed || 0,
          urlsVisited: urlsVisited || 0,
          tabsSwitched: tabsSwitched || 0,
          productivityScore: productivityScore || 0,
          applicationsUsed: applicationsUsed || [],
          visitedUrls: visitedUrls || [],
        } as any,
      })
    }

    // Emit real-time update to monitoring clients
    if (global.emitPerformanceUpdate) {
      try {
        global.emitPerformanceUpdate({
          staffUserId: staffUser.id,
          type: 'latest',
          metrics: metric,
          isActive: true,
          lastActivity: new Date().toISOString()
        })
        console.log('[Performance API] Emitted real-time update for staff user:', staffUser.id)
      } catch (wsError) {
        console.error('[Performance API] Error emitting real-time update:', wsError)
      }
    }

    return NextResponse.json({ success: true, metric }, { status: 201 })
  } catch (error) {
    console.error("Error logging performance metric:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}