// Admin API - Staff Management
// GET: List all staff members
// POST: Create new staff member

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET /api/admin/staff - List all staff
export async function GET(request: NextRequest) {
  try {
    // Authentication check - ADMIN only
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get("role") // STAFF, TEAM_LEAD, MANAGER
    const employmentStatus = searchParams.get("employmentStatus") // PROBATION, REGULAR, TERMINATED
    const clientId = searchParams.get("clientId")
    const search = searchParams.get("search") // Search by name or email

    // Build where clause
    const where: any = {
      role: { in: ["STAFF", "TEAM_LEAD", "MANAGER"] }
    }

    if (role && ["STAFF", "TEAM_LEAD", "MANAGER"].includes(role)) {
      where.role = role
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    }

    // Fetch staff members
    const staff = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        staffAssignments: {
          where: { isActive: true },
          include: {
            client: true,
            manager: true,
          }
        },
        gamificationProfile: true,
        tasks: {
          where: { status: { in: ["TODO", "IN_PROGRESS"] } }
        },
        timeEntries: {
          where: { clockOut: null },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Filter by employment status if provided
    let filteredStaff = staff
    if (employmentStatus && ["PROBATION", "REGULAR", "TERMINATED"].includes(employmentStatus)) {
      filteredStaff = staff.filter(s => s.profile?.employmentStatus === employmentStatus)
    }

    // Filter by client if provided
    if (clientId) {
      filteredStaff = filteredStaff.filter(s => 
        s.staffAssignments.some(a => a.clientId === clientId)
      )
    }

    // Format response
    const formattedStaff = filteredStaff.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      avatar: member.avatar,
      role: member.role,
      createdAt: member.createdAt,
      
      profile: member.profile ? {
        phone: member.profile.phone,
        location: member.profile.location,
        currentRole: member.profile.currentRole,
        employmentStatus: member.profile.employmentStatus,
        startDate: member.profile.startDate,
        daysEmployed: member.profile.daysEmployed,
        salary: member.profile.salary,
        totalLeave: member.profile.totalLeave,
        usedLeave: member.profile.usedLeave,
        hmo: member.profile.hmo,
      } : null,
      
      // Active assignments
      assignments: member.staffAssignments.map(assignment => ({
        id: assignment.id,
        role: assignment.role,
        startDate: assignment.startDate,
        client: {
          id: assignment.client.id,
          companyName: assignment.client.companyName,
        },
        manager: assignment.manager ? {
          id: assignment.manager.id,
          name: assignment.manager.name,
        } : null,
      })),
      
      // Stats
      activeAssignments: member.staffAssignments.length,
      activeTasks: member.tasks.length,
      isClockedIn: member.timeEntries.length > 0,
      level: member.gamificationProfile?.level || 1,
      xp: member.gamificationProfile?.xp || 0,
    }))

    return NextResponse.json({
      success: true,
      count: formattedStaff.length,
      staff: formattedStaff
    })

  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    )
  }
}

// POST /api/admin/staff - Create new staff member
export async function POST(request: NextRequest) {
  try {
    // Authentication check - ADMIN only
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      name, 
      email, 
      password, 
      role, 
      phone, 
      location, 
      currentRole, 
      startDate,
      salary,
      employmentStatus 
    } = body

    // Validation
    if (!name || !email || !password || !currentRole || !startDate || !salary) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password, currentRole, startDate, salary" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ["STAFF", "TEAM_LEAD", "MANAGER"]
    const staffRole = role || "STAFF"
    if (!validRoles.includes(staffRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be STAFF, TEAM_LEAD, or MANAGER" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Calculate days employed
    const start = new Date(startDate)
    const now = new Date()
    const daysEmployed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    // Create user + profile in transaction
    const newStaff = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: staffRole,
        }
      })

      // Create profile
      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          phone: phone || null,
          location: location || null,
          currentRole,
          startDate: new Date(startDate),
          daysEmployed,
          salary: parseFloat(salary),
          employmentStatus: employmentStatus || "PROBATION",
          totalLeave: 12,
          usedLeave: 0,
          vacationUsed: 0,
          sickUsed: 0,
          hmo: true,
        }
      })

      // Create gamification profile
      const gamificationProfile = await tx.gamificationProfile.create({
        data: {
          userId: user.id,
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          totalKudos: 0,
          totalBadges: 0,
        }
      })

      return { user, profile, gamificationProfile }
    })

    // TODO: Send welcome email to new staff member

    return NextResponse.json({
      success: true,
      message: "Staff member created successfully",
      staff: {
        id: newStaff.user.id,
        name: newStaff.user.name,
        email: newStaff.user.email,
        role: newStaff.user.role,
        profile: {
          currentRole: newStaff.profile.currentRole,
          employmentStatus: newStaff.profile.employmentStatus,
          startDate: newStaff.profile.startDate,
          salary: newStaff.profile.salary,
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating staff member:", error)
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    )
  }
}

