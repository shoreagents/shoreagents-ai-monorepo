/**
 * Script to get all staff assigned to a specific client
 * Usage: node scripts/get-client-staff.js stephen@stepten.io
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getClientStaff(clientEmail) {
  try {
    console.log(`🔍 Looking for client: ${clientEmail}`)
    
    // First, find the client user
    const clientUser = await prisma.clientUser.findUnique({
      where: { email: clientEmail },
      include: { 
        company: true,
        profile: true
      }
    })

    if (!clientUser) {
      console.log(`❌ Client not found: ${clientEmail}`)
      return
    }

    console.log(`✅ Found client: ${clientUser.name}`)
    console.log(`📊 Company: ${clientUser.company.companyName}`)
    console.log(`🏢 Company ID: ${clientUser.company.id}`)
    console.log(`👤 Role: ${clientUser.role}`)
    console.log('')

    // Get all staff assigned to this company
    const staffUsers = await prisma.staffUser.findMany({
      where: { 
        companyId: clientUser.company.id 
      },
      include: {
        profile: {
          select: {
            currentRole: true,
            location: true,
            employmentStatus: true,
            startDate: true,
            salary: true
          }
        },
        company: {
          select: {
            companyName: true
          }
        },
        _count: {
          select: {
            tasks: true,
            timeEntries: true,
            performanceMetrics: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log(`👥 Found ${staffUsers.length} staff members assigned to this client:`)
    console.log('=' .repeat(80))

    if (staffUsers.length === 0) {
      console.log('❌ No staff members found for this client')
      return
    }

    // Display staff information
    staffUsers.forEach((staff, index) => {
      console.log(`\n${index + 1}. ${staff.name}`)
      console.log(`   📧 Email: ${staff.email}`)
      console.log(`   🆔 ID: ${staff.id}`)
      console.log(`   👔 Role: ${staff.role}`)
      console.log(`   💼 Position: ${staff.profile?.currentRole || 'Not specified'}`)
      console.log(`   📍 Location: ${staff.profile?.location || 'Not specified'}`)
      console.log(`   💰 Salary: ${staff.profile?.salary ? `$${staff.profile.salary}` : 'Not specified'}`)
      console.log(`   📅 Start Date: ${staff.profile?.startDate ? new Date(staff.profile.startDate).toLocaleDateString() : 'Not specified'}`)
      console.log(`   📊 Employment Status: ${staff.profile?.employmentStatus || 'Not specified'}`)
      console.log(`   📈 Stats: ${staff._count.tasks} tasks, ${staff._count.timeEntries} time entries, ${staff._count.performanceMetrics} performance records`)
      console.log(`   🏢 Company: ${staff.company?.companyName || 'Not assigned'}`)
    })

    // Summary statistics
    console.log('\n' + '=' .repeat(80))
    console.log('📊 SUMMARY STATISTICS:')
    console.log(`   Total Staff: ${staffUsers.length}`)
    
    const staffRoles = staffUsers.reduce((acc, staff) => {
      acc[staff.role] = (acc[staff.role] || 0) + 1
      return acc
    }, {})
    
    console.log(`   By Role:`)
    Object.entries(staffRoles).forEach(([role, count]) => {
      console.log(`     - ${role}: ${count}`)
    })

    const employmentStatuses = staffUsers.reduce((acc, staff) => {
      const status = staff.profile?.employmentStatus || 'Unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    
    console.log(`   By Employment Status:`)
    Object.entries(employmentStatuses).forEach(([status, count]) => {
      console.log(`     - ${status}: ${count}`)
    })

    const totalTasks = staffUsers.reduce((sum, staff) => sum + staff._count.tasks, 0)
    const totalTimeEntries = staffUsers.reduce((sum, staff) => sum + staff._count.timeEntries, 0)
    const totalPerformanceRecords = staffUsers.reduce((sum, staff) => sum + staff._count.performanceMetrics, 0)
    
    console.log(`   Total Tasks: ${totalTasks}`)
    console.log(`   Total Time Entries: ${totalTimeEntries}`)
    console.log(`   Total Performance Records: ${totalPerformanceRecords}`)

  } catch (error) {
    console.error('❌ Error fetching client staff:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get client email from command line arguments
const clientEmail = process.argv[2]

if (!clientEmail) {
  console.log('❌ Please provide a client email address')
  console.log('Usage: node scripts/get-client-staff.js <client-email>')
  console.log('Example: node scripts/get-client-staff.js stephen@stepten.io')
  process.exit(1)
}

// Run the script
getClientStaff(clientEmail)
