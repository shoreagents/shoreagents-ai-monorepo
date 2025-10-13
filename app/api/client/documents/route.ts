import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Fetch all documents (staff + client uploads)
export async function GET(request: NextRequest) {
  try {
    // TODO: Get actual clientId from session
    const clientId = "cm59d03ng0000a17aykwgg8xj" // TechCorp Inc.

    // Get all assigned staff for this client
    const assignments = await prisma.staffAssignment.findMany({
      where: {
        clientId: clientId,
        isActive: true,
      },
      include: {
        user: true,
      },
    })

    const staffUserIds = assignments.map((a) => a.userId)

    // Fetch documents from assigned staff + client's own documents
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          {
            // Staff documents
            userId: {
              in: staffUserIds,
            },
          },
          {
            // Client documents (we'll need to add a clientId field later)
            // For now, fetch documents with "CLIENT" category
            category: "CLIENT",
          },
        ],
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
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform for client display
    const transformedDocs = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category.toLowerCase().replace("_", "-"),
      description: doc.content?.substring(0, 150) || "No description available",
      uploadedBy: doc.uploadedBy,
      uploadedByUser: doc.user,
      size: doc.size,
      fileUrl: doc.fileUrl,
      lastUpdated: doc.updatedAt.toISOString().split("T")[0],
      createdAt: doc.createdAt.toISOString(),
      views: 0, // TODO: Add view tracking
      isStaffUpload: staffUserIds.includes(doc.userId),
    }))

    // Get category counts
    const categoryCounts = transformedDocs.reduce(
      (acc, doc) => {
        const cat = doc.category
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      documents: transformedDocs,
      categoryCounts,
      totalCount: transformedDocs.length,
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

// POST - Upload new document from client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, category, content, size, fileUrl, uploadedBy } = body

    // TODO: Get actual clientId and userId from session
    const clientId = "cm59d03ng0000a17aykwgg8xj" // TechCorp Inc.
    
    // For now, create a document with a placeholder userId
    // In production, you'd create ClientUser and use their ID
    // Or add a separate clientId field to Document model
    
    const document = await prisma.document.create({
      data: {
        userId: "cm55p8ifu000008jsg7vr1g3c", // Placeholder - would be client user ID
        title,
        category: category.toUpperCase().replace("-", "_"),
        content,
        size,
        fileUrl,
        uploadedBy: uploadedBy || "TechCorp Inc.",
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
        id: document.id,
        title: document.title,
        category: document.category.toLowerCase().replace("_", "-"),
        uploadedBy: document.uploadedBy,
        uploadedByUser: document.user,
        lastUpdated: document.updatedAt.toISOString().split("T")[0],
        createdAt: document.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}

