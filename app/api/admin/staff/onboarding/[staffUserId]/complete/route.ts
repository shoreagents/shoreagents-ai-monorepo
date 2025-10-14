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
      return NextResponse.json({ 
        error: "Staff profile already exists" 
      }, { status: 400 })
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

    // Create StaffPersonalRecord with HR data from onboarding
    await prisma.staffPersonalRecord.create({
      data: {
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
      }
    })

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

    // Mark onboarding as complete
    await prisma.staffOnboarding.update({
      where: { id: onboarding.id },
      data: {
        isComplete: true,
        completionPercent: 100
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Onboarding completed! Staff profile and work schedule created.",
      profileId: profile.id
    })

  } catch (error) {
    console.error("Complete onboarding error:", error)
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    )
  }
}

