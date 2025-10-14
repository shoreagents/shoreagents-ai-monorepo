import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/breaks/[id] - End a break
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: breakId } = await params

    // Get staff user first
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Find the break
    const existingBreak = await prisma.break.findUnique({
      where: { id: breakId },
    })

    if (!existingBreak) {
      return NextResponse.json({ error: "Break not found" }, { status: 404 })
    }

    if (existingBreak.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (existingBreak.actualEnd) {
      return NextResponse.json(
        { error: "Break already ended" },
        { status: 400 }
      )
    }

    const endTime = new Date()
    const startTime = existingBreak.actualStart || new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000) // minutes

    // Update the break with end time and duration
    const updatedBreak = await prisma.break.update({
      where: { id: breakId },
      data: {
        actualEnd: endTime,
        duration,
      },
    })

    return NextResponse.json({
      success: true,
      break: {
        id: updatedBreak.id,
        type: updatedBreak.type,
        startTime: updatedBreak.actualStart?.toISOString() || "",
        endTime: updatedBreak.actualEnd?.toISOString() || null,
        duration: updatedBreak.duration,
        reason: updatedBreak.awayReason,
        date: updatedBreak.actualStart?.toISOString().split("T")[0] || "",
      },
    })
  } catch (error) {
    console.error("Error ending break:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

