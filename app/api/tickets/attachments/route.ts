import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/tickets/attachments - Upload ticket attachments
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const urls: string[] = []

    for (const file of files) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        console.log(`File ${file.name} too large, skipping`)
        continue
      }

      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        console.log(`File ${file.name} is not an image, skipping`)
        continue
      }

      // Generate unique filename
      const extension = file.name.split('.').pop()
      const fileName = `${session.user.id}/tickets/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`

      // Upload to Supabase Storage
      const fileBuffer = await file.arrayBuffer()
      const { data, error } = await supabaseAdmin.storage
        .from('ticket-attachments')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        console.error('Supabase upload error:', error)
        continue
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('ticket-attachments')
        .getPublicUrl(fileName)

      urls.push(urlData.publicUrl)
    }

    return NextResponse.json({ urls }, { status: 200 })
  } catch (error) {
    console.error('Error uploading attachments:', error)
    return NextResponse.json(
      { error: 'Failed to upload attachments' },
      { status: 500 }
    )
  }
}

