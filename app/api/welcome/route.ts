import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user with profile and company info
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id },
      include: {
        profile: true,
        company: true
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Check if welcome form already exists
    const existingWelcomeForm = await prisma.staffWelcomeForm.findUnique({
      where: { staffUserId: staffUser.id }
    })

    if (existingWelcomeForm) {
      return NextResponse.json({ 
        error: "Welcome form already submitted",
        alreadySubmitted: true 
      }, { status: 400 })
    }

    // Return auto-fill data
    return NextResponse.json({
      name: staffUser.name,
      client: staffUser.company?.companyName || "ShoreAgents",
      startDate: staffUser.profile?.startDate ? 
        new Date(staffUser.profile.startDate).toLocaleDateString() : 
        new Date().toLocaleDateString()
    })

  } catch (error) {
    console.error("Welcome form GET error:", error)
    return NextResponse.json(
      { error: "Failed to load welcome form data" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      client,
      startDate,
      favoriteFastFood,
      favoriteColor,
      favoriteMusic,
      favoriteMovie,
      favoriteBook,
      hobby,
      dreamDestination,
      favoriteSeason,
      petName,
      favoriteSport,
      favoriteGame,
      favoriteQuote,
      funFact,
      additionalInfo
    } = body

    // Validation
    if (!favoriteFastFood?.trim()) {
      return NextResponse.json({ 
        error: "Favorite fast food is required" 
      }, { status: 400 })
    }

    // Get staff user
    const staffUser = await prisma.staffUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Check if welcome form already exists
    const existingWelcomeForm = await prisma.staffWelcomeForm.findUnique({
      where: { staffUserId: staffUser.id }
    })

    if (existingWelcomeForm) {
      return NextResponse.json({ 
        error: "Welcome form already submitted",
        alreadySubmitted: true 
      }, { status: 400 })
    }

    // Create welcome form record
    const welcomeForm = await prisma.staffWelcomeForm.create({
      data: {
        staffUserId: staffUser.id,
        name: name || staffUser.name,
        client: client || "ShoreAgents",
        startDate: startDate || new Date().toISOString(),
        favoriteFastFood: favoriteFastFood.trim(),
        favoriteColor: favoriteColor?.trim() || null,
        favoriteMusic: favoriteMusic?.trim() || null,
        favoriteMovie: favoriteMovie?.trim() || null,
        favoriteBook: favoriteBook?.trim() || null,
        hobby: hobby?.trim() || null,
        dreamDestination: dreamDestination?.trim() || null,
        favoriteSeason: favoriteSeason || null,
        petName: petName?.trim() || null,
        favoriteSport: favoriteSport?.trim() || null,
        favoriteGame: favoriteGame?.trim() || null,
        favoriteQuote: favoriteQuote?.trim() || null,
        funFact: funFact?.trim() || null,
        additionalInfo: additionalInfo?.trim() || null,
        completed: true,
        submittedAt: new Date()
      }
    })

    console.log("✅ WELCOME FORM SUBMITTED:", {
      staffUserId: staffUser.id,
      staffName: staffUser.name,
      welcomeFormId: welcomeForm.id,
      favoriteFastFood: welcomeForm.favoriteFastFood
    })

    return NextResponse.json({
      success: true,
      message: "Welcome form submitted successfully!",
      welcomeFormId: welcomeForm.id
    })

  } catch (error) {
    console.error("Welcome form POST error:", error)
    return NextResponse.json(
      { error: "Failed to submit welcome form" },
      { status: 500 }
    )
  }
}