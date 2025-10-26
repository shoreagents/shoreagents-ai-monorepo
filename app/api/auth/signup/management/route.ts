import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phone, department, role } = body

    // Validation
    if (!name || !email || !password || !department) {
      return NextResponse.json(
        { error: "Name, email, password, and department are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if email already exists in managementUser
    const existingUser = await prisma.managementUser.findUnique({
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

    // 2. Create in managementUser table (linked to Supabase auth user)
    const managementUser = await prisma.managementUser.create({
      data: {
        authUserId: authData.user.id, // Links to Supabase auth.users.id
        email,
        name,
        role: role || "MANAGER",
        phone: phone || null,
        department,
      }
    })

    return NextResponse.json(
      {
        message: "Management account created successfully",
        user: {
          id: managementUser.id,
          name: managementUser.name,
          email: managementUser.email,
          role: managementUser.role,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Management signup error:", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}

