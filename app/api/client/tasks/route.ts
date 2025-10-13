import { NextRequest, NextResponse } from "next/server"
import { verifyClientAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/tasks - Fetch tasks for all staff assigned to this client
export async function GET(req: NextRequest) {
  try {
    // Verify client authentication
    const { session, error } = await verifyClientAuth()
    if (error) return error

    // Get user from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Try to get client via ClientUser table, otherwise show all tasks (for testing)
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { client: true }
    })

    let staffIds: string[] = []

    if (clientUser) {
      // Get all staff members assigned to this client
      const staffAssignments = await prisma.staffAssignment.findMany({
        where: {
          clientId: clientUser.client.id,
          isActive: true
        },
        select: { userId: true }
      })
      staffIds = staffAssignments.map(s => s.userId)
    } else {
      // For testing with regular user account, show all users
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      })
      staffIds = allUsers.map(u => u.id)
    }

    if (staffIds.length === 0) {
      return NextResponse.json({ tasks: [] })
    }

    // Fetch all tasks for these staff members
    const tasks = await prisma.task.findMany({
      where: {
        userId: {
          in: staffIds
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Error fetching client tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

// POST /api/client/tasks - Create new task(s) for staff
export async function POST(req: NextRequest) {
  try {
    // Verify client authentication
    const { session, error } = await verifyClientAuth()
    if (error) return error

    const body = await req.json()

    // Check if this is bulk task creation
    if (body.tasks && Array.isArray(body.tasks)) {
      // Bulk create
      const { userId, tasks } = body

      // For testing, allow any user to create tasks
      // In production, verify staff assignment to client

      // Create all tasks
      const createdTasks = await Promise.all(
        tasks.map((task: any) =>
          prisma.task.create({
            data: {
              id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: userId,
              title: task.title,
              description: task.description || null,
              priority: task.priority || 'MEDIUM',
              deadline: task.deadline ? new Date(task.deadline) : null,
              source: 'CLIENT',
              status: 'TODO',
              updatedAt: new Date()
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          })
        )
      )

      return NextResponse.json(
        { tasks: createdTasks, count: createdTasks.length },
        { status: 201 }
      )
    } else {
      // Single task creation
      const { userId, title, description, priority, deadline } = body

      // For testing, allow any user to create tasks
      // In production, verify staff assignment to client

      const task = await prisma.task.create({
        data: {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          title,
          description: description || null,
          priority: priority || 'MEDIUM',
          deadline: deadline ? new Date(deadline) : null,
          source: 'CLIENT',
          status: 'TODO',
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      })

      return NextResponse.json({ task }, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}



