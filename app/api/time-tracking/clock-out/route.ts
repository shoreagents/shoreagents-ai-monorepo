import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()

    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notes } = body

    // Find active time entry
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockOut: null,
      },
    })

    if (!activeEntry) {
      return NextResponse.json(
        { error: "You are not currently clocked in" },
        { status: 400 }
      )
    }

    const clockOut = new Date()
    const clockIn = new Date(activeEntry.clockIn)
    const diffMs = clockOut.getTime() - clockIn.getTime()
    const totalHours = diffMs / (1000 * 60 * 60) // Convert to hours

    // Update time entry
    const timeEntry = await prisma.timeEntry.update({
      where: {
        id: activeEntry.id,
      },
      data: {
        clockOut,
        totalHours: Number(totalHours.toFixed(2)),
        notes: notes || null,
      },
    })

    return NextResponse.json({
      success: true,
      timeEntry,
      message: `Clocked out successfully. Total hours: ${totalHours.toFixed(2)}`,
    })
  } catch (error) {
    console.error("Error clocking out:", error)
    return NextResponse.json({ error: "Failed to clock out" }, { status: 500 })
  }
}



