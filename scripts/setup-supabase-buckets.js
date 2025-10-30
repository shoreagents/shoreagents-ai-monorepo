const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKETS = [
  {
    id: 'staff',
    name: 'staff',
    public: false,
    description: '🟦 Staff Portal - All staff-uploaded content (avatars, documents, tickets, tasks, posts, onboarding)'
  },
  {
    id: 'client',
    name: 'client',
    public: false,
    description: '🟢 Client Portal - All client-uploaded content (avatars, company assets, documents, tickets, tasks, posts)'
  },
  {
    id: 'management',
    name: 'management',
    public: false,
    description: '🟣 Management Portal - All management-uploaded content (avatars, documents, tickets, posts, policies)'
  }
]

async function setupBuckets() {
  console.log('🗂️  SUPABASE STORAGE BUCKET SETUP')
  console.log('=' .repeat(50))
  console.log('')

  for (const bucket of BUCKETS) {
    console.log(`\n📦 Creating bucket: ${bucket.name}`)
    console.log(`   Description: ${bucket.description}`)

    try {
      // Check if bucket already exists
      const { data: existingBuckets } = await supabase.storage.listBuckets()
      const exists = existingBuckets?.some(b => b.id === bucket.id)

      if (exists) {
        console.log(`   ⏭️  Bucket "${bucket.name}" already exists - skipping`)
        continue
      }

      // Create the bucket
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: 52428800, // 50MB limit per file
        allowedMimeTypes: [
          // Images
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          // Documents
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          // Text
          'text/plain',
          'text/csv',
          // Archives
          'application/zip',
          'application/x-rar-compressed'
        ]
      })

      if (error) {
        console.error(`   ❌ Error creating bucket "${bucket.name}":`, error.message)
        continue
      }

      console.log(`   ✅ Bucket "${bucket.name}" created successfully!`)
      console.log(`   📋 Bucket ID: ${data?.name || bucket.id}`)

    } catch (error) {
      console.error(`   ❌ Unexpected error:`, error.message)
    }
  }

  console.log('\n\n' + '='.repeat(50))
  console.log('✅ BUCKET SETUP COMPLETE!')
  console.log('='.repeat(50))
  console.log('\n📋 CREATED BUCKETS:\n')
  
  const { data: allBuckets } = await supabase.storage.listBuckets()
  const ourBuckets = allBuckets?.filter(b => ['staff', 'client', 'management'].includes(b.id))
  
  ourBuckets?.forEach(bucket => {
    const emoji = bucket.id === 'staff' ? '🟦' : bucket.id === 'client' ? '🟢' : '🟣'
    console.log(`   ${emoji} ${bucket.id.padEnd(12)} - ${bucket.public ? 'Public' : 'Private'} - Created: ${bucket.created_at}`)
  })

  console.log('\n\n🔒 NEXT STEPS:')
  console.log('   1. ✅ Buckets created')
  console.log('   2. ⏭️  Set up RLS policies (see SUPABASE-STORAGE-STRATEGY.md)')
  console.log('   3. ⏭️  Update upload APIs to use new bucket structure')
  console.log('   4. ⏭️  Test file uploads to each bucket')
  console.log('')
  console.log('📖 Full strategy: /docs/003 SUPABASE-STORAGE-STRATEGY.md\n')
}

setupBuckets()
  .then(() => {
    console.log('🎉 Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })

