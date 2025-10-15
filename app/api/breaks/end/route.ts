import { NextRequest, NextResponse } from "next/server"
import { getStaffUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// POST /api/breaks/end - End the active break
export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()
    if (!staffUser) {
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
    
    if (!breakRecord || breakRecord.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Invalid break" }, { status: 403 })
    }

    const endTime = new Date()
    const startTime = activeBreak.actualStart || new Date()
    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000 / 60
    ) // in minutes

    if (breakRecord.actualEnd) {
      return NextResponse.json({ error: "Break already ended" }, { status: 400 })
    }
    
    const now = new Date()
    const startTime = breakRecord.actualStart
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 60000)
    
    let isLate = false
    let lateBy = 0
    
    // Check if returned late from scheduled break
    if (breakRecord.scheduledEnd) {
      const [time, period] = breakRecord.scheduledEnd.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      const expectedEnd = new Date(now)
      expectedEnd.setHours(hour, parseInt(minutes), 0, 0)
      
      if (now > expectedEnd) {
        isLate = true
        lateBy = Math.floor((now.getTime() - expectedEnd.getTime()) / 60000)
      }
    }
    
    const updatedBreak = await prisma.break.update({
      where: { id: activeBreak.id },
      data: {
        actualEnd: endTime,
        duration,
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

