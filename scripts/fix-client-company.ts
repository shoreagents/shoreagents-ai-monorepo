import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function fixClientCompany() {
  try {
    // The correct ShoreAgents company ID (the one Michael Torres is linked to)
    const correctCompanyId = '44d8847b-41b3-4d25-ab06-e658a5575694'
    
    // Update Sarah Johnson's client user to use the correct company
    const updated = await prisma.clientUser.update({
      where: { email: 'client@shoreagents.com' },
      data: { companyId: correctCompanyId },
      include: { company: true }
    })
    
    console.log('✅ Client user updated:', {
      id: updated.id,
      email: updated.email,
      companyId: updated.companyId,
      companyName: updated.company?.companyName
    })
    
    // Verify staff members in this company
    const staff = await prisma.staffUser.findMany({
      where: { companyId: correctCompanyId },
      select: { id: true, name: true, email: true }
    })
    
    console.log(`\n📋 Staff members in ShoreAgents: ${staff.length}`)
    staff.forEach(s => console.log(`  - ${s.name} (${s.email})`))
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixClientCompany()

