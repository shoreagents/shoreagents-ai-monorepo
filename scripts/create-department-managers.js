const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const departments = [
  {
    department: 'CEO_EXECUTIVE',
    name: 'CEO Manager',
    email: 'ceo@test.com',
    role: 'ADMIN',
    avatar: '👔'
  },
  {
    department: 'IT_DEPARTMENT',
    name: 'IT Manager',
    email: 'it@test.com',
    role: 'MANAGER',
    avatar: '💻'
  },
  {
    department: 'HR_DEPARTMENT',
    name: 'HR Manager',
    email: 'hr@test.com',
    role: 'MANAGER',
    avatar: '👥'
  },
  {
    department: 'NURSE_DEPARTMENT',
    name: 'Nurse Manager',
    email: 'nurse@test.com',
    role: 'MANAGER',
    avatar: '🏥'
  },
  {
    department: 'RECRUITMENT_DEPARTMENT',
    name: 'Recruitment Manager',
    email: 'recruitment@test.com',
    role: 'MANAGER',
    avatar: '🎯'
  },
  {
    department: 'ACCOUNT_MANAGEMENT',
    name: 'Accounts Manager',
    email: 'accounts@test.com',
    role: 'MANAGER',
    avatar: '📊'
  },
  {
    department: 'FINANCE_DEPARTMENT',
    name: 'Finance Manager',
    email: 'finance@test.com',
    role: 'MANAGER',
    avatar: '💰'
  },
  {
    department: 'NERDS_DEPARTMENT',
    name: 'Software Team Lead',
    email: 'nerds@test.com',
    role: 'MANAGER',
    avatar: '🤓'
  },
  {
    department: 'OPERATIONS',
    name: 'Operations Manager',
    email: 'operations@test.com',
    role: 'MANAGER',
    avatar: '⚙️'
  }
]

async function createDepartmentManagers() {
  console.log('🎯 Creating Management Users for All Departments...\n')

  const password = 'password123' // Simple test password

  for (const dept of departments) {
    try {
      console.log(`\n📋 Processing: ${dept.department} (${dept.email})`)

      // 1. Check if user already exists in management_users
      const existingMgmtUser = await prisma.management_users.findUnique({
        where: { email: dept.email }
      })

      if (existingMgmtUser) {
        console.log(`   ⏭️  Management user already exists: ${dept.name}`)
        continue
      }

      // 2. Create or Get Supabase Auth User
      console.log(`   🔐 Creating/fetching Supabase auth user...`)
      let authUserId

      // Try to create the user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: dept.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: dept.name,
          role: 'management'
        }
      })

      if (authError && authError.message.includes('already been registered')) {
        // User exists, fetch it
        console.log(`   ⚠️  Auth user exists, fetching...`)
        const { data: users, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
          console.error(`   ❌ Error listing users:`, listError.message)
          continue
        }

        const existingUser = users.users.find(u => u.email === dept.email)
        if (!existingUser) {
          console.error(`   ❌ Could not find existing user`)
          continue
        }

        authUserId = existingUser.id
        console.log(`   ✅ Found existing auth user: ${authUserId}`)
      } else if (authError) {
        console.error(`   ❌ Supabase auth error:`, authError.message)
        continue
      } else {
        authUserId = authData.user.id
        console.log(`   ✅ Supabase auth user created: ${authUserId}`)
      }

      // 3. Create management_users record
      console.log(`   👤 Creating management_users record...`)
      const { randomUUID } = require('crypto')
      const now = new Date()
      const managementUser = await prisma.management_users.create({
        data: {
          id: randomUUID(), // Generate UUID for id field
          authUserId: authUserId, // Use the variable we set above
          name: dept.name,
          email: dept.email,
          role: dept.role,
          department: dept.department,
          avatar: dept.avatar,
          phone: null,
          updatedAt: now // Add updatedAt field
        }
      })

      console.log(`   ✅ Management user created: ${managementUser.id}`)
      console.log(`   📧 Login: ${dept.email} / ${password}`)

    } catch (error) {
      console.error(`   ❌ Error creating ${dept.department}:`, error.message)
    }
  }

  console.log('\n\n✅ DONE! All department managers created!')
  console.log('\n📋 LOGIN CREDENTIALS:\n')
  console.log('   Password for all accounts: password123\n')
  
  departments.forEach(dept => {
    console.log(`   ${dept.avatar} ${dept.name.padEnd(25)} → ${dept.email}`)
  })

  console.log('\n🔐 Login at: http://localhost:3000/login/management\n')
}

createDepartmentManagers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

