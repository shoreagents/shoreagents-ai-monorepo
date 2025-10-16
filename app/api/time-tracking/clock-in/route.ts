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

    const now = new Date()
    
    // Calculate time ranges once
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)
    const today = now.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Get profile ID first (staffUser already includes profile from getStaffUser)
    const profileId = staffUser.profile?.id
    
    // Run all checks in parallel to speed up the process
    const [activeEntry, todaysEntries, workSchedule] = await Promise.all([
      // Check if user is already clocked in
      prisma.timeEntry.findFirst({
        where: {
          staffUserId: staffUser.id,
          clockOut: null,
        },
      }),
      // Get all today's entries including breaks
      prisma.timeEntry.findMany({
        where: {
          staffUserId: staffUser.id,
          clockIn: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        select: { 
          id: true,
          breaks: {
            select: { id: true }
          }
        }
      }),
      // Get today's work schedule (use profileId directly to avoid JOIN)
      profileId ? prisma.workSchedule.findFirst({
        where: {
          profileId: profileId,
          dayOfWeek: today
        },
        select: {
          startTime: true,
          endTime: true
        }
      }) : null
    ])

    if (activeEntry) {
      return NextResponse.json(
        { error: "You are already clocked in", activeEntry },
        { status: 400 }
      )
    }
    
    if (todaysEntries.length > 0) {
      return NextResponse.json(
        { error: "You have already clocked in today. Only one session per day is allowed." },
        { status: 400 }
      )
    }
    
    let wasLate = false
    let lateBy = 0
    let expectedClockIn = null
    
    // Check if work schedule exists and has a valid startTime
    if (workSchedule && workSchedule.startTime && workSchedule.startTime.trim() !== '') {
      try {
        // Parse shift start time (e.g., "09:00 AM" or "9:00 AM")
        const timeStr = workSchedule.startTime.trim()
        const parts = timeStr.split(' ')
        
        if (parts.length >= 2) {
          const time = parts[0]
          const period = parts[1].toUpperCase()
          const [hours, minutes] = time.split(':')
          
          let hour = parseInt(hours)
          const minute = parseInt(minutes || '0')
          
          // Convert to 24-hour format
          if (period === 'PM' && hour !== 12) {
            hour += 12
          } else if (period === 'AM' && hour === 12) {
            hour = 0
          }
          
          // Create expected clock-in time
          expectedClockIn = new Date(now)
          expectedClockIn.setHours(hour, minute, 0, 0)
          
          // Check if user is late
          if (now > expectedClockIn) {
            wasLate = true
            lateBy = Math.floor((now.getTime() - expectedClockIn.getTime()) / 60000)
          }
        }
      } catch (error) {
        console.error('[Clock-In] Error parsing start time:', workSchedule.startTime, error)
        // If parsing fails, don't mark as late
        wasLate = false
        lateBy = 0
        expectedClockIn = null
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
    
    // Check if any breaks exist for today (we already fetched this data above)
    const existingBreaksToday = todaysEntries.some(entry => entry.breaks && entry.breaks.length > 0)
    
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



