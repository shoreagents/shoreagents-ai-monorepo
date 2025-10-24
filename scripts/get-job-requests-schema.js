/**
 * Get Complete job_requests Table Schema from BPOC
 * Run: node scripts/get-job-requests-schema.js
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

async function getSchema() {
  const pool = new Pool({
    connectionString: process.env.BPOC_DATABASE_URL,
    max: 1,
  })

  try {
    const client = await pool.connect()

    console.log('📋 BPOC job_requests Table Complete Schema:\n')
    
    const schema = await client.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'job_requests' 
      ORDER BY ordinal_position
    `)
    
    console.log('┌─────────────────────────────┬──────────────────┬──────────┬─────────────┐')
    console.log('│ Column Name                 │ Data Type        │ Nullable │ Default     │')
    console.log('├─────────────────────────────┼──────────────────┼──────────┼─────────────┤')
    
    schema.rows.forEach(col => {
      const name = col.column_name.padEnd(27)
      const type = col.data_type.padEnd(16)
      const nullable = col.is_nullable.padEnd(8)
      const def = (col.column_default || '').substring(0, 11).padEnd(11)
      console.log(`│ ${name} │ ${type} │ ${nullable} │ ${def} │`)
    })
    
    console.log('└─────────────────────────────┴──────────────────┴──────────┴─────────────┘')
    console.log(`\n✅ Total Columns: ${schema.rows.length}`)

    // Check if company_id exists
    const hasCompanyId = schema.rows.find(col => col.column_name === 'company_id')
    if (hasCompanyId) {
      console.log(`\n✅ company_id column found!`)
      console.log(`   Type: ${hasCompanyId.data_type}`)
      console.log(`   Nullable: ${hasCompanyId.is_nullable}`)
    } else {
      console.log(`\n❌ company_id column NOT found`)
    }

    // Get sample data
    console.log('\n📊 Sample Job Request:\n')
    const sample = await client.query('SELECT * FROM job_requests LIMIT 1')
    
    if (sample.rows.length > 0) {
      const job = sample.rows[0]
      console.log(`   ID: ${job.id}`)
      console.log(`   Company ID: ${job.company_id}`)
      console.log(`   Title: ${job.job_title}`)
      console.log(`   Status: ${job.status}`)
      console.log(`   Created: ${job.created_at}`)
    }

    // Check companies table
    console.log('\n🏢 Companies Table Check:\n')
    const companies = await client.query(`
      SELECT id, name, created_at 
      FROM companies 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    
    console.log(`   Total companies: ${companies.rows.length}`)
    companies.rows.forEach(comp => {
      console.log(`   - ${comp.id}: ${comp.name}`)
    })

    client.release()
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

getSchema()

