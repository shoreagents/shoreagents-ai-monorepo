// ============================================
// PERFORMANCE REVIEW SYSTEM - CREATE TEST STAFF
// Uses Prisma Client to create 12 test staff users
// ============================================

import { PrismaClient, EmploymentStatus, StaffRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Creating 12 test staff users for review system...\n')

  // Get the first company (or find by name)
  const company = await prisma.company.findFirst()
  
  if (!company) {
    throw new Error('❌ No company found in database! Please create a company first.')
  }

  console.log(`✅ Found company: ${company.companyName} (ID: ${company.id})\n`)

  const testStaff = [
    // MONTH 1 STAFF (3 users - 25 days ago)
    {
      name: 'John Doe',
      email: 'john.month1@test.com',
      authUserId: 'auth_john_m1',
      daysAgo: 25,
      employmentStatus: 'PROBATION' as EmploymentStatus,
      currentRole: 'Virtual Assistant',
      salary: 1000.00
    },
    {
      name: 'Emma Wilson',
      email: 'emma.month1@test.com',
      authUserId: 'auth_emma_m1',
      daysAgo: 25,
      employmentStatus: 'PROBATION' as EmploymentStatus,
      currentRole: 'Virtual Assistant',
      salary: 1000.00
    },
    {
      name: 'Michael Chen',
      email: 'michael.month1@test.com',
      authUserId: 'auth_michael_m1',
      daysAgo: 25,
      employmentStatus: 'PROBATION' as EmploymentStatus,
      currentRole: 'Virtual Assistant',
      salary: 1000.00
    },

    // MONTH 3 STAFF (3 users - 85 days ago)
    {
      name: 'Jane Smith',
      email: 'jane.month3@test.com',
      authUserId: 'auth_jane_m3',
      daysAgo: 85,
      employmentStatus: 'PROBATION' as EmploymentStatus,
      currentRole: 'Customer Support',
      salary: 1000.00
    },
    {
      name: 'David Martinez',
      email: 'david.month3@test.com',
      authUserId: 'auth_david_m3',
      daysAgo: 85,
      employmentStatus: 'PROBATION' as EmploymentStatus,
      currentRole: 'Customer Support',
      salary: 1000.00
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.month3@test.com',
      authUserId: 'auth_sarah_m3',
      daysAgo: 85,
      employmentStatus: 'PROBATION' as EmploymentStatus,
      currentRole: 'Customer Support',
      salary: 1000.00
    },

    // MONTH 5 STAFF (3 users - 145 days ago)
    {
      name: 'Bob Anderson',
      email: 'bob.month5@test.com',
      authUserId: 'auth_bob_m5',
      daysAgo: 145,
      employmentStatus: 'PROBATION' as EmploymentStatus,
      currentRole: 'Data Entry',
      salary: 1000.00
    },
    {
      name: 'Linda Taylor',
      email: 'linda.month5@test.com',
      authUserId: 'auth_linda_m5',
      daysAgo: 145,
      employmentStatus: 'PROBATION' as EmploymentStatus,
      currentRole: 'Data Entry',
      salary: 1000.00
    },
    {
      name: 'James Brown',
      email: 'james.month5@test.com',
      authUserId: 'auth_james_m5',
      daysAgo: 145,
      employmentStatus: 'PROBATION' as EmploymentStatus,
      currentRole: 'Data Entry',
      salary: 1000.00
    },

    // RECURRING STAFF (3 users - 175 days ago)
    {
      name: 'Alice Garcia',
      email: 'alice.recurring@test.com',
      authUserId: 'auth_alice_rec',
      daysAgo: 175,
      employmentStatus: 'REGULAR' as EmploymentStatus,
      currentRole: 'Senior VA',
      salary: 1200.00
    },
    {
      name: 'Robert Lee',
      email: 'robert.recurring@test.com',
      authUserId: 'auth_robert_rec',
      daysAgo: 175,
      employmentStatus: 'REGULAR' as EmploymentStatus,
      currentRole: 'Senior Support',
      salary: 1200.00
    },
    {
      name: 'Patricia White',
      email: 'patricia.recurring@test.com',
      authUserId: 'auth_patricia_rec',
      daysAgo: 175,
      employmentStatus: 'REGULAR' as EmploymentStatus,
      currentRole: 'Senior Support',
      salary: 1200.00
    }
  ]

  let created = 0

  for (const staff of testStaff) {
    try {
      // Check if already exists
      const existing = await prisma.staffUser.findUnique({
        where: { email: staff.email }
      })

      if (existing) {
        console.log(`⏭️  Skipping ${staff.name} - already exists`)
        continue
      }

      // Calculate start date
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - staff.daysAgo)

      // Create staff user with profile in a transaction
      const staffUser = await prisma.staffUser.create({
        data: {
          email: staff.email,
          name: staff.name,
          authUserId: staff.authUserId,
          companyId: company.id,
          role: 'STAFF' as StaffRole,
          profile: {
            create: {
              startDate: startDate,
              employmentStatus: staff.employmentStatus,
              currentRole: staff.currentRole,
              salary: staff.salary,
              daysEmployed: staff.daysAgo
            }
          }
        },
        include: {
          profile: true
        }
      })

      console.log(`✅ Created: ${staff.name} (${staff.daysAgo} days employed)`)
      created++
    } catch (error) {
      console.error(`❌ Error creating ${staff.name}:`, error)
    }
  }

  console.log(`\n🎉 Successfully created ${created} test staff users!`)
  
  // Verify
  const allTestStaff = await prisma.staffUser.findMany({
    where: {
      email: {
        endsWith: '@test.com'
      }
    },
    include: {
      profile: true,
      company: true
    }
  })

  console.log('\n📊 Summary:')
  console.log('─'.repeat(80))
  allTestStaff.forEach(staff => {
    const daysEmployed = staff.profile?.daysEmployed || 0
    let reviewType = ''
    if (daysEmployed >= 20 && daysEmployed <= 30) reviewType = '🔵 Month 1'
    else if (daysEmployed >= 80 && daysEmployed <= 90) reviewType = '🟢 Month 3'
    else if (daysEmployed >= 140 && daysEmployed <= 150) reviewType = '🟣 Month 5'
    else if (daysEmployed >= 170) reviewType = '🔄 Recurring'
    
    console.log(`${reviewType.padEnd(15)} ${staff.name.padEnd(20)} ${staff.email.padEnd(30)} ${daysEmployed} days`)
  })
  console.log('─'.repeat(80))
  console.log(`\n✅ Total: ${allTestStaff.length} staff users ready for review testing`)
  console.log(`📍 Company: ${company.companyName}`)
  console.log(`\n🚀 Next step: Go to http://localhost:3000/admin/reviews and click "Trigger Review Creation"`)
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

