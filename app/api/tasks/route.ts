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

    // Get tasks for this staff user - includes tasks created by staff, client, or admin
    const tasks = await prisma.task.findMany({
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
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create a new task (created by staff)
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
      source,
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
        source: source || "SELF",
        createdByType: "STAFF",
        createdById: staffUser.id,
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
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
