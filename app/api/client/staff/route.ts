import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get all staff assigned to this company
    const staff = await prisma.staffUser.findMany({
      where: {
        companyId: clientUser.company.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true
      },
      orderBy: { name: "asc" }
    })

    return NextResponse.json({ staff, count: staff.length })
  } catch (error) {
    console.error("Error fetching client staff:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
