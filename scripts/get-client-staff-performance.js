/**
 * Script to get performance metrics for all staff assigned to a specific client
 * Usage: node scripts/get-client-staff-performance.js stephen@stepten.io
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getClientStaffPerformance(clientEmail) {
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
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log(`👥 Found ${staffUsers.length} staff members assigned to this client`)
    console.log('=' .repeat(100))

    if (staffUsers.length === 0) {
      console.log('❌ No staff members found for this client')
      return
    }

    // Get staff IDs
    const staffIds = staffUsers.map(staff => staff.id)

    // Get all performance metrics for these staff members
    const performanceMetrics = await prisma.performanceMetric.findMany({
      where: {
        staffUserId: { in: staffIds }
      },
      orderBy: [
        { staffUserId: 'asc' },
        { date: 'desc' }
      ]
    })

    console.log(`📈 Found ${performanceMetrics.length} performance records`)
    console.log('')

    // Group metrics by staff member
    const metricsByStaff = new Map()
    performanceMetrics.forEach(metric => {
      if (!metricsByStaff.has(metric.staffUserId)) {
        metricsByStaff.set(metric.staffUserId, [])
      }
      metricsByStaff.get(metric.staffUserId).push(metric)
    })

    // Display performance data for each staff member
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
      
      const staffMetrics = metricsByStaff.get(staff.id) || []
      
      if (staffMetrics.length === 0) {
        console.log(`   📈 Performance: No performance data available`)
      } else {
        console.log(`   📈 Performance: ${staffMetrics.length} records found`)
        
        // Show latest performance data
        const latestMetric = staffMetrics[0]
        console.log(`   📅 Latest Record: ${new Date(latestMetric.date).toLocaleDateString()}`)
        console.log(`   🖱️  Mouse Movements: ${latestMetric.mouseMovements.toLocaleString()}`)
        console.log(`   🖱️  Mouse Clicks: ${latestMetric.mouseClicks.toLocaleString()}`)
        console.log(`   ⌨️  Keystrokes: ${latestMetric.keystrokes.toLocaleString()}`)
        console.log(`   ⏰ Active Time: ${latestMetric.activeTime} minutes`)
        console.log(`   😴 Idle Time: ${latestMetric.idleTime} minutes`)
        console.log(`   🖥️  Screen Time: ${latestMetric.screenTime} minutes`)
        console.log(`   📥 Downloads: ${latestMetric.downloads}`)
        console.log(`   📤 Uploads: ${latestMetric.uploads}`)
        console.log(`   🌐 Bandwidth: ${latestMetric.bandwidth} MB`)
        console.log(`   📋 Clipboard Actions: ${latestMetric.clipboardActions}`)
        console.log(`   📁 Files Accessed: ${latestMetric.filesAccessed}`)
        console.log(`   🔗 URLs Visited: ${latestMetric.urlsVisited}`)
        console.log(`   🔄 Tabs Switched: ${latestMetric.tabsSwitched}`)
        console.log(`   📊 Productivity Score: ${latestMetric.productivityScore || 'Not calculated'}%`)
        
        // Calculate totals across all records
        const totals = staffMetrics.reduce((acc, metric) => {
          acc.mouseMovements += metric.mouseMovements
          acc.mouseClicks += metric.mouseClicks
          acc.keystrokes += metric.keystrokes
          acc.activeTime += metric.activeTime
          acc.idleTime += metric.idleTime
          acc.screenTime += metric.screenTime
          acc.downloads += metric.downloads
          acc.uploads += metric.uploads
          acc.bandwidth += metric.bandwidth
          acc.clipboardActions += metric.clipboardActions
          acc.filesAccessed += metric.filesAccessed
          acc.urlsVisited += metric.urlsVisited
          acc.tabsSwitched += metric.tabsSwitched
          return acc
        }, {
          mouseMovements: 0,
          mouseClicks: 0,
          keystrokes: 0,
          activeTime: 0,
          idleTime: 0,
          screenTime: 0,
          downloads: 0,
          uploads: 0,
          bandwidth: 0,
          clipboardActions: 0,
          filesAccessed: 0,
          urlsVisited: 0,
          tabsSwitched: 0
        })
        
        console.log(`   📊 TOTALS (All Time):`)
        console.log(`      🖱️  Mouse Movements: ${totals.mouseMovements.toLocaleString()}`)
        console.log(`      🖱️  Mouse Clicks: ${totals.mouseClicks.toLocaleString()}`)
        console.log(`      ⌨️  Keystrokes: ${totals.keystrokes.toLocaleString()}`)
        console.log(`      ⏰ Active Time: ${totals.activeTime} minutes (${Math.round(totals.activeTime / 60)} hours)`)
        console.log(`      😴 Idle Time: ${totals.idleTime} minutes (${Math.round(totals.idleTime / 60)} hours)`)
        console.log(`      🖥️  Screen Time: ${totals.screenTime} minutes (${Math.round(totals.screenTime / 60)} hours)`)
        console.log(`      📥 Downloads: ${totals.downloads}`)
        console.log(`      📤 Uploads: ${totals.uploads}`)
        console.log(`      🌐 Bandwidth: ${totals.bandwidth} MB`)
        console.log(`      📋 Clipboard Actions: ${totals.clipboardActions}`)
        console.log(`      📁 Files Accessed: ${totals.filesAccessed}`)
        console.log(`      🔗 URLs Visited: ${totals.urlsVisited}`)
        console.log(`      🔄 Tabs Switched: ${totals.tabsSwitched}`)
      }
      
      console.log('   ' + '-'.repeat(80))
    })

    // Summary statistics
    console.log('\n' + '=' .repeat(100))
    console.log('📊 PERFORMANCE SUMMARY:')
    
    const staffWithMetrics = staffUsers.filter(staff => metricsByStaff.has(staff.id))
    const staffWithoutMetrics = staffUsers.filter(staff => !metricsByStaff.has(staff.id))
    
    console.log(`   Staff with Performance Data: ${staffWithMetrics.length}`)
    console.log(`   Staff without Performance Data: ${staffWithoutMetrics.length}`)
    console.log(`   Total Performance Records: ${performanceMetrics.length}`)
    
    if (staffWithMetrics.length > 0) {
      // Calculate overall totals
      const overallTotals = performanceMetrics.reduce((acc, metric) => {
        acc.mouseMovements += metric.mouseMovements
        acc.mouseClicks += metric.mouseClicks
        acc.keystrokes += metric.keystrokes
        acc.activeTime += metric.activeTime
        acc.idleTime += metric.idleTime
        acc.screenTime += metric.screenTime
        acc.downloads += metric.downloads
        acc.uploads += metric.uploads
        acc.bandwidth += metric.bandwidth
        acc.clipboardActions += metric.clipboardActions
        acc.filesAccessed += metric.filesAccessed
        acc.urlsVisited += metric.urlsVisited
        acc.tabsSwitched += metric.tabsSwitched
        return acc
      }, {
        mouseMovements: 0,
        mouseClicks: 0,
        keystrokes: 0,
        activeTime: 0,
        idleTime: 0,
        screenTime: 0,
        downloads: 0,
        uploads: 0,
        bandwidth: 0,
        clipboardActions: 0,
        filesAccessed: 0,
        urlsVisited: 0,
        tabsSwitched: 0
      })
      
      console.log(`\n   📈 OVERALL TOTALS (All Staff):`)
      console.log(`      🖱️  Mouse Movements: ${overallTotals.mouseMovements.toLocaleString()}`)
      console.log(`      🖱️  Mouse Clicks: ${overallTotals.mouseClicks.toLocaleString()}`)
      console.log(`      ⌨️  Keystrokes: ${overallTotals.keystrokes.toLocaleString()}`)
      console.log(`      ⏰ Active Time: ${overallTotals.activeTime} minutes (${Math.round(overallTotals.activeTime / 60)} hours)`)
      console.log(`      😴 Idle Time: ${overallTotals.idleTime} minutes (${Math.round(overallTotals.idleTime / 60)} hours)`)
      console.log(`      🖥️  Screen Time: ${overallTotals.screenTime} minutes (${Math.round(overallTotals.screenTime / 60)} hours)`)
      console.log(`      📥 Downloads: ${overallTotals.downloads}`)
      console.log(`      📤 Uploads: ${overallTotals.uploads}`)
      console.log(`      🌐 Bandwidth: ${overallTotals.bandwidth} MB`)
      console.log(`      📋 Clipboard Actions: ${overallTotals.clipboardActions}`)
      console.log(`      📁 Files Accessed: ${overallTotals.filesAccessed}`)
      console.log(`      🔗 URLs Visited: ${overallTotals.urlsVisited}`)
      console.log(`      🔄 Tabs Switched: ${overallTotals.tabsSwitched}`)
      
      // Calculate averages
      const avgRecords = performanceMetrics.length / staffWithMetrics.length
      console.log(`\n   📊 AVERAGES PER STAFF MEMBER:`)
      console.log(`      📈 Records per Staff: ${avgRecords.toFixed(1)}`)
      console.log(`      🖱️  Avg Mouse Clicks: ${Math.round(overallTotals.mouseClicks / staffWithMetrics.length).toLocaleString()}`)
      console.log(`      ⌨️  Avg Keystrokes: ${Math.round(overallTotals.keystrokes / staffWithMetrics.length).toLocaleString()}`)
      console.log(`      ⏰ Avg Active Time: ${Math.round(overallTotals.activeTime / staffWithMetrics.length)} minutes`)
      console.log(`      🖥️  Avg Screen Time: ${Math.round(overallTotals.screenTime / staffWithMetrics.length)} minutes`)
    }

  } catch (error) {
    console.error('❌ Error fetching client staff performance:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get client email from command line arguments
const clientEmail = process.argv[2]

if (!clientEmail) {
  console.log('❌ Please provide a client email address')
  console.log('Usage: node scripts/get-client-staff-performance.js <client-email>')
  console.log('Example: node scripts/get-client-staff-performance.js stephen@stepten.io')
  process.exit(1)
}

// Run the script
getClientStaffPerformance(clientEmail)
