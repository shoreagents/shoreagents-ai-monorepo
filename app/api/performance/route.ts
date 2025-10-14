import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/performance - Get performance metrics for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user first
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

    // Format metrics for frontend
    const formattedMetrics = metrics.map((m) => ({
      id: m.id,
      date: m.date.toISOString(),
      mouseMovements: m.mouseMovements,
      mouseClicks: m.mouseClicks,
      keystrokes: m.keystrokes,
      activeTime: m.activeTime,
      idleTime: m.idleTime,
      screenTime: m.screenTime,
      downloads: m.downloads,
      uploads: m.uploads,
      bandwidth: m.bandwidth,
      clipboardActions: m.clipboardActions,
      filesAccessed: m.filesAccessed,
      urlsVisited: m.urlsVisited,
      tabsSwitched: m.tabsSwitched,
      productivityScore: m.productivityScore,
      screenshotCount: 0, // Not in schema, set to 0
      applicationsUsed: [], // Not in schema, set to empty array
    }))

    const formattedToday = todayMetric
      ? {
          id: todayMetric.id,
          date: todayMetric.date.toISOString(),
          mouseMovements: todayMetric.mouseMovements,
          mouseClicks: todayMetric.mouseClicks,
          keystrokes: todayMetric.keystrokes,
          activeTime: todayMetric.activeTime,
          idleTime: todayMetric.idleTime,
          screenTime: todayMetric.screenTime,
          downloads: todayMetric.downloads,
          uploads: todayMetric.uploads,
          bandwidth: todayMetric.bandwidth,
          clipboardActions: todayMetric.clipboardActions,
          filesAccessed: todayMetric.filesAccessed,
          urlsVisited: todayMetric.urlsVisited,
          tabsSwitched: todayMetric.tabsSwitched,
          productivityScore: todayMetric.productivityScore,
          screenshotCount: 0,
          applicationsUsed: [],
        }
      : null

    return NextResponse.json({
      metrics: formattedMetrics,
      today: formattedToday,
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

    // Get staff user first
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
          clipboardActions: clipboardActions ?? existingMetric.clipboardActions,
          filesAccessed: filesAccessed ?? existingMetric.filesAccessed,
          urlsVisited: urlsVisited ?? existingMetric.urlsVisited,
          tabsSwitched: tabsSwitched ?? existingMetric.tabsSwitched,
          productivityScore: productivityScore ?? existingMetric.productivityScore,
        },
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
        },
      })
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
