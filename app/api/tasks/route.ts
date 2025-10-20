import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/tasks - Get all tasks for current staff user (includes tasks from all sources)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Get staff user first
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Get legacy tasks (old method with staffUserId)
    const legacyTasks = await prisma.task.findMany({
      where: {
        staffUserId: staffUser.id,
        ...(status && { status }),
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
          }
        },
        clientUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Get new tasks (via TaskAssignment)
    const taskAssignments = await prisma.taskAssignment.findMany({
      where: {
        staffUserId: staffUser.id,
      },
      include: {
        task: {
          include: {
            company: {
              select: {
                id: true,
                companyName: true,
              }
            },
            clientUser: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              }
            },
            assignedStaff: {
              include: {
                staffUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    role: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    // Extract tasks from assignments and filter by status if needed
    const newTasks = taskAssignments
      .map(assignment => assignment.task)
      .filter(task => !status || task.status === status)

    // Combine and dedupe tasks
    const allTasks = [...legacyTasks, ...newTasks]
    const uniqueTasks = Array.from(new Map(allTasks.map(task => [task.id, task])).values())
    
    // Sort by createdAt desc
    uniqueTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ tasks: uniqueTasks })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create a new task (created by staff for themselves)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      deadline,
      tags,
      attachments,
    } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Get staff user first
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Create task for themselves using new TaskAssignment method
    const task = await prisma.task.create({
      data: {
        companyId: staffUser.companyId,
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        deadline: deadline ? new Date(deadline) : null,
        tags: tags || [],
        attachments: attachments || [],
        source: "SELF",
        createdByType: "STAFF",
        createdById: staffUser.id,
        // Use new assignment method
        assignedStaff: {
          create: {
            staffUserId: staffUser.id,
          }
        }
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
          }
        },
        assignedStaff: {
          include: {
            staffUser: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              }
            }
          }
        }
      }
    })

    console.log(`✅ Staff ${staffUser.name} created self-task "${title}"`)

    return NextResponse.json({ success: true, task }, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
