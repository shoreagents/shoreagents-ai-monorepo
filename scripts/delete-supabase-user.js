/**
 * Delete a Supabase Auth user by email
 * Run this to clean up failed signups
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function deleteUser(email) {
  console.log(`🔍 Looking for user: ${email}`)
  
  // Find user by email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Error listing users:', listError)
    return
  }
  
  const user = users.users.find(u => u.email === email)
  
  if (!user) {
    console.log('✅ User not found in Supabase Auth - nothing to delete!')
    return
  }
  
  console.log(`🗑️  Found user: ${user.email} (${user.id})`)
  console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
  
  // Delete user
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
  
  if (deleteError) {
    console.error('❌ Error deleting user:', deleteError)
    return
  }
  
  console.log('✅ User deleted from Supabase Auth!')
  console.log('\n🎉 You can now signup with this email again!')
}

// Get email from command line or use default
const email = process.argv[2] || 'nora@nora.com'

deleteUser(email)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

