import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"
import { logClockedOut } from "@/lib/activity-generator"

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()

    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reason, notes } = body

    if (!reason) {
      return NextResponse.json({ error: "Clock-out reason is required" }, { status: 400 })
    }

    // Find active time entry with breaks in one query
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockOut: null,
      },
      include: {
        breaks: true
      }
    })

    if (!activeEntry) {
      return NextResponse.json(
        { error: "You are not currently clocked in" },
        { status: 400 }
      )
    }

    // Check for active breaks (breaks that have been STARTED but not ended)
    const activeBreak = activeEntry.breaks.find(b => b.actualStart && !b.actualEnd)
    
    if (activeBreak) {
      return NextResponse.json({ 
        error: "Please end your active break before clocking out" 
      }, { status: 400 })
    }

    const clockOut = new Date()
    const totalHours = (clockOut.getTime() - activeEntry.clockIn.getTime()) / (1000 * 60 * 60)
    
    // Calculate break time from the breaks we already fetched
    const breaks = activeEntry.breaks
    const totalBreakTime = breaks.reduce((sum, b) => sum + (b.duration || 0), 0) / 60
    const netWorkHours = totalHours - totalBreakTime

    // Update time entry
    const timeEntry = await prisma.timeEntry.update({
      where: {
        id: activeEntry.id,
      },
      data: {
        clockOut,
        totalHours: Number(netWorkHours.toFixed(2)),
        clockOutReason: reason,
        notes: notes || null,
      },
    })

    // ✨ Auto-generate activity post
    await logClockedOut(staffUser.id, staffUser.name, netWorkHours)

    return NextResponse.json({
      success: true,
      timeEntry,
      totalHours: netWorkHours.toFixed(2),
      breakTime: totalBreakTime.toFixed(2),
      message: `Clocked out successfully. Net work hours: ${netWorkHours.toFixed(2)}`,
    })
  } catch (error) {
    console.error("Error clocking out:", error)
    return NextResponse.json({ error: "Failed to clock out" }, { status: 500 })
  }
}



