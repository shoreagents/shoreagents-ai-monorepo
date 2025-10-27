import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        company: {
          include: {
            client_users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            management_users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                department: true,
              },
            },
          },
        },
      },
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    if (!staffUser.company) {
      return NextResponse.json({ 
        error: "No client company assigned",
        message: "You are not currently assigned to a client company."
      }, { status: 404 })
    }

    return NextResponse.json({
      company: staffUser.company,
      clientUsersCount: staffUser.company.client_users?.length || 0,
    })
  } catch (error) {
    console.error("Error fetching client company:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

