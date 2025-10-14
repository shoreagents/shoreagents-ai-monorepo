import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map document types to folder names and onboarding fields
const DOCUMENT_CONFIG: Record<string, { folder: string; field: string }> = {
  validId: { folder: "staff_valid_id", field: "validIdUrl" },
  birthCert: { folder: "staff_birth_cert", field: "birthCertUrl" },
  nbiClearance: { folder: "staff_nbi_clearance", field: "nbiClearanceUrl" },
  policeClearance: { folder: "staff_police_clearance", field: "policeClearanceUrl" },
  birForm2316: { folder: "staff_bir_2316", field: "birForm2316Url" },
  certificateEmp: { folder: "staff_cert_employment", field: "certificateEmpUrl" },
  idPhoto: { folder: "staff_id_photo", field: "idPhotoUrl" },
  sssDoc: { folder: "staff_sss", field: "sssDocUrl" },
  tinDoc: { folder: "staff_tin", field: "tinDocUrl" },
  philhealthDoc: { folder: "staff_philhealth", field: "philhealthDocUrl" },
  pagibigDoc: { folder: "staff_pagibig", field: "pagibigDocUrl" },
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const documentType = formData.get("documentType") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!documentType || !DOCUMENT_CONFIG[documentType]) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 })
    }

    // Get staff user
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: { onboarding: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Check if documents section is locked
    if (staffUser.onboarding?.documentsStatus === "APPROVED") {
      return NextResponse.json({ 
        error: "Documents section has been approved and is locked" 
      }, { status: 403 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png"
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only PDF, JPG, and PNG are allowed" 
      }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 5MB" 
      }, { status: 400 })
    }

    const config = DOCUMENT_CONFIG[documentType]
    const fileExt = file.name.split('.').pop()
    const fileName = `${documentType}.${fileExt}`
    const filePath = `${config.folder}/${staffUser.id}/${fileName}`

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
        error: "Failed to upload file" 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("staff")
      .getPublicUrl(filePath)

    // Update onboarding record
    const updateData: any = {
      [config.field]: publicUrl,
      updatedAt: new Date()
    }

    // Mark documents section as submitted if this is the last required doc
    await prisma.staffOnboarding.upsert({
      where: { staffUserId: staffUser.id },
      update: updateData,
      create: {
        staffUserId: staffUser.id,
        ...updateData
      }
    })

    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      message: "Document uploaded successfully" 
    })

  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    )
  }
}

