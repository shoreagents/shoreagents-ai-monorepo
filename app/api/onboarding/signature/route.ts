import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get staff user
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: { onboarding: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Check if signature section is locked
    if (staffUser.onboarding?.signatureStatus === "APPROVED") {
      return NextResponse.json({ 
        error: "Signature section has been approved and is locked" 
      }, { status: 403 })
    }

    // Validate file type (signature should be PNG or JPG)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only PNG and JPG are allowed" 
      }, { status: 400 })
    }

    // Validate file size (2MB max for signature)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 2MB" 
      }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `signature.${fileExt}`
    const filePath = `staff_signature/${staffUser.id}/${fileName}`

    // Upload to Supabase
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("staff")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return NextResponse.json({ 
        error: "Failed to upload signature" 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("staff")
      .getPublicUrl(filePath)

    // Update onboarding record
    const onboarding = await prisma.staffOnboarding.upsert({
      where: { staffUserId: staffUser.id },
      update: {
        signatureUrl: publicUrl,
        signatureStatus: "SUBMITTED",
        updatedAt: new Date()
      },
      create: {
        staffUserId: staffUser.id,
        signatureUrl: publicUrl,
        signatureStatus: "SUBMITTED"
      }
    })

    // Recalculate completion percentage
    await updateCompletionPercent(onboarding.id)

    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      message: "Signature uploaded successfully" 
    })

  } catch (error) {
    console.error("Signature upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload signature" },
      { status: 500 }
    )
  }
}

// Helper function to calculate completion percentage
async function updateCompletionPercent(onboardingId: string) {
  const onboarding = await prisma.staffOnboarding.findUnique({
    where: { id: onboardingId }
  })

  if (!onboarding) return

  const sections = [
    onboarding.personalInfoStatus,
    onboarding.govIdStatus,
    onboarding.documentsStatus,
    onboarding.signatureStatus,
    onboarding.emergencyContactStatus
  ]

  const approvedCount = sections.filter(status => status === "APPROVED").length
  const completionPercent = Math.round((approvedCount / sections.length) * 100)

  await prisma.staffOnboarding.update({
    where: { id: onboardingId },
    data: { 
      completionPercent,
      isComplete: completionPercent === 100
    }
  })
}

