import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin
    const adminUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await req.json()
    const { staffUserId, equipmentReturned, finalPaymentProcessed } = body

    // Validation
    if (!equipmentReturned || !finalPaymentProcessed) {
      return NextResponse.json(
        { error: "All checklist items must be completed" },
        { status: 400 }
      )
    }

    // Get offboarding record
    const offboarding = await prisma.staff_offboarding.findUnique({
      where: { staffUserId },
      include: {
        staff_users: true
      }
    })

    if (!offboarding) {
      return NextResponse.json({ error: "Offboarding not found" }, { status: 404 })
    }

    // Update offboarding - mark complete
    await prisma.staff_offboarding.update({
      where: { id: offboarding.id },
      data: {
        equipmentReturned: true,
        finalPaymentProcessed: true,
        accessRevoked: true,
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Deactivate staff user
    await prisma.staff_users.update({
      where: { id: staffUserId },
      data: {
        active: false,
        companyId: null, // Remove company assignment
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: "Failed to complete" }, { status: 500 })
  }
}
