import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user with onboarding
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: {
        onboarding: true
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // If no onboarding exists, create one with pre-filled data from signup
    if (!staffUser.onboarding) {
      const onboarding = await prisma.staffOnboarding.create({
        data: {
          staffUserId: staffUser.id,
          email: staffUser.email,
          // Parse name if possible
          firstName: staffUser.name.split(' ')[0] || staffUser.name,
          lastName: staffUser.name.split(' ').slice(1).join(' ') || '',
        }
      })
      
      return NextResponse.json({ onboarding })
    }

    return NextResponse.json({ onboarding: staffUser.onboarding })

  } catch (error) {
    console.error("Onboarding fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    )
  }
}

