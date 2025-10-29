// Create Vanessa Garcia - Fully onboarded staff member
const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createVanessa() {
  try {
    console.log('🚀 Creating Vanessa Garcia - Complete Onboarding Setup\n')
    
    // CHECK IF v@v.com already exists - if so, stop
    const existingStaff = await prisma.staff_users.findUnique({
      where: { email: 'v@v.com' }
    })
    
    if (existingStaff) {
      console.log('⚠️  Vanessa (v@v.com) already exists!')
      console.log('✅ Staff User ID:', existingStaff.id)
      console.log('')
      console.log('📧 Email: v@v.com')
      console.log('🔒 Password: qwerty12345')
      console.log('')
      console.log('🎉 Ready to login and test!')
      return
    }
    
    // Get Johnny Smith's client user ID
    const johnnyClient = await prisma.client_users.findFirst({
      where: { email: 'sc@sc.com' }
    })
    
    if (!johnnyClient) {
      console.log('❌ Client sc@sc.com not found')
      return
    }
    
    console.log('✅ Found client:', johnnyClient.name, '(', johnnyClient.companyId, ')')
    
    // 1. GENERATE FAKE BPOC ID (no actual BPOC database needed)
    console.log('\n📝 Step 1: Generating BPOC candidate ID...')
    const bpocId = crypto.randomUUID()
    console.log('✅ BPOC candidate ID:', bpocId, '(fake - no BPOC database)')
    
    // 2. CREATE INTERVIEW REQUEST
    console.log('\n📝 Step 2: Creating interview request...')
    const interviewRequest = await prisma.interview_requests.create({
      data: {
        id: crypto.randomUUID(),
        clientUserId: johnnyClient.id,
        bpocCandidateId: bpocId,
        candidateFirstName: 'Vanessa',
        preferredTimes: JSON.stringify([{
          datetime: '2025-10-28T10:00',
          timezone: 'Australia/Brisbane',
          timezoneDisplay: 'Brisbane Time (AEST)'
        }]),
        clientNotes: 'Looking for a customer service specialist',
        status: 'HIRED',
        scheduledTime: new Date('2025-10-28T10:00:00Z'),
        adminNotes: 'Excellent interview, recommended for hire',
        meetingLink: 'https://daily.co/vanessa-interview',
        hireRequestedBy: 'client',
        hireRequestedAt: new Date(),
        clientPreferredStart: new Date('2025-11-15'),
        workSchedule: {
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          workStartTime: '08:00',
          isMonToFri: true,
          clientTimezone: 'Australia/Brisbane'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Interview request created:', interviewRequest.id)
    
    // 3. CREATE JOB ACCEPTANCE
    console.log('\n📝 Step 3: Creating job acceptance...')
    const jobAcceptance = await prisma.job_acceptances.create({
      data: {
        id: crypto.randomUUID(),
        interviewRequestId: interviewRequest.id,
        bpocCandidateId: bpocId,
        candidateEmail: 'v@v.com',
        candidatePhone: '+639171234567',
        position: 'Customer Support Specialist',
        companyId: johnnyClient.companyId,
        acceptedByAdminId: 'd2c0cac6-b216-4bd6-aff2-24458ace766e', // Stephen admin
        salary: '28000',
        shiftType: 'DAY_SHIFT',
        workLocation: 'WORK_FROM_HOME',
        hmoIncluded: true,
        leaveCredits: 12,
        workHours: '08:00 - 17:00 Australia/Brisbane (9 hours, Monday to Friday)',
        preferredStartDate: new Date('2025-11-15'),
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workStartTime: '08:00',
        workEndTime: '17:00',
        clientTimezone: 'Australia/Brisbane',
        isDefaultSchedule: true,
        signupEmailSent: true,
        signupEmailSentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Job acceptance created:', jobAcceptance.id)
    
    // 4. CREATE SUPABASE AUTH USER
    console.log('\n📝 Step 4: Creating Supabase auth user...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'v@v.com',
      password: 'qwerty12345',
      email_confirm: true, // Auto-confirm email
    })
    
    if (authError || !authData.user) {
      console.error('❌ Supabase auth error:', authError)
      throw new Error(authError?.message || 'Failed to create auth user')
    }
    
    console.log('✅ Supabase auth user created:', authData.user.id)
    
    // 5. CREATE STAFF USER
    console.log('\n📝 Step 5: Creating staff user...')
    const staffUser = await prisma.staff_users.create({
      data: {
        id: crypto.randomUUID(),
        authUserId: authData.user.id, // Link to Supabase auth user
        email: 'v@v.com',
        name: 'Vanessa Garcia',
        role: 'STAFF',
        companyId: johnnyClient.companyId,
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Staff user created:', staffUser.id)
    
    // 6. LINK JOB ACCEPTANCE TO STAFF USER
    console.log('\n📝 Step 6: Linking job acceptance...')
    await prisma.job_acceptances.update({
      where: { id: jobAcceptance.id },
      data: { staffUserId: staffUser.id }
    })
    
    console.log('✅ Job acceptance linked')
    
    // 7. CREATE STAFF PROFILE
    console.log('\n📝 Step 7: Creating staff profile...')
    const staffProfile = await prisma.staff_profiles.create({
      data: {
        id: crypto.randomUUID(),
        staffUserId: staffUser.id,
        currentRole: 'Customer Support Specialist',
        position: 'Customer Support Specialist',
        salary: 28000,
        employmentStatus: 'PROBATION',
        startDate: new Date('2025-11-15'),
        location: 'Manila, Metro Manila, Philippines',
        phone: '+639171234567',
        gender: 'FEMALE',
        civilStatus: 'SINGLE',
        dateOfBirth: new Date('1995-08-15'),
        hmo: true,
        totalLeave: 12,
        usedLeave: 0,
        vacationUsed: 0,
        sickUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Staff profile created:', staffProfile.id)
    
    // 8. CREATE STAFF ONBOARDING (COMPLETE)
    console.log('\n📝 Step 8: Creating completed onboarding...')
    const onboarding = await prisma.staff_onboarding.create({
      data: {
        id: crypto.randomUUID(),
        staffUserId: staffUser.id,
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
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Onboarding created:', onboarding.id)
    
    // 9. CREATE STAFF PERSONAL RECORDS
    console.log('\n📝 Step 9: Creating personal records...')
    const personalRecord = await prisma.staff_personal_records.create({
      data: {
        id: crypto.randomUUID(),
        staffUserId: staffUser.id,
        sss: '34-1234567-8',
        tin: '123-456-789-000',
        philhealthNo: 'PH-12-345678901-2',
        pagibigNo: '1234-5678-9012',
        emergencyContactName: 'Maria Garcia',
        emergencyContactNo: '+639171234568',
        emergencyRelationship: 'Mother',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Personal records created:', personalRecord.id)
    
    // 10. CREATE STAFF INTERESTS
    console.log('\n📝 Step 10: Creating staff interests...')
    const interests = await prisma.staff_interests.create({
      data: {
        id: crypto.randomUUID(),
        staffUserId: staffUser.id,
        hobbies: ['Reading', 'Cooking', 'Traveling', 'Photography'],
        favoriteFood: 'Adobo',
        favoriteColor: 'Blue',
        favoriteMovie: 'The Pursuit of Happyness',
        favoriteMusic: 'Pop and R&B',
        dreamDestination: 'Japan',
        funFact: 'I can speak 3 languages fluently!',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Staff interests created:', interests.id)
    
    // 11. CREATE WORK SCHEDULES
    console.log('\n📝 Step 11: Creating work schedules...')
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
          staffProfileId: staffProfile.id,
          dayOfWeek: day,
          startTime: isWork ? '08:00' : null,
          endTime: isWork ? '17:00' : null,
          isWorkday: isWork,
          dayOrder: order,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }
    
    console.log('✅ Work schedules created (Mon-Fri, 8AM-5PM)')
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 VANESSA GARCIA CREATED SUCCESSFULLY!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('📧 Email: v@v.com')
    console.log('🔒 Password: qwerty12345')
    console.log('👤 Role: Staff')
    console.log('🏢 Company:', johnnyClient.companyId)
    console.log('💼 Position: Customer Support Specialist')
    console.log('💰 Salary: PHP 28,000')
    console.log('📅 Work Schedule: Mon-Fri, 8:00 AM - 5:00 PM')
    console.log('🏥 HMO: Day 1')
    console.log('🏖️ Leave: 12 days')
    console.log('')
    console.log('✅ Complete Profile')
    console.log('✅ Complete Onboarding (100%)')
    console.log('✅ Personal Records')
    console.log('✅ Staff Interests')
    console.log('✅ Work Schedules')
    console.log('')
    console.log('🚀 Ready to login and test the platform!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createVanessa()

