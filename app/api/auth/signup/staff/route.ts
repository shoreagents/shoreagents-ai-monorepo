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

    // If jobAcceptanceId provided, validate it
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

      // Verify email matches
      if (jobAcceptance.candidateEmail !== email) {
        return NextResponse.json(
          { error: "Email does not match job acceptance record" },
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
      return NextResponse.json(
        { error: authError?.message || "Failed to create auth user" },
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
        companyId: jobAcceptance ? jobAcceptance.companyId : null, // Assign company if from job acceptance
      }
    })

    // 3. If job acceptance, link it and create employment contract
    if (jobAcceptance) {
      // Update job acceptance with staffUserId
      await prisma.jobAcceptance.update({
        where: { id: jobAcceptanceId },
        data: { staffUserId: staffUser.id }
      })

      // Create employment contract
      await prisma.employmentContract.create({
        data: {
          jobAcceptanceId: jobAcceptance.id,
          staffUserId: staffUser.id,
          companyId: jobAcceptance.companyId,
          employeeName: name,
          employeeAddress: "", // To be filled during contract signing
          contactType: "Project Employment Contract",
          assignedClient: jobAcceptance.company.companyName,
          position: jobAcceptance.position,
          startDate: new Date(), // Placeholder - to be updated
          workSchedule: "", // To be filled
          basicSalary: 0, // To be filled
          deMinimis: 0, // To be filled
          totalMonthlyGross: 0, // To be filled
          hmoOffer: "Principal only upon regularization",
          paidLeave: "12 days leave per annum",
          probationaryPeriod: "180 days from start date"
        }
      })

      // Create staff onboarding record
      await prisma.staffOnboarding.create({
        data: {
          staffUserId: staffUser.id,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || '',
          email: email,
          contactNo: phone || '',
          employmentContractId: jobAcceptance.id // Link to contract
        }
      })

      console.log(`✅ [SIGNUP] Staff account created for job acceptance: ${jobAcceptance.position}`)

      return NextResponse.json(
        {
          message: "Staff account created successfully",
          user: {
            id: staffUser.id,
            name: staffUser.name,
            email: staffUser.email,
            role: staffUser.role,
            companyId: staffUser.companyId
          },
          redirectTo: "/contract" // Redirect to contract signing
        },
        { status: 201 }
      )
    }

    // Normal signup flow (no job acceptance)
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

