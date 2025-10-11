import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/posts/reactions - Add or toggle a reaction
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postId, type } = body

    if (!postId || !type) {
      return NextResponse.json(
        { error: 'Post ID and reaction type are required' },
        { status: 400 }
      )
    }

    // Check if reaction already exists
    const existingReaction = await prisma.postReaction.findUnique({
      where: {
        postId_userId_type: {
          postId,
          userId: session.user.id,
          type,
        },
      },
    })

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.postReaction.delete({
        where: { id: existingReaction.id },
      })
      return NextResponse.json({ success: true, action: 'removed' }, { status: 200 })
    } else {
      // Add reaction
      const reaction = await prisma.postReaction.create({
        data: {
          postId,
          userId: session.user.id,
          type,
        },
      })
      return NextResponse.json({ success: true, action: 'added', reaction }, { status: 201 })
    }
  } catch (error) {
    console.error('Error toggling reaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

