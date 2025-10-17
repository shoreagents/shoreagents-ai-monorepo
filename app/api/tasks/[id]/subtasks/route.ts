import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/tasks/[id]/subtasks - Get all subtasks for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Get all subtasks for this task
    const subtasks = await prisma.subtask.findMany({
      where: { taskId: id },
      orderBy: { order: 'asc' },
    })

    // Calculate progress
    const total = subtasks.length
    const completed = subtasks.filter(s => s.completed).length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return NextResponse.json({ 
      success: true, 
      subtasks,
      progress: {
        total,
        completed,
        percentage,
      }
    })
  } catch (error) {
    console.error("❌ [Get Subtasks Error]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/subtasks - Create a new subtask
export async function POST(
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
    const { title } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Get the highest order number
    const lastSubtask = await prisma.subtask.findFirst({
      where: { taskId: id },
      orderBy: { order: 'desc' },
    })

    const nextOrder = (lastSubtask?.order || 0) + 1

    // Create subtask
    const subtask = await prisma.subtask.create({
      data: {
        taskId: id,
        title,
        order: nextOrder,
      },
    })

    return NextResponse.json({ 
      success: true, 
      subtask
    }, { status: 201 })
  } catch (error) {
    console.error("❌ [Create Subtask Error]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/[id]/subtasks - Update subtask (toggle completed or edit title)
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
    const { subtaskId, completed, title } = body

    if (!subtaskId) {
      return NextResponse.json({ error: "Subtask ID is required" }, { status: 400 })
    }

    // Check if subtask exists and belongs to this task
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
    })

    if (!subtask || subtask.taskId !== id) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 })
    }

    // Update subtask
    const updateData: any = {}
    
    if (typeof completed === 'boolean') {
      updateData.completed = completed
      if (completed) {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }

    if (title) {
      updateData.title = title
    }

    const updatedSubtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: updateData,
    })

    return NextResponse.json({ 
      success: true, 
      subtask: updatedSubtask
    })
  } catch (error) {
    console.error("❌ [Update Subtask Error]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id]/subtasks?subtaskId=xxx - Delete a subtask
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
    const { searchParams } = new URL(request.url)
    const subtaskId = searchParams.get('subtaskId')

    if (!subtaskId) {
      return NextResponse.json({ error: "Subtask ID is required" }, { status: 400 })
    }

    // Check if subtask exists and belongs to this task
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
    })

    if (!subtask || subtask.taskId !== id) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 })
    }

    // Delete subtask
    await prisma.subtask.delete({
      where: { id: subtaskId },
    })

    return NextResponse.json({ 
      success: true,
      message: "Subtask deleted"
    })
  } catch (error) {
    console.error("❌ [Delete Subtask Error]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

