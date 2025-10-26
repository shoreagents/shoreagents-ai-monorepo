import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
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

    // Get staff user with full onboarding details
    const staffUser = await prisma.staffUser.findUnique({
      where: { id: staffUserId },
      include: {
        onboarding: true,
        profile: true
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Calculate admin-specific progress based on APPROVED/REJECTED statuses only
    let adminProgress = 0
    if (staffUser.onboarding) {
      const sections = [
        staffUser.onboarding.personalInfoStatus,
        staffUser.onboarding.govIdStatus,
        staffUser.onboarding.documentsStatus,
        staffUser.onboarding.signatureStatus,
        staffUser.onboarding.emergencyContactStatus,
        staffUser.onboarding.resumeStatus,
        staffUser.onboarding.educationStatus,
        staffUser.onboarding.medicalStatus,
        staffUser.onboarding.dataPrivacyStatus
      ]

      // Admin progress: Only count APPROVED/REJECTED sections (11.11% each for 9 sections)
      sections.forEach(status => {
        if (status === "APPROVED" || status === "REJECTED") {
          adminProgress += 11.11
        }
      })
      
      // Round to nearest whole number
      adminProgress = Math.round(adminProgress)
    }

    return NextResponse.json({ 
      staff: {
        id: staffUser.id,
        name: staffUser.name,
        email: staffUser.email,
        avatar: staffUser.avatar,
        createdAt: staffUser.createdAt
      },
      onboarding: staffUser.onboarding ? {
        ...staffUser.onboarding,
        completionPercent: adminProgress // Override with admin-specific progress
      } : null,
      profile: staffUser.profile ? {
        ...staffUser.profile,
        daysEmployed: Math.floor((new Date().getTime() - new Date(staffUser.profile.startDate).getTime()) / (1000 * 60 * 60 * 24))
      } : null
    })

  } catch (error) {
    console.error("Admin onboarding detail error:", error)
    return NextResponse.json(
      { error: "Failed to fetch onboarding details" },
      { status: 500 }
    )
  }
}

