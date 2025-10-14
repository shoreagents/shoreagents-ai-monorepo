import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: { onboarding: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    if (!staffUser.onboarding) {
      return NextResponse.json({ error: "No onboarding found" }, { status: 404 })
    }

    // Check if documents section is locked
    if (staffUser.onboarding.documentsStatus === "APPROVED") {
      return NextResponse.json({ 
        error: "Documents section has been approved and is locked" 
      }, { status: 403 })
    }

    // Allow submission even without documents (staff can skip for now)
    // const hasRequiredDocs = 
    //   staffUser.onboarding.validIdUrl ||
    //   staffUser.onboarding.birthCertUrl ||
    //   staffUser.onboarding.nbiClearanceUrl
    //
    // if (!hasRequiredDocs) {
    //   return NextResponse.json({ 
    //     error: "Please upload at least one required document before submitting" 
    //   }, { status: 400 })
    // }

    // Mark documents section as submitted
    const onboarding = await prisma.staffOnboarding.update({
      where: { id: staffUser.onboarding.id },
      data: {
        documentsStatus: "SUBMITTED",
        updatedAt: new Date()
      }
    })

    // Recalculate completion percentage
    await updateCompletionPercent(onboarding.id)

    return NextResponse.json({ 
      success: true,
      message: "Documents submitted for review" 
    })

  } catch (error) {
    console.error("Documents submit error:", error)
    return NextResponse.json(
      { error: "Failed to submit documents" },
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

  // NEW: Each section = 20% when SUBMITTED or APPROVED
  // 100% = All sections filled out by staff
  let totalProgress = 0
  sections.forEach(status => {
    if (status === "SUBMITTED" || status === "APPROVED") {
      totalProgress += 20
    }
  })

  const completionPercent = Math.min(totalProgress, 100)

  // DON'T set isComplete here - only admin can complete via complete route!
  await prisma.staffOnboarding.update({
    where: { id: onboardingId },
    data: { 
      completionPercent
      // isComplete is NOT updated here - only in admin complete route!
    }
  })
}

