import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import CloudConvert from 'cloudconvert'

// GET /api/documents - Fetch user's documents
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch user's documents
    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST /api/documents - Upload document
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const category = formData.get('category') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type by extension (more reliable than MIME type)
    const nameParts = file.name.split('.')
    if (nameParts.length < 2) {
      return NextResponse.json(
        { error: 'File must have a valid extension' },
        { status: 400 }
      )
    }
    
    const fileExt = '.' + nameParts.pop()?.toLowerCase().trim()
    const allowedExtensions = ['.pdf', '.txt', '.md', '.doc', '.docx']
    
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { error: `Invalid file type "${fileExt}". Only PDF, TXT, MD, DOC, and DOCX files are allowed` },
        { status: 400 }
      )
    }

    // Generate unique file name
    const extension = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('training-documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('training-documents')
      .getPublicUrl(fileName)

    // Format file size
    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    // Extract text content using CloudConvert
    let extractedText: string | null = null
    try {
      console.log('🔄 Starting text extraction with CloudConvert...', { fileExt, fileName: file.name })
      
      // Initialize CloudConvert
      const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY!)
      
      // For TXT and MD files, read directly (no conversion needed)
      if (fileExt === '.txt' || fileExt === '.md') {
        const buffer = Buffer.from(fileBuffer)
        extractedText = buffer.toString('utf-8')
        console.log('✅ Text file read directly, length:', extractedText.length)
      } else {
        // For PDF, DOC, DOCX - use CloudConvert
        console.log('☁️ Uploading to CloudConvert for conversion...')
        
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
        await cloudConvert.tasks.upload(uploadTask, buffer, file.name)
        console.log('✅ File uploaded to CloudConvert')

        // Wait for job to complete
        console.log('⏳ Waiting for conversion to complete...')
        const completedJob = await cloudConvert.jobs.wait(job.id)
        
        // Get export task
        const exportTask = completedJob.tasks.filter(
          (task) => task.name === 'export-txt'
        )[0]

        if (exportTask?.result?.files?.[0]?.url) {
          // Download converted text
          console.log('📥 Downloading converted text...')
          const textResponse = await fetch(exportTask.result.files[0].url)
          extractedText = await textResponse.text()
          console.log('✅ Text extraction successful! Length:', extractedText.length, 'characters')
        } else {
          console.log('⚠️ No output file found from CloudConvert')
          extractedText = null
        }
      }
    } catch (extractError) {
      console.error('❌ Text extraction failed:', extractError)
      // Continue anyway - document will be saved without content
      extractedText = null
    }

    // Save document metadata to database
    const document = await prisma.document.create({
      data: {
        userId: user.id,
        title: title || file.name,
        category: category as any,
        uploadedBy: user.name,
        size: formatSize(file.size),
        fileUrl: urlData.publicUrl,
        content: extractedText,
      },
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}

