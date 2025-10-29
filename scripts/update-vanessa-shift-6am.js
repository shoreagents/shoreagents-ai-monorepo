const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateVanessaShiftTo6AM() {
  try {
    console.log('🔧 Updating Vanessa Garcia\'s shift time to 6:00 AM...\n')

    // Find Vanessa's staff user and profile
    const vanessa = await prisma.staff_users.findFirst({
      where: {
        email: 'v@v.com'
      },
      include: {
        staff_profiles: true
      }
    })

    if (!vanessa || !vanessa.staff_profiles) {
      console.error('❌ Vanessa Garcia or her profile not found!')
      process.exit(1)
    }

    console.log(`✅ Found: ${vanessa.name} (${vanessa.email})`)
    console.log(`📋 Staff User ID: ${vanessa.id}`)
    console.log(`📋 Profile ID: ${vanessa.staff_profiles.id}\n`)

    // Get current work schedules
    const currentSchedules = await prisma.work_schedules.findMany({
      where: { profileId: vanessa.staff_profiles.id }
    })

    // Update work schedules for weekdays (Monday-Friday) to 6:00 AM - 3:00 PM
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    
    for (const day of weekdays) {
      const schedule = currentSchedules.find(s => s.dayOfWeek === day)
      
      if (schedule) {
        await prisma.work_schedules.update({
          where: { id: schedule.id },
          data: {
            startTime: '06:00',
            endTime: '15:00',
            isWorkday: true
          }
        })
        console.log(`✅ Updated ${day}: 06:00 - 15:00 (6 AM - 3 PM)`)
      }
    }

    // Verify the update
    console.log('\n📊 Verifying updated schedule...\n')
    const updatedSchedules = await prisma.work_schedules.findMany({
      where: { profileId: vanessa.staff_profiles.id },
      orderBy: { dayOfWeek: 'asc' }
    })

    console.log('📅 Updated Work Schedule:')
    updatedSchedules.forEach(schedule => {
      console.log(`  ${schedule.dayOfWeek}: ${schedule.startTime} - ${schedule.endTime} ${schedule.isWorkday ? '💼' : '🏖️'}`)
    })

    console.log('\n✅ Vanessa\'s shift updated to 6:00 AM - 3:00 PM (Monday-Friday)')
    console.log('🧪 You can now test early clock-in by logging in before 6:00 AM!')

  } catch (error) {
    console.error('❌ Error updating shift:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateVanessaShiftTo6AM()

