import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAssignedClient } from "@/lib/auth-helpers"

// GET /api/team - Get team members assigned to same client
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the client that the current user is assigned to
    const userClient = await getAssignedClient(session.user.id)

    if (!userClient) {
      // User not assigned to any client, return empty team
      return NextResponse.json({ members: [], clientName: null })
    }

    // Get all staff assignments for this client
    const assignments = await prisma.staffAssignment.findMany({
      where: {
        clientId: userClient.id,
        isActive: true,
      },
      include: {
        user: {
          include: {
            profile: true,
            gamificationProfile: true,
          },
        },
      },
    })

    // Format team members for frontend
    const members = assignments.map((assignment) => ({
      id: assignment.user.id,
      name: assignment.user.name,
      email: assignment.user.email,
      role: assignment.user.role,
      avatar: assignment.user.avatar || "/placeholder-user.jpg",
      client: userClient.companyName,
      status: "online" as const, // Default to online; in real app, would check actual status
      currentTask: assignment.user.profile?.currentRole || null,
      mood: assignment.user.profile?.location || null, // Using location as mood placeholder
      tasksCompleted: assignment.user.gamificationProfile?.tasksCompleted || 0,
      pointsEarned: assignment.user.gamificationProfile?.points || 0,
      streakDays: assignment.user.gamificationProfile?.streak || 0,
      level: assignment.user.gamificationProfile?.level || 1,
      rank: assignment.user.gamificationProfile?.rank || null,
      performanceScore: assignment.user.gamificationProfile?.performanceScore || 0,
    }))

    return NextResponse.json({ members, clientName: userClient.companyName })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

