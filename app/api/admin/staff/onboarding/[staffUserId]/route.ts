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
        onboarding: true
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      staff: {
        id: staffUser.id,
        name: staffUser.name,
        email: staffUser.email,
        avatar: staffUser.avatar,
        createdAt: staffUser.createdAt
      },
      onboarding: staffUser.onboarding 
    })

  } catch (error) {
    console.error("Admin onboarding detail error:", error)
    return NextResponse.json(
      { error: "Failed to fetch onboarding details" },
      { status: 500 }
    )
  }
}

