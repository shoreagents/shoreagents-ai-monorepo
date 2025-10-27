import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify client user
    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client access required" }, { status: 403 })
    }

    // Get offboardings for staff in this client's company
    const offboardings = await prisma.staffOffboarding.findMany({
      where: {
        staffUser: {
          companyId: clientUser.companyId
        }
      },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ offboardings })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}
