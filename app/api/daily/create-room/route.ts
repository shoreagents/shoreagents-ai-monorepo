import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    const { staffId } = await request.json()

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    const staffUser = await prisma.staffUser.findUnique({
      where: { id: staffId },
    })

    if (!staffUser || staffUser.companyId !== clientUser.companyId) {
      return NextResponse.json(
        { error: "Staff not found or not assigned to your organization" },
        { status: 403 }
      )
    }

    const DAILY_API_KEY = process.env.DAILY_API_KEY
    const NEXT_PUBLIC_DAILY_DOMAIN = process.env.NEXT_PUBLIC_DAILY_DOMAIN

    if (!DAILY_API_KEY || !NEXT_PUBLIC_DAILY_DOMAIN) {
      return NextResponse.json({ error: "Daily.co API keys not configured" }, { status: 500 })
    }

    // Create a temporary Daily.co room
    const response = await fetch(`https://api.daily.co/v1/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `quick-call-${staffId}-${clientUser.id}-${Date.now()}`,
        properties: {
          exp: Math.round(Date.now() / 1000) + 60 * 60, // 1 hour expiration
          enable_screenshare: true,
          enable_chat: true,
          max_participants: 2, // 1-on-1 call
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Daily.co room creation failed:", errorData)
      return NextResponse.json({ error: "Failed to create video room" }, { status: 500 })
    }

    const room = await response.json()

    return NextResponse.json({ roomUrl: room.url, token: room.token })
  } catch (error) {
    console.error("Error creating Daily.co room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
