import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/breaks/end - End the active break
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find active break
    const activeBreak = await prisma.break.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
    })

    if (!activeBreak) {
      return NextResponse.json(
        { error: "No active break found" },
        { status: 400 }
      )
    }

    const endTime = new Date()
    const actualDuration = Math.floor(
      (endTime.getTime() - activeBreak.startTime.getTime()) / 1000 / 60
    ) // in minutes

    const updatedBreak = await prisma.break.update({
      where: { id: activeBreak.id },
      data: {
        endTime,
        actualDuration,
      },
    })

    return NextResponse.json({ success: true, break: updatedBreak })
  } catch (error) {
    console.error("Error ending break:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

