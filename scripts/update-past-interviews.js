const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updatePastInterviews() {
  try {
    console.log('🔍 Finding interviews with past scheduled times...\n')
    
    const now = new Date()
    
    // Find interviews with scheduledTime in the past that are in SCHEDULED status
    const pastInterviews = await prisma.interview_requests.findMany({
      where: {
        scheduledTime: {
          lt: now
        },
        status: 'SCHEDULED'
      },
      select: {
        id: true,
        candidateFirstName: true,
        scheduledTime: true,
        status: true
      }
    })
    
    if (pastInterviews.length === 0) {
      console.log('✅ No past scheduled interviews found to update.')
      return
    }
    
    console.log(`📋 Found ${pastInterviews.length} past interview(s):\n`)
    pastInterviews.forEach(interview => {
      console.log(`   - ${interview.candidateFirstName}`)
      console.log(`     Scheduled: ${interview.scheduledTime}`)
      console.log(`     Current Status: ${interview.status}\n`)
    })
    
    // Update all past interviews to COMPLETED
    const result = await prisma.interview_requests.updateMany({
      where: {
        scheduledTime: {
          lt: now
        },
        status: 'SCHEDULED'
      },
      data: {
        status: 'COMPLETED',
        updatedAt: now
      }
    })
    
    console.log(`✅ Updated ${result.count} interview(s) to COMPLETED status!\n`)
    console.log('🎉 These interviews will now show the "Request to Hire" button for the client.\n')
    
  } catch (error) {
    console.error('❌ Error updating interviews:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updatePastInterviews()

