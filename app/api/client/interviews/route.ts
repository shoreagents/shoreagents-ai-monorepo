/**
 * Client Interviews API
 * GET /api/client/interviews
 * 
 * Fetch client's interview requests and scheduled interviews
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify client is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a client
    if (session.user.role?.toUpperCase() !== 'CLIENT') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'all' // all | pending | scheduled | completed

    console.log(`📋 Fetching interviews for client ${session.user.id}, status: ${statusFilter}`)

    // Fetch interview requests
    let requestsQuery = `
      SELECT * FROM interview_requests
      WHERE client_user_id = $1
    `
    if (statusFilter !== 'all') {
      requestsQuery += ` AND status = $2`
    }
    requestsQuery += ` ORDER BY created_at DESC`

    const requests = statusFilter === 'all'
      ? await prisma.$queryRawUnsafe<any[]>(requestsQuery, session.user.id)
      : await prisma.$queryRawUnsafe<any[]>(requestsQuery, session.user.id, statusFilter)

    // Fetch scheduled interviews
    let interviewsQuery = `
      SELECT 
        si.*,
        io.decision as outcome_decision,
        io.client_feedback as outcome_feedback,
        io.created_at as outcome_created_at
      FROM scheduled_interviews si
      LEFT JOIN interview_outcomes io ON si.id = io.scheduled_interview_id
      WHERE si.client_user_id = $1
    `
    if (statusFilter === 'scheduled') {
      interviewsQuery += ` AND si.status = 'scheduled'`
    } else if (statusFilter === 'completed') {
      interviewsQuery += ` AND si.status = 'completed'`
    }
    interviewsQuery += ` ORDER BY si.scheduled_time DESC`

    const scheduledInterviews = await prisma.$queryRawUnsafe<any[]>(interviewsQuery, session.user.id)

    console.log(`✅ Found ${requests.length} requests, ${scheduledInterviews.length} scheduled interviews`)

    return NextResponse.json({
      success: true,
      requests,
      scheduledInterviews,
    })
  } catch (error) {
    console.error('❌ Error fetching interviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interviews', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

