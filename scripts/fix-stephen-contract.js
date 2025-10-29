// Fix Stephen's job_acceptances with real hire data
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixStephenContract() {
  try {
    console.log('🔧 Updating Stephen\'s job acceptance with real data...')
    
    const jobAcceptanceId = 'e87bf100-df82-4c52-81a6-f46cf41fc105'
    
    const updated = await prisma.job_acceptances.update({
      where: { id: jobAcceptanceId },
      data: {
        salary: '300000',
        shiftType: 'DAY_SHIFT',
        workLocation: 'OFFICE',
        hmoIncluded: true,
        leaveCredits: 12,
        workHours: '09:00 - 18:00 Australia/Brisbane (9 hours, Monday to Friday)',
        preferredStartDate: new Date('2025-11-12'),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Job acceptance updated!')
    console.log('📋 Updated values:', {
      id: updated.id,
      position: updated.position,
      salary: updated.salary,
      shiftType: updated.shiftType,
      workLocation: updated.workLocation,
      hmoIncluded: updated.hmoIncluded,
      leaveCredits: updated.leaveCredits,
      workDays: updated.workDays,
      workStartTime: updated.workStartTime,
      workEndTime: updated.workEndTime,
      clientTimezone: updated.clientTimezone
    })
    
    console.log('\n🎉 DONE! Now refresh the contract page and it will show:')
    console.log('   💰 Salary: PHP 300,000')
    console.log('   📅 Work Schedule: Monday-Friday, 09:00 - 18:00 (Brisbane Time AEST)')
    console.log('   🏥 HMO: Day 1')
    console.log('   🏖️ Leave: 12 days')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixStephenContract()

