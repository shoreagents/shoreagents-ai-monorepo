import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session
    const userId = "c463d406-e524-4ef6-8ab5-29db543d4cb6" // Maria Santos

    // Find active time entry
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
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



