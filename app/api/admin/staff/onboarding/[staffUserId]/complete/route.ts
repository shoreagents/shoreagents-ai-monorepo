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

    // Create StaffProfile with data from onboarding
    const profile = await prisma.staffProfile.create({
      data: {
        staffUserId: staffUser.id,
        phone: onboarding.contactNo || "",
        location: "Philippines", // Default
        employmentStatus: "PROBATION", // Default for new hires
        startDate: new Date(),
        daysEmployed: 0,
        currentRole: "New Hire", // Admin will update later
        client: "", // Admin will assign later
        accountManager: "", // Admin will assign later
        salary: 0, // Admin will set later
        totalLeave: 12,
        usedLeave: 0,
        vacationUsed: 0,
        sickUsed: 0,
        hmo: true,
      }
    })

    // Create default work schedule (Mon-Fri 9AM-6PM)
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
      startTime: ["Saturday", "Sunday"].includes(day) ? "" : "9:00 AM",
      endTime: ["Saturday", "Sunday"].includes(day) ? "" : "6:00 PM",
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

