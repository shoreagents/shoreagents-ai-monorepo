/**
 * Check BPOC Database Tables
 * Run: node scripts/check-bpoc-tables.js
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

async function checkTables() {
  console.log('🔍 Checking BPOC Database Tables...\n')

  const pool = new Pool({
    connectionString: process.env.BPOC_DATABASE_URL,
    max: 1,
  })

  try {
    const client = await pool.connect()

    // Get all tables
    console.log('📊 All Tables:')
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      ORDER BY table_name
    `)
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`))

    console.log('\n🔍 Looking for job/application related tables...\n')

    // Check job_requests structure
    const jobReqStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_requests' 
      ORDER BY ordinal_position
    `)
    
    if (jobReqStructure.rows.length > 0) {
      console.log('✅ job_requests table found:')
      jobReqStructure.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`)
      })
      
      // Count job requests
      const jobCount = await client.query('SELECT COUNT(*) FROM job_requests')
      console.log(`   Total: ${jobCount.rows[0].count} job requests\n`)
    }

    // Check applications structure
    const appStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'applications' 
      ORDER BY ordinal_position
    `)
    
    if (appStructure.rows.length > 0) {
      console.log('✅ applications table found:')
      appStructure.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`)
      })
      
      // Count applications
      const appCount = await client.query('SELECT COUNT(*) FROM applications')
      console.log(`   Total: ${appCount.rows[0].count} applications`)
      
      // Sample application
      const sample = await client.query('SELECT * FROM applications LIMIT 1')
      if (sample.rows.length > 0) {
        console.log('\n   Sample application:')
        console.log(JSON.stringify(sample.rows[0], null, 2))
      }
      
      // Count applications per job
      const countPerJob = await client.query(`
        SELECT job_request_id, COUNT(*) as count
        FROM applications
        GROUP BY job_request_id
        ORDER BY count DESC
        LIMIT 5
      `)
      
      if (countPerJob.rows.length > 0) {
        console.log('\n   Applications per job (top 5):')
        countPerJob.rows.forEach(row => {
          console.log(`   Job ID ${row.job_request_id}: ${row.count} applications`)
        })
      }
    } else {
      console.log('❌ applications table not found')
      console.log('   → Check if table name is different (job_applications, candidate_applications, etc.)\n')
    }

    client.release()
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkTables()

