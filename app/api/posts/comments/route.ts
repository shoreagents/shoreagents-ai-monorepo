import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/posts/comments - Add a comment to a post
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
    const { postId, content } = body

    if (!postId || !content?.trim()) {
      return NextResponse.json(
        { error: "Post ID and comment content are required" },
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

    // Create comment
    const comment = await prisma.postComment.create({
      data: {
        postId: postId,
        staffUserId: staffUser?.id || null,
        clientUserId: clientUser?.id || null,
        managementUserId: managementUser?.id || null,
        content: content.trim(),
      },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        clientUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        managementUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, comment }, { status: 201 })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/comments - Delete a comment
export async function DELETE(request: NextRequest) {
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

    // Get comment ID from query params
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId') || searchParams.get('id')

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      )
    }

    // Check if comment exists and belongs to user
    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if user owns the comment (staff, client, or management)
    const isOwner = (staffUser && comment.staffUserId === staffUser.id) ||
                    (clientUser && comment.clientUserId === clientUser.id) ||
                    (managementUser && comment.managementUserId === managementUser.id)

    if (!isOwner) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      )
    }

    // Delete comment
    await prisma.postComment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

