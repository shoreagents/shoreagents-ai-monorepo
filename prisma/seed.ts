import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Hash password for test users
  const passwordHash = await bcrypt.hash("password123", 10)

  // Create test users
  const maria = await prisma.user.upsert({
    where: { email: "maria.santos@techcorp.com" },
    update: {},
    create: {
      email: "maria.santos@techcorp.com",
      name: "Maria Santos",
      passwordHash,
      role: "STAFF",
    },
  })

  const john = await prisma.user.upsert({
    where: { email: "john.manager@techcorp.com" },
    update: {},
    create: {
      email: "john.manager@techcorp.com",
      name: "John Manager",
      passwordHash,
      role: "MANAGER",
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: "admin@techcorp.com" },
    update: {},
    create: {
      email: "admin@techcorp.com",
      name: "Admin User",
      passwordHash,
      role: "ADMIN",
    },
  })

  console.log("✅ Created users")

  // Create Maria's profile
  const mariaProfile = await prisma.profile.upsert({
    where: { userId: maria.id },
    update: {},
    create: {
      userId: maria.id,
      phone: "+63 912 345 6789",
      employmentStatus: "REGULAR",
      startDate: new Date("2023-12-15"),
      daysEmployed: 390,
      currentRole: "SEO Specialist",
      client: "TechCorp Inc.",
      accountManager: john.name,
      salary: 45000,
      lastPayIncrease: new Date("2024-06-15"),
      lastIncreaseAmount: 5000,
      totalLeave: 12,
      usedLeave: 3,
      vacationUsed: 2,
      sickUsed: 1,
      hmo: true,
    },
  })

  console.log("✅ Created profile")

  // Create work schedule (delete existing first to avoid duplicates)
  await prisma.workSchedule.deleteMany({
    where: { profileId: mariaProfile.id },
  })

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]

  for (const dayName of daysOfWeek) {
    await prisma.workSchedule.create({
      data: {
        profileId: mariaProfile.id,
        dayOfWeek: dayName,
        startTime: "09:00",
        endTime: "18:00",
        isWorkday: true,
      },
    })
  }

  console.log("✅ Created work schedule")

  // Create sample tasks
  const tasks = [
    {
      title: "Fix broken images on landing page",
      description: "Several images are not loading on the homepage",
      status: "TODO",
      priority: "HIGH",
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      source: "CLIENT",
    },
    {
      title: "SEO audit for blog posts",
      description: "Conduct comprehensive SEO audit for Q4 2024 blog posts",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      source: "SELF",
    },
    {
      title: "Update meta descriptions",
      description: "Optimize meta descriptions for top 20 pages",
      status: "COMPLETED",
      priority: "MEDIUM",
      deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      source: "CLIENT",
      completedAt: new Date(),
    },
  ]

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        ...task,
        userId: maria.id,
      },
    })
  }

  console.log("✅ Created sample tasks")

  // Create gamification profile
  await prisma.gamificationProfile.upsert({
    where: { userId: maria.id },
    update: {},
    create: {
      userId: maria.id,
      points: 2850,
      rank: 3,
      streak: 12,
      tasksCompleted: 127,
      performanceScore: 89,
      reviewRating: 4.8,
    },
  })

  console.log("✅ Created gamification profile")

  console.log("🎉 Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

