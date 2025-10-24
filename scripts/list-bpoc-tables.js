/**
 * List All BPOC Database Tables
 * Run: node scripts/list-bpoc-tables.js
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

async function listTables() {
  const pool = new Pool({
    connectionString: process.env.BPOC_DATABASE_URL,
    max: 1,
  })

  try {
    const client = await pool.connect()

    console.log('📊 BPOC Database Tables:\n')
    
    const tables = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema='public' 
      ORDER BY table_name
    `)
    
    tables.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${row.table_name.padEnd(35)} (${row.column_count} columns)`)
    })

    console.log(`\n✅ Total: ${tables.rows.length} tables`)

    // Show key relationships
    console.log('\n🔗 Key Tables for Job Requests:\n')
    console.log('   • job_requests - Job postings')
    console.log('   • applications - Candidate applications (uses job_id)')
    console.log('   • users - Candidate profiles')
    console.log('   • resumes_extracted - Parsed resumes')
    console.log('   • companies - Company information')

    client.release()
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

listTables()

