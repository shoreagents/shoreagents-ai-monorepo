import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user with profile, work schedule, company, personal record, and onboarding status
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        staff_profiles: {
          include: {
            work_schedules: true
          }
        },
        company: {
          include: {
            management_users: true // Fetch account manager (e.g., Jinemva)
          }
        },
        staff_personal_records: true,
        staff_onboarding: true  // Include all onboarding data
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      user: {
        id: staffUser.id,
        name: staffUser.name,
        email: staffUser.email,
        role: staffUser.role,
        avatar: staffUser.avatar,
        coverPhoto: staffUser.coverPhoto,
      },
      company: staffUser.company ? {
        name: staffUser.company.companyName,
        accountManager: staffUser.company.management_users?.name || null, // Jinemva or other management user
      } : null,
      profile: staffUser.staff_profiles ? {
        phone: staffUser.staff_profiles.phone,
        location: staffUser.staff_profiles.location,
        gender: staffUser.staff_profiles.gender,
        civilStatus: staffUser.staff_profiles.civilStatus,
        dateOfBirth: staffUser.staff_profiles.dateOfBirth,
        employmentStatus: staffUser.staff_profiles.employmentStatus,
        startDate: staffUser.staff_profiles.startDate,
        daysEmployed: Math.floor((new Date().getTime() - new Date(staffUser.staff_profiles.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        currentRole: staffUser.staff_profiles.currentRole,
        salary: Number(staffUser.staff_profiles.salary),
        lastPayIncrease: staffUser.staff_profiles.lastPayIncrease,
        lastIncreaseAmount: staffUser.staff_profiles.lastIncreaseAmount ? Number(staffUser.staff_profiles.lastIncreaseAmount) : null,
        totalLeave: staffUser.staff_profiles.totalLeave,
        usedLeave: staffUser.staff_profiles.usedLeave,
        vacationUsed: staffUser.staff_profiles.vacationUsed,
        sickUsed: staffUser.staff_profiles.sickUsed,
        hmo: staffUser.staff_profiles.hmo,
      } : null,
      personalRecords: staffUser.staff_personal_records ? {
        // Personal Info from Onboarding (stored cleanly in staff_personal_records)
        sss: staffUser.staff_personal_records.sss,
        tin: staffUser.staff_personal_records.tin,
        philhealthNo: staffUser.staff_personal_records.philhealthNo,
        pagibigNo: staffUser.staff_personal_records.pagibigNo,
        emergencyContactName: staffUser.staff_personal_records.emergencyContactName,
        emergencyContactPhone: staffUser.staff_personal_records.emergencyContactNo,
        emergencyContactRelation: staffUser.staff_personal_records.emergencyRelationship,
        emergencyContactAddress: staffUser.staff_onboarding?.emergencyContactNo || null, // Get from onboarding if needed
        // Document URLs
        validIdUrl: staffUser.staff_personal_records.validIdUrl,
        birthCertUrl: staffUser.staff_personal_records.birthCertUrl,
        nbiClearanceUrl: staffUser.staff_personal_records.nbiClearanceUrl,
        policeClearanceUrl: staffUser.staff_personal_records.policeClearanceUrl,
        sssDocUrl: staffUser.staff_personal_records.sssDocUrl,
        tinDocUrl: staffUser.staff_personal_records.tinDocUrl,
        philhealthDocUrl: staffUser.staff_personal_records.philhealthDocUrl,
        pagibigDocUrl: staffUser.staff_personal_records.pagibigDocUrl,
      } : null,
      onboardingData: staffUser.staff_onboarding ? {
        // Personal details from onboarding
        firstName: staffUser.staff_onboarding.firstName,
        middleName: staffUser.staff_onboarding.middleName,
        lastName: staffUser.staff_onboarding.lastName,
        gender: staffUser.staff_onboarding.gender,
        civilStatus: staffUser.staff_onboarding.civilStatus,
        dateOfBirth: staffUser.staff_onboarding.dateOfBirth,
        contactNo: staffUser.staff_onboarding.contactNo,
        email: staffUser.staff_onboarding.email,
        // Additional documents from onboarding
        medicalCertUrl: staffUser.staff_onboarding.medicalCertUrl,
        resumeUrl: staffUser.staff_onboarding.resumeUrl,
        diplomaTorUrl: staffUser.staff_onboarding.diplomaTorUrl,
        dataPrivacyConsentUrl: staffUser.staff_onboarding.dataPrivacyConsentUrl,
        signatureUrl: staffUser.staff_onboarding.signatureUrl,
        idPhotoUrl: staffUser.staff_onboarding.idPhotoUrl,
        certificateEmpUrl: staffUser.staff_onboarding.certificateEmpUrl,
        birForm2316Url: staffUser.staff_onboarding.birForm2316Url,
      } : null,
      workSchedules: staffUser.staff_profiles?.work_schedules || [],
      onboarding: staffUser.staff_onboarding ? {
        isComplete: staffUser.staff_onboarding.isComplete,
        completionPercent: staffUser.staff_onboarding.completionPercent
      } : null
    })

  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
