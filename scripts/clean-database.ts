/**
 * 🧹 CLEAN DATABASE - Remove ALL test data
 * 
 * This script deletes ALL data from ALL tables while preserving the schema.
 * Use this to start fresh with a clean database.
 * 
 * Run: npx tsx scripts/clean-database.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup...\n')

  try {
    // Delete in correct order (respecting foreign key constraints)
    
    console.log('🗑️  Deleting activity data...')
    await prisma.postComment.deleteMany({})
    await prisma.postReaction.deleteMany({})
    await prisma.activityPost.deleteMany({})
    console.log('✅ Activity data deleted')

    console.log('🗑️  Deleting gamification data...')
    await prisma.userBadge.deleteMany({})
    await prisma.gamificationProfile.deleteMany({})
    await prisma.kudos.deleteMany({})
    console.log('✅ Gamification data deleted')

    console.log('🗑️  Deleting support tickets...')
    await prisma.ticketResponse.deleteMany({})
    await prisma.ticket.deleteMany({})
    console.log('✅ Support tickets deleted')

    console.log('🗑️  Deleting documents...')
    await prisma.document.deleteMany({})
    console.log('✅ Documents deleted')

    console.log('🗑️  Deleting reviews...')
    await prisma.review.deleteMany({})
    console.log('✅ Reviews deleted')

    console.log('🗑️  Deleting performance metrics...')
    await prisma.performanceMetric.deleteMany({})
    console.log('✅ Performance metrics deleted')

    console.log('🗑️  Deleting time tracking...')
    await prisma.timeEntry.deleteMany({})
    console.log('✅ Time entries deleted')

    console.log('🗑️  Deleting breaks...')
    await prisma.break.deleteMany({})
    console.log('✅ Breaks deleted')

    console.log('🗑️  Deleting tasks...')
    await prisma.task.deleteMany({})
    console.log('✅ Tasks deleted')

    console.log('🗑️  Deleting staff assignments...')
    await prisma.staffAssignment.deleteMany({})
    console.log('✅ Staff assignments deleted')

    console.log('🗑️  Deleting client users...')
    await prisma.clientUser.deleteMany({})
    console.log('✅ Client users deleted')

    console.log('🗑️  Deleting clients...')
    await prisma.client.deleteMany({})
    console.log('✅ Clients deleted')

    console.log('🗑️  Deleting work schedules...')
    await prisma.workSchedule.deleteMany({})
    console.log('✅ Work schedules deleted')

    console.log('🗑️  Deleting profiles...')
    await prisma.profile.deleteMany({})
    console.log('✅ Profiles deleted')

    console.log('🗑️  Deleting users...')
    await prisma.user.deleteMany({})
    console.log('✅ Users deleted')

    console.log('\n✨ Database cleaned successfully!')
    console.log('📊 All test data removed. Schema and structure preserved.')
    console.log('\n🔐 You can now create your REAL users from scratch.\n')

  } catch (error) {
    console.error('❌ Error cleaning database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

