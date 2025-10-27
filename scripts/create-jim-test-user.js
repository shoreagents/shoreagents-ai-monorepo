const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createJimTestData() {
  try {
    console.log('🎯 Creating test data for Jim...\n');
    
    // 1. Get an existing company
    const company = await prisma.company.findFirst({
      where: { isActive: true }
    });
    
    if (!company) {
      console.log('❌ No active companies found');
      await prisma.$disconnect();
      return;
    }
    
    console.log('✅ Using company:', company.companyName);
    
    // 2. Get a client user from this company
    const clientUser = await prisma.clientUser.findFirst({
      where: { companyId: company.id }
    });
    
    if (!clientUser) {
      console.log('❌ No client users found for company');
      await prisma.$disconnect();
      return;
    }
    
    console.log('✅ Using client user:', clientUser.email);
    
    // 3. Delete existing Jim if exists
    const existingJim = await prisma.staffUser.findUnique({
      where: { email: 'jim@jim.com' }
    });
    
    if (existingJim) {
      console.log('⚠️ Deleting existing Jim account...');
      await prisma.staffOnboarding.deleteMany({
        where: { staffUserId: existingJim.id }
      });
      await prisma.staffUser.delete({
        where: { id: existingJim.id }
      });
      console.log('✅ Deleted old Jim account\n');
    }
    
    // 4. Create interview request
    const interviewId = 'jim-interview-' + Date.now();
    await prisma.interviewRequest.create({
      data: {
        id: interviewId,
        clientUserId: clientUser.id,
        candidateFirstName: 'Jim Smith',
        bpocCandidateId: 'jim-bpoc-123',
        preferredTimes: [],
        status: 'PENDING',
      }
    });
    
    console.log('✅ Created interview request');
    
    // 5. Create job acceptance
    const jobAcceptanceId = 'jim-job-' + Date.now();
    await prisma.jobAcceptance.create({
      data: {
        id: jobAcceptanceId,
        interviewRequestId: interviewId,
        bpocCandidateId: 'jim-bpoc-123',
        candidateEmail: 'jim@jim.com',
        candidatePhone: '+63 912 345 6789',
        position: 'Virtual Assistant',
        companyId: company.id,
        acceptedByAdminId: 'admin-test',
      }
    });
    
    console.log('✅ Created job acceptance\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 TEST DATA READY FOR JIM!');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('📋 JIM\'S SIGNUP INFO:');
    console.log('  Name: Jim Smith');
    console.log('  Email: jim@jim.com');
    console.log('  Password: qqwerty12345');
    console.log('  Company: ' + company.companyName);
    console.log('  Position: Virtual Assistant\n');
    console.log('🔗 SIGNUP LINK (COPY THIS):');
    const signupLink = 'http://localhost:3000/login/staff/signup?jobAcceptanceId=' + jobAcceptanceId;
    console.log('  ' + signupLink + '\n');
    console.log('📝 TEST STEPS:');
    console.log('  1. Copy the link above');
    console.log('  2. Open it in your browser');
    console.log('  3. You should see banner: "Hired as Virtual Assistant at ' + company.companyName + '"');
    console.log('  4. Fill signup form:');
    console.log('     • Name: Jim Smith');
    console.log('     • Email: jim@jim.com (pre-filled)');
    console.log('     • Password: qqwerty12345');
    console.log('  5. Click "Sign Up"');
    console.log('  6. Login with: jim@jim.com / qqwerty12345');
    console.log('  7. Go to: http://localhost:3000/welcome');
    console.log('  8. ✅ Client field should show: "' + company.companyName + '"\n');
    console.log('═══════════════════════════════════════════════════\n');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createJimTestData();

