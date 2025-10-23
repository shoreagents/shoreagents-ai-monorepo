import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/admin/staff - Get all staff users
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is management
    const managementUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!managementUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get all staff users with company info
    const staff = await prisma.staffUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            companyName: true,
            tradingName: true,
            industry: true,
            logo: true,
          },
        },
        profile: {
          select: {
            phone: true,
            location: true,
            currentRole: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error("Error fetching staff users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


