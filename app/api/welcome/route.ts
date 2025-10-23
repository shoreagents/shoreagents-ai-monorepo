import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: { 
        welcomeForm: true,
        company: { select: { companyName: true } }
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    return NextResponse.json({
      completed: staffUser.welcomeForm?.completed || false,
      prefillData: {
        name: staffUser.name,
        clientCompany: staffUser.company?.companyName || ''
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { favoriteFastFood, ...otherFields } = body

    if (!favoriteFastFood) {
      return NextResponse.json({ error: "Favorite fast food is required" }, { status: 400 })
    }

    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    await prisma.staffWelcomeForm.upsert({
      where: { staffUserId: staffUser.id },
      create: {
        staffUserId: staffUser.id,
        name: staffUser.name,
        clientCompany: staffUser.company?.companyName || '',
        startDate: new Date(),
        favoriteFastFood,
        ...otherFields,
        completed: true,
        completedAt: new Date()
      },
      update: {
        favoriteFastFood,
        ...otherFields,
        completed: true,
        completedAt: new Date()
      }
    })

    console.log(`✅ [WELCOME] Welcome form completed by: ${staffUser.name}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error saving welcome form:', error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}

