/**
 * Test BPOC Database Connection
 * Run: node scripts/test-bpoc-connection.js
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

async function testConnection() {
  console.log('🔍 Testing BPOC Database Connection...\n')

  // Check if env var exists
  if (!process.env.BPOC_DATABASE_URL) {
    console.error('❌ BPOC_DATABASE_URL not found in .env.local')
    console.log('   Please add: BPOC_DATABASE_URL=postgresql://...')
    process.exit(1)
  }

  console.log('✅ BPOC_DATABASE_URL found')
  console.log(`   Host: ${process.env.BPOC_DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}\n`)

  // Create connection pool
  const pool = new Pool({
    connectionString: process.env.BPOC_DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10000,
  })

  try {
    // Test connection
    console.log('🔌 Attempting to connect...')
    const client = await pool.connect()
    console.log('✅ Connected successfully!\n')

    // Test query - count users
    console.log('📊 Testing queries...')
    const userCount = await client.query('SELECT COUNT(*) FROM users')
    console.log(`✅ Users table: ${userCount.rows[0].count} total users`)

    // Count users with resumes
    const resumeCount = await client.query(`
      SELECT COUNT(*) 
      FROM users u
      INNER JOIN resumes_extracted re ON u.id = re.user_id
      WHERE re.resume_data IS NOT NULL
    `)
    console.log(`✅ Users with resumes: ${resumeCount.rows[0].count} candidates`)

    // Get sample candidate
    const sample = await client.query(`
      SELECT 
        u.id,
        u.first_name,
        u.position,
        u.location_city,
        u.location_country,
        re.resume_data->'skills' as skills
      FROM users u
      INNER JOIN resumes_extracted re ON u.id = re.user_id
      WHERE re.resume_data IS NOT NULL
      LIMIT 1
    `)

    if (sample.rows.length > 0) {
      console.log(`\n👤 Sample Candidate:`)
      console.log(`   Name: ${sample.rows[0].first_name}`)
      console.log(`   Position: ${sample.rows[0].position || 'N/A'}`)
      console.log(`   Location: ${sample.rows[0].location_city || 'N/A'}, ${sample.rows[0].location_country || 'N/A'}`)
      
      // Skills is already a JSON object from PostgreSQL JSONB, no need to parse
      const skills = sample.rows[0].skills
      if (skills && Array.isArray(skills)) {
        console.log(`   Skills: ${skills.slice(0, 3).join(', ')}`)
      } else {
        console.log(`   Skills: N/A`)
      }
    }

    console.log('\n✅ All tests passed! BPOC connection is working!')
    console.log('🚀 Your talent pool should now show candidates.\n')

    client.release()
  } catch (error) {
    console.error('\n❌ Connection failed!')
    console.error('   Error:', error.message)
    
    if (error.code === 'ENOTFOUND') {
      console.error('   → Check if the database host is correct')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   → Database is not accepting connections')
    } else if (error.message.includes('password')) {
      console.error('   → Check your database password')
    } else if (error.message.includes('does not exist')) {
      console.error('   → Database or table does not exist')
    }

    console.error('\n💡 Double-check your BPOC_DATABASE_URL in .env.local\n')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection()

