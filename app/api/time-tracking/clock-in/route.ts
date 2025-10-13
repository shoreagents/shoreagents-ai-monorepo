import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // TODO: Get userId from session
    const userId = "c463d406-e524-4ef6-8ab5-29db543d4cb6" // Maria Santos

    // Check if user is already clocked in
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
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
        userId,
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



