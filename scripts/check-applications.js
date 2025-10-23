/**
 * Check Applications Table in BPOC
 * Run: node scripts/check-applications.js
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

async function checkApplications() {
  const pool = new Pool({
    connectionString: process.env.BPOC_DATABASE_URL,
    max: 1,
  })

  try {
    const client = await pool.connect()

    // Check applications table structure
    console.log('📊 Applications Table Structure:\n')
    const structure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'applications' 
      ORDER BY ordinal_position
    `)
    
    structure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`)
    })

    // Count total applications
    const total = await client.query('SELECT COUNT(*) FROM applications')
    console.log(`\n✅ Total Applications: ${total.rows[0].count}`)

    // Get sample application
    const sample = await client.query('SELECT * FROM applications LIMIT 1')
    if (sample.rows.length > 0) {
      console.log('\n📋 Sample Application:')
      const app = sample.rows[0]
      Object.keys(app).forEach(key => {
        console.log(`   ${key}: ${app[key]}`)
      })
    }

    // Count applications per job
    console.log('\n📊 Applications Per Job Request:')
    const perJob = await client.query(`
      SELECT 
        job_request_id, 
        COUNT(*) as application_count
      FROM applications
      GROUP BY job_request_id
      ORDER BY application_count DESC
      LIMIT 10
    `)
    
    perJob.rows.forEach(row => {
      console.log(`   Job ID ${row.job_request_id}: ${row.application_count} applicants`)
    })

    // Test JOIN with job_requests
    console.log('\n🔗 Testing JOIN with job_requests:')
    const joined = await client.query(`
      SELECT 
        jr.id,
        jr.job_title,
        COUNT(a.id) as applicant_count
      FROM job_requests jr
      LEFT JOIN applications a ON jr.id = a.job_request_id
      GROUP BY jr.id, jr.job_title
      HAVING COUNT(a.id) > 0
      ORDER BY applicant_count DESC
      LIMIT 5
    `)
    
    if (joined.rows.length > 0) {
      joined.rows.forEach(row => {
        console.log(`   "${row.job_title}" → ${row.applicant_count} applicants`)
      })
    } else {
      console.log('   No jobs with applicants found')
    }

    console.log('\n✅ Done!')

    client.release()
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkApplications()

