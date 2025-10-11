import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/profile/cover - Upload/update profile cover photo
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('cover') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WEBP are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max for covers - larger than avatars)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Create filename
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    const fileName = `${session.user.id}/cover${fileExt}`

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('staff-covers')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true, // Replace if exists
      })

    if (uploadError) {
      console.error('Supabase cover upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload cover photo' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('staff-covers')
      .getPublicUrl(fileName)

    // Update user cover photo URL in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { coverPhoto: urlData.publicUrl },
    })

    return NextResponse.json({ 
      success: true, 
      coverUrl: urlData.publicUrl 
    }, { status: 200 })

  } catch (error) {
    console.error('Error uploading cover photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

