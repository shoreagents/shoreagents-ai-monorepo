import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: {
          include: {
            workSchedule: {
              orderBy: { dayOfWeek: "asc" },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      profile: user.profile,
      workSchedules: user.profile?.workSchedule || [],
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      phone,
      profileImage,
      mood,
      currentTask,
      // Add other updateable fields as needed
    } = body

    // Update user name if provided
    if (name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
      })
    }

    // Update or create profile
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        ...(phone && { phone }),
        ...(profileImage && { profileImage }),
        ...(mood && { mood }),
        ...(currentTask && { currentTask }),
      },
      create: {
        userId: session.user.id,
        ...(phone && { phone }),
        ...(profileImage && { profileImage }),
        ...(mood && { mood }),
        ...(currentTask && { currentTask }),
      },
    })

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

