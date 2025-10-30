// Check what's actually in the database for Stephen
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkStephenData() {
  try {
    console.log('🔍 Checking Stephen\'s actual data in database...\n')
    
    const staffUser = await prisma.staff_users.findFirst({
      where: { email: 'stephen@stepten.io' },
      include: {
        job_acceptances: true,
        employment_contracts: true
      }
    })
    
    if (!staffUser) {
      console.log('❌ Stephen not found')
      return
    }
    
    console.log('📋 JOB ACCEPTANCE DATA:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    if (staffUser.job_acceptances) {
      console.log('Salary:', staffUser.job_acceptances.salary || '❌ NULL')
      console.log('Shift Type:', staffUser.job_acceptances.shiftType || '❌ NULL')
      console.log('Work Location:', staffUser.job_acceptances.workLocation || '❌ NULL')
      console.log('HMO:', staffUser.job_acceptances.hmoIncluded)
      console.log('Leave Credits:', staffUser.job_acceptances.leaveCredits)
      console.log('Work Days:', staffUser.job_acceptances.workDays)
      console.log('Work Start Time:', staffUser.job_acceptances.workStartTime)
      console.log('Work End Time:', staffUser.job_acceptances.workEndTime)
      console.log('Client Timezone:', staffUser.job_acceptances.clientTimezone)
      console.log('Work Hours:', staffUser.job_acceptances.workHours || '❌ NULL')
      console.log('Preferred Start Date:', staffUser.job_acceptances.preferredStartDate || '❌ NULL')
    } else {
      console.log('❌ NO JOB ACCEPTANCE FOUND')
    }
    
    console.log('\n📄 CONTRACT DATA:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    if (staffUser.employment_contracts) {
      console.log('Position:', staffUser.employment_contracts.position)
      console.log('Basic Salary:', staffUser.employment_contracts.basicSalary)
      console.log('De Minimis:', staffUser.employment_contracts.deMinimis)
      console.log('Total Monthly Gross:', staffUser.employment_contracts.totalMonthlyGross)
      console.log('Work Schedule:', staffUser.employment_contracts.workSchedule)
      console.log('HMO Offer:', staffUser.employment_contracts.hmoOffer)
      console.log('Paid Leave:', staffUser.employment_contracts.paidLeave)
    } else {
      console.log('❌ NO CONTRACT FOUND')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStephenData()

