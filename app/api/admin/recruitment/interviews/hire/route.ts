/**
 * Admin Recruitment - Hire Candidate API
 * POST /api/admin/recruitment/interviews/hire
 * 
 * Admin marks interview as hired and creates job acceptance record
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
    const managementUser = await prisma.managementUser.findUnique({
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
      bpocCandidateId
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

    console.log(`🎯 [ADMIN] Hiring candidate for position: ${position}`)

    // Check if interview request exists
    const interviewRequest = await prisma.interview_requests.findUnique({
      where: { id: interviewRequestId }
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

    // Check if already hired
    const existingJobAcceptance = await prisma.job_acceptances.findUnique({
      where: { interviewRequestId }
    })

    if (existingJobAcceptance) {
      return NextResponse.json({ error: 'This candidate has already been hired' }, { status: 400 })
    }

    // Update interview request status
    await prisma.interview_requests.update({
      where: { id: interviewRequestId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    })

    // Create job acceptance record
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

    console.log(`✅ [ADMIN] Job acceptance created: ${jobAcceptance.id}`)

    // TODO: Send signup email to candidate with jobAcceptanceId token
    // This will be implemented in Phase 12 (Email Notifications)
    // For now, we'll just log the signup link
    const signupLink = `${process.env.NEXT_PUBLIC_APP_URL}/login/staff/signup?jobAcceptanceId=${jobAcceptance.id}`
    console.log(`📧 [ADMIN] Signup link (email to be sent): ${signupLink}`)

    // Log activity
    console.log(`🎉 [ADMIN] Successfully hired candidate for ${position} at ${company.companyName}`)

    return NextResponse.json({
      success: true,
      message: 'Candidate hired successfully',
      jobAcceptance,
      signupLink // Return this for now until email is implemented
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error hiring candidate:', error)
    return NextResponse.json(
      { error: 'Failed to hire candidate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

