import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/tasks/[id] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      deadline,
      tags,
      actualHours,
      timeTracked,
    } = body

    // Get staff user first
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Verify task belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (existingTask.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        ...(tags && { tags }),
        ...(actualHours !== undefined && { actualHours }),
        ...(timeTracked !== undefined && { timeTracked }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
      },
    })

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get staff user first
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Verify task belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (existingTask.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.task.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

