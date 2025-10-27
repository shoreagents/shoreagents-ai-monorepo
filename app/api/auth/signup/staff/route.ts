import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phone, jobAcceptanceId } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if email already exists in staff_users
    const existingUser = await prisma.staffUser.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    // If jobAcceptanceId is provided, fetch job acceptance details
    let jobAcceptance = null
    if (jobAcceptanceId) {
      jobAcceptance = await prisma.jobAcceptance.findUnique({
        where: { id: jobAcceptanceId },
        include: { company: true }
      })

      if (!jobAcceptance) {
        return NextResponse.json(
          { error: "Invalid job acceptance link" },
          { status: 400 }
        )
      }

      if (jobAcceptance.staffUserId) {
        return NextResponse.json(
          { error: "This job acceptance link has already been used" },
          { status: 400 }
        )
      }
    }

    // 1. Create user in Supabase Auth (auth.users table)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError || !authData.user) {
      console.error("Supabase auth error:", authError)
      
      // Handle specific Supabase errors - check for email already exists
      // The error object has __isAuthError: true, status: 422, code: 'email_exists'
      const errorObj = authError as any
      const errorStatus = errorObj?.status
      const errorCode = errorObj?.code
      const errorMessage = errorObj?.message
      
      if (errorStatus === 422 || errorCode === 'email_exists') {
        return NextResponse.json(
          { error: "A user with this email address has already been registered" },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: errorMessage || "Failed to create auth user" },
        { status: 500 }
      )
    }

    // 2. Create in staff_users table (linked to Supabase auth user)
    const staffUser = await prisma.staffUser.create({
      data: {
        authUserId: authData.user.id, // Links to Supabase auth.users.id
        email,
        name,
        role: "STAFF", // Default role
        companyId: jobAcceptance?.companyId || null, // Assign company from job acceptance if exists
      }
    })

    // 3. If job acceptance exists, link it and create employment contract + onboarding
    if (jobAcceptance && jobAcceptanceId) {
      // Update job acceptance with staffUserId
      await prisma.jobAcceptance.update({
        where: { id: jobAcceptanceId },
        data: { staffUserId: staffUser.id }
      })

      // Create employment contract
      const employmentContract = await prisma.employmentContract.create({
        data: {
          jobAcceptanceId: jobAcceptance.id,
          staffUserId: staffUser.id,
          companyId: jobAcceptance.companyId,
          employeeName: name,
          employeeAddress: "", // To be filled during contract signing
          contactType: "Project Employment Contract",
          assignedClient: jobAcceptance.company.companyName,
          position: jobAcceptance.position,
          startDate: new Date(), // Placeholder - to be updated by admin
          workSchedule: "Monday - Friday", // Placeholder
          basicSalary: 0, // To be filled by admin
          deMinimis: 0,
          totalMonthlyGross: 0,
          hmoOffer: "As per company policy", // Placeholder
          paidLeave: "12 days per year", // Placeholder
          probationaryPeriod: "3 months", // Placeholder
        }
      })
      console.log(`✅ Created employment contract: ${employmentContract.id}`)

      // Create staff onboarding record
      const onboarding = await prisma.staffOnboarding.create({
        data: {
          staffUserId: staffUser.id,
        }
      })
      console.log(`✅ Created onboarding record: ${onboarding.id}`)
    }

    return NextResponse.json(
      {
        message: "Staff account created successfully",
        user: {
          id: staffUser.id,
          name: staffUser.name,
          email: staffUser.email,
          role: staffUser.role,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Staff signup error:", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}

