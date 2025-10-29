// Delete Stephen's old contract so it recreates with new data
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deleteStephenContract() {
  try {
    console.log('🗑️  Deleting Stephen\'s old contract...')
    
    // Find Stephen's staff user
    const staffUser = await prisma.staff_users.findFirst({
      where: { email: 'stephen@stepten.io' },
      include: { employment_contracts: true }
    })
    
    if (!staffUser) {
      console.log('❌ Stephen not found')
      return
    }
    
    if (!staffUser.employment_contracts) {
      console.log('⚠️  No contract found for Stephen')
      return
    }
    
    await prisma.employment_contracts.delete({
      where: { id: staffUser.employment_contracts.id }
    })
    
    console.log('✅ Contract deleted!')
    console.log('🔄 Now refresh the onboarding page and it will recreate with:')
    console.log('   💰 Salary: PHP 300,000 (not 25,000!)')
    console.log('   📅 Work Schedule: Monday-Friday, 09:00 - 18:00 (Brisbane Time AEST)')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteStephenContract()

