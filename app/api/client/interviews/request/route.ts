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

    // Get the client user record (session.user.id is authUserId, we need clientUser.id)
    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!clientUser) {
      return NextResponse.json({ error: 'Client user not found' }, { status: 404 })
    }

    // Verify candidate exists in BPOC database
    const candidate = await getCandidateById(bpoc_candidate_id)
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
    // Create interview request using Prisma ORM (handles column mapping automatically)
    const interviewRequest = await prisma.interviewRequest.create({
      data: {
        clientUserId: clientUser.id,  // Use clientUser.id, not session.user.id!
=======
    // Create interview request using Prisma ORM (handles column mapping automatically)
    const interviewRequest = await prisma.interviewRequest.create({
      data: {
        clientUserId: session.user.id,
>>>>>>> 15b4dc5 (fix: Replace raw SQL with Prisma ORM in interview request API)
        bpocCandidateId: bpoc_candidate_id,
        candidateFirstName: candidate.first_name || 'Unknown',
        preferredTimes: preferred_times,
        clientNotes: client_notes || null,
        status: 'PENDING'
      }
    })
<<<<<<< HEAD
>>>>>>> a83ec4d (fix: Lookup clientUser by authUserId before creating interview request)
=======
>>>>>>> 15b4dc5 (fix: Replace raw SQL with Prisma ORM in interview request API)

    console.log(`✅ Interview request created successfully:`, interviewRequest.id)

    return NextResponse.json({
      success: true,
      message: 'Interview request submitted successfully',
      request: interviewRequest,
    })
  } catch (error) {
    console.error('❌ Error creating interview request:', error)
    return NextResponse.json(
      { error: 'Failed to create interview request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}




