import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createClientUser() {
  try {
    // First, create an auth user
    const hashedPassword = await bcrypt.hash('qwerty12345', 10)
    
    const authUser = await prisma.user.create({
      data: {
        email: 'client@shoreagents.com',
        password: hashedPassword,
        name: 'Sarah Johnson',
        role: 'CLIENT'
      }
    })

    console.log('✅ Auth user created:', authUser.id)

    // Then create the client user record
    const clientUser = await prisma.clientUser.create({
      data: {
        authUserId: authUser.id,
        name: 'Sarah Johnson',
        email: 'client@shoreagents.com',
        role: 'MANAGER',
        companyId: '44d8847b-41b3-4d25-ab06-e658a5575694', // ShoreAgents company
      }
    })

    console.log('✅ Client user created:', clientUser.id)
    console.log('')
    console.log('📧 Email: client@shoreagents.com')
    console.log('🔑 Password: qwerty12345')
    console.log('🏢 Company: ShoreAgents')
    console.log('👤 Name: Sarah Johnson')
    console.log('🎯 Role: MANAGER')
    console.log('')
    console.log('🚀 You can now log in to the Client Portal!')

  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️  User already exists! Using existing credentials:')
      console.log('📧 Email: client@shoreagents.com')
      console.log('🔑 Password: qwerty12345')
    } else {
      console.error('Error creating client user:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createClientUser()

