import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// In-memory request deduplication cache
const pendingRequests = new Map<string, Promise<NextResponse>>()

export async function POST(request: NextRequest) {
  try {
    const { postId, type } = await request.json()
    console.log('📥 [API] Received reaction request:', { postId: postId?.substring(0, 8), type })

    if (!postId || !type) {
      console.error('❌ [API] Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get authenticated user
    const session = await auth()
    if (!session?.user?.id) {
      console.error('❌ [API] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a unique key for this request
    const requestKey = `${session.user.id}-${postId}-${type}`
    
    // If there's already a pending request for this exact reaction, return it
    if (pendingRequests.has(requestKey)) {
      console.log('🚫 [API] Duplicate request detected, returning existing promise:', requestKey)
      return pendingRequests.get(requestKey)!
    }

    // Create the processing promise
    const processingPromise = (async () => {
      try {
        console.log('⚡ [API] Processing reaction:', requestKey)

        // 🚀 First determine user type to get the correct user ID
        console.log('🔍 [API] Finding user type for:', session.user.id)
        const [staffUser, clientUser, managementUser] = await Promise.all([
          prisma.staffUser.findUnique({ where: { authUserId: session.user.id } }),
          prisma.clientUser.findUnique({ where: { authUserId: session.user.id } }),
          prisma.managementUser.findUnique({ where: { authUserId: session.user.id } })
        ])

        const userType = staffUser ? 'staff' : clientUser ? 'client' : managementUser ? 'management' : null
        console.log('👤 [API] User type:', userType)
        
        if (!userType) {
          console.error('❌ [API] User not found in any user table')
          return NextResponse.json({ error: 'User not found in any user table' }, { status: 404 })
        }

        const userId = staffUser?.id || clientUser?.id || managementUser?.id
        console.log('🆔 [API] User DB ID:', userId)

        // 🚀 Check if user already has this reaction (toggle behavior)
        const existingReaction = await prisma.postReaction.findFirst({
          where: {
            postId,
            type: type as any,
            ...(userType === 'staff' && { staffUserId: userId }),
            ...(userType === 'client' && { clientUserId: userId }),
            ...(userType === 'management' && { managementUserId: userId }),
          }
        })

        if (existingReaction) {
          // 🚀 Remove reaction (toggle off) - handle case where reaction might already be deleted
          try {
            await prisma.postReaction.delete({
              where: { id: existingReaction.id }
            })
          } catch (error: any) {
            // If the reaction was already deleted, that's fine - treat as success
            if (error.code === 'P2025') {
              console.log('Reaction already deleted, treating as success')
            } else {
              throw error
            }
          }

          // Emit socket event for real-time updates
          const io = (global as any).socketServer
          if (io) {
            io.emit('reactionRemoved', { postId, type, userId: session.user.id })
          }

          console.log('✅ Reaction removed:', requestKey)
          return NextResponse.json({ 
            success: true, 
            action: 'removed',
            reaction: null 
          })
        } else {
          // 🚀 Add reaction (toggle on)
          try {
            const reaction = await prisma.postReaction.create({
              data: {
                postId,
                type: type as any,
                ...(userType === 'staff' && { staffUserId: userId }),
                ...(userType === 'client' && { clientUserId: userId }),
                ...(userType === 'management' && { managementUserId: userId }),
              },
            })

            // Emit socket event for real-time updates
            const io = (global as any).socketServer
            if (io) {
              io.emit('reactionAdded', { postId, type, userId: session.user.id })
            }

            console.log('✅ Reaction added:', requestKey)
            return NextResponse.json({ 
              success: true, 
              action: 'added',
              reaction 
            })
          } catch (error: any) {
            // Handle unique constraint violation - reaction already exists
            if (error.code === 'P2002') {
              console.log('Reaction already exists, treating as success')
              return NextResponse.json({ 
                success: true, 
                action: 'exists',
                reaction: null 
              })
            }
            throw error
          }
        }
      } catch (innerError: any) {
        // Catch any errors from the inner try-catch blocks
        console.error('❌ [API] Inner error caught:', innerError)
        console.error('❌ [API] Inner error details:', {
          message: innerError.message,
          code: innerError.code,
          name: innerError.name
        })
        return NextResponse.json({ 
          error: 'Failed to process reaction',
          details: innerError.message,
          code: innerError.code
        }, { status: 500 })
      } finally {
        // Remove from pending requests after processing
        pendingRequests.delete(requestKey)
        console.log('🔓 Request completed, removed from cache:', requestKey)
      }
    })()

    // Store the promise in the cache
    pendingRequests.set(requestKey, processingPromise)
    
    // Return the promise
    return processingPromise
  } catch (error: any) {
    console.error('❌ [API] Error toggling reaction:', error)
    console.error('❌ [API] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n')[0]
    })
    return NextResponse.json({ 
      error: 'Failed to toggle reaction',
      details: error.message 
    }, { status: 500 })
  }
}