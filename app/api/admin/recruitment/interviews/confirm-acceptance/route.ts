/**
 * Admin Recruitment - Finalize Hire API (Consolidated)
 * POST /api/admin/recruitment/interviews/confirm-acceptance
 * 
 * Finalizes hire by creating job acceptance record and updating status to HIRED
 * This consolidates the previous "Confirm Acceptance" and "Finalize Hire" steps
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCandidateById } from '@/lib/bpoc-db'
import crypto from 'crypto'

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
    const { interviewRequestId, bpocCandidateId, confirmedStartDate, staffEmail, adminNotes } = body

    // Validation
    if (!interviewRequestId) {
      return NextResponse.json({ error: 'Interview request ID is required' }, { status: 400 })
    }

    if (!confirmedStartDate) {
      return NextResponse.json({ error: 'Confirmed start date is required' }, { status: 400 })
    }

    if (!staffEmail) {
      return NextResponse.json({ error: 'Staff email is required' }, { status: 400 })
    }

    console.log('🎯 [ADMIN] Finalizing hire for interview:', interviewRequestId)

    // Get interview request with company info
    const interview = await prisma.interview_requests.findUnique({
      where: { id: interviewRequestId },
      include: {
        client_users: {
          include: {
            company: true
          }
        }
      }
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

    // Get candidate info from BPOC database
    let candidateData = null
    if (bpocCandidateId) {
      try {
        candidateData = await getCandidateById(bpocCandidateId)
        console.log('✅ [ADMIN] Found candidate in BPOC:', candidateData?.first_name)
      } catch (error) {
        console.warn('⚠️ [ADMIN] Could not fetch BPOC candidate data:', error)
      }
    }

    // Get candidate phone if available
    let candidatePhone = null
    if (candidateData?.resume_data?.phone || candidateData?.resume_data?.contact?.phone) {
      candidatePhone = candidateData.resume_data.phone || candidateData.resume_data.contact?.phone || null
    }

    // Check if job acceptance already exists
    const existingJobAcceptance = await prisma.job_acceptances.findUnique({
      where: { interviewRequestId: interviewRequestId }
    })

    let jobAcceptance
    if (existingJobAcceptance) {
      // Update existing job acceptance
      console.log('📝 [ADMIN] Updating existing job acceptance:', existingJobAcceptance.id)
      jobAcceptance = await prisma.job_acceptances.update({
        where: { id: existingJobAcceptance.id },
        data: {
          candidateEmail: staffEmail,
          candidatePhone: candidatePhone,
          position: candidateData?.position || existingJobAcceptance.position,
          bpocCandidateId: bpocCandidateId || existingJobAcceptance.bpocCandidateId,
          acceptedByAdminId: session.user.id,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new job acceptance record
      console.log('🆕 [ADMIN] Creating new job acceptance')
      jobAcceptance = await prisma.job_acceptances.create({
        data: {
          id: crypto.randomUUID(),
          interviewRequestId: interviewRequestId,
          bpocCandidateId: bpocCandidateId || '',
          candidateEmail: staffEmail,
          candidatePhone: candidatePhone,
          position: candidateData?.position || 'Staff Member',
          companyId: interview.client_users?.companyId || '',
          acceptedByAdminId: session.user.id,
          acceptedAt: new Date(),
          signupEmailSent: false,
          signupEmailSentAt: null,
          staffUserId: null, // Will be set when staff creates account
          contractSigned: false,
          contractSignedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    console.log('✅ [ADMIN] Job acceptance record ready:', jobAcceptance.id)

    // Update interview request status to HIRED
    const updatedInterview = await prisma.interview_requests.update({
      where: { id: interviewRequestId },
      data: {
        status: 'HIRED',
        finalStartDate: new Date(confirmedStartDate),
        adminNotes: adminNotes 
          ? `${interview.adminNotes || ''}\n\n[Hire Finalized] ${adminNotes}`
          : `${interview.adminNotes || ''}\n\n[Hire Finalized] Job acceptance ID: ${jobAcceptance.id}. Staff account prepared for: ${staffEmail}`,
        updatedAt: new Date()
      }
    })

    console.log('✅ [ADMIN] Hire finalized. Status updated to HIRED')

    return NextResponse.json({
      success: true,
      message: 'Hire finalized successfully',
      interview: updatedInterview,
      jobAcceptanceId: jobAcceptance.id,
      staffEmail: staffEmail,
      instructions: `Staff member should create their account using ${staffEmail}. The system will auto-match their signup to this hire record.`
    })

  } catch (error: any) {
    console.error('❌ [ADMIN] Error finalizing hire:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to finalize hire' 
    }, { status: 500 })
  }
}

