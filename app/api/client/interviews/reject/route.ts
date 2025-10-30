import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/client/interviews/reject
 * Client rejects a candidate after interview
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get client user
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email }
    })

    if (!clientUser) {
      return NextResponse.json({ error: 'Client user not found' }, { status: 404 })
    }

    const { interviewRequestId, rejectReason } = await req.json()

    if (!interviewRequestId || !rejectReason) {
      return NextResponse.json(
        { error: 'Interview request ID and reject reason are required' },
        { status: 400 }
      )
    }

    // Verify the interview belongs to this client
    const interview = await prisma.staff_interview_requests.findUnique({
      where: { id: interviewRequestId }
    })

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    if (interview.clientUserId !== clientUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update interview status to REJECTED
    const updatedInterview = await prisma.staff_interview_requests.update({
      where: { id: interviewRequestId },
      data: {
        status: 'REJECTED',
        clientNotes: rejectReason, // Store reject reason in clientNotes
        updatedAt: new Date()
      }
    })

    console.log('✅ Interview rejected:', {
      interviewId: interviewRequestId,
      candidateName: interview.candidateFirstName,
      reason: rejectReason
    })

    return NextResponse.json({
      success: true,
      message: 'Candidate rejected successfully',
      interview: updatedInterview
    })

  } catch (error) {
    console.error('❌ Error rejecting candidate:', error)
    return NextResponse.json(
      { error: 'Failed to reject candidate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

