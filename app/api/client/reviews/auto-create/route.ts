import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getReviewDueDate, shouldCreateReview, ReviewType } from "@/lib/review-templates"
import { getDaysSinceStart } from "@/lib/review-utils"

// POST /api/client/reviews/auto-create - Auto-create reviews for client's staff
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    console.log(`🔄 Auto-creating reviews for client: ${clientUser.email}`)

    // Get all staff users for this client's company with startDate
    const staffUsers = await prisma.staffUser.findMany({
      where: {
        companyId: clientUser.company.id,
        profile: {
          startDate: { not: null }
        }
      },
      include: {
        profile: true
      }
    })

    let created = 0
    let skipped = 0
    const results: any[] = []

    for (const staff of staffUsers) {
      if (!staff.profile?.startDate) continue
      
      const startDate = staff.profile.startDate
      const daysSinceStart = getDaysSinceStart(startDate)
      
      // Determine review type based on days employed
      let reviewType: ReviewType | null = null
      
      if (daysSinceStart >= 23 && daysSinceStart <= 30) {
        reviewType = "MONTH_1"
      } else if (daysSinceStart >= 83 && daysSinceStart <= 90) {
        reviewType = "MONTH_3"
      } else if (daysSinceStart >= 143 && daysSinceStart <= 150) {
        reviewType = "MONTH_5"
      } else if (daysSinceStart >= 173) {
        reviewType = "RECURRING"
      }
      
      if (!reviewType) {
        console.log(`⏭️  Skipping ${staff.name} (${daysSinceStart} days - not in review window)`)
        skipped++
        continue
      }

      // Check if review should be created (7 days before due)
      const shouldCreate = shouldCreateReview(startDate, reviewType)
      
      if (!shouldCreate) {
        console.log(`⏭️  Skipping ${staff.name} - ${reviewType} not ready for creation`)
        skipped++
        continue
      }

      // Check if review already exists
      const existing = await prisma.review.findFirst({
        where: {
          staffUserId: staff.id,
          type: reviewType,
          reviewer: clientUser.email
        }
      })

      if (existing) {
        console.log(`⏭️  Skipping ${staff.name} - ${reviewType} already exists`)
        skipped++
        continue
      }

      // Create the review
      const dueDate = getReviewDueDate(startDate, reviewType)
      const evaluationPeriod = `Day 1 to Day ${daysSinceStart}`

      const review = await prisma.review.create({
        data: {
          staffUserId: staff.id,
          type: reviewType,
          status: "PENDING",
          client: clientUser.company.companyName,
          reviewer: clientUser.email,
          reviewerTitle: clientUser.role,
          dueDate,
          evaluationPeriod
        }
      })

      created++
      results.push({
        action: "created",
        staffName: staff.name,
        reviewType,
        dueDate,
        daysSinceStart
      })

      console.log(`✅ Created ${reviewType} review for ${staff.name} (${daysSinceStart} days employed)`)
    }

    console.log(`🎉 Auto-creation complete: ${created} created, ${skipped} skipped`)

    return NextResponse.json({
      success: true,
      created,
      skipped,
      results
    })

  } catch (error) {
    console.error("Error in auto-review creation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
