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
    const limit = parseInt(searchParams.get('limit') || '15')
    
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

    // Get total count for pagination
    const totalCount = await prisma.activityPost.count({
      where: whereClause
    })

    const posts = await prisma.activityPost.findMany({
      where: whereClause,
      skip,
      take: validLimit,
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
        clientUser: {
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
          include: {
            staffUser: {
              select: {
                id: true,
                name: true,
              },
            },
            clientUser: {
              select: {
                id: true,
                name: true,
              },
            },
            managementUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        comments: {
          include: {
            staffUser: {
              select: {
                id: true,
                name: true,
                avatar: true,
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
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Fetch tagged users if any posts have them
    const allTaggedUserIds = [...new Set(posts.flatMap(p => p.taggedUserIds || []).filter(Boolean))]
    const taggedUsers = allTaggedUserIds.length > 0 
      ? await prisma.staffUser.findMany({
          where: { id: { in: allTaggedUserIds } },
          select: { id: true, name: true, avatar: true }
        })
      : []
    
    const taggedUsersMap = new Map(taggedUsers.map(u => [u.id, u]))

    // Transform data to match frontend expectations (user instead of staffUser/clientUser/managementUser)
    const transformedPosts = posts.map(post => {
      const postUser = post.staffUser || post.clientUser || post.managementUser
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
        reactions: post.reactions.map(r => {
          const reactUser = r.staffUser || r.clientUser || r.managementUser
          return {
            id: r.id,
            type: r.type,
            user: {
              id: reactUser.id,
              name: reactUser.name
            }
          }
        }),
        comments: post.comments.map(c => {
          const commentUser = c.staffUser || c.clientUser || c.managementUser
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

    return NextResponse.json({ 
      posts: transformedPosts,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: totalCount,
        totalPages,
        hasMore
      }
    })
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

    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id }
    })

    const managementUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser && !clientUser && !managementUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const post = await prisma.activityPost.create({
      data: {
        staffUserId: staffUser?.id || null,
        clientUserId: clientUser?.id || null,
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
        clientUser: {
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

    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

