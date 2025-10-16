import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ staffUserId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/management
    const managementUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser || managementUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { staffUserId } = await context.params
    const body = await req.json()
    const { 
      companyId,
      employmentStatus,
      startDate,
      shiftTime,
      currentRole,
      salary,
      hmo
    } = body

    console.log("🚀 COMPLETING ONBOARDING REQUEST:", {
      staffUserId,
      companyId,
      employmentStatus,
      startDate,
      shiftTime,
      currentRole,
      salary,
      hmo,
      adminId: managementUser.id
    })

    // Validation
    if (!companyId) {
      return NextResponse.json({ 
        error: "Company ID is required" 
      }, { status: 400 })
    }

    if (!currentRole) {
      return NextResponse.json({ 
        error: "Role title is required" 
      }, { status: 400 })
    }

    if (!salary || salary <= 0) {
      return NextResponse.json({ 
        error: "Valid salary is required" 
      }, { status: 400 })
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json({ 
        error: "Company not found" 
      }, { status: 404 })
    }

    // Get staff onboarding
    const staffUser = await prisma.staffUser.findUnique({
      where: { id: staffUserId },
      include: { 
        onboarding: true,
        profile: true
      }
    })

    if (!staffUser || !staffUser.onboarding) {
      return NextResponse.json({ error: "Onboarding not found" }, { status: 404 })
    }

    // Check if all sections are approved
    const { onboarding } = staffUser
    const allApproved = 
      onboarding.personalInfoStatus === "APPROVED" &&
      onboarding.govIdStatus === "APPROVED" &&
      onboarding.documentsStatus === "APPROVED" &&
      onboarding.signatureStatus === "APPROVED" &&
      onboarding.emergencyContactStatus === "APPROVED"

    if (!allApproved) {
      return NextResponse.json({ 
        error: "All sections must be approved before completing onboarding" 
      }, { status: 400 })
    }

    // Check if profile already exists
    if (staffUser.profile) {
      console.log("✅ PROFILE ALREADY EXISTS:", { 
        profileId: staffUser.profile.id,
        staffUserId: staffUser.id,
        staffName: staffUser.name
      })
      
      return NextResponse.json({ 
        success: true,
        message: `Profile already exists for ${staffUser.name}. Onboarding was completed previously.`,
        profileId: staffUser.profile.id,
        companyName: company.companyName,
        staffName: staffUser.name,
        alreadyExists: true
      })
    }

    // Assign staff to company & update legal name from onboarding
    const fullName = `${onboarding.firstName} ${onboarding.middleName || ''} ${onboarding.lastName}`.trim()
    await prisma.staffUser.update({
      where: { id: staffUser.id },
      data: { 
        companyId: companyId,
        name: fullName // Update with full legal name from onboarding
      }
    })
    console.log("✅ STAFF USER UPDATED:", { 
      staffUserId: staffUser.id, 
      companyId, 
      fullName,
      companyName: company.companyName 
    })

    // Calculate days employed from start date
    const startDateTime = new Date(startDate)
    const today = new Date()
    const daysEmployed = Math.floor((today.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24))

    // Vacation leave: 0 for PROBATION, 12 for REGULAR
    const vacationLeave = employmentStatus === "PROBATION" ? 0 : 12

    // Create StaffProfile with data from onboarding + management input
    const profile = await prisma.staffProfile.create({
      data: {
        staffUserId: staffUser.id,
        phone: onboarding.contactNo || "",
        location: "Philippines", // Default location
        gender: onboarding.gender,
        civilStatus: onboarding.civilStatus,
        dateOfBirth: onboarding.dateOfBirth,
        employmentStatus: employmentStatus || "PROBATION",
        startDate: new Date(startDate),
        daysEmployed: daysEmployed >= 0 ? daysEmployed : 0,
        currentRole: currentRole,
        salary: salary,
        totalLeave: vacationLeave,
        usedLeave: 0,
        vacationUsed: 0,
        sickUsed: 0,
        hmo: hmo !== undefined ? hmo : true,
      }
    })
    console.log("✅ PROFILE CREATED:", { 
      profileId: profile.id, 
      salary, 
      currentRole, 
      employmentStatus,
      daysEmployed,
      totalLeave: vacationLeave
    })

    // Check if personal record already exists
    const existingPersonalRecord = await prisma.staff_personal_records.findUnique({
      where: { staffUserId: staffUser.id }
    })

    if (existingPersonalRecord) {
      console.log("⚠️ PERSONAL RECORD ALREADY EXISTS:", { 
        personalRecordId: existingPersonalRecord.id,
        staffUserId: existingPersonalRecord.staffUserId
      })
    }

    // Create StaffPersonalRecord with HR data from onboarding
    const personalRecordData = {
      id: crypto.randomUUID(), // Generate UUID for the id field
      staffUserId: staffUser.id,
      sss: onboarding.sss,
      tin: onboarding.tin,
      philhealthNo: onboarding.philhealthNo,
      pagibigNo: onboarding.pagibigNo,
      emergencyContactName: onboarding.emergencyContactName,
      emergencyContactNo: onboarding.emergencyContactNo,
      emergencyRelationship: onboarding.emergencyRelationship,
      validIdUrl: onboarding.validIdUrl,
      birthCertUrl: onboarding.birthCertUrl,
      nbiClearanceUrl: onboarding.nbiClearanceUrl,
      policeClearanceUrl: onboarding.policeClearanceUrl,
      sssDocUrl: onboarding.sssDocUrl,
      tinDocUrl: onboarding.tinDocUrl,
      philhealthDocUrl: onboarding.philhealthDocUrl,
      pagibigDocUrl: onboarding.pagibigDocUrl,
      updatedAt: new Date(), // Provide updatedAt timestamp
    }
    console.log("🔐 CREATING/UPDATING PERSONAL RECORD:", personalRecordData)
    
    try {
      const personalRecord = await prisma.staff_personal_records.upsert({
        where: { staffUserId: staffUser.id },
        update: personalRecordData,
        create: personalRecordData
      })
      console.log("✅ PERSONAL RECORD CREATED/UPDATED:", { 
        personalRecordId: personalRecord.id,
        staffUserId: personalRecord.staffUserId
      })
    } catch (error) {
      console.error("❌ PERSONAL RECORD CREATION FAILED:", error)
      throw error
    }

    // Create work schedule based on shift time
    // Parse shift time (e.g., "9:00 AM - 6:00 PM")
    const shiftParts = shiftTime.split('-').map(s => s.trim())
    const startTime = shiftParts[0] || "9:00 AM"
    const endTime = shiftParts[1] || "6:00 PM"

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ]

    const schedules = days.map(day => ({
      profileId: profile.id,
      dayOfWeek: day,
      startTime: ["Saturday", "Sunday"].includes(day) ? "" : startTime,
      endTime: ["Saturday", "Sunday"].includes(day) ? "" : endTime,
      isWorkday: !["Saturday", "Sunday"].includes(day)
    }))

    await prisma.workSchedule.createMany({ data: schedules })
    console.log("✅ WORK SCHEDULE CREATED:", { 
      profileId: profile.id, 
      schedulesCount: schedules.length,
      workdays: schedules.filter(s => s.isWorkday).length
    })

    // Mark onboarding as complete
    await prisma.staffOnboarding.update({
      where: { id: onboarding.id },
      data: {
        isComplete: true,
        completionPercent: 100
      }
    })
    console.log("✅ ONBOARDING MARKED COMPLETE:", { 
      onboardingId: onboarding.id,
      staffUserId: staffUser.id 
    })

    console.log("🎉 ONBOARDING COMPLETION SUCCESS:", {
      staffName: fullName,
      company: company.companyName,
      role: currentRole,
      salary,
      profileId: profile.id
    })

    return NextResponse.json({ 
      success: true,
      message: `Onboarding completed! ${fullName} assigned to ${company.companyName} as ${currentRole}.`,
      profileId: profile.id,
      companyName: company.companyName,
      staffName: fullName
    })

  } catch (error) {
    console.error("Complete onboarding error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    )
  }
}

