import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/time-tracking/clock-out - Clock out the user
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find active time entry (clocked in but not out)
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        clockOut: null,
      },
    })

    if (!activeEntry) {
      return NextResponse.json(
        { error: 'You are not currently clocked in' },
        { status: 400 }
      )
    }

    const clockOut = new Date()
    const clockIn = new Date(activeEntry.clockIn)
    
    // Calculate total hours (difference in milliseconds / 1000 / 60 / 60)
    const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)

    // Update time entry with clock out time and total hours
    const timeEntry = await prisma.timeEntry.update({
      where: {
        id: activeEntry.id,
      },
      data: {
        clockOut: clockOut,
        totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
      },
    })

    return NextResponse.json({ success: true, timeEntry }, { status: 200 })
  } catch (error) {
    console.error('Error clocking out:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

