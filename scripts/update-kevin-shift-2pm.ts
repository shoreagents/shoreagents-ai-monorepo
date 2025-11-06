import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Updating Kevin\'s shift to 2:00 PM - 1:00 AM...\n')

  // Find Kevin
  const kevin = await prisma.staff_users.findUnique({
    where: { email: 'kevinlmacabanti@gmail.com' },
    include: {
      staff_profiles: {
        include: {
          work_schedules: true
        }
      }
    }
  })

  if (!kevin) {
    console.error('❌ Kevin not found!')
    return
  }

  console.log('✅ Found Kevin:', kevin.name)
  console.log('📋 Profile ID:', kevin.staff_profiles?.id)

  const profileId = kevin.staff_profiles?.id
  if (!profileId) {
    console.error('❌ Kevin has no profile!')
    return
  }

  // Update all weekday schedules to 2:00 PM - 1:00 AM
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  
  for (const day of weekdays) {
    const updated = await prisma.work_schedules.updateMany({
      where: {
        profileId: profileId,
        dayOfWeek: day
      },
      data: {
        startTime: '2:00 PM',
        endTime: '1:00 AM',
        isWorkday: true,
        updatedAt: new Date()
      }
    })
    
    console.log(`✅ Updated ${day}: 2:00 PM - 1:00 AM (${updated.count} record(s))`)
  }

  // Verify
  console.log('\n📊 Current Schedule:')
  const schedules = await prisma.work_schedules.findMany({
    where: { profileId: profileId },
    orderBy: { dayOfWeek: 'asc' }
  })

  schedules.forEach(s => {
    console.log(`   ${s.dayOfWeek}: ${s.startTime} - ${s.endTime} ${s.isWorkday ? '✅' : '❌'}`)
  })

  console.log('\n✅ Kevin\'s shift updated to 2:00 PM - 1:00 AM')
  console.log('🌙 This is a NIGHT SHIFT crossing midnight - perfect for testing!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

