/**
 * Admin Recruitment - Confirm Offer Acceptance API
 * POST /api/admin/recruitment/interviews/confirm-acceptance
 * 
 * Updates interview status from OFFER_SENT to OFFER_ACCEPTED after admin confirms with candidate
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verify admin is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin/manager
    const userRole = session.user.role?.toUpperCase()
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    const body = await request.json()
    const { interviewRequestId, confirmedStartDate, adminNotes } = body

    // Validation
    if (!interviewRequestId) {
      return NextResponse.json({ error: 'Interview request ID is required' }, { status: 400 })
    }

    console.log('✅ [ADMIN] Confirming offer acceptance for interview:', interviewRequestId)

    // Get interview request
    const interview = await prisma.interview_requests.findUnique({
      where: { id: interviewRequestId }
    })

    if (!interview) {
      return NextResponse.json({ error: 'Interview request not found' }, { status: 404 })
    }

    // Check if interview is in OFFER_SENT status
    if (interview.status !== 'OFFER_SENT') {
      return NextResponse.json({ 
        error: `Interview must be in OFFER_SENT status. Current status: ${interview.status}` 
      }, { status: 400 })
    }

    // Update interview request status to OFFER_ACCEPTED
    const updatedInterview = await prisma.interview_requests.update({
      where: { id: interviewRequestId },
      data: {
        status: 'OFFER_ACCEPTED',
        finalStartDate: confirmedStartDate ? new Date(confirmedStartDate) : interview.clientPreferredStart,
        adminNotes: adminNotes 
          ? `${interview.adminNotes || ''}\n\n[Offer Accepted] ${adminNotes}`
          : `${interview.adminNotes || ''}\n\n[Offer Accepted] Candidate confirmed acceptance via phone/email on ${new Date().toLocaleDateString()}`,
        updatedAt: new Date()
      }
    })

    console.log('✅ [ADMIN] Offer acceptance confirmed. Status updated to OFFER_ACCEPTED')

    return NextResponse.json({
      success: true,
      message: 'Offer acceptance confirmed successfully',
      interview: updatedInterview,
      nextStep: 'You can now finalize the hire by setting the final start date and preparing their account.'
    })

  } catch (error: any) {
    console.error('❌ [ADMIN] Error confirming offer acceptance:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to confirm offer acceptance' 
    }, { status: 500 })
  }
}

