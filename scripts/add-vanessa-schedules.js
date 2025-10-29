// Add work schedules for Vanessa
const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

async function addSchedules() {
  try {
    const staff = await prisma.staff_users.findUnique({
      where: { email: 'v@v.com' },
      include: {
        staff_profiles: {
          include: {
            work_schedules: true
          }
        }
      }
    })
    
    if (!staff || !staff.staff_profiles) {
      console.log('❌ Vanessa or profile not found')
      return
    }
    
    if (staff.staff_profiles.work_schedules && staff.staff_profiles.work_schedules.length > 0) {
      console.log('✅ Work schedules already exist:', staff.staff_profiles.work_schedules.length, 'days')
      return
    }
    
    console.log('📅 Creating work schedules for Vanessa...')
    
    const workDays = [
      { day: 'Monday', order: 1 },
      { day: 'Tuesday', order: 2 },
      { day: 'Wednesday', order: 3 },
      { day: 'Thursday', order: 4 },
      { day: 'Friday', order: 5 },
      { day: 'Saturday', order: 6, isWork: false },
      { day: 'Sunday', order: 7, isWork: false }
    ]
    
    for (const { day, order, isWork = true } of workDays) {
      await prisma.work_schedules.create({
        data: {
          id: crypto.randomUUID(),
          profileId: staff.staff_profiles.id,
          dayOfWeek: day,
          startTime: isWork ? '08:00' : '00:00',
          endTime: isWork ? '17:00' : '00:00',
          isWorkday: isWork,
          timezone: 'Asia/Manila',
          shiftType: 'DAY_SHIFT',
          workLocation: 'WORK_FROM_HOME',
          updatedAt: new Date()
        }
      })
    }
    
    console.log('✅ Work schedules created (Mon-Fri, 8AM-5PM)')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSchedules()

