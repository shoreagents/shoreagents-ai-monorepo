import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user with onboarding
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        staff_onboarding: true
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // If no onboarding exists, create one with pre-filled data from signup
    if (!staffUser.staff_onboarding) {
      const onboarding = await prisma.staff_onboarding.create({
        data: {
          id: crypto.randomUUID(),
          staffUserId: staffUser.id,
          email: staffUser.email,
          // Parse name if possible
          firstName: staffUser.name.split(' ')[0] || staffUser.name,
          lastName: staffUser.name.split(' ').slice(1).join(' ') || '',
          updatedAt: new Date()
        }
      })
      
      return NextResponse.json({ onboarding })
    }

    return NextResponse.json({ onboarding: staffUser.staff_onboarding })

  } catch (error) {
    console.error("Onboarding fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    )
  }
}

