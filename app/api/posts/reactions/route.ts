import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/posts/reactions - Add or remove a reaction to a post
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if it's a staff user, client user, or management user
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id }
    })

    const managementUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser && !clientUser && !managementUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { postId, type } = body

    if (!postId || !type) {
      return NextResponse.json(
        { error: "Post ID and reaction type are required" },
        { status: 400 }
      )
    }

    // Check if post exists
    const post = await prisma.activityPost.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Build where clause for finding user's reactions
    const userWhereClause: any = { postId }
    if (staffUser) {
      userWhereClause.staffUserId = staffUser.id
    } else if (clientUser) {
      userWhereClause.clientUserId = clientUser.id
    } else if (managementUser) {
      userWhereClause.managementUserId = managementUser.id
    }

    // Check if user already reacted with this type
    const existingReaction = await prisma.postReaction.findFirst({
      where: {
        ...userWhereClause,
        type: type,
      },
    })

    if (existingReaction) {
      // If same reaction exists, remove it (toggle off)
      await prisma.postReaction.delete({
        where: { id: existingReaction.id },
      })
      
      // 🔥 Emit WebSocket event
      const io = global.socketServer
      if (io) {
        io.emit('activity:reactionRemoved', { postId, userId: staffUser?.id || clientUser?.id || managementUser?.id, type })
        console.log('🔥 [WebSocket] Reaction removed:', postId)
      }
      
      return NextResponse.json({ success: true, action: "removed" })
    }

    // Check if user has ANY reaction on this post (different type)
    const anyReaction = await prisma.postReaction.findFirst({
      where: userWhereClause,
    })

    if (anyReaction) {
      // Update to new reaction type
      const reaction = await prisma.postReaction.update({
        where: { id: anyReaction.id },
        data: { type },
      })
      
      // 🔥 Emit WebSocket event
      const io = global.socketServer
      if (io) {
        const user = staffUser || clientUser || managementUser
        io.emit('activity:reactionUpdated', { 
          postId, 
          reaction: {
            id: reaction.id,
            type: reaction.type,
            user: { id: user.id, name: user.name }
          }
        })
        console.log('🔥 [WebSocket] Reaction updated:', postId)
      }
      
      return NextResponse.json({ success: true, action: "updated", reaction })
    }

    // Create new reaction
    const reaction = await prisma.postReaction.create({
      data: {
        postId: postId,
        staffUserId: staffUser?.id || null,
        clientUserId: clientUser?.id || null,
        managementUserId: managementUser?.id || null,
        type,
      },
    })

    // 🔥 Emit WebSocket event
    const io = global.socketServer
    if (io) {
      const user = staffUser || clientUser || managementUser
      io.emit('activity:reactionAdded', { 
        postId, 
        reaction: {
          id: reaction.id,
          type: reaction.type,
          user: { id: user.id, name: user.name }
        }
      })
      console.log('🔥 [WebSocket] Reaction added:', postId)
    }

    return NextResponse.json({ success: true, action: "added", reaction })
  } catch (error) {
    console.error("Error toggling reaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

