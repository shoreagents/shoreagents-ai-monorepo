import { NextRequest, NextResponse } from "next/server"
import { getStaffUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// Global declaration for socket server
declare global {
  var socketServer: any
}

// PATCH /api/breaks/[id]/resume - Resume a break
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staffUser = await getStaffUser()
    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: breakId } = await params

    // Find the break
    const existingBreak = await prisma.break.findUnique({
      where: { id: breakId }
    })

    if (!existingBreak) {
      return NextResponse.json({ error: "Break not found" }, { status: 404 })
    }

    if (existingBreak.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (existingBreak.actualEnd) {
      return NextResponse.json({ error: "Break already ended" }, { status: 400 })
    }

    if (!existingBreak.ispaused) {
      return NextResponse.json({ error: "Break is not paused" }, { status: 400 })
    }

    // Calculate new remaining time after pause period
    const now = new Date()
    const pauseDuration = existingBreak.pausedat 
      ? Math.floor((now.getTime() - existingBreak.pausedat.getTime()) / 1000) // seconds
      : 0

    // Calculate new remaining time (subtract pause duration from remaining time)
    const newRemainingTime = Math.max(0, (existingBreak.pausedduration || 0) - pauseDuration)

    // Resume the break
    const updatedBreak = await prisma.break.update({
      where: { id: breakId },
      data: {
        ispaused: false,
        pausedat: null,
        pausedduration: newRemainingTime // Store the updated remaining time
      }
    })

    // Emit WebSocket event for real-time updates
    const io = global.socketServer
    if (io) {
      io.to(`user:${staffUser.authUserId}`).emit('break:resumed', {
        break: updatedBreak,
        message: "Break resumed successfully"
      })
      console.log('📡 [WebSocket] Break resumed event emitted for user:', staffUser.authUserId)
    }

    return NextResponse.json({
      success: true,
      break: updatedBreak,
      message: "Break resumed successfully"
    })
  } catch (error) {
    console.error("Error resuming break:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
