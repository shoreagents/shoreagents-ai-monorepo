import { NextRequest, NextResponse } from "next/server"
import { getStaffUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()
    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { breakId } = await request.json()
    
    const breakRecord = await prisma.break.findUnique({
      where: { id: breakId }
    })
    
    if (!breakRecord || breakRecord.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Invalid break" }, { status: 403 })
    }
    
    if (breakRecord.actualStart) {
      return NextResponse.json({ error: "Break already started" }, { status: 400 })
    }
    
    const now = new Date()
    const updatedBreak = await prisma.break.update({
      where: { id: breakId },
      data: { actualStart: now }
    })
    
    return NextResponse.json({ 
      success: true, 
      break: updatedBreak,
      message: "Break started. Enjoy!"
    })
  } catch (error) {
    console.error("Error starting break:", error)
    return NextResponse.json({ error: "Failed to start break" }, { status: 500 })
  }
}

