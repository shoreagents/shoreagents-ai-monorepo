import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkData() {
  console.log("🔍 CHECKING TIME TRACKING DATA\n")
  
  // Find client users
  const clientUsers = await prisma.client_users.findMany({
    include: {
      company: {
        select: {
          id: true,
          companyName: true
        }
      }
    }
  })

  console.log(`📊 Total Client Users: ${clientUsers.length}`)
  clientUsers.forEach((client, i) => {
    console.log(`  ${i + 1}. ${client.email} → ${client.company?.companyName || 'No company'}`)
  })
  console.log("")

  // For each company, check staff
  for (const client of clientUsers) {
    if (!client.company) continue

    console.log(`\n🏢 COMPANY: ${client.company.companyName}`)
    console.log(`   Client: ${client.email}`)
    console.log(`   Company ID: ${client.company.id}`)

    const staff = await prisma.staff_users.findMany({
      where: {
        companyId: client.company.id
      },
      include: {
        profile: {
          select: {
            currentRole: true,
            startDate: true
          }
        }
      }
    })

    console.log(`   📋 Staff Count: ${staff.length}`)
    
    if (staff.length === 0) {
      console.log(`   ⚠️  NO STAFF ASSIGNED TO THIS COMPANY!`)
    } else {
      staff.forEach((s, i) => {
        console.log(`      ${i + 1}. ${s.name} (${s.email})`)
        console.log(`         Role: ${s.profile?.currentRole || 'Not set'}`)
        console.log(`         Start Date: ${s.profile?.startDate || 'Not set'}`)
      })

      // Check time entries for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)

      const staffIds = staff.map(s => s.id)
      const timeEntries = await prisma.time_entries.findMany({
        where: {
          staffUserId: { in: staffIds },
          clockIn: {
            gte: today,
            lte: endOfDay
          }
        },
        include: {
          staff_users: {
            select: {
              name: true
            }
          },
          breaks: true
        }
      })

      console.log(`   ⏰ Time Entries Today: ${timeEntries.length}`)
      if (timeEntries.length === 0) {
        console.log(`   ℹ️  No one clocked in today`)
      } else {
        timeEntries.forEach(entry => {
          console.log(`      - ${entry.staff_users.name}`)
          console.log(`        Clock In: ${entry.clockIn}`)
          console.log(`        Clock Out: ${entry.clockOut || 'Still active'}`)
          console.log(`        Breaks: ${entry.breaks.length}`)
        })
      }
    }
  }

  await prisma.$disconnect()
}

checkData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

