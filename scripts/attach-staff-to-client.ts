import { PrismaClient } from "@prisma/client"
import { randomUUID } from "crypto"

const prisma = new PrismaClient()

async function main() {
  console.log("🔧 Attaching staff user to sc@sc.com client's company...\n")

  // Find the sc@sc.com client user
  const clientUser = await prisma.client_users.findUnique({
    where: { email: "sc@sc.com" },
    include: { company: true }
  })

  if (!clientUser) {
    console.log("❌ Client user sc@sc.com not found!")
    console.log("\n📋 Available client users:")
    const allClients = await prisma.client_users.findMany({
      include: { company: true }
    })
    allClients.forEach(c => {
      console.log(`  - ${c.email} (${c.company?.companyName || 'No company'})`)
    })
    return
  }

  console.log(`✅ Found client: ${clientUser.email}`)
  console.log(`✅ Company: ${clientUser.company.companyName}`)
  console.log(`✅ Company ID: ${clientUser.companyId}\n`)

  // Find the staff user
  const staffUser = await prisma.staff_users.findUnique({
    where: { email: "o@o.com" },
    include: { company: true }
  })

  if (!staffUser) {
    console.log("❌ Staff user o@o.com not found!")
    return
  }

  console.log(`✅ Found staff: ${staffUser.name} (${staffUser.email})`)
  console.log(`   Current company: ${staffUser.company?.companyName || 'None'}\n`)

  // Update the staff user's company
  const updatedStaff = await prisma.staff_users.update({
    where: { email: "o@o.com" },
    data: { 
      companyId: clientUser.companyId,
      updatedAt: new Date()
    },
    include: { 
      company: true,
      staff_profiles: true 
    }
  })

  console.log(`✅ Staff updated successfully!`)
  console.log(`   Name: ${updatedStaff.name}`)
  console.log(`   Email: ${updatedStaff.email}`)
  console.log(`   Company: ${updatedStaff.company?.companyName}`)
  console.log(`   Days employed: ${updatedStaff.staff_profiles?.daysEmployed || 0} days`)
  console.log(`   Start date: ${updatedStaff.staff_profiles?.startDate ? new Date(updatedStaff.staff_profiles.startDate).toLocaleDateString() : 'N/A'}`)
  
  console.log(`\n🎉 Login Credentials:`)
  console.log(`Email: o@o.com`)
  console.log(`Password: qwerty12345`)
  console.log(`Name: Shit Worker`)
  console.log(`Client: ${clientUser.company.companyName}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch((error) => {
    console.error("\n❌ Error:", error)
    process.exit(1)
  })

