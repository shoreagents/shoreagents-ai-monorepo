import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🕵️ Creating welcome form for test staff...\n")

  const staffUser = await prisma.staff_users.findUnique({
    where: { email: "o@o.com" },
    include: { company: true, staff_profiles: true }
  })

  if (!staffUser) {
    console.log("❌ Staff user not found!")
    return
  }

  // Check if welcome form exists
  const existingForm = await prisma.staff_welcome_forms.findUnique({
    where: { staffUserId: staffUser.id }
  })

  if (existingForm) {
    console.log("✅ Welcome form already exists!")
    return
  }

  // Calculate start date from profile
  const startDate = staffUser.staff_profiles?.startDate || new Date()
  
  // Create welcome form
  const welcomeForm = await prisma.staff_welcome_forms.create({
    data: {
      staffUserId: staffUser.id,
      name: staffUser.name,
      client: staffUser.company?.companyName || "ShoreAgents",
      startDate: startDate.toLocaleDateString(),
      favoriteFastFood: "Jollibee",
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  console.log("✅ Welcome form created!")
  console.log(`\n📋 Staff Details:`)
  console.log(`Name: ${staffUser.name}`)
  console.log(`Email: ${staffUser.email}`)
  console.log(`Company: ${staffUser.company?.companyName}`)
  console.log(`Login: o@o.com`)
  console.log(`Password: qwerty12345`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch((error) => {
    console.error("\n❌ Error:", error)
    process.exit(1)
  })

