// Add test documents to Vanessa's personal records
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addDocuments() {
  try {
    console.log('📄 Adding test documents to Vanessa...\n')
    
    const testDocUrl = 'https://hdztsymxdgpcqtorjgou.supabase.co/storage/v1/object/public/staff/staff_avatar/37086f53-b8b2-4ed8-bec6-b373ead68d0d/avatar.jpg'
    
    const staff = await prisma.staff_users.findUnique({
      where: { email: 'v@v.com' },
      include: {
        staff_personal_records: true
      }
    })
    
    if (!staff) {
      console.log('❌ Vanessa not found')
      return
    }
    
    if (!staff.staff_personal_records) {
      console.log('❌ Vanessa has no personal records')
      return
    }
    
    console.log('✅ Found Vanessa:', staff.id)
    console.log('📝 Updating all document URLs...\n')
    
    await prisma.staff_personal_records.update({
      where: { id: staff.staff_personal_records.id },
      data: {
        // Government Documents
        sssDocUrl: testDocUrl,
        tinDocUrl: testDocUrl,
        philhealthDocUrl: testDocUrl,
        pagibigDocUrl: testDocUrl,
        
        // Personal Documents
        validIdUrl: testDocUrl,
        birthCertUrl: testDocUrl,
        
        // Clearance Documents
        nbiClearanceUrl: testDocUrl,
        policeClearanceUrl: testDocUrl,
        
        // Additional Documents (NEW fields)
        birForm2316Url: testDocUrl,
        idPhotoUrl: testDocUrl,
        signatureUrl: testDocUrl,
        certificateEmpUrl: testDocUrl,
        medicalCertUrl: testDocUrl,
        resumeUrl: testDocUrl,
        employmentContractUrl: testDocUrl,
        
        updatedAt: new Date()
      }
    })
    
    console.log('✅ DOCUMENTS ADDED:')
    console.log('   📁 Government: SSS, TIN, PhilHealth, Pag-IBIG')
    console.log('   📁 Personal: Valid ID, Birth Certificate')
    console.log('   📁 Clearance: NBI, Police')
    console.log('   📁 Additional: BIR 2316, ID Photo, Signature, COE, Medical, Resume, Contract')
    console.log('')
    console.log('🎉 All documents now visible in Vanessa\'s profile!')
    console.log('📌 Using test URL:', testDocUrl)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addDocuments()

