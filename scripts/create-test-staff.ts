import { PrismaClient } from "@prisma/client"
import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "crypto"

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
  console.log("🕵️ Creating test staff: Shit Worker\n")

  // Step 1: Create Supabase Auth User
  console.log("📝 Step 1: Creating Supabase Auth user...")
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "o@o.com",
    password: "qwerty12345",
    email_confirm: true,
    user_metadata: {
      name: "Shit Worker"
    }
  })

  if (authError) {
    // Check if user already exists (Supabase returns different error codes)
    const isExistingUser = 
      authError.message?.includes("already registered") || 
      (authError as any).status === 422 || 
      (authError as any).code === 'email_exists'
    
    if (isExistingUser) {
      console.log("⚠️  User already exists in Supabase Auth. Trying to continue...")
      
      // Try to find existing user
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers.users.find(u => u.email === "o@o.com")
      
      if (!existingUser) {
        throw new Error("Failed to find existing user")
      }
      
      // Use existing auth user - need to pass existing staff ID if exists
      const existingStaff = await prisma.staff_users.findUnique({
        where: { email: "o@o.com" }
      })
      
      if (existingStaff) {
        console.log(`\n✅ Test staff already exists!\nLogin: o@o.com\nPassword: qwerty12345`)
        return
      }
      
      // Create new staff records with existing auth
      const staffUserId = randomUUID()
      const staffUser = await createStaffRecords(existingUser.id, staffUserId)
      console.log(`\n✅ Test staff created with existing auth!\nLogin: o@o.com\nPassword: qwerty12345`)
      return
    }
    throw authError
  }

  if (!authData.user) {
    throw new Error("Failed to create auth user")
  }

  console.log(`✅ Auth user created: ${authData.user.id}`)

  // Step 2: Create all staff records
  const staffUserId = randomUUID()
  const staffUser = await createStaffRecords(authData.user.id, staffUserId)

  console.log(`\n🎉 Test staff created successfully!`)
  console.log(`\n📋 Login Credentials:`)
  console.log(`Email: o@o.com`)
  console.log(`Password: qwerty12345`)
  console.log(`Name: Shit Worker`)
  console.log(`Staff ID: ${staffUserId}`)
  console.log(`Days employed: 90`)
}

async function createStaffRecords(authUserId: string, staffUserId: string) {
  // Find the sc@sc.com client user to get their company
  const clientUser = await prisma.client_users.findUnique({
    where: { email: "sc@sc.com" },
    include: { company: true }
  })

  if (!clientUser) {
    throw new Error("Client user sc@sc.com not found! Please create that client user first.")
  }

  const company = clientUser.company
  console.log(`✅ Found company: ${company.companyName} (${company.id})`)

  // Calculate dates (3 months ago)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const birthDate = new Date()
  birthDate.setFullYear(birthDate.getFullYear() - 28)

  // Create staff user
  const staffUser = await prisma.staff_users.create({
    data: {
      id: staffUserId,
      authUserId: authUserId,
      name: "Shit Worker",
      email: "o@o.com",
      role: "STAFF",
      companyId: company.id,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
  console.log(`✅ Staff user created: ${staffUser.id}`)

  // Create staff profile
  const staffProfile = await prisma.staff_profiles.create({
    data: {
      id: staffUserId, // Use same ID
      staffUserId: staffUserId,
      phone: "+63 912 345 6789",
      location: "Manila, Philippines",
      employmentStatus: "REGULAR",
      startDate: threeMonthsAgo,
      daysEmployed: 90,
      currentRole: "Customer Support Specialist",
      salary: 25000.00,
      totalLeave: 12,
      usedLeave: 0,
      vacationUsed: 0,
      sickUsed: 0,
      hmo: true,
      civilStatus: "Single",
      dateOfBirth: birthDate,
      gender: "Male",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
  console.log(`✅ Staff profile created`)

  // Create staff onboarding record (completed)
  const staffOnboarding = await prisma.staff_onboarding.create({
    data: {
      id: staffUserId,
      staffUserId: staffUserId,
      sss: "12-3456789-0",
      tin: "123-456-789-000",
      philhealthNo: "12-345678901-2",
      pagibigNo: "1212-3456-7890",
      firstName: "Shit",
      middleName: "M.",
      lastName: "Worker",
      gender: "Male",
      civilStatus: "Single",
      dateOfBirth: birthDate,
      contactNo: "+63 912 345 6789",
      email: "o@o.com",
      emergencyContactName: "Emergency Contact",
      emergencyContactNo: "+63 923 456 7890",
      emergencyRelationship: "Friend",
      personalInfoStatus: "APPROVED",
      govIdStatus: "APPROVED",
      documentsStatus: "APPROVED",
      signatureStatus: "APPROVED",
      emergencyContactStatus: "APPROVED",
      educationStatus: "APPROVED",
      medicalStatus: "APPROVED",
      resumeStatus: "APPROVED",
      dataPrivacyStatus: "APPROVED",
      isComplete: true,
      completionPercent: 100,
      personalInfoFeedback: "All good",
      govIdFeedback: "Verified",
      documentsFeedback: "Complete",
      signatureFeedback: "Valid",
      emergencyContactFeedback: "Confirmed",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
  console.log(`✅ Staff onboarding created`)

  // Create staff personal records
  const staffPersonalRecords = await prisma.staff_personal_records.create({
    data: {
      id: staffUserId,
      staffUserId: staffUserId,
      sss: "12-3456789-0",
      tin: "123-456-789-000",
      philhealthNo: "12-345678901-2",
      pagibigNo: "1212-3456-7890",
      emergencyContactName: "Emergency Contact",
      emergencyContactNo: "+63 923 456 7890",
      emergencyRelationship: "Friend",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
  console.log(`✅ Staff personal records created`)

  // Create welcome form
  const welcomeForm = await prisma.staff_welcome_forms.create({
    data: {
      staffUserId: staffUserId,
      name: "Shit Worker",
      client: company.companyName,
      startDate: threeMonthsAgo.toLocaleDateString(),
      favoriteFastFood: "Jollibee",
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
  console.log(`✅ Welcome form created`)

  return staffUser
}

main()
  .then(() => {
    console.log("\n✅ Script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
