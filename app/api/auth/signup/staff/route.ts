import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phone } = body

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
    // companyId is null - will be assigned by Management later
    const staffUser = await prisma.staffUser.create({
      data: {
        authUserId: authData.user.id, // Links to Supabase auth.users.id
        email,
        name,
        role: "STAFF", // Default role
        companyId: null, // Management will assign company later
      }
    })

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

