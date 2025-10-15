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

    const { breakId } = await request.json()
    
    const breakRecord = await prisma.break.findUnique({
      where: { id: breakId }
    })
    
    if (!breakRecord || breakRecord.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Invalid break" }, { status: 403 })
    }

    if (!breakRecord.actualStart) {
      return NextResponse.json({ error: "Break not started yet" }, { status: 400 })
    }

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
      where: { id: breakRecord.id },
      data: { 
        actualEnd: now, 
        duration,
        isLate,
        lateBy
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      break: updatedBreak, 
      isLate, 
      lateBy,
      message: isLate 
        ? `Break ended. You returned ${lateBy} minutes late.`
        : "Break ended. Welcome back!"
    })
  } catch (error) {
    console.error("Error ending break:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

