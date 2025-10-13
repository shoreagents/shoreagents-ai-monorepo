import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("cover") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 10MB for cover photos)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename with user folder
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const filename = `cover-${timestamp}.${fileExtension}`
    const filepath = `${session.user.id}/cover-${timestamp}.${fileExtension}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("staff-covers")
      .upload(filepath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("staff-covers")
      .getPublicUrl(filepath)

    const coverUrl = urlData.publicUrl

    // Update user cover photo in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { coverPhoto: coverUrl },
    })

    return NextResponse.json({
      success: true,
      coverUrl,
      message: "Cover photo updated successfully",
    })
  } catch (error) {
    console.error("Error uploading cover photo:", error)
    return NextResponse.json(
      { error: "Failed to upload cover photo" },
      { status: 500 }
    )
  }
}

