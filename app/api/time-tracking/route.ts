import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

// GET - Fetch time entries for current staff user only
export async function GET(request: NextRequest) {
  try {
    const user = await getStaffUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = { userId: user.id }

    if (startDate && endDate) {
      where.clockIn = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      orderBy: {
        clockIn: "desc",
      },
    })

    // Calculate total hours for the period
    const totalHours = entries
      .filter((e) => e.totalHours)
      .reduce((sum, e) => sum + Number(e.totalHours), 0)

    return NextResponse.json({
      entries,
      totalHours: totalHours.toFixed(2),
      count: entries.length,
    })
  } catch (error) {
    console.error("Error fetching time entries:", error)
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 })
  }
}



