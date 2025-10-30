const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 VERIFYING UNIVERSAL COMMENTS TABLE...\n')
  
  // Check table exists
  const result = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'comments' 
    ORDER BY ordinal_position
  `)
  
  console.log('✅ Comments table structure:')
  result.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`))
  
  // Check enums
  const commentableTypes = await prisma.$queryRawUnsafe(`
    SELECT enumlabel FROM pg_enum 
    WHERE enumtypid = 'CommentableType'::regtype 
    ORDER BY enumlabel
  `)
  
  console.log('\n✅ CommentableType enum values:')
  commentableTypes.forEach(t => console.log(`  - ${t.enumlabel}`))
  
  const userTypes = await prisma.$queryRawUnsafe(`
    SELECT enumlabel FROM pg_enum 
    WHERE enumtypid = 'UserType'::regtype 
    ORDER BY enumlabel
  `)
  
  console.log('\n✅ UserType enum values:')
  userTypes.forEach(t => console.log(`  - ${t.enumlabel}`))
  
  console.log('\n🎉 UNIVERSAL COMMENTS SYSTEM READY!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
