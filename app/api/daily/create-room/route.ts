import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { staffId, staffName } = body

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID required" }, { status: 400 })
    }

    // Generate unique room name
    const timestamp = Date.now()
    const roomName = `quick-call-${staffId}-${session.user.id}-${timestamp}`

    // Set expiration time (1 hour from now)
    const exp = Math.floor(Date.now() / 1000) + 3600

    // Create room via Daily.co API
    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: exp,
          enable_screenshare: true,
          enable_chat: true,
          enable_recording: "cloud",
          max_participants: 2
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Daily.co API error:", error)
      return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
    }

    const room = await response.json()

    return NextResponse.json({
      success: true,
      roomUrl: room.url,
      roomName: room.name,
      staffName: staffName || "Staff Member",
      expiresAt: exp
    })
  } catch (error) {
    console.error("Error creating Daily.co room:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

