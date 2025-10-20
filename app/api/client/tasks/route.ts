import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/tasks - Get all tasks created by this client
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const staffUserId = searchParams.get("staffUserId")

    // Get client user
    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      clientUserId: clientUser.id,
      ...(status && { status }),
    }

    // Get tasks created by this client
    const tasks = await prisma.task.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
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
        // Include both legacy and new assignment methods
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // If filtering by staff, do it manually (since it can be in either staffUser or assignedStaff)
    let filteredTasks = tasks
    if (staffUserId) {
      filteredTasks = tasks.filter(
        (task) =>
          task.staffUserId === staffUserId ||
          task.assignedStaff.some((assignment) => assignment.staffUserId === staffUserId)
      )
    }

    return NextResponse.json({ tasks: filteredTasks })
  } catch (error) {
    console.error("Error fetching client tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/client/tasks - Create task (single or bulk assignment)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, priority, deadline, tags, staffUserIds, attachments } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!staffUserIds || staffUserIds.length === 0) {
      return NextResponse.json({ error: "At least one staff member must be assigned" }, { status: 400 })
    }

    // Get client user
    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    // Verify all staff users belong to the client's company
    const staffUsers = await prisma.staffUser.findMany({
      where: {
        id: { in: staffUserIds },
        companyId: clientUser.companyId,
      },
    })

    if (staffUsers.length !== staffUserIds.length) {
      return NextResponse.json(
        { error: "One or more staff members do not belong to your company" },
        { status: 403 }
      )
    }

    // Create ONE task with multiple assignments
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: "TODO",
        priority: priority || "MEDIUM",
        deadline: deadline ? new Date(deadline) : null,
        tags: tags || [],
        attachments: attachments || [],
        source: "CLIENT",
        createdByType: "CLIENT",
        createdById: clientUser.id,
        clientUserId: clientUser.id,
        companyId: clientUser.companyId,
        // Create assignments for all selected staff
        assignedStaff: {
          create: staffUserIds.map((staffUserId: string) => ({
            staffUserId,
          })),
        },
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
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
        assignedStaff: {
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
          },
        },
      },
    })

    console.log(`✅ Client ${clientUser.name} created task "${title}" for ${staffUserIds.length} staff member(s)`)

    return NextResponse.json({ success: true, task }, { status: 201 })
  } catch (error) {
    console.error("Error creating client task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
