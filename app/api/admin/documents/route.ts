import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET /api/admin/documents - Get ALL documents (admin view)
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const clientId = searchParams.get("clientId")
    const source = searchParams.get("source") // STAFF or CLIENT

    const where: any = {}

    // Filter by specific staff
    if (staffId) {
      where.userId = staffId
    }

    // Filter by client (via staff assignments)
    if (clientId) {
      const assignments = await prisma.staffAssignment.findMany({
        where: {
          clientId,
          isActive: true
        },
        select: { userId: true }
      })
      where.userId = { in: assignments.map(a => a.userId) }
    }

    // Filter by source
    if (source) {
      where.source = source
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ documents, count: documents.length })
  } catch (error) {
    console.error("Error fetching admin documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

