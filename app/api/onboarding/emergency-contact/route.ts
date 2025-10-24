import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      emergencyContactName,
      emergencyContactNo,
      emergencyRelationship
    } = body

    // Get staff user
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: { onboarding: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Check if section is locked (already approved)
    if (staffUser.onboarding?.emergencyContactStatus === "APPROVED") {
      return NextResponse.json({ 
        error: "This section has been approved and is locked" 
      }, { status: 403 })
    }

    // Update or create onboarding
    const onboarding = await prisma.staffOnboarding.upsert({
      where: { staffUserId: staffUser.id },
      update: {
        emergencyContactName,
        emergencyContactNo,
        emergencyRelationship,
        emergencyContactStatus: "SUBMITTED",
        updatedAt: new Date()
      },
      create: {
        staffUserId: staffUser.id,
        emergencyContactName,
        emergencyContactNo,
        emergencyRelationship,
        emergencyContactStatus: "SUBMITTED"
      }
    })

    // Recalculate completion percentage
    await updateCompletionPercent(onboarding.id)

    // Fetch updated onboarding to get completion percent
    const updatedOnboarding = await prisma.staffOnboarding.findUnique({
      where: { id: onboarding.id }
    })

    return NextResponse.json({ 
      success: true,
      message: "Emergency contact saved successfully",
      completionPercent: updatedOnboarding?.completionPercent || 0
    })

  } catch (error) {
    console.error("Emergency contact save error:", error)
    return NextResponse.json(
      { error: "Failed to save emergency contact" },
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
  // Verification (APPROVED/REJECTED) is separate from completion
  let totalProgress = 0
  sections.forEach(status => {
    if (status === "SUBMITTED" || status === "APPROVED") {
      totalProgress += Math.round(100 / sections.length)
    }
  })

  const completionPercent = Math.min(totalProgress, 100)
  
  // DON'T set isComplete here - only admin can complete via complete route!
  // 100% just means staff has submitted everything, not that it's verified

  await prisma.staffOnboarding.update({
    where: { id: onboardingId },
    data: { 
      completionPercent
      // isComplete is NOT updated here - only in admin complete route!
    }
  })
}

