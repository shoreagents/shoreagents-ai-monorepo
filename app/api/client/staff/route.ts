import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true },
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Client user or company not found" }, { status: 404 })
    }

    const staff = await prisma.staffUser.findMany({
      where: {
        companyId: clientUser.company.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("Error fetching client staff:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
