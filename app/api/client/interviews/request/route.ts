/**
 * Interview Request API
 * POST /api/client/interviews/request
 * 
 * Client requests an interview with a candidate
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getCandidateById } from '@/lib/bpoc-db'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { bpoc_candidate_id, preferred_times, client_notes } = body

    // Validation
    if (!bpoc_candidate_id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 })
    }

    if (!preferred_times || !Array.isArray(preferred_times) || preferred_times.length === 0) {
      return NextResponse.json({ error: 'At least one preferred time is required' }, { status: 400 })
    }

    console.log(`📅 Interview request from client ${session.user.id} for candidate ${bpoc_candidate_id}`)

    // Verify candidate exists in BPOC database
    const candidate = await getCandidateById(bpoc_candidate_id)
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Create interview request in our Supabase database
    const interviewRequest = await prisma.$executeRaw`
      INSERT INTO interview_requests (
        client_user_id,
        bpoc_candidate_id,
        candidate_first_name,
        preferred_times,
        client_notes,
        status
      ) VALUES (
        ${session.user.id}::uuid,
        ${bpoc_candidate_id}::uuid,
        ${candidate.first_name},
        ${JSON.stringify(preferred_times)}::jsonb,
        ${client_notes || null},
        'pending'::interview_request_status
      )
    `

    // Get the created request
    const createdRequest = await prisma.$queryRaw<any[]>`
      SELECT * FROM interview_requests
      WHERE client_user_id = ${session.user.id}::uuid
        AND bpoc_candidate_id = ${bpoc_candidate_id}::uuid
      ORDER BY created_at DESC
      LIMIT 1
    `

    console.log(`✅ Interview request created successfully`)

    return NextResponse.json({
      success: true,
      message: 'Interview request submitted successfully',
      request: createdRequest[0],
    })
  } catch (error) {
    console.error('❌ Error creating interview request:', error)
    return NextResponse.json(
      { error: 'Failed to create interview request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

