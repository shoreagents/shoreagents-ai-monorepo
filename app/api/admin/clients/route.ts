import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/admin/clients - Get all client users for management
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is management
    const managementUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!managementUser) {
      return NextResponse.json(
        { error: "Management user not found" },
        { status: 404 }
      )
    }

    const clients = await prisma.clientUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        company: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

