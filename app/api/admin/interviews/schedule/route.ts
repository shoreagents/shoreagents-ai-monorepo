/**
 * Admin Schedule Interview API
 * POST /api/admin/interviews/schedule
 * 
 * Admin approves interview request and schedules the interview
 * Creates Daily.co room for video interview
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { createDailyRoom, generateInterviewRoomName } from '@/lib/daily-co'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Verify admin is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    if (session.user.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    const body = await request.json()
    const { interview_request_id, scheduled_time, candidate_confirmed, admin_notes } = body

    // Validation
    if (!interview_request_id) {
      return NextResponse.json({ error: 'Interview request ID is required' }, { status: 400 })
    }

    if (!scheduled_time) {
      return NextResponse.json({ error: 'Scheduled time is required' }, { status: 400 })
    }

    if (!candidate_confirmed) {
      return NextResponse.json({ error: 'Please confirm candidate availability first' }, { status: 400 })
    }

    console.log(`📅 Admin scheduling interview: ${interview_request_id}`)

    // Fetch the interview request
    const request_data = await prisma.$queryRaw<any[]>`
      SELECT ir.*, cu.name as client_name
      FROM interview_requests ir
      JOIN client_users cu ON ir.client_user_id = cu.id
      WHERE ir.id = ${interview_request_id}::uuid
    `

    if (!request_data || request_data.length === 0) {
      return NextResponse.json({ error: 'Interview request not found' }, { status: 404 })
    }

    const interviewRequest = request_data[0]

    // Check if already scheduled
    const existing = await prisma.$queryRaw<any[]>`
      SELECT * FROM scheduled_interviews
      WHERE interview_request_id = ${interview_request_id}::uuid
    `

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Interview already scheduled' }, { status: 400 })
    }

    // Create Daily.co room
    console.log('🎥 Creating Daily.co room...')
    const roomName = generateInterviewRoomName(
      interviewRequest.client_name,
      interviewRequest.candidate_first_name
    )
    
    const dailyRoom = await createDailyRoom({ name: roomName })

    // Create scheduled interview record
    await prisma.$executeRaw`
      INSERT INTO scheduled_interviews (
        interview_request_id,
        client_user_id,
        bpoc_candidate_id,
        candidate_first_name,
        scheduled_time,
        daily_co_room_url,
        daily_co_room_name,
        status,
        admin_notes
      ) VALUES (
        ${interview_request_id}::uuid,
        ${interviewRequest.client_user_id}::uuid,
        ${interviewRequest.bpoc_candidate_id}::uuid,
        ${interviewRequest.candidate_first_name},
        ${scheduled_time}::timestamptz,
        ${dailyRoom.url},
        ${dailyRoom.name},
        'scheduled'::scheduled_interview_status,
        ${admin_notes || null}
      )
    `

    // Update interview request status to scheduled
    await prisma.$executeRaw`
      UPDATE interview_requests
      SET status = 'scheduled'::interview_request_status,
          updated_at = NOW()
      WHERE id = ${interview_request_id}::uuid
    `

    console.log(`✅ Interview scheduled successfully, room: ${dailyRoom.url}`)

    return NextResponse.json({
      success: true,
      message: 'Interview scheduled successfully',
      dailyRoomUrl: dailyRoom.url,
      scheduledTime: scheduled_time,
    })
  } catch (error) {
    console.error('❌ Error scheduling interview:', error)
    return NextResponse.json(
      { error: 'Failed to schedule interview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

