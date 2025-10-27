import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing staff company assignments...\n')
  
  // 1. Find the CLIENT user (stephen@stepten.io)
  const clientUser = await prisma.client_users.findUnique({
    where: { email: 'stephen@stepten.io' },
    include: { company: true }
  })
  
  if (!clientUser) {
    console.log('❌ Client user stephen@stepten.io NOT FOUND!')
    console.log('Available client users:')
    const allClients = await prisma.client_users.findMany()
    allClients.forEach(c => console.log(`  - ${c.email}`))
    return
  }
  
  console.log(`✅ Found client: ${clientUser.email}`)
  console.log(`✅ Company: ${clientUser.company?.companyName}`)
  console.log(`✅ Company ID: ${clientUser.companyId}\n`)
  
  // 2. Update all test staff to THIS company
  const result = await prisma.staff_users.updateMany({
    where: {
      email: {
        endsWith: '@test.com'
      }
    },
    data: {
      companyId: clientUser.companyId
    }
  })
  
  console.log(`✅ Updated ${result.count} staff users to ${clientUser.company?.companyName}\n`)
  
  // 3. Verify
  const testStaff = await prisma.staff_users.findMany({
    where: {
      email: { endsWith: '@test.com' }
    },
    include: {
      company: true,
      profile: true
    }
  })
  
  console.log('📊 Test staff now assigned to:')
  console.log('─'.repeat(80))
  testStaff.forEach(staff => {
    const days = staff.profile?.daysEmployed || 0
    console.log(`${staff.name.padEnd(25)} → ${staff.company?.companyName || 'NO COMPANY'} (${days} days)`)
  })
  console.log('─'.repeat(80))
  console.log(`\n🎉 All ${testStaff.length} test staff are now assigned to ${clientUser.company?.companyName}!`)
  console.log(`\n✅ When reviews are triggered, ${clientUser.email} will see them!`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

