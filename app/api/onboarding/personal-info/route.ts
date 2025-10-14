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
      firstName,
      middleName,
      lastName,
      gender,
      civilStatus,
      dateOfBirth,
      contactNo,
      email
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
    if (staffUser.onboarding?.personalInfoStatus === "APPROVED") {
      return NextResponse.json({ 
        error: "This section has been approved and is locked" 
      }, { status: 403 })
    }

    // Update or create onboarding
    const onboarding = await prisma.staffOnboarding.upsert({
      where: { staffUserId: staffUser.id },
      update: {
        firstName,
        middleName,
        lastName,
        gender,
        civilStatus,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        contactNo,
        email,
        personalInfoStatus: "SUBMITTED",
        updatedAt: new Date()
      },
      create: {
        staffUserId: staffUser.id,
        firstName,
        middleName,
        lastName,
        gender,
        civilStatus,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        contactNo,
        email,
        personalInfoStatus: "SUBMITTED"
      }
    })

    // Recalculate completion percentage
    await updateCompletionPercent(onboarding.id)

    return NextResponse.json({ 
      success: true,
      message: "Personal information saved successfully" 
    })

  } catch (error) {
    console.error("Personal info save error:", error)
    return NextResponse.json(
      { error: "Failed to save personal information" },
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

  const approvedCount = sections.filter(status => status === "APPROVED").length
  const completionPercent = Math.round((approvedCount / sections.length) * 100)

  await prisma.staffOnboarding.update({
    where: { id: onboardingId },
    data: { 
      completionPercent,
      isComplete: completionPercent === 100
    }
  })
}

