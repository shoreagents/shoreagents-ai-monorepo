import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser || !clientUser.companyId) {
      return NextResponse.json({ error: "Client user or company not found" }, { status: 404 })
    }

    // Get all staff for this company with their onboarding status and profile
    const staffList = await prisma.staffUser.findMany({
      where: { companyId: clientUser.companyId },
      include: {
        onboarding: {
          select: {
            id: true,
            completionPercent: true,
            isComplete: true,
            personalInfoStatus: true,
            govIdStatus: true,
            documentsStatus: true,
            signatureStatus: true,
            emergencyContactStatus: true,
            updatedAt: true,
            firstName: true,
            lastName: true,
          }
        },
        profile: {
          select: {
            startDate: true,
            employmentStatus: true,
            currentRole: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Format the response with countdown calculations
    const staffWithCountdown = staffList.map(staff => {
      let daysUntilStart = null
      let startDateFormatted = null

      if (staff.profile?.startDate) {
        const startDate = new Date(staff.profile.startDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const diffTime = startDate.getTime() - today.getTime()
        daysUntilStart = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        startDateFormatted = startDate.toISOString().split('T')[0] // YYYY-MM-DD
      }

      // Calculate overall onboarding progress
      let sectionsApproved = 0
      if (staff.onboarding) {
        const statuses = [
          staff.onboarding.personalInfoStatus,
          staff.onboarding.govIdStatus,
          staff.onboarding.documentsStatus,
          staff.onboarding.signatureStatus,
          staff.onboarding.emergencyContactStatus
        ]
        sectionsApproved = statuses.filter(s => s === "APPROVED").length
      }

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        avatar: staff.avatar,
        onboarding: staff.onboarding ? {
          completionPercent: staff.onboarding.completionPercent,
          isComplete: staff.onboarding.isComplete,
          sectionsApproved,
          totalSections: 5,
          sections: {
            personalInfo: staff.onboarding.personalInfoStatus,
            govId: staff.onboarding.govIdStatus,
            documents: staff.onboarding.documentsStatus,
            signature: staff.onboarding.signatureStatus,
            emergencyContact: staff.onboarding.emergencyContactStatus,
          },
          updatedAt: staff.onboarding.updatedAt
        } : null,
        profile: staff.profile ? {
          startDate: startDateFormatted,
          daysUntilStart,
          employmentStatus: staff.profile.employmentStatus,
          currentRole: staff.profile.currentRole,
        } : null,
        createdAt: staff.createdAt
      }
    })

    return NextResponse.json({ staff: staffWithCountdown })

  } catch (error) {
    console.error("Client onboarding error:", error)
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    )
  }
}

