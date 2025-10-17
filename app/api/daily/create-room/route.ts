import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { staffId, staffName, clientId, clientName, initiatedBy = "client" } = body

    // Determine who is calling whom based on initiatedBy
    let finalClientId: string
    let finalStaffId: string
    let finalClientName: string | undefined
    let finalStaffName: string | undefined
    let roomNamePrefix: string

    if (initiatedBy === "staff") {
      // Staff is calling client
      if (!clientId) {
        return NextResponse.json({ error: "Client ID required" }, { status: 400 })
      }
      
      // Get staff user ID from auth
      const staffUser = await prisma.staffUser.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true }
      })
      
      if (!staffUser) {
        return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
      }
      
      finalClientId = clientId
      finalStaffId = staffUser.id
      finalClientName = clientName
      finalStaffName = staffUser.name
      roomNamePrefix = `staff-call-${finalStaffId}-${finalClientId}`
    } else {
      // Client is calling staff
      if (!staffId) {
        return NextResponse.json({ error: "Staff ID required" }, { status: 400 })
      }
      
      // Get client user ID from auth
      const clientUser = await prisma.clientUser.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true }
      })
      
      if (!clientUser) {
        return NextResponse.json({ error: "Client user not found" }, { status: 404 })
      }
      
      finalClientId = clientUser.id
      finalStaffId = staffId
      finalClientName = clientUser.name
      finalStaffName = staffName
      roomNamePrefix = `client-call-${finalClientId}-${finalStaffId}`
    }

    // Generate unique room name
    const timestamp = Date.now()
    const roomName = `${roomNamePrefix}-${timestamp}`

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

    // Log the call to database
    const call = await prisma.videoCalls.create({
      data: {
        roomName: room.name,
        roomUrl: room.url,
        clientId: finalClientId,
        staffId: finalStaffId,
        clientName: finalClientName,
        staffName: finalStaffName,
        initiatedBy: initiatedBy,
        status: "INITIATED"
      }
    })

    console.log("📞 CALL CREATED:", {
      callId: call.id,
      roomName: room.name,
      initiatedBy: initiatedBy,
      client: finalClientName,
      staff: finalStaffName
    })

    // Send WebSocket notification to the recipient
    try {
      const io = global.socketServer
      
      if (io) {
        if (initiatedBy === "client") {
          // Notify staff about incoming call from client
          const staff = await prisma.staffUser.findUnique({
            where: { id: finalStaffId },
            select: { authUserId: true, avatar: true }
          })
          
          if (staff) {
            io.to(`user:${staff.authUserId}`).emit("incoming-call", {
              callId: call.id,
              callerName: finalClientName || "Client",
              callerAvatar: undefined, // TODO: Get client avatar
              roomUrl: room.url,
              roomName: room.name
            })
            console.log(`📤 Sent incoming-call notification to staff ${staff.authUserId}`)
          }
        } else {
          // Notify client about incoming call from staff
          const client = await prisma.clientUser.findUnique({
            where: { id: finalClientId },
            select: { authUserId: true, avatar: true }
          })
          
          if (client) {
            io.to(`user:${client.authUserId}`).emit("incoming-call", {
              callId: call.id,
              callerName: finalStaffName || "Staff Member",
              callerAvatar: undefined, // TODO: Get staff avatar
              roomUrl: room.url,
              roomName: room.name
            })
            console.log(`📤 Sent incoming-call notification to client ${client.authUserId}`)
          }
        }
      } else {
        console.warn("⚠️ Socket server not available for notifications")
      }
    } catch (wsError) {
      console.error("❌ Error sending WebSocket notification:", wsError)
      // Don't fail the request if WebSocket notification fails
    }

    return NextResponse.json({
      success: true,
      roomUrl: room.url,
      roomName: room.name,
      staffName: finalStaffName || "Staff Member",
      clientName: finalClientName || "Client",
      callId: call.id,
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

