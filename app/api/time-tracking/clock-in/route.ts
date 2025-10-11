import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/time-tracking/clock-in - Clock in the user
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is already clocked in (has an entry without clockOut)
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        clockOut: null,
      },
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: 'You are already clocked in' },
        { status: 400 }
      )
    }

    // Create new time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
        clockIn: new Date(),
      },
    })

    return NextResponse.json({ success: true, timeEntry }, { status: 201 })
  } catch (error) {
    console.error('Error clocking in:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

