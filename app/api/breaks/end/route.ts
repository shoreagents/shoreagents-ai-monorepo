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

    // Get the StaffUser record using authUserId
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Find active break
    const activeBreak = await prisma.break.findFirst({
      where: {
        staffUserId: staffUser.id,
        actualEnd: null,
      },
    })

    if (!activeBreak) {
      return NextResponse.json(
        { error: "No active break found" },
        { status: 400 }
      )
    }

    const endTime = new Date()
    const startTime = activeBreak.actualStart || new Date()
    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000 / 60
    ) // in minutes

    const updatedBreak = await prisma.break.update({
      where: { id: activeBreak.id },
      data: {
        actualEnd: endTime,
        duration,
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

