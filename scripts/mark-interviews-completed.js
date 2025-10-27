const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function markInterviewsCompleted() {
  try {
    console.log('🔍 Updating PENDING interviews to COMPLETED for testing...\n')
    
    const now = new Date()
    
    // Find PENDING interviews
    const pendingInterviews = await prisma.interview_requests.findMany({
      where: {
        status: 'PENDING'
      },
      select: {
        id: true,
        candidateFirstName: true,
        status: true
      }
    })
    
    if (pendingInterviews.length === 0) {
      console.log('✅ No PENDING interviews found to update.')
      return
    }
    
    console.log(`📋 Found ${pendingInterviews.length} PENDING interview(s):\n`)
    pendingInterviews.forEach(interview => {
      console.log(`   - ${interview.candidateFirstName} (${interview.id})`)
    })
    console.log('')
    
    // Update all PENDING interviews to COMPLETED
    const result = await prisma.interview_requests.updateMany({
      where: {
        status: 'PENDING'
      },
      data: {
        status: 'COMPLETED',
        updatedAt: now
      }
    })
    
    console.log(`✅ Updated ${result.count} interview(s) to COMPLETED status!\n`)
    console.log('🎉 Clients can now see the "Request to Hire" button for these candidates.\n')
    console.log('🔄 Refresh your browser to see the changes!')
    
  } catch (error) {
    console.error('❌ Error updating interviews:', error)
  } finally {
    await prisma.$disconnect()
  }
}

markInterviewsCompleted()

