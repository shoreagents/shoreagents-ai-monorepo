const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setAaronShift() {
  try {
    const aaron = await prisma.staff_users.findUnique({
      where: { email: 'apunzalan500@gmail.com' },
      include: { staff_profiles: true }
    })

    if (!aaron || !aaron.staff_profiles) {
      console.log('❌ Aaron or profile not found')
      return
    }

    // Delete existing schedules
    await prisma.work_schedules.deleteMany({
      where: { profileId: aaron.staff_profiles.id }
    })

    // Create work schedule for Monday-Friday
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    
    for (const day of days) {
      await prisma.work_schedules.create({
        data: {
          id: require('crypto').randomUUID(),
          profileId: aaron.staff_profiles.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          isWorkday: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    console.log('✅ Aaron\'s work schedule set!')
    console.log('🕐 Monday-Friday: 9:00 AM - 6:00 PM (09:00 - 18:00)')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

setAaronShift()
