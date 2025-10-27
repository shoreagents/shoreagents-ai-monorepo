/**
 * Update job acceptance email for testing
 * Changes nora@nora.com to nora2@nora.com
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateJobAcceptanceEmail() {
  console.log('🔄 Updating job acceptance email from nora@nora.com to nora2@nora.com...\n');

  try {
    // Find the job acceptance
    const jobAcceptance = await prisma.job_acceptances.findFirst({
      where: {
        candidateEmail: 'nora@nora.com'
      },
      include: {
        interview_requests: true,
        company: true
      }
    });

    if (!jobAcceptance) {
      console.log('❌ No job acceptance found with email nora@nora.com');
      return;
    }

    console.log('📋 Found job acceptance:');
    console.log(`   ID: ${jobAcceptance.id}`);
    console.log(`   Current Email: ${jobAcceptance.candidateEmail}`);
    console.log(`   Position: ${jobAcceptance.position}`);
    console.log(`   Company: ${jobAcceptance.company.companyName}`);
    console.log(`   Interview: ${jobAcceptance.interview_requests?.candidateFirstName}`);
    console.log('');

    // Update the email
    const updated = await prisma.job_acceptances.update({
      where: { id: jobAcceptance.id },
      data: {
        candidateEmail: 'nora2@nora.com',
        updatedAt: new Date()
      }
    });

    console.log('✅ Email updated successfully!');
    console.log(`   New Email: ${updated.candidateEmail}`);
    console.log('');
    console.log('🎉 Now you can sign up with nora2@nora.com and it will auto-match!');
    console.log('');
    console.log('📍 Next Steps:');
    console.log('   1. Go to: http://localhost:3000/login/staff/signup');
    console.log('   2. Email: nora2@nora.com');
    console.log('   3. Name: Nora Johnson');
    console.log('   4. Password: password123');
    console.log('   5. Watch the console for auto-matching logs! 🚀');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateJobAcceptanceEmail();

