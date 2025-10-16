import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

// GET - Fetch time entries for current staff user only
export async function GET(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()

    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = { staffUserId: staffUser.id }

    if (startDate && endDate) {
      where.clockIn = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      orderBy: {
        clockIn: "desc",
      },
    })

    // Calculate total hours for the period
    const totalHours = entries
      .filter((e) => e.totalHours)
      .reduce((sum, e) => sum + Number(e.totalHours), 0)

    // Calculate stats (today, this week, this month)
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const startOfMonth = new Date(now)
    startOfMonth.setDate(now.getDate() - 30)
    startOfMonth.setHours(0, 0, 0, 0)

    // Calculate today's hours (including active session)
    let todayHours = 0
    entries.forEach((entry) => {
      const clockIn = new Date(entry.clockIn)
      if (clockIn >= startOfToday) {
        if (entry.totalHours) {
          // Completed entry
          todayHours += Number(entry.totalHours)
        } else if (!entry.clockOut) {
          // Active entry - calculate current hours
          const currentMinutes = (now.getTime() - clockIn.getTime()) / (1000 * 60)
          todayHours += currentMinutes / 60
        }
      }
    })

    // Calculate this week's hours
    let weekHours = 0
    entries.forEach((entry) => {
      const clockIn = new Date(entry.clockIn)
      if (clockIn >= startOfWeek) {
        if (entry.totalHours) {
          weekHours += Number(entry.totalHours)
        } else if (!entry.clockOut) {
          const currentMinutes = (now.getTime() - clockIn.getTime()) / (1000 * 60)
          weekHours += currentMinutes / 60
        }
      }
    })

    // Calculate this month's hours
    let monthHours = 0
    entries.forEach((entry) => {
      const clockIn = new Date(entry.clockIn)
      if (clockIn >= startOfMonth) {
        if (entry.totalHours) {
          monthHours += Number(entry.totalHours)
        } else if (!entry.clockOut) {
          const currentMinutes = (now.getTime() - clockIn.getTime()) / (1000 * 60)
          monthHours += currentMinutes / 60
        }
      }
    })

    return NextResponse.json({
      entries,
      totalHours: totalHours.toFixed(2),
      count: entries.length,
      stats: {
        today: parseFloat(todayHours.toFixed(1)),
        week: parseFloat(weekHours.toFixed(1)),
        month: parseFloat(monthHours.toFixed(1))
      }
    })
  } catch (error) {
    console.error("Error fetching time entries:", error)
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 })
  }
}



