import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 🌍 UNIVERSAL COMMENTS API
 * 
 * ONE endpoint for ALL comment types across the platform:
 * - Tickets (staff, client, management)
 * - Tasks
 * - Documents
 * - Posts
 * - Reviews
 * - Onboarding
 * - Job Acceptances
 * - Contracts
 * - Personal Records
 * - Time Entries
 * - Staff Profiles
 * 
 * The magic: commentableType + commentableId
 */

// GET /api/comments?commentableType=TICKET&commentableId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const commentableType = searchParams.get('commentableType')
    const commentableId = searchParams.get('commentableId')

    if (!commentableType || !commentableId) {
      return NextResponse.json({ 
        error: "Missing commentableType or commentableId" 
      }, { status: 400 })
    }

    // Get user type (staff, client, or management)
    const userType = await getUserType(session.user.id)
    if (!userType) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check permissions - can this user view comments on this entity?
    const canView = await canViewComments(
      session.user.id,
      userType.type,
      commentableType,
      commentableId
    )

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch comments (including nested replies)
    const comments = await prisma.comments.findMany({
      where: {
        commentableType,
        commentableId,
        parentId: null // Only get top-level comments
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await prisma.comments.findMany({
          where: {
            parentId: comment.id
          },
          orderBy: {
            createdAt: 'asc'
          }
        })
        return {
          ...comment,
          replies
        }
      })
    )

    return NextResponse.json({
      success: true,
      comments: commentsWithReplies,
      count: comments.length
    })

  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/comments
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { 
      commentableType, 
      commentableId, 
      content, 
      attachments = [],
      parentId = null 
    } = body

    // Validation
    if (!commentableType || !commentableId || !content) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 })
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ 
        error: "Comment cannot be empty" 
      }, { status: 400 })
    }

    // Get user type and details
    const userType = await getUserType(session.user.id)
    if (!userType) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check permissions - can this user comment on this entity?
    const canComment = await canAddComment(
      session.user.id,
      userType.type,
      commentableType,
      commentableId
    )

    if (!canComment) {
      return NextResponse.json({ 
        error: "You don't have permission to comment on this" 
      }, { status: 403 })
    }

    // If replying, verify parent comment exists
    if (parentId) {
      const parentComment = await prisma.comments.findUnique({
        where: { id: parentId }
      })
      if (!parentComment) {
        return NextResponse.json({ 
          error: "Parent comment not found" 
        }, { status: 404 })
      }
    }

    // Create comment
    const comment = await prisma.comments.create({
      data: {
        commentableType,
        commentableId,
        userId: userType.userId,
        userType: userType.type,
        userName: userType.name,
        userAvatar: userType.avatar,
        content: content.trim(),
        attachments: attachments || [],
        parentId,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // TODO: Emit WebSocket event for real-time updates
    // io.to(`${commentableType}-${commentableId}`).emit('comment:new', comment)

    // TODO: Create notification for relevant users
    // await createCommentNotification(comment, commentableType, commentableId)

    console.log(`✅ Comment created: ${userType.type} ${userType.name} on ${commentableType} ${commentableId}`)

    return NextResponse.json({
      success: true,
      comment
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/comments (edit comment)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { commentId, content } = body

    if (!commentId || !content) {
      return NextResponse.json({ 
        error: "Missing commentId or content" 
      }, { status: 400 })
    }

    // Get user type
    const userType = await getUserType(session.user.id)
    if (!userType) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get existing comment
    const existingComment = await prisma.comments.findUnique({
      where: { id: commentId }
    })

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check ownership - only the author can edit
    if (existingComment.userId !== userType.userId) {
      return NextResponse.json({ 
        error: "You can only edit your own comments" 
      }, { status: 403 })
    }

    // Update comment
    const updatedComment = await prisma.comments.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log(`✏️ Comment edited: ${commentId} by ${userType.name}`)

    return NextResponse.json({
      success: true,
      comment: updatedComment
    })

  } catch (error) {
    console.error('Error editing comment:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/comments?commentId=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json({ 
        error: "Missing commentId" 
      }, { status: 400 })
    }

    // Get user type
    const userType = await getUserType(session.user.id)
    if (!userType) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get existing comment
    const existingComment = await prisma.comments.findUnique({
      where: { id: commentId }
    })

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check ownership - only the author can delete (or admin)
    const isOwner = existingComment.userId === userType.userId
    const isAdmin = userType.type === 'MANAGEMENT' // Management can delete any comment

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ 
        error: "You can only delete your own comments" 
      }, { status: 403 })
    }

    // Delete comment (and all replies cascade)
    await prisma.comments.delete({
      where: { id: commentId }
    })

    console.log(`🗑️ Comment deleted: ${commentId} by ${userType.name}`)

    return NextResponse.json({
      success: true,
      message: "Comment deleted"
    })

  } catch (error) {
    console.error('Error deleting comment:', error)
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
 * Check if user can VIEW comments on this entity
 */
async function canViewComments(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  commentableType: string,
  commentableId: string
): Promise<boolean> {
  // Management can view ALL comments
  if (userType === 'MANAGEMENT') {
    return true
  }

  // Context-specific permissions
  switch (commentableType) {
    case 'TICKET':
      // Can view if you created the ticket or it's assigned to you
      return await canAccessTicket(authUserId, userType, commentableId)

    case 'TASK':
      // Can view if you're assigned to the task or created it
      return await canAccessTask(authUserId, userType, commentableId)

    case 'DOCUMENT':
      // Can view if document is shared with you
      return await canAccessDocument(authUserId, userType, commentableId)

    case 'POST':
      // Public posts - everyone can view
      return true

    case 'ONBOARDING':
      // Staff can view their own, management can view all
      return await canAccessOnboarding(authUserId, userType, commentableId)

    case 'JOB_ACCEPTANCE':
      // Staff can view their own
      return await canAccessJobAcceptance(authUserId, userType, commentableId)

    case 'REVIEW':
      // Staff can view their own reviews
      return await canAccessReview(authUserId, userType, commentableId)

    case 'TIME_ENTRY':
      // Staff can view their own time entries
      return await canAccessTimeEntry(authUserId, userType, commentableId)

    default:
      // Unknown type - deny by default
      return false
  }
}

/**
 * Check if user can ADD comments to this entity
 */
async function canAddComment(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  commentableType: string,
  commentableId: string
): Promise<boolean> {
  // Same logic as viewing for now
  // Can be customized per entity (e.g., staff can view but not comment on reviews)
  return await canViewComments(authUserId, userType, commentableType, commentableId)
}

/**
 * Context-specific permission checks
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

  // Management ticket
  const ticket = await prisma.management_tickets.findFirst({
    where: { id: ticketId }
  })
  return !!ticket
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
  // Check in appropriate document table based on user type
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

async function canAccessJobAcceptance(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  jobAcceptanceId: string
): Promise<boolean> {
  if (userType !== 'STAFF') return false

  const jobAcceptance = await prisma.staff_job_acceptances.findFirst({
    where: { 
      id: jobAcceptanceId,
      staffUserId: (await prisma.staff_users.findUnique({ 
        where: { authUserId }, 
        select: { id: true } 
      }))?.id
    }
  })
  return !!jobAcceptance
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

