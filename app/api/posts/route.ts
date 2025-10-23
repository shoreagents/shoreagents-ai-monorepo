import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/posts - Get all activity posts
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const audienceFilter = searchParams.get('audience')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10') // Reduced from 15 to 10 for faster initial load
    
    // Validate pagination params
    const validPage = Math.max(1, page)
    const validLimit = Math.min(Math.max(1, limit), 50) // Max 50 posts per page
    const skip = (validPage - 1) * validLimit

    // Build where clause based on audience filter
    // If filtering by a specific audience, show posts for that audience AND posts for ALL
    const whereClause: any = {}
    if (audienceFilter && audienceFilter !== 'ALL_FILTER') {
      whereClause.audience = {
        in: [audienceFilter, 'ALL']
      }
    }

    // 🚀 Get current user's database ID (not auth ID)
    const [currentStaffUser, currentClientUser, currentManagementUser] = await Promise.all([
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

    const currentUserDbId = currentStaffUser?.id || currentClientUser?.id || currentManagementUser?.id

    // Get total count for pagination
    const totalCount = await prisma.activityPost.count({
      where: whereClause
    })

    // Optimize the query by reducing nested includes and using select
    const posts = await prisma.activityPost.findMany({
      where: whereClause,
      skip,
      take: validLimit,
      select: {
        id: true,
        type: true,
        content: true,
        images: true,
        createdAt: true,
        taggedUserIds: true,
        audience: true,
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        managementUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        reactions: {
          select: {
            id: true,
            type: true,
            createdAt: true,
            staffUser: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            client_users: {
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
              },
            },
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            staffUser: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            client_users: {
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
              },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 5, // Limit comments to 5 per post for performance
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Fetch tagged users if any posts have them (check all user types)
    const allTaggedUserIds = [...new Set(posts.flatMap(p => p.taggedUserIds || []).filter(Boolean))]
    
    let taggedUsers: Array<{ id: string; name: string; avatar: string | null }> = []
    if (allTaggedUserIds.length > 0) {
      // Fetch from all user tables
      const [staffUsers, clientUsers, managementUsers] = await Promise.all([
        prisma.staffUser.findMany({
          where: { id: { in: allTaggedUserIds } },
          select: { id: true, name: true, avatar: true }
        }),
        prisma.clientUser.findMany({
          where: { id: { in: allTaggedUserIds } },
          select: { id: true, name: true, avatar: true }
        }),
        prisma.managementUser.findMany({
          where: { id: { in: allTaggedUserIds } },
          select: { id: true, name: true, avatar: true }
        })
      ])
      
      // Combine all users
      taggedUsers = [...staffUsers, ...clientUsers, ...managementUsers]
    }
    
    const taggedUsersMap = new Map(taggedUsers.map(u => [u.id, u]))

    // Transform data to match frontend expectations (user instead of staffUser/client_users/managementUser)
    const transformedPosts = posts.map(post => {
      const postUser = post.staffUser || post.clientUser || post.managementUser
      if (!postUser) {
        throw new Error(`Post ${post.id} has no associated user`)
      }

      // 🚀 Facebook-style reaction analytics
      const reactionStats = post.reactions.reduce((acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // 🚀 User-specific reaction tracking (like Twitter)
      // Compare with database user ID, not auth user ID
      const currentUserReactions = post.reactions.filter(r => {
        const reactUser = r.staffUser || r.clientUser || r.managementUser
        return reactUser?.id === currentUserDbId
      })

      // 🚀 Recent reactions timeline (like LinkedIn)
      const recentReactions = post.reactions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(r => {
          const reactUser = r.staffUser || r.clientUser || r.managementUser
          if (!reactUser) {
            throw new Error(`Reaction ${r.id} has no associated user`)
          }
          return {
            id: r.id,
            type: r.type,
            createdAt: r.createdAt.toISOString(),
            user: {
              id: reactUser.id,
              name: reactUser.name,
              avatar: reactUser.avatar || null
            }
          }
        })

      return {
        id: post.id,
        content: post.content,
        type: post.type,
        images: post.images,
        taggedUsers: post.taggedUserIds.map(id => taggedUsersMap.get(id)).filter(Boolean),
        audience: post.audience,
        createdAt: post.createdAt.toISOString(),
        user: {
          id: postUser.id,
          name: postUser.name,
          avatar: postUser.avatar,
          role: post.staffUser?.role || post.managementUser?.role || 'Client'
        },
        // 🚀 Enhanced reaction data
        reactions: post.reactions.map(r => {
          const reactUser = r.staffUser || r.clientUser || r.managementUser
          if (!reactUser) {
            throw new Error(`Reaction ${r.id} has no associated user`)
          }
          return {
            id: r.id,
            type: r.type,
            createdAt: r.createdAt.toISOString(),
            user: {
              id: reactUser.id,
              name: reactUser.name,
              avatar: reactUser.avatar || null
            }
          }
        }),
        // 🚀 Facebook-style reaction analytics
        reactionStats,
        // 🚀 User's reactions to this post
        userReactions: currentUserReactions.map(r => r.type),
        // 🚀 Recent reactions timeline
        recentReactions,
        // 🚀 Total reaction count
        totalReactions: post.reactions.length,
        comments: post.comments.map(c => {
          const commentUser = c.staffUser || c.clientUser || c.managementUser
          if (!commentUser) {
            throw new Error(`Comment ${c.id} has no associated user`)
          }
          return {
            id: c.id,
            content: c.content,
            createdAt: c.createdAt.toISOString(),
            user: {
              id: commentUser.id,
              name: commentUser.name,
              avatar: commentUser.avatar
            }
          }
        })
      }
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validLimit)
    const hasMore = validPage < totalPages

    // Create response with caching headers
    const response = NextResponse.json({ 
      posts: transformedPosts,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: totalCount,
        totalPages,
        hasMore
      }
    })
    
    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    
    return response
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create a new activity post
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, type, achievement, images, taggedUserIds, audience } = body

    if (!content || !type) {
      return NextResponse.json(
        { error: "Content and type are required" },
        { status: 400 }
      )
    }

    // Check if it's a staff user, client user, or management user
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    const client_users = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id }
    })

    const managementUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser && !client_users && !managementUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const post = await prisma.activityPost.create({
      data: {
        staffUserId: staffUser?.id || null,
        client_usersId: client_users?.id || null,
        managementUserId: managementUser?.id || null,
        content,
        type,
        achievement: achievement || null,
        images: images || [],
        taggedUserIds: taggedUserIds || [],
        audience: audience || 'ALL',
      },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        managementUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        reactions: true,
        comments: true,
      },
    })

    // 🔔 Create notifications for tagged users
    if (taggedUserIds && taggedUserIds.length > 0) {
      const postUser = staffUser || clientUser || managementUser
      if (!postUser) {
        throw new Error('No user found for post creation')
      }
      const postUserName = postUser.name
      
      // Create notification for each tagged user
      const notificationPromises = taggedUserIds.map((userId: string) =>
        prisma.notification.create({
          data: {
            userId,
            type: 'TAG',
            title: `${postUserName} tagged you in a post`,
            message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            postId: post.id,
            actionUrl: `/activity?postId=${post.id}`,
            read: false
          }
        })
      )
      
      await Promise.all(notificationPromises)
      console.log(`🔔 [Notifications] Created ${taggedUserIds.length} tag notifications for post ${post.id}`)
    }

    // 🔥 Emit real-time event to all connected clients
    const io = (global as any).socketServer
    if (io) {
      const postUser = staffUser || clientUser || managementUser
      if (!postUser) {
        throw new Error('No user found for WebSocket emission')
      }
      io.emit('activity:newPost', {
        id: post.id,
        content: post.content,
        type: post.type,
        images: post.images,
        audience: post.audience,
        createdAt: post.createdAt.toISOString(),
        user: {
          id: postUser.id,
          name: postUser.name,
          avatar: postUser.avatar,
          role: staffUser?.role || managementUser?.role || 'Client'
        },
        reactions: [],
        comments: []
      })
      console.log('🔥 [WebSocket] New post emitted:', post.id)
      
      // 🔔 Emit notification events to tagged users
      if (taggedUserIds && taggedUserIds.length > 0) {
        taggedUserIds.forEach((userId: string) => {
          io.to(`user:${userId}`).emit('notification:new', {
            userId,
            postId: post.id,
            title: `${postUser.name} tagged you in a post`,
            message: content.substring(0, 100) + (content.length > 100 ? '...' : '')
          })
        })
        console.log(`🔔 [WebSocket] Notification emitted to ${taggedUserIds.length} tagged users`)
      }
    }

    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

