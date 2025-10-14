import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()

    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is already clocked in
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockOut: null,
      },
    })

    if (activeEntry) {
      return NextResponse.json(
        { error: "You are already clocked in", activeEntry },
        { status: 400 }
      )
    }

    // Create new time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        staffUserId: staffUser.id,
        clockIn: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      timeEntry,
      message: "Clocked in successfully",
    })
  } catch (error) {
    console.error("Error clocking in:", error)
    return NextResponse.json({ error: "Failed to clock in" }, { status: 500 })
  }
}



