import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { postId, content } = await request.json()

    if (!postId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get authenticated user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Determine user type and get database user ID
    const [staffUser, clientUser, managementUser] = await Promise.all([
      prisma.staffUser.findUnique({ 
        where: { authUserId: session.user.id },
        select: { id: true }
      }),
      prisma.clientUser.findUnique({ 
        where: { authUserId: session.user.id },
        select: { id: true }
      }),
      prisma.managementUser.findUnique({ 
        where: { authUserId: session.user.id },
        select: { id: true }
      })
    ])

    const userId = staffUser?.id || clientUser?.id || managementUser?.id
    
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Determine user type
    const userType = staffUser ? 'staff' : clientUser ? 'client' : 'management'

    // Create the comment
    const comment = await prisma.postComment.create({
      data: {
        postId,
        content,
        ...(userType === 'staff' && { staffUserId: userId }),
        ...(userType === 'client' && { clientUserId: userId }),
        ...(userType === 'management' && { managementUserId: userId }),
      },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        clientUser: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        managementUser: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Emit socket event for real-time updates
    const io = (global as any).socketServer
    if (io) {
      io.emit('commentAdded', { postId, content })
    }

    return NextResponse.json({ success: true, comment })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}