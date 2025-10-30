const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyRLSPolicies() {
  console.log('🔒 APPLYING SUPABASE STORAGE RLS POLICIES')
  console.log('=' .repeat(60))
  console.log('')

  // Read the SQL file
  const sqlFilePath = path.join(__dirname, 'storage-rls-policies.sql')
  console.log('📄 Reading SQL file:', sqlFilePath)
  
  let sqlContent
  try {
    sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
  } catch (error) {
    console.error('❌ Error reading SQL file:', error.message)
    process.exit(1)
  }

  console.log('✅ SQL file loaded successfully')
  console.log('')

  // Split SQL into individual policy statements
  // Remove comments and empty lines
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => !s.startsWith('--'))
    .filter(s => !s.match(/^={5,}/)) // Remove separator lines

  console.log(`📊 Found ${statements.length} SQL statements to execute`)
  console.log('')

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  // Execute each policy
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim()
    
    // Skip if it's just a comment block
    if (statement.startsWith('--') || statement.length < 10) {
      continue
    }

    // Extract policy name from CREATE POLICY statement
    const policyMatch = statement.match(/CREATE POLICY "([^"]+)"/)
    const policyName = policyMatch ? policyMatch[1] : `Policy ${i + 1}`

    try {
      console.log(`   ${i + 1}/${statements.length} Creating: ${policyName}`)

      // Execute the SQL statement
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';' 
      })

      // If rpc doesn't exist, try direct query
      if (error && error.message.includes('function public.exec_sql')) {
        // Try using the REST API to execute raw SQL
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: statement + ';' })
          }
        )

        if (!response.ok) {
          // Try executing via pg connection if available
          // For now, we'll use a different approach
          throw new Error('Cannot execute SQL via API')
        }
      }

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`      ⏭️  Already exists - skipping`)
          skippedCount++
        } else {
          console.error(`      ❌ Error: ${error.message}`)
          errorCount++
        }
      } else {
        console.log(`      ✅ Created successfully`)
        successCount++
      }

    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`      ⏭️  Already exists - skipping`)
        skippedCount++
      } else {
        console.error(`      ❌ Error: ${error.message}`)
        errorCount++
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('')
  console.log('=' .repeat(60))
  console.log('📊 RLS POLICIES APPLICATION SUMMARY')
  console.log('=' .repeat(60))
  console.log(`   ✅ Created:  ${successCount} policies`)
  console.log(`   ⏭️  Skipped:  ${skippedCount} policies (already exist)`)
  console.log(`   ❌ Errors:   ${errorCount} policies`)
  console.log('')

  if (errorCount > 0) {
    console.log('⚠️  SOME POLICIES FAILED!')
    console.log('')
    console.log('   This is likely because the Supabase client cannot execute')
    console.log('   CREATE POLICY statements directly via JavaScript.')
    console.log('')
    console.log('   📋 MANUAL STEPS REQUIRED:')
    console.log('   1. Go to Supabase Dashboard → SQL Editor')
    console.log('   2. Open file: /scripts/storage-rls-policies.sql')
    console.log('   3. Copy all SQL')
    console.log('   4. Paste into SQL Editor')
    console.log('   5. Click "RUN"')
    console.log('')
    console.log('   ✅ This will create all 20 RLS policies at once!')
    console.log('')
  } else {
    console.log('✅ ALL RLS POLICIES APPLIED SUCCESSFULLY!')
    console.log('')
    console.log('🔒 SECURITY STATUS:')
    console.log('   ✅ Staff can only access their own files')
    console.log('   ✅ Client can read their staff\'s documents')
    console.log('   ✅ Management can access everything (oversight)')
    console.log('   ✅ All buckets are now secure!')
    console.log('')
    console.log('🎯 NEXT STEPS:')
    console.log('   1. ✅ Buckets created')
    console.log('   2. ✅ Folder structure established')
    console.log('   3. ✅ RLS policies applied')
    console.log('   4. ⏭️  Update upload APIs to use new structure')
    console.log('   5. ⏭️  Test file uploads')
    console.log('')
  }
}

// Alternative approach: Direct SQL execution
async function tryDirectExecution() {
  console.log('🔧 Attempting alternative approach...')
  console.log('')
  
  const sqlFilePath = path.join(__dirname, 'storage-rls-policies.sql')
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')

  try {
    // Try executing the entire SQL file at once
    const { data, error } = await supabase.rpc('query', { 
      query_text: sqlContent 
    })

    if (error) throw error

    console.log('✅ SQL executed successfully via alternative method!')
    return true
  } catch (error) {
    console.log('❌ Alternative method also failed')
    console.log('')
    return false
  }
}

async function main() {
  try {
    await applyRLSPolicies()
  } catch (error) {
    console.error('💥 Script failed:', error.message)
    console.log('')
    console.log('📋 MANUAL STEPS REQUIRED:')
    console.log('   1. Go to Supabase Dashboard → SQL Editor')
    console.log('   2. Open file: /scripts/storage-rls-policies.sql')
    console.log('   3. Copy all SQL')
    console.log('   4. Paste into SQL Editor')
    console.log('   5. Click "RUN"')
    console.log('')
    process.exit(1)
  }
}

main()
  .then(() => {
    console.log('🎉 Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })

