import { prisma } from './lib/prisma'

async function testQuery() {
  try {
    const clientUser = await prisma.client_users.findUnique({
      where: { email: 'sc@sc.com' }
    })

    if (!clientUser?.companyId) {
      console.log('No company found')
      return
    }

    const staffList = await prisma.staff_users.findMany({
      where: { 
        companyId: clientUser.companyId,
        staff_onboarding: {
          isNot: null
        }
      },
      include: {
        staff_onboarding: {
          select: {
            id: true,
            completionPercent: true,
            isComplete: true
          }
        },
        staff_profiles: {
          select: {
            startDate: true,
            currentRole: true
          }
        }
      }
    })

    console.log(`Found ${staffList.length} staff with onboarding data:`)
    staffList.forEach((staff, i) => {
      console.log(`\n${i + 1}. ${staff.name}`)
      console.log(`   Complete: ${staff.staff_onboarding?.isComplete}`)
      console.log(`   Progress: ${staff.staff_onboarding?.completionPercent}%`)
      console.log(`   Start Date: ${staff.staff_profiles?.startDate}`)
      console.log(`   Role: ${staff.staff_profiles?.currentRole}`)
    })

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
  }
}

testQuery()

