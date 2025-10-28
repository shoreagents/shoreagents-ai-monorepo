const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateAaronStartDate() {
  try {
    // Use Aaron's email
    const aaronEmail = 'apunzalan500@gmail.com'
    
    const aaron = await prisma.staff_users.findUnique({
      where: { email: aaronEmail },
      include: {
        staff_profiles: true
      }
    })

    if (!aaron) {
      console.log('❌ Aaron not found with email:', aaronEmail)
      return
    }

    console.log('📍 Found Aaron:', {
      id: aaron.id,
      name: aaron.name,
      email: aaron.email,
      currentStartDate: aaron.staff_profiles?.startDate
    })

    if (!aaron.staff_profiles) {
      console.log('❌ Aaron has no profile!')
      return
    }

    // Update start date to today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const updated = await prisma.staff_profiles.update({
      where: { staffUserId: aaron.id },
      data: {
        startDate: today,
        updatedAt: new Date()
      }
    })

    console.log('✅ Updated Aaron\'s start date!')
    console.log('📅 New start date:', updated.startDate.toISOString().split('T')[0])

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

updateAaronStartDate()
