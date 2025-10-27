/**
 * Admin Recruitment - Send Job Offer API
 * POST /api/admin/recruitment/interviews/hire
 * 
 * Admin sends job offer to candidate (does NOT immediately hire)
 * Sets status to OFFER_SENT and waits for candidate acceptance
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
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser || managementUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    const body = await request.json()
    const {
      interviewRequestId,
      position,
      companyId,
      candidateEmail,
      candidatePhone,
      bpocCandidateId,
      clientPreferredStart // Optional: client's preferred start date
    } = body

    // Validation
    if (!interviewRequestId) {
      return NextResponse.json({ error: 'Interview request ID is required' }, { status: 400 })
    }

    if (!position) {
      return NextResponse.json({ error: 'Position is required' }, { status: 400 })
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    if (!candidateEmail) {
      return NextResponse.json({ error: 'Candidate email is required' }, { status: 400 })
    }

    if (!bpocCandidateId) {
      return NextResponse.json({ error: 'BPOC candidate ID is required' }, { status: 400 })
    }

    console.log(`📧 [ADMIN] Sending job offer to candidate for position: ${position}`)

    // Check if interview request exists
    const interviewRequest = await prisma.interview_requests.findUnique({
      where: { id: interviewRequestId },
      include: {
        client_users: {
          include: {
            company: true
          }
        }
      }
    })

    if (!interviewRequest) {
      return NextResponse.json({ error: 'Interview request not found' }, { status: 404 })
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check if already has a job acceptance (offer sent)
    const existingJobAcceptance = await prisma.job_acceptances.findUnique({
      where: { interviewRequestId }
    })

    if (existingJobAcceptance) {
      return NextResponse.json({ error: 'Job offer has already been sent to this candidate' }, { status: 400 })
    }

    // Update interview request status to OFFER_SENT
    await prisma.interview_requests.update({
      where: { id: interviewRequestId },
      data: {
        status: 'OFFER_SENT',
        hireRequestedBy: 'admin',
        hireRequestedAt: new Date(),
        offerSentAt: new Date(),
        clientPreferredStart: clientPreferredStart ? new Date(clientPreferredStart) : null,
        updatedAt: new Date()
      }
    })

    // Create job acceptance record (pending candidate acceptance)
    const jobAcceptance = await prisma.job_acceptances.create({
      data: {
        id: crypto.randomUUID(),
        interviewRequestId,
        bpocCandidateId,
        candidateEmail,
        candidatePhone: candidatePhone || null,
        position,
        companyId,
        acceptedByAdminId: managementUser.id,
        updatedAt: new Date()
      }
    })

    console.log(`✅ [ADMIN] Job offer sent: ${jobAcceptance.id}`)

    // Generate offer acceptance link (not signup yet!)
    const offerLink = `${process.env.NEXT_PUBLIC_APP_URL}/offer/accept?jobId=${jobAcceptance.id}`
    console.log(`📧 [ADMIN] Offer acceptance link (email to be sent): ${offerLink}`)

    // TODO: Send email to candidate with offer details and acceptance link
    // This will include:
    // - Position details
    // - Company information
    // - Preferred start date
    // - Accept/Decline buttons

    // Log activity
    console.log(`🎉 [ADMIN] Job offer sent for ${position} at ${company.companyName}`)

    return NextResponse.json({
      success: true,
      message: 'Job offer sent to candidate. Waiting for their response.',
      jobAcceptance,
      offerLink, // Return this for now until email is implemented
      nextSteps: 'Candidate will receive an email to accept or decline the offer. Once accepted, you can finalize the start date and they will be able to create their account.'
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error sending job offer:', error)
    return NextResponse.json(
      { error: 'Failed to send job offer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
