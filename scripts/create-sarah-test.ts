import { PrismaClient } from "@prisma/client"
import { createClient } from "@supabase/supabase-js"

const prisma = new PrismaClient()

// Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log("🚀 Creating test staff: Sarah Test\n")

  // Step 1: Create Supabase Auth User
  console.log("📝 Step 1: Creating Supabase Auth user...")
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "sarah.test@test.com",
    password: "password123",
    email_confirm: true,
    user_metadata: {
      name: "Sarah Test"
    }
  })

  if (authError) {
    // Check if user already exists
    if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
      console.log("⚠️  User already exists in Supabase Auth")
      
      // Get existing user
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) throw listError
      
      const existingUser = users.find(u => u.email === "sarah.test@test.com")
      if (!existingUser) throw new Error("User exists but couldn't find them")
      
      console.log(`✅ Found existing Supabase user: ${existingUser.id}`)
      
      // Delete existing Prisma records if any
      await prisma.review.deleteMany({
        where: {
          staffUser: {
            email: "sarah.test@test.com"
          }
        }
      })
      
      await prisma.staffProfile.deleteMany({
        where: {
          staffUser: {
            email: "sarah.test@test.com"
          }
        }
      })
      
      await prisma.staffUser.deleteMany({
        where: {
          email: "sarah.test@test.com"
        }
      })
      
      console.log("🗑️  Cleaned up old Prisma records")
      
      // Use existing auth user
      const supabaseUserId = existingUser.id
      await createPrismaRecords(supabaseUserId)
    } else {
      throw authError
    }
  } else {
    console.log(`✅ Supabase Auth user created: ${authData.user.id}`)
    await createPrismaRecords(authData.user.id)
  }
}

async function createPrismaRecords(supabaseUserId: string) {
  // Step 2: Get StepTen company
  console.log("\n📝 Step 2: Finding StepTen company...")
  const company = await prisma.company.findFirst({
    where: {
      companyName: {
        contains: "StepTen",
        mode: "insensitive"
      }
    }
  })

  if (!company) {
    throw new Error("StepTen company not found!")
  }
  console.log(`✅ Found company: ${company.companyName} (${company.id})`)

  // Step 3: Create staff_users record
  console.log("\n📝 Step 3: Creating staff_users record...")
  const staffUser = await prisma.staffUser.create({
    data: {
      email: "sarah.test@test.com",
      name: "Sarah Test",
      authUserId: supabaseUserId,
      companyId: company.id,
      role: "STAFF"
    }
  })
  console.log(`✅ Staff user created: ${staffUser.id}`)

  // Step 4: Create staff_profiles record
  console.log("\n📝 Step 4: Creating staff_profiles record...")
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 25) // 25 days ago (Month 1)

  const profile = await prisma.staffProfile.create({
    data: {
      staffUserId: staffUser.id,
      startDate: startDate,
      phone: "+63 999 888 7777",
      employmentStatus: "PROBATION",
      currentRole: "Virtual Assistant",
      salary: 35000 // PHP 35,000 per month
    }
  })
  console.log(`✅ Staff profile created: ${profile.id}`)

  // Step 5: Create PENDING review
  console.log("\n📝 Step 5: Creating PENDING Month 1 review...")
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7) // Due in 7 days

  const review = await prisma.review.create({
    data: {
      staffUserId: staffUser.id,
      type: "MONTH_1",
      status: "PENDING",
      client: "StepTen",
      reviewer: "stephen@stepten.io",
      reviewerTitle: "MANAGER",
      submittedDate: new Date(),
      dueDate: dueDate,
      evaluationPeriod: "Day 1 to Day 25"
    }
  })
  console.log(`✅ Review created: ${review.id}`)

  // Step 6: Verify
  console.log("\n📝 Step 6: Verifying creation...")
  const verification = await prisma.staffUser.findUnique({
    where: { id: staffUser.id },
    include: {
      profile: true,
      reviewsReceived: true,
      company: {
        select: {
          companyName: true
        }
      }
    }
  })

  console.log("\n" + "=".repeat(60))
  console.log("✅ SUCCESS! Test staff created:")
  console.log("=".repeat(60))
  console.log(`📧 Email:           sarah.test@test.com`)
  console.log(`🔑 Password:        password123`)
  console.log(`👤 Name:            ${verification?.name}`)
  console.log(`🏢 Company:         ${verification?.company?.companyName}`)
  console.log(`📅 Start Date:      ${verification?.profile?.startDate?.toISOString().split('T')[0]}`)
  console.log(`💼 Employment:      ${verification?.profile?.employmentStatus}`)
  console.log(`📝 Reviews:         ${verification?.reviewsReceived.length} (${verification?.reviewsReceived[0]?.status})`)
  console.log(`🔍 Review ID:       ${verification?.reviewsReceived[0]?.id}`)
  console.log(`👨‍💼 Assigned to:    ${verification?.reviewsReceived[0]?.reviewer}`)
  console.log("=".repeat(60))
  console.log("\n🎯 TEST CREDENTIALS:")
  console.log("=".repeat(60))
  console.log("STAFF:  sarah.test@test.com / password123")
  console.log("CLIENT: stephen@stepten.io / qwerty12345")
  console.log("ADMIN:  stephena@shoreagents.com / qwerty12345")
  console.log("=".repeat(60))
  console.log("\n🚀 Ready to test! Login at: http://localhost:3000/login/staff\n")
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

