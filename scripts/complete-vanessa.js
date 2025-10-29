// Complete Vanessa's setup with all missing data
const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

async function completeVanessa() {
  try {
    console.log('🚀 Completing Vanessa Garcia Setup\n')
    
    const staff = await prisma.staff_users.findUnique({
      where: { email: 'v@v.com' },
      include: {
        staff_profiles: true,
        staff_onboarding: true,
        staff_personal_records: true,
        staff_welcome_forms: true
      }
    })
    
    if (!staff) {
      console.log('❌ Vanessa not found')
      return
    }
    
    console.log('✅ Found Vanessa:', staff.id)
    
    // 1. CREATE STAFF PROFILE (if missing)
    if (!staff.staff_profiles) {
      console.log('\n📝 Creating staff profile...')
      const staffProfile = await prisma.staff_profiles.create({
        data: {
          id: crypto.randomUUID(),
          staffUserId: staff.id,
          currentRole: 'Customer Support Specialist',
          salary: 28000,
          employmentStatus: 'PROBATION',
          startDate: new Date('2025-11-15'),
          location: 'Manila, Metro Manila, Philippines',
          phone: '+639171234567',
          gender: 'FEMALE',
          civilStatus: 'SINGLE',
          dateOfBirth: new Date('1995-08-15'),
          timezone: 'Asia/Manila',
          hmo: true,
          totalLeave: 12,
          usedLeave: 0,
          vacationUsed: 0,
          sickUsed: 0,
          updatedAt: new Date()
        }
      })
      console.log('✅ Staff profile created:', staffProfile.id)
      
      // Create work schedules
      console.log('📅 Creating work schedules...')
      const workDays = [
        { day: 'Monday', order: 1 },
        { day: 'Tuesday', order: 2 },
        { day: 'Wednesday', order: 3 },
        { day: 'Thursday', order: 4 },
        { day: 'Friday', order: 5 },
        { day: 'Saturday', order: 6, isWork: false },
        { day: 'Sunday', order: 7, isWork: false }
      ]
      
      for (const { day, order, isWork = true } of workDays) {
        await prisma.work_schedules.create({
          data: {
            id: crypto.randomUUID(),
            dayOfWeek: day,
            startTime: isWork ? '08:00' : null,
            endTime: isWork ? '17:00' : null,
            isWorkday: isWork,
            dayOrder: order,
            updatedAt: new Date(),
            staff_profiles: {
              connect: { id: staffProfile.id }
            }
          }
        })
      }
      console.log('✅ Work schedules created (Mon-Fri, 8AM-5PM)')
    } else {
      console.log('\n✅ Staff profile already exists')
    }
    
    // 2. CREATE STAFF ONBOARDING (if missing)
    if (!staff.staff_onboarding) {
      console.log('\n📝 Creating completed onboarding...')
      await prisma.staff_onboarding.create({
        data: {
          id: crypto.randomUUID(),
          staffUserId: staff.id,
          email: 'v@v.com',
          firstName: 'Vanessa',
          middleName: 'Marie',
          lastName: 'Garcia',
          gender: 'FEMALE',
          civilStatus: 'SINGLE',
          dateOfBirth: new Date('1995-08-15'),
          contactNo: '+639171234567',
          sss: '34-1234567-8',
          tin: '123-456-789-000',
          philhealthNo: 'PH-12-345678901-2',
          pagibigNo: '1234-5678-9012',
          emergencyContactName: 'Maria Garcia',
          emergencyContactNo: '+639171234568',
          emergencyRelationship: 'Mother',
          completionPercent: 100,
          isComplete: true,
          personalInfoStatus: 'APPROVED',
          govIdStatus: 'APPROVED',
          documentsStatus: 'APPROVED',
          signatureStatus: 'APPROVED',
          updatedAt: new Date()
        }
      })
      console.log('✅ Onboarding created (100% complete)')
    } else {
      console.log('\n✅ Onboarding already exists')
    }
    
    // 3. CREATE PERSONAL RECORDS (if missing)
    if (!staff.staff_personal_records) {
      console.log('\n📝 Creating personal records...')
      await prisma.staff_personal_records.create({
        data: {
          id: crypto.randomUUID(),
          staffUserId: staff.id,
          sss: '34-1234567-8',
          tin: '123-456-789-000',
          philhealthNo: 'PH-12-345678901-2',
          pagibigNo: '1234-5678-9012',
          emergencyContactName: 'Maria Garcia',
          emergencyContactNo: '+639171234568',
          emergencyRelationship: 'Mother',
          updatedAt: new Date()
        }
      })
      console.log('✅ Personal records created')
    } else {
      console.log('\n✅ Personal records already exist')
    }
    
    // 4. CREATE WELCOME FORM (if missing)
    if (!staff.staff_welcome_forms) {
      console.log('\n📝 Creating welcome form...')
      await prisma.staff_welcome_forms.create({
        data: {
          id: crypto.randomUUID(),
          staffUserId: staff.id,
          name: 'Vanessa Marie Garcia',
          client: 'Johnny Smith - StepTen Inc',
          startDate: '2025-11-15',
          favoriteFastFood: 'Jollibee',
          favoriteColor: 'Blue',
          favoriteMusic: 'Pop and R&B',
          favoriteMovie: 'The Pursuit of Happyness',
          favoriteBook: 'Harry Potter Series',
          hobby: 'Reading, Cooking, Photography',
          dreamDestination: 'Japan',
          favoriteSeason: 'Winter',
          petName: 'Brownie (my dog)',
          favoriteSport: 'Volleyball',
          updatedAt: new Date()
        }
      })
      console.log('✅ Welcome form created')
    } else {
      console.log('\n✅ Welcome form already exists')
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 VANESSA GARCIA - FULLY COMPLETE!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('📧 Email: v@v.com')
    console.log('🔒 Password: qwerty12345')
    console.log('👤 Role: Staff')
    console.log('🏢 Company: StepTen Inc')
    console.log('💼 Position: Customer Support Specialist')
    console.log('💰 Salary: PHP 28,000')
    console.log('📅 Work Schedule: Mon-Fri, 8:00 AM - 5:00 PM')
    console.log('🏥 HMO: Day 1')
    console.log('🏖️ Leave: 12 days')
    console.log('')
    console.log('✅ Complete Job Acceptance')
    console.log('✅ Complete Profile')
    console.log('✅ Complete Onboarding (100%)')
    console.log('✅ Personal Records')
    console.log('✅ Welcome Form')
    console.log('✅ Work Schedules')
    console.log('')
    console.log('🚀 Ready to login and test the full platform!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

completeVanessa()

