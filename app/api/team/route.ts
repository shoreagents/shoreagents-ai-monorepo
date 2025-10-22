import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

// GET /api/team - Get team members assigned to same client
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current staff user with company info
    const staffUser = await getStaffUser()

    if (!staffUser || !staffUser.companyId) {
      // User not assigned to any company, return empty team
      return NextResponse.json({ members: [], clientName: null })
    }

    // Get all staff users for the same company
    const teamMembers = await prisma.staffUser.findMany({
      where: {
        companyId: staffUser.companyId,
      },
      include: {
        profile: true,
        gamificationProfile: true,
        company: true,
      },
    })

    // Format team members for frontend
    const members = teamMembers.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      avatar: member.avatar || "/placeholder-user.jpg",
      client: member.company?.companyName || "No Company",
      status: "online" as const, // Default to online; in real app, would check actual status
      currentTask: member.profile?.currentRole || null,
      mood: member.profile?.location || null, // Using location as mood placeholder
      tasksCompleted: member.gamificationProfile?.tasksCompleted || 0,
      pointsEarned: member.gamificationProfile?.points || 0,
      streakDays: member.gamificationProfile?.streak || 0,
      level: member.gamificationProfile?.level || 1,
      rank: member.gamificationProfile?.rank || null,
      performanceScore: member.gamificationProfile?.performanceScore || 0,
    }))

    return NextResponse.json({ members, clientName: staffUser.company?.companyName || null })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

