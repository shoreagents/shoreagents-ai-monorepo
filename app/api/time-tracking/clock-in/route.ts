import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"
import { logClockedIn } from "@/lib/activity-generator"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Clock-in API called")
    const staffUser = await getStaffUser()
    console.log("👤 Staff user:", staffUser ? "Found" : "Not found")

    if (!staffUser) {
      console.log("❌ Unauthorized - no staff user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 🌏 GET STAFF TIMEZONE (Philippines = Asia/Manila)
    const staffTimezone = staffUser.staff_profiles?.timezone || 'Asia/Manila'
    console.log(`🌏 Staff timezone: ${staffTimezone}`)
    
    // 🕐 CALCULATE "NOW" IN STAFF'S TIMEZONE
    const now = new Date()
    const staffLocalTime = new Date(now.toLocaleString('en-US', { timeZone: staffTimezone }))
    console.log(`🕐 UTC now: ${now.toISOString()}`)
    console.log(`🕐 Staff local time: ${staffLocalTime.toISOString()} (${staffTimezone})`)
    
    // Calculate time ranges in STAFF'S timezone
    const startOfDay = new Date(staffLocalTime)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(staffLocalTime)
    endOfDay.setHours(23, 59, 59, 999)
    const today = staffLocalTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: staffTimezone })
    
    console.log(`📅 Today (${staffTimezone}): ${today}`)
    
    // Get profile ID first (staffUser already includes staff_profiles from getStaffUser)
    const profileId = staffUser.staff_profiles?.id
    
    // Run all checks in parallel to speed up the process
    const [activeEntry, todaysEntries, workSchedule] = await Promise.all([
      // Check if user is already clocked in
      prisma.time_entries.findFirst({
        where: {
          staffUserId: staffUser.id,
          clockOut: null,
        },
      }),
      // Get all today's entries including breaks
      prisma.time_entries.findMany({
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
      // Get today's work schedule (use profileId directly to avoid JOIN) - FULL record including ID!
      profileId ? prisma.work_schedules.findFirst({
        where: {
          profileId: profileId,
          dayOfWeek: today
        },
        select: {
          id: true,           // ← NEED THIS to save relationship!
          dayOfWeek: true,    // ← NEED THIS for shift date calculation!
          startTime: true,
          endTime: true
        }
      }) : null
    ])

    // 🔥 CALCULATE SHIFT DATE (Work Schedules = KING)
    // This determines which date the shift belongs to (handles night shifts crossing midnight)
    // Use STAFF'S LOCAL TIME (not UTC)
    let shiftDate: Date = new Date(staffLocalTime)
    shiftDate.setHours(0, 0, 0, 0)

    if (workSchedule && workSchedule.dayOfWeek) {
      // Get the scheduled day name (e.g. "Thursday")
      const scheduledDay = workSchedule.dayOfWeek
      
      // Find the most recent occurrence of that day
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const scheduledDayIndex = daysOfWeek.indexOf(scheduledDay)
      const todayIndex = daysOfWeek.indexOf(today)
      
      if (scheduledDayIndex !== -1 && todayIndex !== -1) {
        // Calculate days difference
        let daysDiff = todayIndex - scheduledDayIndex
        
        // If clocking in after midnight for a previous day's shift
        if (daysDiff > 0 && daysDiff <= 1) {
          // They might be late for yesterday's shift
          // Check if their shift start time was yesterday
          if (workSchedule.startTime && workSchedule.startTime.trim() !== '') {
            const timeStr = workSchedule.startTime.trim()
            const parts = timeStr.split(' ')
            
            let shiftStartHour = 0
            if (parts.length >= 2) {
              // Format: "11:00 PM"
              const hour = parseInt(parts[0].split(':')[0])
              const period = parts[1].toUpperCase()
              shiftStartHour = (period === 'PM' && hour !== 12) ? hour + 12 : (period === 'AM' && hour === 12) ? 0 : hour
            } else {
              // Format: "23:00" (24-hour)
              shiftStartHour = parseInt(timeStr.split(':')[0])
            }
            
            // If shift starts late (after 8 PM), and they're clocking in early AM, use yesterday
            if (shiftStartHour >= 20 && staffLocalTime.getHours() < 12) {
              daysDiff = -1 // Use yesterday's date
            }
          }
        }
        
        // Apply the day difference (if negative, go back; if 0, stay same)
        if (daysDiff !== 0) {
          shiftDate.setDate(shiftDate.getDate() - Math.abs(daysDiff))
        }
      }
    }

    console.log(`[Clock-In] Shift date calculated: ${shiftDate.toISOString()} (scheduled: ${workSchedule?.dayOfWeek}, today: ${today})`)

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
    let wasEarly = false
    let earlyBy = 0
    let expectedClockIn = null
    
    // Check if work schedule exists and has a valid startTime
    if (workSchedule && workSchedule.startTime && workSchedule.startTime.trim() !== '') {
      try {
        // Parse shift start time - supports both "09:00 AM" and "09:00" (24-hour)
        const timeStr = workSchedule.startTime.trim()
        const parts = timeStr.split(' ')
        
        let hour: number
        let minute: number
        
        if (parts.length >= 2) {
          // Format: "09:00 AM" or "9:00 PM"
          const time = parts[0]
          const period = parts[1].toUpperCase()
          const [hours, minutes] = time.split(':')
          
          hour = parseInt(hours)
          minute = parseInt(minutes || '0')
          
          // Convert to 24-hour format
          if (period === 'PM' && hour !== 12) {
            hour += 12
          } else if (period === 'AM' && hour === 12) {
            hour = 0
          }
        } else {
          // Format: "09:00" or "03:00" (24-hour format)
          const [hours, minutes] = timeStr.split(':')
          hour = parseInt(hours)
          minute = parseInt(minutes || '0')
        }
        
        // Create expected clock-in time (in staff's timezone)
        expectedClockIn = new Date(staffLocalTime)
        expectedClockIn.setHours(hour, minute, 0, 0)
        
        // Check if user is LATE or EARLY (compare using staff's local time)
        const diffMs = staffLocalTime.getTime() - expectedClockIn.getTime()
        const diffMinutes = Math.floor(Math.abs(diffMs) / 60000)
        
        if (diffMs > 0) {
          // Clocked in AFTER shift start = LATE
          wasLate = true
          lateBy = diffMinutes
        } else if (diffMs < 0) {
          // Clocked in BEFORE shift start = EARLY
          wasEarly = true
          earlyBy = diffMinutes
        }
        // If diffMs === 0, they're exactly on time!
        
      } catch (error) {
        console.error('[Clock-In] Error parsing start time:', workSchedule.startTime, error)
        // If parsing fails, don't mark as late/early
        wasLate = false
        lateBy = 0
        wasEarly = false
        earlyBy = 0
        expectedClockIn = null
      }
    }

    // Create new time entry with shift tracking
    const timeEntry = await prisma.time_entries.create({
      data: {
        id: randomUUID(),
        staffUserId: staffUser.id,
        date: shiftDate,  // 🔥 SCHEDULED SHIFT DATE (Work Schedules = KING!)
        workScheduleId: workSchedule?.id || null,  // ← SAVE THE SCHEDULE LINK!
        clockIn: now,
        updatedAt: now,
        expectedClockIn,
        wasLate,
        lateBy: wasLate ? lateBy : null,
        wasEarly,
        earlyBy: wasEarly ? earlyBy : null,
        lateReason: null,  // Will be set by UI if user is late
        workedFullShift: false  // Will be calculated on clock-out
      },
    })
    
    // Check if any breaks exist for today (we already fetched this data above)
    const existingBreaksToday = todaysEntries.some(entry => entry.breaks && entry.breaks.length > 0)
    
    // Only show break scheduler if no breaks have been scheduled today at all
    const shouldShowBreakScheduler = !existingBreaksToday
    
    console.log(`[Clock-In] Breaks today: ${existingBreaksToday ? 'YES' : 'NO'}, Show scheduler: ${shouldShowBreakScheduler}`)

    // ✨ Auto-generate activity post
    await logClockedIn(staffUser.id, staffUser.name)

    return NextResponse.json({
      success: true,
      timeEntry: {
        ...timeEntry,
        breaksScheduled: !!existingBreaksToday // Mark as scheduled if breaks exist today
      },
      wasLate,
      lateBy,
      wasEarly,
      earlyBy,
      showBreakScheduler: shouldShowBreakScheduler,
      // Message for logging, popup will be handled by UI based on wasLate/wasEarly flags
      message: wasLate 
        ? `Clocked in ${lateBy} minutes late`
        : wasEarly
        ? `Clocked in ${earlyBy} minutes early`
        : "Clocked in on time",
    })
  } catch (error) {
    console.error("❌ ERROR CLOCKING IN:", error)
    console.error("❌ ERROR DETAILS:", JSON.stringify(error, null, 2))
    console.error("❌ ERROR MESSAGE:", error instanceof Error ? error.message : "Unknown error")
    console.error("❌ ERROR STACK:", error instanceof Error ? error.stack : "No stack")
    return NextResponse.json({ 
      error: "Failed to clock in",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}



