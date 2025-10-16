import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Clock-in API called")
    const staffUser = await getStaffUser()
    console.log("👤 Staff user:", staffUser ? "Found" : "Not found")

    if (!staffUser) {
      console.log("❌ Unauthorized - no staff user found")
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

    const now = new Date()
    
    // Check if user already clocked in today (prevent multiple clock-ins per day)
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)
    
    const todaysEntry = await prisma.timeEntry.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockIn: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })
    
    if (todaysEntry) {
      return NextResponse.json(
        { error: "You have already clocked in today. Only one session per day is allowed." },
        { status: 400 }
      )
    }
    
    // Get today's work schedule
    const today = now.toLocaleDateString('en-US', { weekday: 'long' })
    const workSchedule = await prisma.workSchedule.findFirst({
      where: {
        profile: { staffUserId: staffUser.id },
        dayOfWeek: today
      },
      include: { profile: true }
    })
    
    let wasLate = false
    let lateBy = 0
    let expectedClockIn = null
    
    if (workSchedule && workSchedule.startTime) {
      // Parse shift start time (e.g., "09:00 AM")
      const [time, period] = workSchedule.startTime.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      expectedClockIn = new Date(now)
      expectedClockIn.setHours(hour, parseInt(minutes), 0, 0)
      
      if (now > expectedClockIn) {
        wasLate = true
        lateBy = Math.floor((now.getTime() - expectedClockIn.getTime()) / 60000)
      }
    }

    // Create new time entry with shift tracking
    const timeEntry = await prisma.timeEntry.create({
      data: {
        staffUserId: staffUser.id,
        clockIn: now,
        expectedClockIn,
        wasLate,
        lateBy
      },
    })
    
    // Check if breaks have already been scheduled for TODAY
    // Check ALL time entries from today (including the one we just created)
    const allTodaysTimeEntries = await prisma.timeEntry.findMany({
      where: {
        staffUserId: staffUser.id,
        clockIn: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: { id: true }
    })
    
    // Check if any breaks exist for today's time entries
    const existingBreaksToday = allTodaysTimeEntries.length > 0 
      ? await prisma.break.findFirst({
          where: {
            timeEntryId: {
              in: allTodaysTimeEntries.map(te => te.id)
            }
          }
        })
      : null
    
    // Only show break scheduler if no breaks have been scheduled today at all
    const shouldShowBreakScheduler = !existingBreaksToday
    
    console.log(`[Clock-In] Breaks today: ${existingBreaksToday ? 'YES' : 'NO'}, Show scheduler: ${shouldShowBreakScheduler}`)

    return NextResponse.json({
      success: true,
      timeEntry: {
        ...timeEntry,
        breaksScheduled: !!existingBreaksToday // Mark as scheduled if breaks exist today
      },
      wasLate,
      lateBy,
      showBreakScheduler: shouldShowBreakScheduler,
      message: wasLate 
        ? `Clocked in ${lateBy} minutes late`
        : "Clocked in successfully",
    })
  } catch (error) {
    console.error("Error clocking in:", error)
    return NextResponse.json({ error: "Failed to clock in" }, { status: 500 })
  }
}



