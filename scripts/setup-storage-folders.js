const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Folder structure as per SUPABASE-STORAGE-STRATEGY.md
const FOLDER_STRUCTURE = {
  staff: [
    'avatars',
    'covers',
    'documents',
    'onboarding/government_docs',
    'onboarding/clearances',
    'onboarding/personal_docs',
    'onboarding/employment',
    'onboarding/signatures',
    'onboarding/education',
    'tickets',
    'tasks',
    'posts',
    'shared_activities'
  ],
  client: [
    'avatars',
    'covers',
    'companies',
    'documents',
    'tickets',
    'tasks',
    'posts'
  ],
  management: [
    'avatars',
    'covers',
    'documents',
    'tickets',
    'posts'
  ]
}

// Create a small placeholder file to establish folders
const createPlaceholder = () => {
  const content = `# Folder Structure Placeholder
  
This file establishes the folder structure for the Supabase Storage bucket.
It can be safely deleted once real files are uploaded to this folder.

Created: ${new Date().toISOString()}
Strategy: /docs/003 SUPABASE-STORAGE-STRATEGY.md
`
  return new Blob([content], { type: 'text/plain' })
}

async function setupFolders() {
  console.log('📁 SUPABASE STORAGE FOLDER SETUP')
  console.log('=' .repeat(60))
  console.log('')

  let totalCreated = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const [bucketName, folders] of Object.entries(FOLDER_STRUCTURE)) {
    const emoji = bucketName === 'staff' ? '🟦' : bucketName === 'client' ? '🟢' : '🟣'
    console.log(`\n${emoji} ${bucketName.toUpperCase()} BUCKET`)
    console.log('-'.repeat(60))

    for (const folder of folders) {
      const filePath = `${folder}/.gitkeep`
      
      try {
        // Check if placeholder already exists
        const { data: existingFile, error: checkError } = await supabase
          .storage
          .from(bucketName)
          .list(folder, { limit: 1 })

        // If folder has files, skip
        if (existingFile && existingFile.length > 0) {
          console.log(`   ⏭️  ${folder.padEnd(35)} (already exists)`)
          totalSkipped++
          continue
        }

        // Upload placeholder file to create folder
        const { data, error } = await supabase
          .storage
          .from(bucketName)
          .upload(filePath, createPlaceholder(), {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          // If error is "already exists", that's fine
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`   ⏭️  ${folder.padEnd(35)} (already exists)`)
            totalSkipped++
          } else {
            console.error(`   ❌ ${folder.padEnd(35)} Error: ${error.message}`)
            totalErrors++
          }
          continue
        }

        console.log(`   ✅ ${folder.padEnd(35)} (created)`)
        totalCreated++

      } catch (error) {
        console.error(`   ❌ ${folder.padEnd(35)} Error: ${error.message}`)
        totalErrors++
      }
    }
  }

  console.log('\n\n' + '='.repeat(60))
  console.log('📊 FOLDER SETUP SUMMARY')
  console.log('='.repeat(60))
  console.log(`   ✅ Created: ${totalCreated} folders`)
  console.log(`   ⏭️  Skipped: ${totalSkipped} folders (already exist)`)
  console.log(`   ❌ Errors:  ${totalErrors} folders`)
  console.log('')

  // Show complete structure
  console.log('\n📋 COMPLETE FOLDER STRUCTURE:\n')
  
  for (const [bucketName, folders] of Object.entries(FOLDER_STRUCTURE)) {
    const emoji = bucketName === 'staff' ? '🟦' : bucketName === 'client' ? '🟢' : '🟣'
    console.log(`${emoji} ${bucketName}/`)
    folders.forEach((folder, index) => {
      const isLast = index === folders.length - 1
      const prefix = isLast ? '└──' : '├──'
      console.log(`   ${prefix} ${folder}/`)
    })
    console.log('')
  }

  console.log('🎯 FOLDER PURPOSES:\n')
  console.log('🟦 STAFF BUCKET:')
  console.log('   • avatars/             - Profile pictures')
  console.log('   • covers/              - Profile cover photos')
  console.log('   • documents/           - Work samples, reports, presentations')
  console.log('   • onboarding/          - All onboarding documents (7 subfolders)')
  console.log('   • tickets/             - Support ticket attachments')
  console.log('   • tasks/               - Task deliverables and proofs')
  console.log('   • posts/               - Social feed images')
  console.log('   • shared_activities/   - Achievement sharing images')
  console.log('')
  console.log('🟢 CLIENT BUCKET:')
  console.log('   • avatars/             - Profile pictures')
  console.log('   • covers/              - Profile cover photos')
  console.log('   • companies/           - Company logos and assets')
  console.log('   • documents/           - Training materials, procedures, guidelines')
  console.log('   • tickets/             - Client ticket attachments')
  console.log('   • tasks/               - Task briefs and references')
  console.log('   • posts/               - Company announcements')
  console.log('')
  console.log('🟣 MANAGEMENT BUCKET:')
  console.log('   • avatars/             - Profile pictures')
  console.log('   • covers/              - Profile cover photos')
  console.log('   • documents/           - Policies, HR forms, handbooks, training')
  console.log('   • tickets/             - Management ticket attachments')
  console.log('   • posts/               - Company updates and announcements')
  console.log('')

  console.log('📖 Full details: /docs/003 SUPABASE-STORAGE-STRATEGY.md')
  console.log('')
  console.log('🔒 NEXT STEPS:')
  console.log('   1. ✅ Buckets created')
  console.log('   2. ✅ Folder structure established')
  console.log('   3. ⏭️  Set up RLS policies in Supabase dashboard')
  console.log('   4. ⏭️  Update upload APIs to use this structure')
  console.log('   5. ⏭️  Test file uploads')
  console.log('')
}

setupFolders()
  .then(() => {
    console.log('🎉 Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })

