import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/tasks - Fetch all tasks for staff assigned to this client's company
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

    // Get all staff members assigned to this company
    const staffUsers = await prisma.staffUser.findMany({
      where: { companyId: clientUser.company.id },
      select: { id: true, name: true, avatar: true, email: true }
    })
    
    const staffIds = staffUsers.map(s => s.id)

    if (staffIds.length === 0) {
      return NextResponse.json({ tasks: [], staff: [] })
    }

    // Fetch all tasks for these staff members (visible across all portals)
    const tasks = await prisma.task.findMany({
      where: {
        staffUserId: {
          in: staffIds
        }
      },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        company: {
          select: {
            id: true,
            companyName: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ tasks, staff: staffUsers })
  } catch (error) {
    console.error("Error fetching client tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

// POST /api/client/tasks - Create new task(s) for staff (created by client)
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

    const { staffUserId, title, description, priority, deadline } = body

    if (!staffUserId || !title) {
      return NextResponse.json({ error: "Staff user and title are required" }, { status: 400 })
    }

    // Verify staff is assigned to this client's company
    const staffUser = await prisma.staffUser.findFirst({
      where: {
        id: staffUserId,
        companyId: clientUser.company.id
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff not assigned to your organization" }, { status: 403 })
    }

    // Create task with 3-way sync support
    const task = await prisma.task.create({
      data: {
        staffUserId: staffUser.id,
        companyId: clientUser.company.id,
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        deadline: deadline ? new Date(deadline) : null,
        source: 'CLIENT',
        status: 'TODO',
        createdByType: 'CLIENT',
        createdById: clientUser.id,
      },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        company: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}
