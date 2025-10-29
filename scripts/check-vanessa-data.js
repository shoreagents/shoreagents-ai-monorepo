// Check Vanessa's data completeness
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkVanessa() {
  try {
    const staff = await prisma.staff_users.findUnique({
      where: { email: 'v@v.com' },
      include: {
        staff_profiles: {
          include: {
            work_schedules: true
          }
        },
        staff_onboarding: true,
        staff_personal_records: true,
        staff_welcome_forms: true,
        job_acceptances: {
          include: {
            interview_requests: true,
            company: true
          }
        }
      }
    })

    if (!staff) {
      console.log('❌ Vanessa not found')
      return
    }

    console.log('📊 VANESSA GARCIA DATA CHECK\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log('✅ Staff User:', staff.id)
    console.log('   Email:', staff.email)
    console.log('   Name:', staff.name)
    console.log('   Company:', staff.companyId)
    console.log('   Auth ID:', staff.authUserId)
    console.log('')
    
    console.log('🎯 Job Acceptance:', staff.job_acceptances ? '✅ EXISTS' : '❌ MISSING')
    if (staff.job_acceptances) {
      console.log('   Position:', staff.job_acceptances.position)
      console.log('   Salary:', staff.job_acceptances.salary)
      console.log('   Company:', staff.job_acceptances.company?.companyName)
      console.log('   Work Days:', staff.job_acceptances.workDays?.join(', '))
      console.log('   Work Time:', staff.job_acceptances.workStartTime, '-', staff.job_acceptances.workEndTime)
    }
    console.log('')
    
    console.log('👤 Staff Profile:', staff.staff_profiles ? '✅ EXISTS' : '❌ MISSING')
    if (staff.staff_profiles) {
      console.log('   Position:', staff.staff_profiles.currentRole)
      console.log('   Salary:', staff.staff_profiles.salary)
      console.log('   Status:', staff.staff_profiles.employmentStatus)
      console.log('   Gender:', staff.staff_profiles.gender)
      console.log('   Civil Status:', staff.staff_profiles.civilStatus)
      console.log('   DOB:', staff.staff_profiles.dateOfBirth?.toISOString().split('T')[0])
    }
    console.log('')
    
    console.log('📅 Work Schedules:', staff.staff_profiles?.work_schedules?.length || 0, 'days')
    if (staff.staff_profiles?.work_schedules && staff.staff_profiles.work_schedules.length > 0) {
      staff.staff_profiles.work_schedules.forEach(ws => {
        const time = ws.isWorkday ? `${ws.startTime} - ${ws.endTime}` : 'OFF'
        console.log(`   ${ws.dayOfWeek}: ${time}`)
      })
    }
    console.log('')
    
    console.log('📝 Onboarding:', staff.staff_onboarding ? '✅ EXISTS' : '❌ MISSING')
    if (staff.staff_onboarding) {
      console.log('   Complete:', staff.staff_onboarding.isComplete ? 'YES' : 'NO')
      console.log('   Progress:', staff.staff_onboarding.completionPercent + '%')
      console.log('   SSS:', staff.staff_onboarding.sss)
      console.log('   TIN:', staff.staff_onboarding.tin)
      console.log('   PhilHealth:', staff.staff_onboarding.philhealthNo)
      console.log('   Pag-IBIG:', staff.staff_onboarding.pagibigNo)
    }
    console.log('')
    
    console.log('📄 Personal Records:', staff.staff_personal_records ? '✅ EXISTS' : '❌ MISSING')
    if (staff.staff_personal_records) {
      console.log('   SSS:', staff.staff_personal_records.sss)
      console.log('   TIN:', staff.staff_personal_records.tin)
      console.log('   Emergency:', staff.staff_personal_records.emergencyContactName)
    }
    console.log('')
    
    console.log('👋 Welcome Form:', staff.staff_welcome_forms ? '✅ EXISTS' : '❌ MISSING')
    if (staff.staff_welcome_forms) {
      console.log('   Hobby:', staff.staff_welcome_forms.hobby)
      console.log('   Fav Food:', staff.staff_welcome_forms.favoriteFastFood)
      console.log('   Fav Color:', staff.staff_welcome_forms.favoriteColor)
    }
    console.log('')
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    
    const missing = []
    if (!staff.job_acceptances) missing.push('Job Acceptance')
    if (!staff.staff_profiles) missing.push('Staff Profile')
    if (!staff.staff_onboarding) missing.push('Onboarding')
    if (!staff.staff_personal_records) missing.push('Personal Records')
    if (!staff.staff_welcome_forms) missing.push('Welcome Form')
    if (staff.staff_profiles && (!staff.staff_profiles.work_schedules || staff.staff_profiles.work_schedules.length === 0)) {
      missing.push('Work Schedules')
    }
    
    if (missing.length > 0) {
      console.log('⚠️  MISSING DATA:')
      missing.forEach(m => console.log('   ❌', m))
    } else {
      console.log('🎉 ALL DATA COMPLETE!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVanessa()

