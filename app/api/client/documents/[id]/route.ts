import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Fetch single document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Transform for client display
    const transformedDoc = {
      id: document.id,
      title: document.title,
      category: document.category.toLowerCase().replace("_", "-"),
      content: document.content,
      uploadedBy: document.uploadedBy,
      uploadedByUser: document.user,
      size: document.size,
      fileUrl: document.fileUrl,
      lastUpdated: document.updatedAt.toISOString().split("T")[0],
      createdAt: document.createdAt.toISOString(),
    }

    return NextResponse.json({ document: transformedDoc })
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
  }
}

// PUT - Update document (only if client uploaded it)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { title, category, content } = body

    // Check if document exists and is a client document
    const existingDoc = await prisma.document.findUnique({
      where: { id },
    })

    if (!existingDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Update the document
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        title,
        category: category.toUpperCase().replace("-", "_"),
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      document: {
        id: updatedDoc.id,
        title: updatedDoc.title,
        category: updatedDoc.category.toLowerCase().replace("_", "-"),
        content: updatedDoc.content,
        uploadedBy: updatedDoc.uploadedBy,
        uploadedByUser: updatedDoc.user,
        lastUpdated: updatedDoc.updatedAt.toISOString().split("T")[0],
      },
    })
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}

// DELETE - Delete document (only if client uploaded it)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if document exists
    const existingDoc = await prisma.document.findUnique({
      where: { id },
    })

    if (!existingDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete the document
    await prisma.document.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}



