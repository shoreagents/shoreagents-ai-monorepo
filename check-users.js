const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n=== STAFF USERS (Login at /login/staff) ===')
  const staff = await prisma.user.findMany({
    where: { role: { in: ['STAFF', 'TEAM_LEAD', 'MANAGER'] } },
    select: { email: true, name: true, role: true }
  })
  staff.forEach(s => console.log(`✅ ${s.name} | ${s.email} | ${s.role}`))

  console.log('\n=== ADMIN USERS (Login at /login/admin) ===')
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true, name: true, role: true }
  })
  admins.forEach(a => console.log(`✅ ${a.name} | ${a.email} | ${a.role}`))

  console.log('\n=== CLIENT USERS (Login at /login/client) ===')
  const clients = await prisma.clientUser.findMany({
    include: { client: true }
  })
  clients.forEach(c => console.log(`✅ ${c.name} | ${c.email} | Client: ${c.client.companyName}`))

  console.log('\n=== STAFF ASSIGNMENTS (Who works for which client) ===')
  const assignments = await prisma.staffAssignment.findMany({
    where: { isActive: true },
    include: { 
      user: { select: { name: true, email: true } },
      client: { select: { companyName: true } }
    }
  })
  assignments.forEach(a => console.log(`✅ ${a.user.name} (${a.user.email}) → ${a.client.companyName}`))

  console.log('\n\n🔐 DEFAULT PASSWORD FOR ALL USERS: password123')
  console.log('\n📍 DEV SERVER: http://localhost:3000')
  console.log('   Staff Login:  http://localhost:3000/login/staff')
  console.log('   Client Login: http://localhost:3000/login/client')
  console.log('   Admin Login:  http://localhost:3000/login/admin')
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })

