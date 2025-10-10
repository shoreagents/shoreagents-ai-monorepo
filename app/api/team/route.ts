import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/team - Get all team members with their stats
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all users with their profiles and gamification data
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        gamificationProfile: true,
      },
      orderBy: { name: "asc" },
    })

    // Format team members for frontend
    const members = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || "/placeholder-user.jpg",
      client: user.profile?.client || "Unassigned",
      status: "online" as const, // Default to online; in real app, would check actual status
      currentTask: user.profile?.currentRole || null,
      mood: user.profile?.location || null, // Using location as mood placeholder
      tasksCompleted: user.gamificationProfile?.tasksCompleted || 0,
      pointsEarned: user.gamificationProfile?.points || 0,
      streakDays: user.gamificationProfile?.streak || 0,
      level: user.gamificationProfile?.level || 1,
      rank: user.gamificationProfile?.rank || null,
      performanceScore: user.gamificationProfile?.performanceScore || 0,
    }))

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

