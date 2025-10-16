import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/profile - Fetch client profile details
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser with profile
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        company: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            location: true
          }
        }
      }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // If no profile exists, return null profile
    return NextResponse.json({
      clientUser: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        role: clientUser.role,
        avatar: clientUser.avatar,
        coverPhoto: clientUser.coverPhoto,
        company: clientUser.company
      },
      profile: clientUser.profile
    })
  } catch (error: any) {
    console.error("❌ Error fetching client profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch client profile", details: error?.message },
      { status: 500 }
    )
  }
}

// PUT /api/client/profile - Update client profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Get ClientUser
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Update or create profile
    const {
      position,
      department,
      directPhone,
      mobilePhone,
      timezone,
      bio,
      notifyTaskCreate,
      notifyTaskComplete,
      notifyReviews,
      notifyWeeklyReports
    } = body

    let profile

    if (clientUser.profile) {
      // Update existing profile
      profile = await prisma.clientProfile.update({
        where: { id: clientUser.profile.id },
        data: {
          ...(position !== undefined && { position }),
          ...(department !== undefined && { department }),
          ...(directPhone !== undefined && { directPhone }),
          ...(mobilePhone !== undefined && { mobilePhone }),
          ...(timezone !== undefined && { timezone }),
          ...(bio !== undefined && { bio }),
          ...(notifyTaskCreate !== undefined && { notifyTaskCreate }),
          ...(notifyTaskComplete !== undefined && { notifyTaskComplete }),
          ...(notifyReviews !== undefined && { notifyReviews }),
          ...(notifyWeeklyReports !== undefined && { notifyWeeklyReports })
        }
      })
    } else {
      // Create new profile
      profile = await prisma.clientProfile.create({
        data: {
          clientUserId: clientUser.id,
          position: position || null,
          department: department || null,
          directPhone: directPhone || null,
          mobilePhone: mobilePhone || null,
          timezone: timezone || null,
          bio: bio || null,
          notifyTaskCreate: notifyTaskCreate ?? true,
          notifyTaskComplete: notifyTaskComplete ?? true,
          notifyReviews: notifyReviews ?? true,
          notifyWeeklyReports: notifyWeeklyReports ?? true
        }
      })
    }

    // Update clientUser fields if provided
    const { name, avatar, coverPhoto } = body

    if (name !== undefined || avatar !== undefined || coverPhoto !== undefined) {
      await prisma.clientUser.update({
        where: { id: clientUser.id },
        data: {
          ...(name !== undefined && { name }),
          ...(avatar !== undefined && { avatar }),
          ...(coverPhoto !== undefined && { coverPhoto })
        }
      })
    }

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error("❌ Error updating client profile:", error)
    return NextResponse.json(
      { error: "Failed to update client profile", details: error?.message },
      { status: 500 }
    )
  }
}


