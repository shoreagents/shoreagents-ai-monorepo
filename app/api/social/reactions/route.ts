import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 🎉 UNIVERSAL REACTIONS API
 * 
 * ONE endpoint for ALL reaction types across the platform:
 * - Tickets (staff, client, management)
 * - Tasks
 * - Documents
 * - Posts
 * - Reviews
 * - Onboarding
 * - Comments (yes, you can react to comments!)
 * - Time Entries
 * - Staff Profiles
 * - Performance Metrics
 * 
 * Reaction Types: 👍 LIKE, ❤️ LOVE, 🎉 CELEBRATE, 🔥 FIRE, 👏 CLAP, 
 *                 😂 LAUGH, 💩 POO, 🚀 ROCKET, 😲 SHOCKED, 🤯 MIND_BLOWN
 * 
 * The magic: reactableType + reactableId + ONE reaction per user
 */

// GET /api/reactions?reactableType=TICKET&reactableId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reactableType = searchParams.get('reactableType')
    const reactableId = searchParams.get('reactableId')

    if (!reactableType || !reactableId) {
      return NextResponse.json({ 
        error: "Missing reactableType or reactableId" 
      }, { status: 400 })
    }

    // Get user type (staff, client, or management)
    const userType = await getUserType(session.user.id)
    if (!userType) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check permissions - can this user view reactions on this entity?
    const canView = await canViewReactions(
      session.user.id,
      userType.type,
      reactableType,
      reactableId
    )

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all reactions for this entity
    const reactions = await prisma.reactions.findMany({
      where: {
        reactableType,
        reactableId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group by reaction type and count
    const reactionCounts = reactions.reduce((acc, reaction) => {
      const type = reaction.reactionType
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          users: []
        }
      }
      acc[type].count++
      acc[type].users.push({
        userId: reaction.userId,
        userName: reaction.userName,
        userAvatar: reaction.userAvatar,
        userType: reaction.userType
      })
      return acc
    }, {} as Record<string, { count: number; users: any[] }>)

    // Get current user's reaction (if any)
    const userReaction = reactions.find(r => r.userId === userType.userId)

    return NextResponse.json({
      success: true,
      reactions: reactionCounts,
      userReaction: userReaction?.reactionType || null,
      totalReactions: reactions.length
    })

  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/reactions (add or change reaction)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { reactableType, reactableId, reactionType } = body

    // Validation
    if (!reactableType || !reactableId || !reactionType) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 })
    }

    // Validate reaction type
    const validReactions = [
      'LIKE', 'LOVE', 'CELEBRATE', 'FIRE', 'CLAP', 
      'LAUGH', 'POO', 'ROCKET', 'SHOCKED', 'MIND_BLOWN'
    ]
    if (!validReactions.includes(reactionType)) {
      return NextResponse.json({ 
        error: "Invalid reaction type" 
      }, { status: 400 })
    }

    // Get user type and details
    const userType = await getUserType(session.user.id)
    if (!userType) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check permissions - can this user react to this entity?
    const canReact = await canAddReaction(
      session.user.id,
      userType.type,
      reactableType,
      reactableId
    )

    if (!canReact) {
      return NextResponse.json({ 
        error: "You don't have permission to react to this" 
      }, { status: 403 })
    }

    // Check if user already reacted
    const existingReaction = await prisma.reactions.findFirst({
      where: {
        reactableType,
        reactableId,
        userId: userType.userId
      }
    })

    let reaction

    if (existingReaction) {
      // User already reacted - UPDATE their reaction
      reaction = await prisma.reactions.update({
        where: { id: existingReaction.id },
        data: {
          reactionType,
          updatedAt: new Date()
        }
      })
      console.log(`🔄 Reaction changed: ${userType.name} changed to ${reactionType} on ${reactableType}`)
    } else {
      // New reaction - CREATE
      reaction = await prisma.reactions.create({
        data: {
          reactableType,
          reactableId,
          userId: userType.userId,
          userType: userType.type,
          userName: userType.name,
          userAvatar: userType.avatar,
          reactionType,
          createdAt: new Date()
        }
      })
      console.log(`✅ New reaction: ${userType.name} reacted ${reactionType} on ${reactableType}`)
    }

    // TODO: Emit WebSocket event for real-time updates
    // io.to(`${reactableType}-${reactableId}`).emit('reaction:update', reaction)

    // TODO: Create notification for entity owner
    // await createReactionNotification(reaction, reactableType, reactableId)

    return NextResponse.json({
      success: true,
      reaction,
      message: existingReaction ? 'Reaction updated' : 'Reaction added'
    }, { status: 200 })

  } catch (error) {
    console.error('Error adding reaction:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/reactions?reactableType=X&reactableId=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reactableType = searchParams.get('reactableType')
    const reactableId = searchParams.get('reactableId')

    if (!reactableType || !reactableId) {
      return NextResponse.json({ 
        error: "Missing reactableType or reactableId" 
      }, { status: 400 })
    }

    // Get user type
    const userType = await getUserType(session.user.id)
    if (!userType) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find user's reaction
    const existingReaction = await prisma.reactions.findFirst({
      where: {
        reactableType,
        reactableId,
        userId: userType.userId
      }
    })

    if (!existingReaction) {
      return NextResponse.json({ 
        error: "You haven't reacted to this" 
      }, { status: 404 })
    }

    // Delete reaction
    await prisma.reactions.delete({
      where: { id: existingReaction.id }
    })

    console.log(`🗑️ Reaction removed: ${userType.name} removed ${existingReaction.reactionType} from ${reactableType}`)

    return NextResponse.json({
      success: true,
      message: "Reaction removed"
    })

  } catch (error) {
    console.error('Error removing reaction:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get user type and details from auth ID
 */
async function getUserType(authUserId: string) {
  // Check if staff
  const staff = await prisma.staff_users.findUnique({
    where: { authUserId },
    select: { id: true, name: true, avatar: true }
  })
  if (staff) {
    return {
      type: 'STAFF' as const,
      userId: staff.id,
      name: staff.name,
      avatar: staff.avatar
    }
  }

  // Check if client
  const client = await prisma.client_users.findUnique({
    where: { authUserId },
    select: { id: true, name: true, avatar: true }
  })
  if (client) {
    return {
      type: 'CLIENT' as const,
      userId: client.id,
      name: client.name,
      avatar: client.avatar
    }
  }

  // Check if management
  const management = await prisma.management_users.findUnique({
    where: { authUserId },
    select: { id: true, name: true, avatar: true }
  })
  if (management) {
    return {
      type: 'MANAGEMENT' as const,
      userId: management.id,
      name: management.name,
      avatar: management.avatar
    }
  }

  return null
}

/**
 * Check if user can VIEW reactions on this entity
 */
async function canViewReactions(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  reactableType: string,
  reactableId: string
): Promise<boolean> {
  // Management can view ALL reactions
  if (userType === 'MANAGEMENT') {
    return true
  }

  // Use same permission logic as comments
  // If you can view the entity, you can see reactions
  switch (reactableType) {
    case 'TICKET':
      return await canAccessTicket(authUserId, userType, reactableId)

    case 'TASK':
      return await canAccessTask(authUserId, userType, reactableId)

    case 'DOCUMENT':
      return await canAccessDocument(authUserId, userType, reactableId)

    case 'POST':
      // Public posts - everyone can view
      return true

    case 'COMMENT':
      // If you can see the comment, you can see its reactions
      return await canAccessComment(authUserId, userType, reactableId)

    case 'ONBOARDING':
      return await canAccessOnboarding(authUserId, userType, reactableId)

    case 'REVIEW':
      return await canAccessReview(authUserId, userType, reactableId)

    case 'TIME_ENTRY':
      return await canAccessTimeEntry(authUserId, userType, reactableId)

    default:
      // Unknown type - deny by default
      return false
  }
}

/**
 * Check if user can ADD reactions to this entity
 */
async function canAddReaction(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  reactableType: string,
  reactableId: string
): Promise<boolean> {
  // Same logic as viewing
  return await canViewReactions(authUserId, userType, reactableType, reactableId)
}

/**
 * Context-specific permission checks (reuse from comments API)
 */

async function canAccessTicket(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  ticketId: string
): Promise<boolean> {
  if (userType === 'STAFF') {
    const ticket = await prisma.staff_tickets.findFirst({
      where: { 
        id: ticketId,
        staffUserId: (await prisma.staff_users.findUnique({ 
          where: { authUserId }, 
          select: { id: true } 
        }))?.id
      }
    })
    return !!ticket
  }

  if (userType === 'CLIENT') {
    const ticket = await prisma.client_tickets.findFirst({
      where: { 
        id: ticketId,
        clientUserId: (await prisma.client_users.findUnique({ 
          where: { authUserId }, 
          select: { id: true } 
        }))?.id
      }
    })
    return !!ticket
  }

  return false
}

async function canAccessTask(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  taskId: string
): Promise<boolean> {
  const task = await prisma.staff_tasks.findUnique({
    where: { id: taskId }
  })

  if (!task) return false

  if (userType === 'STAFF') {
    const staff = await prisma.staff_users.findUnique({ 
      where: { authUserId }, 
      select: { id: true } 
    })
    return task.staffUserId === staff?.id
  }

  if (userType === 'CLIENT') {
    const client = await prisma.client_users.findUnique({ 
      where: { authUserId }, 
      select: { id: true } 
    })
    return task.clientUserId === client?.id
  }

  return false
}

async function canAccessDocument(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  documentId: string
): Promise<boolean> {
  if (userType === 'STAFF') {
    const doc = await prisma.staff_documents.findFirst({
      where: { 
        id: documentId,
        staffUserId: (await prisma.staff_users.findUnique({ 
          where: { authUserId }, 
          select: { id: true } 
        }))?.id
      }
    })
    return !!doc
  }

  if (userType === 'CLIENT') {
    const doc = await prisma.client_documents.findFirst({
      where: { id: documentId }
    })
    // TODO: Check if document is shared with this client
    return !!doc
  }

  return false
}

async function canAccessComment(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  commentId: string
): Promise<boolean> {
  // Get the comment
  const comment = await prisma.comments.findUnique({
    where: { id: commentId }
  })

  if (!comment) return false

  // Check if user can access the parent entity
  return await canViewReactions(
    authUserId,
    userType,
    comment.commentableType,
    comment.commentableId
  )
}

async function canAccessOnboarding(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  onboardingId: string
): Promise<boolean> {
  if (userType !== 'STAFF') return false

  const onboarding = await prisma.staff_onboarding.findFirst({
    where: { 
      id: onboardingId,
      staffUserId: (await prisma.staff_users.findUnique({ 
        where: { authUserId }, 
        select: { id: true } 
      }))?.id
    }
  })
  return !!onboarding
}

async function canAccessReview(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  reviewId: string
): Promise<boolean> {
  const review = await prisma.staff_performance_reviews.findUnique({
    where: { id: reviewId }
  })

  if (!review) return false

  if (userType === 'STAFF') {
    const staff = await prisma.staff_users.findUnique({ 
      where: { authUserId }, 
      select: { id: true } 
    })
    return review.staffUserId === staff?.id
  }

  if (userType === 'CLIENT') {
    const client = await prisma.client_users.findUnique({ 
      where: { authUserId }, 
      select: { id: true } 
    })
    return review.clientUserId === client?.id
  }

  return false
}

async function canAccessTimeEntry(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  timeEntryId: string
): Promise<boolean> {
  if (userType !== 'STAFF') return false

  const timeEntry = await prisma.staff_time_entries.findFirst({
    where: { 
      id: timeEntryId,
      staffUserId: (await prisma.staff_users.findUnique({ 
        where: { authUserId }, 
        select: { id: true } 
      }))?.id
    }
  })
  return !!timeEntry
}

