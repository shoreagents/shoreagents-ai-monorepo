import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser || managementUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") || "all"

    // Build where clause based on filter
    let whereClause: any = {}
    
    if (filter === "pending") {
      whereClause = {
        staff_onboarding: {
          isComplete: false,
          OR: [
            { personalInfoStatus: "SUBMITTED" },
            { govIdStatus: "SUBMITTED" },
            { documentsStatus: "SUBMITTED" },
            { signatureStatus: "SUBMITTED" },
            { emergencyContactStatus: "SUBMITTED" }
          ]
        }
      }
    } else if (filter === "incomplete") {
      whereClause = {
        staff_onboarding: {
          isComplete: false
        }
      }
    } else if (filter === "complete") {
      whereClause = {
        staff_onboarding: {
          isComplete: true
        }
      }
    }

    // Get all staff with onboarding status
    const staffList = await prisma.staff_users.findMany({
      where: whereClause,
      include: {
        staff_onboarding: {
          select: {
            completionPercent: true,
            isComplete: true,
            personalInfoStatus: true,
            govIdStatus: true,
            documentsStatus: true,
            signatureStatus: true,
            emergencyContactStatus: true,
            updatedAt: true
          }
        },
        employment_contracts: {
          select: {
            signed: true,
            adminApproved: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform to match frontend expectations (camelCase)
    const transformedStaff = staffList.map(staff => {
      // employment_contracts is a one-to-one optional relationship
      let contractStatus = "None"
      if (staff.employment_contracts) {
        if (staff.employment_contracts.adminApproved) {
          contractStatus = "Approved"
        } else if (staff.employment_contracts.signed) {
          contractStatus = "Signed"
        } else {
          contractStatus = "Pending"
        }
      }
      
      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        onboarding: staff.staff_onboarding,
        contractStatus
      }
    })

    return NextResponse.json({ staff: transformedStaff })

  } catch (error) {
    console.error("Admin onboarding list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch staff onboarding list" },
      { status: 500 }
    )
  }
}

