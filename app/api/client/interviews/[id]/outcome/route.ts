/**
 * Interview Outcome API
 * POST /api/client/interviews/[id]/outcome
 * 
 * Client submits feedback and hiring decision after interview
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const scheduledInterviewId = params.id
    const body = await request.json()
    const { decision, client_feedback } = body

    // Validation
    if (!decision || !['hire', 'reject', 'needs_review'].includes(decision)) {
      return NextResponse.json({ error: 'Valid decision is required (hire, reject, needs_review)' }, { status: 400 })
    }

    if (!client_feedback || client_feedback.trim().length === 0) {
      return NextResponse.json({ error: 'Client feedback is required' }, { status: 400 })
    }

    console.log(`📝 Interview outcome from client ${session.user.id} for interview ${scheduledInterviewId}`)

    // Verify interview exists and belongs to this client
    const interview = await prisma.$queryRaw<any[]>`
      SELECT * FROM scheduled_interviews
      WHERE id = ${scheduledInterviewId}::uuid
        AND client_user_id = ${session.user.id}::uuid
    `

    if (!interview || interview.length === 0) {
      return NextResponse.json({ error: 'Interview not found or access denied' }, { status: 404 })
    }

    const interviewData = interview[0]

    // Check if outcome already exists
    const existingOutcome = await prisma.$queryRaw<any[]>`
      SELECT * FROM interview_outcomes
      WHERE scheduled_interview_id = ${scheduledInterviewId}::uuid
    `

    if (existingOutcome && existingOutcome.length > 0) {
      return NextResponse.json({ error: 'Outcome already submitted for this interview' }, { status: 400 })
    }

    // Create interview outcome
    await prisma.$executeRaw`
      INSERT INTO interview_outcomes (
        scheduled_interview_id,
        client_user_id,
        bpoc_candidate_id,
        candidate_first_name,
        decision,
        client_feedback
      ) VALUES (
        ${scheduledInterviewId}::uuid,
        ${session.user.id}::uuid,
        ${interviewData.bpoc_candidate_id}::uuid,
        ${interviewData.candidate_first_name},
        ${decision}::interview_decision,
        ${client_feedback}
      )
    `

    // Update scheduled interview status to completed
    await prisma.$executeRaw`
      UPDATE scheduled_interviews
      SET status = 'completed'::scheduled_interview_status,
          updated_at = NOW()
      WHERE id = ${scheduledInterviewId}::uuid
    `

    console.log(`✅ Interview outcome saved: ${decision}`)

    return NextResponse.json({
      success: true,
      message: 'Interview outcome submitted successfully',
      decision,
    })
  } catch (error) {
    console.error('❌ Error submitting interview outcome:', error)
    return NextResponse.json(
      { error: 'Failed to submit interview outcome', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

