import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()

    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find active time entry
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockOut: null,
      },
    })

    if (activeEntry) {
      const clockIn = new Date(activeEntry.clockIn)
      const now = new Date()
      const diffMs = now.getTime() - clockIn.getTime()
      const hoursElapsed = (diffMs / (1000 * 60 * 60)).toFixed(2)

      return NextResponse.json({
        isClockedIn: true,
        activeEntry,
        clockedInAt: activeEntry.clockIn,
        hoursElapsed,
      })
    }

    return NextResponse.json({
      isClockedIn: false,
      activeEntry: null,
    })
  } catch (error) {
    console.error("Error getting clock status:", error)
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 })
  }
}



