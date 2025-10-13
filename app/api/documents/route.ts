import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import CloudConvert from 'cloudconvert'

// GET /api/documents - Fetch all documents for current staff user (own + client uploads)
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

    // Check which clients this staff is assigned to
    const assignments = await prisma.staffAssignment.findMany({
      where: {
        userId: user.id,
        isActive: true
      }
    })

    const clientIds = assignments.map(a => a.clientId)

    // Fetch:
    // 1. Documents uploaded by this staff member
    // 2. All other documents (client uploads) - will filter properly when clientId is added
    const documents = await prisma.document.findMany({
      where: {
        // For now, fetch all documents
        // Later: Add proper filtering by clientId when field is added to schema
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

        // For TXT and MD files, read directly (no conversion needed)
        if (fileExt === '.txt' || fileExt === '.md') {
          const buffer = Buffer.from(fileBuffer)
          content = buffer.toString('utf-8')
          console.log('✅ Text file read directly, length:', content.length)
        } 
        // For PDF, DOC, DOCX - use CloudConvert
        else if (fileExt === '.pdf' || fileExt === '.doc' || fileExt === '.docx') {
          console.log('☁️ Starting CloudConvert extraction for', fileName)
          
          // Initialize CloudConvert
          const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY!)
          
          // Create conversion job
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

          console.log('📤 CloudConvert job created:', job.id)

          // Get upload task
          const uploadTask = job.tasks.filter((task) => task.name === 'upload-file')[0]
          
          // Upload file
          const buffer = Buffer.from(fileBuffer)
          await cloudConvert.tasks.upload(uploadTask, buffer, fileName)
          console.log('✅ File uploaded to CloudConvert')

          // Wait for job to complete
          console.log('⏳ Waiting for conversion to complete...')
          const completedJob = await cloudConvert.jobs.wait(job.id)
          
          // Get export task
          const exportTask = completedJob.tasks.filter(
            (task) => task.name === 'export-txt'
          )[0]

          if (exportTask?.result?.files?.[0]?.url) {
            const txtUrl = exportTask.result.files[0].url
            console.log('⬇️ Downloading extracted text from:', txtUrl)
            
            // Download extracted text
            const response = await fetch(txtUrl)
            content = await response.text()
            console.log('✅ Text extracted successfully, length:', content.length)
          } else {
            console.error('❌ No export URL found')
            content = `[File: ${fileName}]`
          }
        } else {
          // Unsupported file type
          content = `[Unsupported file type: ${fileExt}]`
        }
      } catch (err) {
        console.error("Error extracting text:", err)
        content = `[File: ${fileName} - Extraction failed]`
      }
    }

    // Create the document
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        title,
        category,
        source: 'STAFF',  // Mark as staff upload
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

