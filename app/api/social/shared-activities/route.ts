import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 📢 UNIVERSAL SHARE ACTIVITY API
 * 
 * ONE endpoint for sharing ALL achievements across the platform:
 * - Onboarding completion 🎉
 * - Performance reviews ⭐
 * - Milestones reached 🏆
 * - Tasks completed ✅
 * - Certifications earned 📜
 * - Anniversaries 🎂
 * - Promotions 🚀
 * - Contract signed 📝
 * - First week/month complete 💪
 * 
 * User-controlled sharing: Staff CHOOSE what to share!
 * No auto-posting spam - only what they're proud of!
 * 
 * The magic: activityType + activityId + optional personal message
 */

// GET /api/shared-activities (get all shared activities for feed)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userType = searchParams.get('userType') // Filter by user type
    const activityType = searchParams.get('activityType') // Filter by activity type

    // Build filters
    const where: any = {}
    if (userType) {
      where.userType = userType
    }
    if (activityType) {
      where.activityType = activityType
    }

    // Fetch shared activities
    const activities = await prisma.shared_activities.findMany({
      where,
      orderBy: {
        sharedAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const total = await prisma.shared_activities.count({ where })

    return NextResponse.json({
      success: true,
      activities,
      total,
      limit,
      offset,
      hasMore: offset + activities.length < total
    })

  } catch (error) {
    console.error('Error fetching shared activities:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/shared-activities (share an achievement)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { activityType, activityId, message = null } = body

    // Validation
    if (!activityType || !activityId) {
      return NextResponse.json({ 
        error: "Missing activityType or activityId" 
      }, { status: 400 })
    }

    // Validate activity type
    const validActivityTypes = [
      'ONBOARDING_COMPLETE',
      'PERFORMANCE_REVIEW',
      'MILESTONE_REACHED',
      'TASK_COMPLETED',
      'CERTIFICATION_EARNED',
      'ANNIVERSARY',
      'PROMOTION',
      'CONTRACT_SIGNED',
      'FIRST_WEEK_COMPLETE',
      'FIRST_MONTH_COMPLETE'
    ]
    if (!validActivityTypes.includes(activityType)) {
      return NextResponse.json({ 
        error: "Invalid activity type" 
      }, { status: 400 })
    }

    // Get user type and details
    const userType = await getUserType(session.user.id)
    if (!userType) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check permissions - can this user share this activity?
    const canShare = await canShareActivity(
      session.user.id,
      userType.type,
      activityType,
      activityId
    )

    if (!canShare) {
      return NextResponse.json({ 
        error: "You don't have permission to share this activity" 
      }, { status: 403 })
    }

    // Check if already shared (prevent duplicates)
    const existingShare = await prisma.shared_activities.findFirst({
      where: {
        activityType,
        activityId,
        userId: userType.userId
      }
    })

    if (existingShare) {
      return NextResponse.json({ 
        error: "You've already shared this activity" 
      }, { status: 400 })
    }

    // Verify the activity exists and get details
    const activityDetails = await getActivityDetails(activityType, activityId)
    if (!activityDetails) {
      return NextResponse.json({ 
        error: "Activity not found" 
      }, { status: 404 })
    }

    // Create shared activity
    const sharedActivity = await prisma.shared_activities.create({
      data: {
        activityType,
        activityId,
        userId: userType.userId,
        userType: userType.type,
        userName: userType.name,
        userAvatar: userType.avatar,
        message: message?.trim() || null,
        sharedAt: new Date()
      }
    })

    // TODO: Emit WebSocket event for real-time feed updates
    // io.emit('activity:shared', sharedActivity)

    // TODO: Create notifications for followers/company
    // await createActivityNotifications(sharedActivity)

    console.log(`📢 Activity shared: ${userType.name} shared ${activityType}`)

    return NextResponse.json({
      success: true,
      sharedActivity,
      message: "Activity shared to feed!"
    }, { status: 201 })

  } catch (error) {
    console.error('Error sharing activity:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/shared-activities?id=xxx (unshare - remove from feed)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        error: "Missing activity id" 
      }, { status: 400 })
    }

    // Get user type
    const userType = await getUserType(session.user.id)
    if (!userType) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get existing shared activity
    const existingActivity = await prisma.shared_activities.findUnique({
      where: { id }
    })

    if (!existingActivity) {
      return NextResponse.json({ 
        error: "Shared activity not found" 
      }, { status: 404 })
    }

    // Check ownership - only the author can delete (or admin)
    const isOwner = existingActivity.userId === userType.userId
    const isAdmin = userType.type === 'MANAGEMENT'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ 
        error: "You can only unshare your own activities" 
      }, { status: 403 })
    }

    // Delete shared activity
    await prisma.shared_activities.delete({
      where: { id }
    })

    console.log(`🗑️ Activity unshared: ${userType.name} removed ${existingActivity.activityType}`)

    return NextResponse.json({
      success: true,
      message: "Activity removed from feed"
    })

  } catch (error) {
    console.error('Error deleting shared activity:', error)
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
 * Check if user can share this activity
 */
async function canShareActivity(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  activityType: string,
  activityId: string
): Promise<boolean> {
  // Management can share anything
  if (userType === 'MANAGEMENT') {
    return true
  }

  // Context-specific checks
  switch (activityType) {
    case 'ONBOARDING_COMPLETE':
      // Staff can share their own onboarding completion
      return await canAccessOnboarding(authUserId, userType, activityId)

    case 'PERFORMANCE_REVIEW':
      // Staff can share their own reviews (if positive!)
      return await canAccessReview(authUserId, userType, activityId)

    case 'TASK_COMPLETED':
      // Staff can share tasks they completed
      return await canAccessTask(authUserId, userType, activityId)

    case 'CONTRACT_SIGNED':
      // Staff can share their contract signing
      return await canAccessContract(authUserId, userType, activityId)

    case 'FIRST_WEEK_COMPLETE':
    case 'FIRST_MONTH_COMPLETE':
    case 'ANNIVERSARY':
      // Staff can share their own milestones
      // These are tied to their staff profile
      return userType === 'STAFF'

    case 'CERTIFICATION_EARNED':
    case 'PROMOTION':
    case 'MILESTONE_REACHED':
      // Staff can share their achievements
      return userType === 'STAFF'

    default:
      return false
  }
}

/**
 * Get activity details to verify it exists
 */
async function getActivityDetails(activityType: string, activityId: string) {
  switch (activityType) {
    case 'ONBOARDING_COMPLETE':
      return await prisma.staff_onboarding.findUnique({
        where: { id: activityId },
        select: { id: true, staffUserId: true, isComplete: true }
      })

    case 'PERFORMANCE_REVIEW':
      return await prisma.staff_performance_reviews.findUnique({
        where: { id: activityId },
        select: { id: true, staffUserId: true, status: true }
      })

    case 'TASK_COMPLETED':
      return await prisma.staff_tasks.findUnique({
        where: { id: activityId },
        select: { id: true, staffUserId: true, status: true }
      })

    case 'CONTRACT_SIGNED':
      return await prisma.staff_employment_contracts.findUnique({
        where: { id: activityId },
        select: { id: true, staffUserId: true, signedAt: true }
      })

    default:
      // For milestones, anniversaries, etc. that don't have specific tables
      // We'd need to verify against staff profile or other data
      return { id: activityId }
  }
}

/**
 * Context-specific permission checks (reuse from comments/reactions)
 */

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

async function canAccessContract(
  authUserId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT',
  contractId: string
): Promise<boolean> {
  if (userType !== 'STAFF') return false

  const contract = await prisma.staff_employment_contracts.findFirst({
    where: { 
      id: contractId,
      staffUserId: (await prisma.staff_users.findUnique({ 
        where: { authUserId }, 
        select: { id: true } 
      }))?.id
    }
  })
  return !!contract
}

