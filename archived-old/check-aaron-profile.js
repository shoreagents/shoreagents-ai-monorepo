const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAaronProfile() {
  try {
    const aaron = await prisma.staff_users.findUnique({
      where: { email: 'apunzalan500@gmail.com' },
      include: {
        staff_profiles: true,
        company: true
      }
    })

    if (!aaron) {
      console.log('❌ Aaron not found')
      return
    }

    console.log('\n📋 AARON\'S PROFILE:\n')
    console.log('👤 Basic Info:')
    console.log('  Name:', aaron.name)
    console.log('  Email:', aaron.email)
    console.log('  Company:', aaron.company?.companyName || 'Not assigned')
    
    if (aaron.staff_profiles) {
      console.log('\n💼 Employment Details:')
      console.log('  Role:', aaron.staff_profiles.currentRole)
      console.log('  Start Date:', aaron.staff_profiles.startDate?.toISOString().split('T')[0])
      console.log('  Employment Status:', aaron.staff_profiles.employmentStatus)
      console.log('  Shift Time:', aaron.staff_profiles.shiftTime || '⚠️  NOT SET')
      console.log('  Salary:', aaron.staff_profiles.salary)
      console.log('  HMO:', aaron.staff_profiles.hmo ? 'Yes' : 'No')
    } else {
      console.log('\n❌ No profile found!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAaronProfile()

