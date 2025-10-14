import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/tasks - Fetch tasks for all staff assigned to this client
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Get all staff members assigned to this client
    const staffAssignments = await prisma.staffAssignment.findMany({
      where: {
        companyId: clientUser.company.id,
        isActive: true
      },
      select: { userId: true }
    })
    
    const staffIds = staffAssignments.map(s => s.userId)

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
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Get ClientUser
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Check if this is bulk task creation
    if (body.tasks && Array.isArray(body.tasks)) {
      // Bulk create
      const { userId, tasks } = body

      // Verify staff is assigned to this client
      const assignment = await prisma.staffAssignment.findFirst({
        where: {
          userId,
          companyId: clientUser.company.id,
          isActive: true
        }
      })

      if (!assignment) {
        return NextResponse.json({ error: "Staff not assigned to your organization" }, { status: 403 })
      }

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

      // Verify staff is assigned to this client
      const assignment = await prisma.staffAssignment.findFirst({
        where: {
          userId,
          companyId: clientUser.company.id,
          isActive: true
        }
      })

      if (!assignment) {
        return NextResponse.json({ error: "Staff not assigned to your organization" }, { status: 403 })
      }

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



