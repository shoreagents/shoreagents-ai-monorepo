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

    // Validate input
    const validSections = [
      "personalInfo",
      "govId",
      "documents",
      "signature",
      "emergencyContact"
    ]
    
    const validActions = ["APPROVED", "REJECTED"]

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
      [`${section}Status`]: action,
      [`${section}Feedback`]: feedback || null,
      verifiedBy: managementUser.id,
      updatedAt: new Date()
    }

    // Add verification timestamp if approved
    if (action === "APPROVED") {
      updateData[`${section}VerifiedAt`] = new Date()
    }

    // Update onboarding
    const onboarding = await prisma.staffOnboarding.update({
      where: { id: staffUser.onboarding.id },
      data: updateData
    })

    // Recalculate completion percentage
    await updateCompletionPercent(onboarding.id)

    return NextResponse.json({ 
      success: true,
      message: `Section ${action.toLowerCase()} successfully` 
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
    onboarding.emergencyContactStatus
  ]

  // Count progress: SUBMITTED = 15%, APPROVED = 20% per section
  let totalProgress = 0
  sections.forEach(status => {
    if (status === "SUBMITTED") totalProgress += 15
    if (status === "APPROVED") totalProgress += 20
  })

  const completionPercent = Math.min(totalProgress, 100)
  const approvedCount = sections.filter(status => status === "APPROVED").length
  const isComplete = approvedCount === 5

  await prisma.staffOnboarding.update({
    where: { id: onboardingId },
    data: { 
      completionPercent,
      isComplete
    }
  })
}

