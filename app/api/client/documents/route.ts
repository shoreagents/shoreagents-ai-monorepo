import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import CloudConvert from 'cloudconvert'

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
            // Staff documents (uploaded by assigned staff)
            userId: {
              in: staffUserIds,
            },
          },
          {
            // Client documents - fetch all for now
            // Later: Add clientId field to filter by specific client
            userId: {
              notIn: staffUserIds, // Anything not uploaded by assigned staff
            },
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

// POST - Upload new document from client with CloudConvert
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const category = formData.get('category') as string

    if (!title || !category || !file) {
      return NextResponse.json(
        { error: "Title, category, and file are required" },
        { status: 400 }
      )
    }

    // Get user info (for now use first staff user as placeholder for client upload)
    // TODO: Get actual ClientUser from session
    const user = await prisma.user.findFirst()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Extract text content from file using CloudConvert
    let content = ""
    let fileSize = "0 KB"
    
    if (file) {
      fileSize = `${(file.size / 1024).toFixed(2)} KB`
      const fileName = file.name
      const fileExt = '.' + fileName.split('.').pop()?.toLowerCase()
      
      try {
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = new Uint8Array(arrayBuffer)

        // For TXT and MD files, read directly
        if (fileExt === '.txt' || fileExt === '.md') {
          const buffer = Buffer.from(fileBuffer)
          content = buffer.toString('utf-8')
          console.log('✅ [CLIENT] Text file read directly, length:', content.length)
        } 
        // For PDF, DOC, DOCX - use CloudConvert
        else if (fileExt === '.pdf' || fileExt === '.doc' || fileExt === '.docx') {
          console.log('☁️ [CLIENT] Starting CloudConvert extraction for', fileName)
          
          const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY!)
          
          const job = await cloudConvert.jobs.create({
            tasks: {
              'upload-file': {
                operation: 'import/upload',
              },
              'convert-to-txt': {
                operation: 'convert',
                input: 'upload-file',
                output_format: 'txt',
                engine: fileExt === '.pdf' ? 'pdftotext' : undefined,
              },
              'export-txt': {
                operation: 'export/url',
                input: 'convert-to-txt',
              },
            },
          })

          console.log('📤 [CLIENT] CloudConvert job created:', job.id)

          const uploadTask = job.tasks.filter((task) => task.name === 'upload-file')[0]
          const buffer = Buffer.from(fileBuffer)
          await cloudConvert.tasks.upload(uploadTask, buffer, fileName)
          console.log('✅ [CLIENT] File uploaded to CloudConvert')

          console.log('⏳ [CLIENT] Waiting for conversion...')
          const completedJob = await cloudConvert.jobs.wait(job.id)
          
          const exportTask = completedJob.tasks.filter(
            (task) => task.name === 'export-txt'
          )[0]

          if (exportTask?.result?.files?.[0]?.url) {
            const txtUrl = exportTask.result.files[0].url
            console.log('⬇️ [CLIENT] Downloading extracted text')
            
            const response = await fetch(txtUrl)
            content = await response.text()
            console.log('✅ [CLIENT] Text extracted, length:', content.length)
          } else {
            console.error('❌ [CLIENT] No export URL found')
            content = `[File: ${fileName}]`
          }
        } else {
          content = `[Unsupported file type: ${fileExt}]`
        }
      } catch (err) {
        console.error("[CLIENT] Error extracting text:", err)
        content = `[File: ${fileName} - Extraction failed]`
      }
    }

    // Create document with CLIENT source
    const document = await prisma.document.create({
      data: {
        userId: user.id, // TODO: Use actual ClientUser ID
        title,
        category,
        source: 'CLIENT',  // Mark as client upload
        content,
        size: fileSize,
        fileUrl: null,
        uploadedBy: "TechCorp Inc.", // TODO: Get from ClientUser session
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

    console.log('✅ [CLIENT] Document created:', document.id)

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        category: document.category.toLowerCase(),
        uploadedBy: document.uploadedBy,
        uploadedByUser: document.user,
        lastUpdated: document.updatedAt.toISOString().split("T")[0],
        createdAt: document.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error("[CLIENT] Error creating document:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}


