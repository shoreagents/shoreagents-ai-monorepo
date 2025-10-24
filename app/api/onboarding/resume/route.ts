/**
 * Resume Upload API
 * POST /api/onboarding/resume
 * 
 * Upload resume document for staff onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify staff is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find staff user
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: { onboarding: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 })
    }

    if (!staffUser.onboarding) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 })
    }

    // Get resume file from form data
    const formData = await request.formData()
    const resumeFile = formData.get('resume') as File

    if (!resumeFile) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, DOC, and DOCX are allowed' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileName = `${staffUser.id}/resume.${resumeFile.name.split('.').pop()}`
    const fileBuffer = await resumeFile.arrayBuffer()

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('staff')
      .upload(`staff_onboarding/${fileName}`, fileBuffer, {
        contentType: resumeFile.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload resume' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from('staff')
      .getPublicUrl(`staff_onboarding/${fileName}`)

    const resumeUrl = urlData.publicUrl

    // Update onboarding record
    const updatedOnboarding = await prisma.staffOnboarding.update({
      where: { staffUserId: staffUser.id },
      data: {
        resumeUrl: resumeUrl,
        resumeStatus: 'SUBMITTED'
      }
    })

    // Update completion percentage
    await updateCompletionPercent(updatedOnboarding.id)

    console.log(`✅ [ONBOARDING] Resume uploaded for staff: ${staffUser.name}`)

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded successfully',
      resumeUrl
    })
  } catch (error) {
    console.error('❌ Error uploading resume:', error)
    return NextResponse.json(
      { error: 'Failed to upload resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate completion percentage
async function updateCompletionPercent(onboardingId: string) {
  const onboarding = await prisma.staffOnboarding.findUnique({
    where: { id: onboardingId }
  })

  if (!onboarding) return

  const sections = [
    onboarding.personalInfoStatus,
    onboarding.resumeStatus,
    onboarding.govIdStatus,
    onboarding.educationStatus,
    onboarding.medicalStatus,
    onboarding.dataPrivacyStatus,
    onboarding.documentsStatus,
    onboarding.signatureStatus,
    onboarding.emergencyContactStatus
  ]

  // NEW: Each section = ~11.11% when SUBMITTED or APPROVED (9 sections total)
  // 100% = All sections filled out by staff
  let totalProgress = 0
  sections.forEach(status => {
    if (status === "SUBMITTED" || status === "APPROVED") {
      totalProgress += Math.round(100 / sections.length)
    }
  })

  const completionPercent = Math.min(totalProgress, 100)

  await prisma.staffOnboarding.update({
    where: { id: onboardingId },
    data: { completionPercent }
  })
}

