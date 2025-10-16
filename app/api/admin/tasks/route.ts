import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET /api/admin/tasks - Get ALL tasks across all companies (admin view)
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const companyId = searchParams.get("companyId")
    const source = searchParams.get("source") // SELF, CLIENT, MANAGEMENT
    const status = searchParams.get("status")
    const createdByType = searchParams.get("createdByType") // STAFF, CLIENT, ADMIN

    const where: any = {}

    // Filter by specific staff
    if (staffId) {
      where.staffUserId = staffId
    }

    // Filter by company
    if (companyId) {
      where.companyId = companyId
    }

    // Filter by source
    if (source) {
      where.source = source
    }

    // Filter by creator type
    if (createdByType) {
      where.createdByType = createdByType
    }

    // Filter by status
    if (status) {
      where.status = status
    }

    const tasks = await prisma.task.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tasks, count: tasks.length })
  } catch (error) {
    console.error("Error fetching admin tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

// POST /api/admin/tasks - Create a new task for a staff member (created by admin)
export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      staffUserId,
      title,
      description,
      status,
      priority,
      deadline,
      tags,
      source,
    } = body

    if (!staffUserId || !title) {
      return NextResponse.json({ error: "Staff user and title are required" }, { status: 400 })
    }

    // Get staff user to link company
    const staffUser = await prisma.staffUser.findUnique({
      where: { id: staffUserId }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Create task with 3-way sync support
    const task = await prisma.task.create({
      data: {
        staffUserId: staffUser.id,
        companyId: staffUser.companyId, // Link to company for cross-portal visibility
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        deadline: deadline ? new Date(deadline) : null,
        tags: tags || [],
        source: source || "MANAGEMENT",
        createdByType: "ADMIN",
        createdById: user.id,
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

    return NextResponse.json({ success: true, task }, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
