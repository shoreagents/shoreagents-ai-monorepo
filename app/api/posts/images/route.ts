import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/posts/images - Upload images for a post
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 images allowed' }, { status: 400 })
    }

    const uploadedUrls: string[] = []
    const userId = session.user.id

    for (const file of files) {
      // Validate file size (10MB max for posts - includes PDFs/GIFs)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 10MB limit` },
          { status: 400 }
        )
      }

      // Validate file type (images, GIFs, PDFs)
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']
      if (!allowedExtensions.includes(fileExt)) {
        return NextResponse.json(
          { error: `Invalid file type "${file.name}". Only images, GIFs, and PDFs allowed` },
          { status: 400 }
        )
      }

      // Create unique filename
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`
      const fileBuffer = await file.arrayBuffer()

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('post-images')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Supabase post image upload error:', uploadError)
        return NextResponse.json(
          { error: `Failed to upload file "${file.name}"` },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('post-images')
        .getPublicUrl(fileName)
      
      uploadedUrls.push(urlData.publicUrl)
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 200 })
  } catch (error) {
    console.error('Error uploading post images:', error)
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    )
  }
}

