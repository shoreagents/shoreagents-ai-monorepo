import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user with profile, work schedule, and company
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: {
        profile: {
          include: {
            workSchedule: true
          }
        },
        company: {
          include: {
            accountManager: true
          }
        }
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
        accountManager: staffUser.company.accountManager?.name || null,
      } : null,
      profile: staffUser.profile ? {
        phone: staffUser.profile.phone,
        location: staffUser.profile.location,
        gender: staffUser.profile.gender,
        civilStatus: staffUser.profile.civilStatus,
        dateOfBirth: staffUser.profile.dateOfBirth,
        employmentStatus: staffUser.profile.employmentStatus,
        startDate: staffUser.profile.startDate,
        daysEmployed: staffUser.profile.daysEmployed,
        currentRole: staffUser.profile.currentRole,
        salary: Number(staffUser.profile.salary),
        lastPayIncrease: staffUser.profile.lastPayIncrease,
        lastIncreaseAmount: staffUser.profile.lastIncreaseAmount ? Number(staffUser.profile.lastIncreaseAmount) : null,
        totalLeave: staffUser.profile.totalLeave,
        usedLeave: staffUser.profile.usedLeave,
        vacationUsed: staffUser.profile.vacationUsed,
        sickUsed: staffUser.profile.sickUsed,
        hmo: staffUser.profile.hmo,
      } : null,
      workSchedules: staffUser.profile?.workSchedule || []
    })

  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
