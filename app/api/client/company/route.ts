import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/company - Fetch company details for the logged-in client
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser with company
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: {
        company: {
          include: {
            staffUsers: {
              include: {
                profile: {
                  select: {
                    currentRole: true,
                    location: true,
                    employmentStatus: true,
                    startDate: true
                  }
                }
              }
            },
            accountManager: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    if (!clientUser.company) {
      return NextResponse.json({ error: "No company associated with this client" }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedCompany = {
      ...clientUser.company,
      staffUsers: clientUser.company.staffUsers.map(staff => ({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        avatar: staff.avatar,
        role: staff.role,
        profile: staff.profile
      }))
    }

    return NextResponse.json({ company: transformedCompany })
  } catch (error: any) {
    console.error("❌ Error fetching company:", error)
    return NextResponse.json(
      { error: "Failed to fetch company", details: error?.message },
      { status: 500 }
    )
  }
}

// PUT /api/client/company - Update company details
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Get ClientUser with company
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    if (!clientUser.company) {
      return NextResponse.json({ error: "No company associated with this client" }, { status: 404 })
    }

    // Update company details
    const { bio, website, phone, location, billingEmail, tradingName, industry, logo, coverPhoto } = body

    const updatedCompany = await prisma.company.update({
      where: { id: clientUser.company.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(website !== undefined && { website }),
        ...(phone !== undefined && { phone }),
        ...(location !== undefined && { location }),
        ...(billingEmail !== undefined && { billingEmail }),
        ...(tradingName !== undefined && { tradingName }),
        ...(industry !== undefined && { industry }),
        ...(logo !== undefined && { logo }),
        ...(coverPhoto !== undefined && { coverPhoto })
      },
      include: {
        staffUsers: {
          include: {
            profile: {
              select: {
                currentRole: true,
                location: true,
                employmentStatus: true,
                startDate: true
              }
            }
          }
        },
        accountManager: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    // Transform the data
    const transformedCompany = {
      ...updatedCompany,
      staffUsers: updatedCompany.staffUsers.map(staff => ({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        avatar: staff.avatar,
        role: staff.role,
        profile: staff.profile
      }))
    }

    return NextResponse.json({ company: transformedCompany })
  } catch (error: any) {
    console.error("❌ Error updating company:", error)
    return NextResponse.json(
      { error: "Failed to update company", details: error?.message },
      { status: 500 }
    )
  }
}

