// NUKE Stephen's contract so it recreates with the FIXED code
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function nukeContract() {
  try {
    console.log('💣 NUKING Stephen\'s contract...')
    
    const staffUser = await prisma.staff_users.findFirst({
      where: { email: 'stephen@stepten.io' }
    })
    
    if (!staffUser) {
      console.log('❌ Stephen not found')
      return
    }
    
    // Delete ALL contracts for Stephen
    const deleted = await prisma.employment_contracts.deleteMany({
      where: { staffUserId: staffUser.id }
    })
    
    console.log(`✅ Deleted ${deleted.count} contract(s)`)
    console.log('')
    console.log('🔄 NOW:')
    console.log('1. Make sure dev server has restarted (with the NEW code)')
    console.log('2. Refresh the onboarding page')
    console.log('3. Contract will recreate with CORRECT data:')
    console.log('   💰 Salary: PHP 300,000 (not 25,000!)')
    console.log('   📅 Work Schedule: Monday-Friday, 09:00 - 18:00')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

nukeContract()

