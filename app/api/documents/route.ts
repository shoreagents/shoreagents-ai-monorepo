import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/documents - Fetch all documents for current staff user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch all documents uploaded by this staff member
    const documents = await prisma.document.findMany({
      where: {
        userId: user.id
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

// POST /api/documents - Upload new document (staff-side)
// Documents are automatically shared with assigned clients
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const category = formData.get('category') as string

    if (!title || !category) {
      return NextResponse.json(
        { error: "Title and category are required" },
        { status: 400 }
      )
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Read file content if file exists
    let content = ""
    let fileSize = "0 KB"
    
    if (file) {
      fileSize = `${(file.size / 1024).toFixed(2)} KB`
      
      // Read text content from file
      try {
        const arrayBuffer = await file.arrayBuffer()
        const decoder = new TextDecoder('utf-8')
        content = decoder.decode(arrayBuffer)
      } catch (err) {
        console.error("Error reading file:", err)
        content = `[File: ${file.name}]`
      }
    }

    // Create the document
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        title,
        category,
        content,
        uploadedBy: user.name,
        size: fileSize,
        fileUrl: null, // Can add Supabase storage later
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

    // Check if this staff member is assigned to any clients
    // Documents are automatically visible to assigned clients via StaffAssignment
    const assignments = await prisma.staffAssignment.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    })

    return NextResponse.json({
      document,
      sharedWith: assignments.map(a => a.client),
      message: assignments.length > 0 
        ? `Document shared with ${assignments.length} client(s)` 
        : "Document created (not yet assigned to clients)"
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    )
  }
}

