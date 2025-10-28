import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user with onboarding, profiles, and job acceptances
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        staff_onboarding: true,
        staff_profiles: true,
        job_acceptances: {
          include: {
            interview_requests: true
          }
        }
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // If no onboarding exists, create one with pre-filled data from BPOC + signup
    if (!staffUser.staff_onboarding) {
      console.log('🎯 [ONBOARDING] Creating new onboarding record with pre-filled data')
      
      // Get BPOC candidate data if available
      let bpocData: any = null
      if (staffUser.job_acceptances?.interview_requests?.bpocCandidateId) {
        try {
          const { getCandidateById } = await import('@/lib/bpoc-db')
          bpocData = await getCandidateById(staffUser.job_acceptances.interview_requests.bpocCandidateId)
          console.log('✅ [ONBOARDING] BPOC data fetched:', {
            name: `${bpocData?.first_name} ${bpocData?.last_name}`,
            email: bpocData?.email,
            phone: bpocData?.phone,
            location: bpocData?.location_city
          })
        } catch (error) {
          console.error('❌ [ONBOARDING] Error fetching BPOC data:', error)
        }
      }
      
      // Parse resume data for additional info
      const resumeData = bpocData?.resume_data ? 
        (typeof bpocData.resume_data === 'string' ? JSON.parse(bpocData.resume_data) : bpocData.resume_data) 
        : null
      
      const onboarding = await prisma.staff_onboarding.create({
        data: {
          id: crypto.randomUUID(),
          staffUserId: staffUser.id,
          // Pre-fill from BPOC or fallback to staff_users
          email: staffUser.email,
          firstName: bpocData?.first_name || staffUser.name.split(' ')[0] || staffUser.name,
          middleName: resumeData?.personal_info?.middle_name || '',
          lastName: bpocData?.last_name || staffUser.name.split(' ').slice(1).join(' ') || '',
          gender: resumeData?.personal_info?.gender || '',
          civilStatus: resumeData?.personal_info?.civil_status || '',
          dateOfBirth: resumeData?.personal_info?.date_of_birth ? new Date(resumeData.personal_info.date_of_birth) : null,
          contactNo: bpocData?.phone || staffUser.staff_profiles?.phone || '',
          updatedAt: new Date()
        }
      })
      
      console.log('✅ [ONBOARDING] Created with pre-filled data:', {
        firstName: onboarding.firstName,
        lastName: onboarding.lastName,
        email: onboarding.email,
        contactNo: onboarding.contactNo
      })
      
      return NextResponse.json({ onboarding })
    }

    return NextResponse.json({ onboarding: staffUser.staff_onboarding })

  } catch (error) {
    console.error("Onboarding fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    )
  }
}

