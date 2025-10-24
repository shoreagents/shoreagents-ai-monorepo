import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ staffUserId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/management
    const managementUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser || managementUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { staffUserId } = await context.params
    const body = await req.json()
    const { section, action, feedback } = body

    console.log("📥 VERIFY REQUEST:", { 
      staffUserId, 
      section, 
      action, 
      feedback,
      adminId: managementUser.id
    })

    // Validate input
    const validSections = [
      "personalInfo",
      "govId",
      "documents",
      "signature",
      "emergencyContact",
      "resume",
      "medical",
      "education",
      "dataPrivacy",
      "bankDetails"
    ]
    
    const validActions = ["APPROVED", "REJECTED", "feedback"]

    if (!validSections.includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 })
    }

    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get staff onboarding
    const staffUser = await prisma.staffUser.findUnique({
      where: { id: staffUserId },
      include: { onboarding: true }
    })

    if (!staffUser || !staffUser.onboarding) {
      return NextResponse.json({ error: "Onboarding not found" }, { status: 404 })
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    }

    // Handle different action types
    if (action === "feedback") {
      // Only update feedback, don't change status
      updateData[`${section}Feedback`] = feedback || null
    } else {
      // Update status and feedback for approve/reject actions
      updateData[`${section}Status`] = action
      updateData[`${section}Feedback`] = feedback || null
      updateData.verifiedBy = managementUser.id

      // Add verification timestamp if approved
      if (action === "APPROVED") {
        updateData[`${section}VerifiedAt`] = new Date()
      }
    }

    console.log("💾 UPDATING DATABASE:", updateData)

    // Update onboarding
    const onboarding = await prisma.staffOnboarding.update({
      where: { id: staffUser.onboarding.id },
      data: updateData
    })

    console.log("✅ DATABASE UPDATED:", { 
      section, 
      status: action, 
      hasVerifiedAt: !!updateData[`${section}VerifiedAt`],
      feedback: feedback || 'none'
    })

    // Recalculate completion percentage only for approve/reject actions
    if (action !== "feedback") {
      await updateCompletionPercent(onboarding.id)
    }
    
    const updated = await prisma.staffOnboarding.findUnique({ 
      where: { id: onboarding.id } 
    })
    const approvedCount = [
      updated?.personalInfoStatus,
      updated?.govIdStatus,
      updated?.documentsStatus,
      updated?.signatureStatus,
      updated?.emergencyContactStatus,
      updated?.resumeStatus,
      updated?.medicalStatus,
      updated?.educationStatus,
      updated?.dataPrivacyStatus,
      updated?.bankDetailsStatus
    ].filter(status => status === "APPROVED").length
    
    console.log("📊 COMPLETION UPDATED:", { 
      completionPercent: updated?.completionPercent,
      approvedCount: approvedCount,
      allApproved: approvedCount === 10 ? "✅ GREEN FORM SHOULD APPEAR!" : `❌ Only ${approvedCount}/10 approved`,
      isComplete: updated?.isComplete,
      statuses: {
        personalInfo: updated?.personalInfoStatus,
        govId: updated?.govIdStatus,
        documents: updated?.documentsStatus,
        signature: updated?.signatureStatus,
        emergencyContact: updated?.emergencyContactStatus,
        resume: updated?.resumeStatus,
        medical: updated?.medicalStatus,
        education: updated?.educationStatus,
        dataPrivacy: updated?.dataPrivacyStatus,
        bankDetails: updated?.bankDetailsStatus
      }
    })

    return NextResponse.json({ 
      success: true,
      message: action === "feedback" ? "Feedback saved successfully" : `Section ${action.toLowerCase()} successfully` 
    })

  } catch (error) {
    console.error("Admin verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify section" },
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
    onboarding.govIdStatus,
    onboarding.documentsStatus,
    onboarding.signatureStatus,
    onboarding.emergencyContactStatus,
    onboarding.resumeStatus,
    onboarding.medicalStatus,
    onboarding.educationStatus,
    onboarding.dataPrivacyStatus,
    onboarding.bankDetailsStatus
  ]

  // Admin progress: Only count APPROVED/REJECTED sections (10% each for 10 sections)
  let totalProgress = 0
  sections.forEach(status => {
    if (status === "APPROVED" || status === "REJECTED") {
      totalProgress += 10
    }
  })

  const completionPercent = Math.min(totalProgress, 100)
  // DON'T set isComplete here - that should only happen when admin clicks "Complete Onboarding"!
  // const approvedCount = sections.filter(status => status === "APPROVED").length
  // const isComplete = approvedCount === 5

  await prisma.staffOnboarding.update({
    where: { id: onboardingId },
    data: { 
      completionPercent
      // isComplete is NOT updated here - only in complete route!
    }
  })
}

