const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkInterviews() {
  try {
    console.log('🔍 Checking all interview requests...\n')
    
    const interviews = await prisma.interview_requests.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        candidateFirstName: true,
        status: true,
        scheduledTime: true,
        createdAt: true
      }
    })
    
    console.log(`📋 Found ${interviews.length} total interview(s):\n`)
    
    const now = new Date()
    
    interviews.forEach((interview, index) => {
      const isPast = interview.scheduledTime && new Date(interview.scheduledTime) < now
      console.log(`${index + 1}. ${interview.candidateFirstName}`)
      console.log(`   ID: ${interview.id}`)
      console.log(`   Status: ${interview.status}`)
      console.log(`   Scheduled: ${interview.scheduledTime || 'Not scheduled yet'}`)
      if (isPast) {
        console.log(`   ⏰ PAST DUE - Could be marked COMPLETED`)
      }
      console.log(`   Created: ${interview.createdAt}`)
      console.log('')
    })
    
    // Count by status
    const statusCounts = interviews.reduce((acc, interview) => {
      acc[interview.status] = (acc[interview.status] || 0) + 1
      return acc
    }, {})
    
    console.log('📊 Status breakdown:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })
    
  } catch (error) {
    console.error('❌ Error checking interviews:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkInterviews()

