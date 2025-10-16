import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

// POST /api/screenshots - Upload a screenshot
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the StaffUser record using authUserId
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Parse FormData
    const formData = await request.formData()
    const screenshot = formData.get('screenshot') as File | null
    const timestamp = formData.get('timestamp') as string

    if (!screenshot) {
      return NextResponse.json(
        { error: "Screenshot file is required" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!screenshot.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await screenshot.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const fileExt = screenshot.name.split('.').pop()
    const fileName = `${staffUser.id}/${Date.now()}_${timestamp || Date.now()}.${fileExt}`
    const filePath = `staff_screenshot/${fileName}`

    console.log('[Screenshots API] Uploading screenshot:', filePath, buffer.length, 'bytes')

    // Upload to Supabase Storage (staff bucket)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('staff')
      .upload(filePath, buffer, {
        contentType: screenshot.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[Screenshots API] Upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('[Screenshots API] Upload successful:', uploadData.path)

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('staff')
      .getPublicUrl(filePath)

    // Increment clipboardActions in today's performance metrics
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    console.log(`[Screenshots API] Looking for metric between ${today.toISOString()} and ${tomorrow.toISOString()}`)

    // Find or create today's performance metric
    const existingMetric = await prisma.performanceMetric.findFirst({
      where: {
        staffUserId: staffUser.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    console.log(`[Screenshots API] Existing metric found: ${existingMetric ? existingMetric.id : 'none'}`)

    if (existingMetric) {
      // Update existing metric
      const updated = await prisma.performanceMetric.update({
        where: { id: existingMetric.id },
        data: {
          clipboardActions: {
            increment: 1
          }
        }
      })
      console.log(`[Screenshots API] Incremented clipboardActions for metric ${existingMetric.id}: ${existingMetric.clipboardActions} → ${updated.clipboardActions}`)
    } else {
      // Create new metric with clipboardActions = 1
      await prisma.performanceMetric.create({
        data: {
          staffUserId: staffUser.id,
          date: today,
          clipboardActions: 1,
          mouseMovements: 0,
          mouseClicks: 0,
          keystrokes: 0,
          activeTime: 0,
          idleTime: 0,
          screenTime: 0,
          downloads: 0,
          uploads: 0,
          bandwidth: 0,
          filesAccessed: 0,
          urlsVisited: 0,
          tabsSwitched: 0,
          productivityScore: 0
        }
      })
      console.log('[Screenshots API] Created new metric with clipboardActions = 1')
    }

    const capturedAt = timestamp ? new Date(parseInt(timestamp)) : new Date()

    return NextResponse.json({
      success: true,
      screenshot: {
        fileUrl: urlData.publicUrl,
        capturedAt: capturedAt,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("[Screenshots API] Error uploading screenshot:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/screenshots - Get screenshot count from performance metrics
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the StaffUser record using authUserId
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Get total screenshot count (sum of all clipboardActions)
    const metrics = await prisma.performanceMetric.findMany({
      where: {
        staffUserId: staffUser.id
      },
      select: {
        clipboardActions: true
      }
    })

    const totalScreenshots = metrics.reduce((sum, metric) => sum + metric.clipboardActions, 0)

    return NextResponse.json({ 
      totalScreenshots,
      message: "Screenshot count from clipboardActions" 
    })
  } catch (error) {
    console.error("[Screenshots API] Error fetching screenshot count:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

