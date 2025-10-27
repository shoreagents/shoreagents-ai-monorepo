import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking for client user...\n')
  
  const clientUser = await prisma.client_users.findUnique({
    where: { email: 'stephen@stepten.ai' },
    include: { company: true }
  })
  
  if (clientUser) {
    console.log('✅ Client user EXISTS:')
    console.log('   Email:', clientUser.email)
    console.log('   Name:', clientUser.name)
    console.log('   Company:', clientUser.company?.companyName)
    console.log('   Company ID:', clientUser.companyId)
  } else {
    console.log('❌ Client user NOT FOUND for stephen@stepten.ai')
    console.log('\n🔧 Need to create client user!')
  }
  
  console.log('\n📊 All client users:')
  const allClients = await prisma.client_users.findMany({
    include: { company: true }
  })
  console.log(`Found ${allClients.length} client users:`)
  allClients.forEach(c => {
    console.log(`  - ${c.email} (${c.company?.companyName || 'No company'})`)
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

