import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

async function main() {
  console.log('🚀 Creating PENDING reviews for CLIENT to submit...\n')
  
  // Get client user
  const clientUser = await prisma.client_users.findUnique({
    where: { email: 'stephen@stepten.io' },
    include: { company: true }
  })
  
  if (!clientUser) {
    console.log('❌ Client not found!')
    return
  }
  
  console.log(`✅ Client: ${clientUser.email}`)
  console.log(`✅ Company: ${clientUser.company?.companyName}\n`)
  
  // Get all test staff with profiles
  const staffList = await prisma.staff_users.findMany({
    where: {
      email: { endsWith: '@test.com' },
      companyId: clientUser.companyId
    },
    include: {
      profile: true
    }
  })
  
  console.log(`Found ${staffList.length} staff users\n`)
  
  let created = 0
  
  for (const staff of staffList) {
    if (!staff.profile?.startDate) continue
    
    const startDate = staff.profile.startDate
    const daysEmployed = staff.profile.daysEmployed
    
    let reviewType: string | null = null
    let dueDate: Date | null = null
    
    // Determine which review type based on days employed
    if (daysEmployed >= 20 && daysEmployed <= 30) {
      reviewType = 'MONTH_1'
      dueDate = addDays(startDate, 30)
    } else if (daysEmployed >= 80 && daysEmployed <= 90) {
      reviewType = 'MONTH_3'
      dueDate = addDays(startDate, 90)
    } else if (daysEmployed >= 140 && daysEmployed <= 150) {
      reviewType = 'MONTH_5'
      dueDate = addDays(startDate, 150)
    } else if (daysEmployed >= 170) {
      reviewType = 'RECURRING'
      dueDate = addDays(startDate, 180)
    }
    
    if (!reviewType || !dueDate) {
      console.log(`⏭️  Skipping ${staff.name} (${daysEmployed} days - not in review window)`)
      continue
    }
    
    // Check if review already exists
    const existing = await prisma.reviews.findFirst({
      where: {
        staffUserId: staff.id,
        type: reviewType as any
      }
    })
    
    if (existing) {
      console.log(`⏭️  Skipping ${staff.name} - ${reviewType} already exists`)
      continue
    }
    
    // Create PENDING review
    const review = await prisma.reviews.create({
      data: {
        staffUserId: staff.id,
        type: reviewType as any,
        status: 'PENDING',
        client: clientUser.company?.companyName || 'StepTen',
        reviewer: clientUser.email,
        reviewerTitle: clientUser.role,
        dueDate: dueDate,
        evaluationPeriod: `Day 1 to Day ${daysEmployed}`
      }
    })
    
    console.log(`✅ Created ${reviewType} review for ${staff.name} (${daysEmployed} days)`)
    created++
  }
  
  console.log(`\n🎉 Created ${created} PENDING reviews!`)
  console.log(`\n✅ NOW: Login as stephen@stepten.io and go to /client/reviews`)
  console.log(`   You'll see ${created} reviews waiting for YOU to submit!\n`)
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

