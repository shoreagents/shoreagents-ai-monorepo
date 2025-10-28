import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import crypto from 'crypto'

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
    const existingUser = await prisma.staff_users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    // Check for job acceptance data (from hire flow)
    // FIRST: Try to auto-match by email (this is the key for recruitment flow!)
    let companyId = null
    let position = null
    let jobAcceptance = null

    // Auto-match by email first (most common scenario from hire flow)
    jobAcceptance = await prisma.job_acceptances.findFirst({
      where: {
        candidateEmail: email,
        staffUserId: null // Not yet linked to a staff account
      },
      include: {
        company: true,
        interview_requests: true
      },
      orderBy: {
        createdAt: 'desc' // Get most recent if multiple
      }
    })

    if (jobAcceptance) {
      companyId = jobAcceptance.companyId
      position = jobAcceptance.position
      console.log('✅ [SIGNUP] Job acceptance AUTO-MATCHED by email:', {
        jobAcceptanceId: jobAcceptance.id,
        company: jobAcceptance.company.companyName,
        position: jobAcceptance.position,
        candidateName: jobAcceptance.interview_requests?.candidateFirstName
      })
    } else if (jobAcceptanceId) {
      // Fallback: Try by jobAcceptanceId if provided
      jobAcceptance = await prisma.job_acceptances.findUnique({
        where: { id: jobAcceptanceId },
        include: {
          company: true,
          interview_requests: true
        }
      })

      if (jobAcceptance) {
        companyId = jobAcceptance.companyId
        position = jobAcceptance.position
        console.log('✅ [SIGNUP] Job acceptance found by ID:', {
          company: jobAcceptance.company.companyName,
          position: jobAcceptance.position
        })
      } else {
        console.warn('⚠️ [SIGNUP] Job acceptance not found:', jobAcceptanceId)
      }
    } else {
      console.log('ℹ️ [SIGNUP] No job acceptance found for email:', email)
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
    const staffUserId = crypto.randomUUID()
    const staffUser = await prisma.staff_users.create({
      data: {
        id: staffUserId, // ✅ REQUIRED: Generate UUID
        authUserId: authData.user.id, // Links to Supabase auth.users.id
        email,
        name,
        role: "STAFF", // Default role
        companyId: companyId, // ✅ Auto-assigned from job acceptance if available
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('✅ [SIGNUP] Staff user created:', {
      id: staffUser.id,
      email: staffUser.email,
      companyId: staffUser.companyId,
      hasCompany: !!companyId
    })

    // 2.5. Link job acceptance to staff user if found
    if (jobAcceptance) {
      await prisma.job_acceptances.update({
        where: { id: jobAcceptance.id },
        data: {
          staffUserId: staffUser.id,
          updatedAt: new Date()
        }
      })
      console.log('✅ [SIGNUP] Job acceptance linked to staff user:', jobAcceptance.id)
      
      // 2.6. Update interview request status to HIRED
      if (jobAcceptance.interviewRequestId) {
        const interview = await prisma.interview_requests.update({
          where: { id: jobAcceptance.interviewRequestId },
          data: {
            status: 'HIRED',
            updatedAt: new Date(),
            adminNotes: `Staff member ${name} created account on ${new Date().toLocaleDateString()}. Successfully matched to job acceptance ${jobAcceptance.id}.`
          }
        })
        console.log('✅ [SIGNUP] Interview request status updated to HIRED:', jobAcceptance.interviewRequestId)
        
        // 2.7. Create staff_profiles with position and start date
        const startDate = interview.finalStartDate || new Date()
        await prisma.staff_profiles.create({
          data: {
            id: crypto.randomUUID(),
            staffUserId: staffUser.id,
            currentRole: position || 'Staff Member',
            startDate: startDate,
            salary: 50000.00, // Default salary
            employmentStatus: 'PROBATION',
            daysEmployed: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        console.log('✅ [SIGNUP] Staff profile created with position:', position)
      }
    }

    // NOTE: Onboarding and contracts are separate features - will be created later in the flow

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

