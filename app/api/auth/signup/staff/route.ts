import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phone, jobAcceptanceId } = body

    console.log('📝 [SIGNUP] Staff signup attempt:', { email, hasJobAcceptance: !!jobAcceptanceId })

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

    // Check for job acceptance data (from hire flow)
    let companyId = null
    let position = null
    let jobAcceptance = null

    if (jobAcceptanceId) {
      jobAcceptance = await prisma.jobAcceptance.findUnique({
        where: { id: jobAcceptanceId },
        include: {
          company: true
        }
      })

      if (jobAcceptance) {
        companyId = jobAcceptance.companyId
        position = jobAcceptance.position
        console.log('✅ [SIGNUP] Job acceptance found:', {
          company: jobAcceptance.company.companyName,
          position: jobAcceptance.position
        })
      } else {
        console.warn('⚠️ [SIGNUP] Job acceptance not found:', jobAcceptanceId)
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
        companyId: companyId, // ✅ Auto-assigned from job acceptance if available
      }
    })

    console.log('✅ [SIGNUP] Staff user created:', {
      id: staffUser.id,
      email: staffUser.email,
      companyId: staffUser.companyId,
      hasCompany: !!companyId
    })

    // 3. Create staff onboarding record
    await prisma.staffOnboarding.create({
      data: {
        staffUserId: staffUser.id,
        email: staffUser.email,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
      }
    })

    console.log('✅ [SIGNUP] Onboarding record created')

    // 4. If from job acceptance, create employment contract
    if (jobAcceptance && companyId) {
      try {
        const contract = await prisma.employmentContract.create({
          data: {
            jobAcceptanceId: jobAcceptance.id,
            staffUserId: staffUser.id,
            companyId: companyId,
            employeeName: name,
            employeeAddress: 'To be updated in onboarding',
            contactType: 'Employee',
            assignedClient: jobAcceptance.company.companyName,
            position: position || 'Staff Member',
            startDate: new Date(),
            workSchedule: '40 hours per week',
            basicSalary: 0, // To be set by admin
            deMinimis: 0,
            totalMonthlyGross: 0,
            hmoOffer: 'Standard HMO',
            paidLeave: '15 days annually',
            probationaryPeriod: '6 months',
          }
        })

        console.log('✅ [SIGNUP] Employment contract created:', contract.id)
      } catch (contractError) {
        console.error('⚠️ [SIGNUP] Failed to create contract:', contractError)
        // Don't fail signup if contract creation fails
      }
    }

    return NextResponse.json(
      {
        message: "Staff account created successfully",
        user: {
          id: staffUser.id,
          name: staffUser.name,
          email: staffUser.email,
          role: staffUser.role,
          companyId: staffUser.companyId,
        },
        fromJobAcceptance: !!jobAcceptance,
        company: jobAcceptance ? jobAcceptance.company.companyName : null,
        position: position,
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

