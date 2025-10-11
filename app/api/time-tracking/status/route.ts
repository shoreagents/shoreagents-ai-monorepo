import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/time-tracking/status - Check if user is currently clocked in
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        clockOut: null,
      },
    })

    if (activeEntry) {
      return NextResponse.json({
        isClockedIn: true,
        activeEntry,
      }, { status: 200 })
    }

    return NextResponse.json({
      isClockedIn: false,
      activeEntry: null,
    }, { status: 200 })
  } catch (error) {
    console.error('Error checking clock status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

