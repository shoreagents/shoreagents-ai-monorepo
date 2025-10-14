import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user with profile and work schedule
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: {
        profile: {
          include: {
            workSchedule: true
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
      profile: staffUser.profile ? {
        phone: staffUser.profile.phone,
        employmentStatus: staffUser.profile.employmentStatus,
        startDate: staffUser.profile.startDate,
        daysEmployed: staffUser.profile.daysEmployed,
        currentRole: staffUser.profile.currentRole,
        client: staffUser.profile.client,
        accountManager: staffUser.profile.accountManager,
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
