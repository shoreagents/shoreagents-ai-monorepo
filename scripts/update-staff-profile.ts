import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🕵️ Updating staff profile with 3 months of employment...\n")

  // Get the staff user
  const staffUser = await prisma.staff_users.findUnique({
    where: { email: "o@o.com" },
    include: { staff_profiles: true }
  })

  if (!staffUser) {
    console.log("❌ Staff user o@o.com not found!")
    return
  }

  console.log(`✅ Found staff: ${staffUser.name}`)

  // Calculate dates (3 months ago)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const birthDate = new Date()
  birthDate.setFullYear(birthDate.getFullYear() - 28)

  // Update or create staff profile
  if (staffUser.staff_profiles) {
    console.log(`   Updating existing profile...`)
    await prisma.staff_profiles.update({
      where: { id: staffUser.id },
      data: {
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
        updatedAt: new Date()
      }
    })
    console.log(`✅ Profile updated`)
  } else {
    console.log(`   Creating new profile...`)
    await prisma.staff_profiles.create({
      data: {
        id: staffUser.id,
        staffUserId: staffUser.id,
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
    console.log(`✅ Profile created`)
  }

  // Check if onboarding exists
  const onboarding = await prisma.staff_onboarding.findUnique({
    where: { staffUserId: staffUser.id }
  })

  if (!onboarding) {
    console.log(`   Creating onboarding record...`)
    await prisma.staff_onboarding.create({
      data: {
        id: staffUser.id,
        staffUserId: staffUser.id,
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
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    console.log(`✅ Onboarding created`)
  }

  // Check if personal records exist
  const personalRecords = await prisma.staff_personal_records.findUnique({
    where: { staffUserId: staffUser.id }
  })

  if (!personalRecords) {
    console.log(`   Creating personal records...`)
    await prisma.staff_personal_records.create({
      data: {
        id: staffUser.id,
        staffUserId: staffUser.id,
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
    console.log(`✅ Personal records created`)
  }

  console.log(`\n🎉 Staff profile complete!`)
  console.log(`\n📋 Login Credentials:`)
  console.log(`Email: o@o.com`)
  console.log(`Password: qwerty12345`)
  console.log(`Name: Shit Worker`)
  console.log(`Days employed: 90`)
  console.log(`Start date: ${threeMonthsAgo.toLocaleDateString()}`)
  console.log(`\n✅ This staff member is now 3 months in and ready for offboarding tests!`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch((error) => {
    console.error("\n❌ Error:", error)
    process.exit(1)
  })

