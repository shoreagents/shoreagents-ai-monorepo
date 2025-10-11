import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/time-tracking - Get all time entries for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        clockIn: 'desc',
      },
    })

    return NextResponse.json({ timeEntries }, { status: 200 })
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

