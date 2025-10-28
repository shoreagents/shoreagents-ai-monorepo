import { prisma } from './lib/prisma'

async function checkStaff() {
  try {
    // Find the client user
    const clientUser = await prisma.client_users.findUnique({
      where: { email: 'sc@sc.com' },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      console.log('Client user or company not found')
      return
    }

    console.log('Client:', clientUser.name)
    console.log('Company:', clientUser.company.companyName)
    console.log('Company ID:', clientUser.company.id)

    // Get ALL staff for this company
    const allStaff = await prisma.staff_users.findMany({
      where: { 
        companyId: clientUser.company.id
      },
      include: { 
        staff_onboarding: true,
        staff_profiles: true
      }
    })

    console.log(`\n📊 Found ${allStaff.length} staff members for this company:\n`)

    allStaff.forEach((staff, i) => {
      console.log(`${i + 1}. ${staff.name} (${staff.email})`)
      console.log(`   Active: ${staff.active}`)
      
      if (staff.staff_onboarding) {
        console.log(`   Onboarding Complete: ${staff.staff_onboarding.isComplete}`)
        console.log(`   Progress: ${staff.staff_onboarding.completionPercent}%`)
      } else {
        console.log(`   Onboarding: NOT STARTED`)
      }

      if (staff.staff_profiles) {
        console.log(`   Start Date: ${staff.staff_profiles.startDate}`)
        console.log(`   Role: ${staff.staff_profiles.currentRole}`)
      } else {
        console.log(`   Profile: NOT CREATED`)
      }
      console.log()
    })

    // Now check the current query logic
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const filteredStaff = await prisma.staff_users.findMany({
      where: { 
        companyId: clientUser.company.id,
        staff_onboarding: {
          isComplete: true
        },
        staff_profiles: {
          startDate: {
            gt: today
          }
        }
      }
    })

    console.log(`\n🔍 With current filters (completed onboarding + future start date): ${filteredStaff.length} staff members\n`)

    filteredStaff.forEach((staff, i) => {
      console.log(`${i + 1}. ${staff.name} (${staff.email})`)
    })

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
  }
}

checkStaff()

