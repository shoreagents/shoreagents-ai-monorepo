import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        staff_onboarding: true
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Check if onboarding exists
    if (!staffUser.staff_onboarding) {
      return NextResponse.json({ 
        exists: false,
        shouldRedirect: true,
        completionPercent: 0
      })
    }

    return NextResponse.json({ 
      exists: true,
      shouldRedirect: !staffUser.staff_onboarding.isComplete,
      completionPercent: staffUser.staff_onboarding.completionPercent,
      isComplete: staffUser.staff_onboarding.isComplete
    })

  } catch (error) {
    console.error("Onboarding status check error:", error)
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    )
  }
}

