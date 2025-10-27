/**
 * Create Nora's Full Hire Flow Test Data
 * 
 * This script simulates the complete recruitment journey:
 * 1. Interview requested by client (stephen@stepten.io)
 * 2. Interview scheduled
 * 3. Interview completed
 * 4. Client requests to hire
 * 5. Admin sends offer
 * 6. Candidate accepts offer
 * 7. Ready for Admin to finalize and create staff account
 */

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const crypto = require('crypto');

const prisma = new PrismaClient();

// BPOC Database connection
const bpocDB = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL,
});

async function createNoraHireFlow() {
  console.log('🚀 Starting Nora hire flow creation...\n');

  try {
    // Step 1: Get an existing candidate from BPOC database (use ANY candidate - doesn't matter which)
    console.log('📝 Step 1: Finding an existing BPOC candidate...');
    
    let bpocCandidateId;
    let candidateName;
    
    try {
      const existingCandidates = await bpocDB.query(
        `SELECT id, first_name, full_name FROM users LIMIT 1`
      );

      if (existingCandidates.rows.length > 0) {
        bpocCandidateId = existingCandidates.rows[0].id;
        candidateName = existingCandidates.rows[0].full_name || existingCandidates.rows[0].first_name || 'Nora';
        console.log(`✅ Using existing BPOC candidate: ${candidateName} (${bpocCandidateId})`);
      } else {
        throw new Error('No candidates found in BPOC database!');
      }

      // Step 2: Get Stephen's client user ID
      console.log('\n📝 Step 2: Finding Stephen\'s client account...');
      
      const stephen = await prisma.client_users.findFirst({
        where: { email: 'stephen@stepten.io' },
        include: { company: true }
      });

      if (!stephen) {
        throw new Error('Stephen\'s client account not found!');
      }

      console.log(`✅ Found Stephen: ${stephen.name} (${stephen.company.companyName})`);

      // Step 3: Check if interview request already exists
      console.log('\n📝 Step 3: Creating interview request...');
      
      const existingInterview = await prisma.interview_requests.findFirst({
        where: {
          bpocCandidateId: bpocCandidateId,
          clientUserId: stephen.id
        }
      });

      let interviewId;
      
      if (existingInterview) {
        interviewId = existingInterview.id;
        console.log(`⚠️  Interview request already exists: ${interviewId}`);
      } else {
        const interview = await prisma.interview_requests.create({
          data: {
            id: crypto.randomUUID(),
            clientUserId: stephen.id,
            bpocCandidateId: bpocCandidateId,
            candidateFirstName: candidateName,
            preferredTimes: JSON.stringify(['2025-11-05T10:00', '2025-11-05T14:00']),
            clientNotes: 'Looking for customer service rep with excellent communication skills. This is a test hire flow for nora@nora.com.',
            status: 'PENDING',
            createdAt: new Date('2025-10-28T09:00:00Z'),
            updatedAt: new Date('2025-10-28T09:00:00Z')
          }
        });
        
        interviewId = interview.id;
        console.log(`✅ Created interview request: ${interviewId}`);
      }

      // Step 4: Update interview to SCHEDULED
      console.log('\n📝 Step 4: Scheduling interview...');
      
      await prisma.interview_requests.update({
        where: { id: interviewId },
        data: {
          status: 'SCHEDULED',
          scheduledTime: new Date('2025-11-05T10:00:00Z'),
          meetingLink: 'https://meet.google.com/nora-interview-123',
          adminNotes: 'Interview scheduled with client.',
          updatedAt: new Date('2025-10-29T10:00:00Z')
        }
      });
      
      console.log(`✅ Interview scheduled for Nov 5, 2025 at 10:00 AM`);

      // Step 5: Mark interview as COMPLETED
      console.log('\n📝 Step 5: Completing interview...');
      
      await prisma.interview_requests.update({
        where: { id: interviewId },
        data: {
          status: 'COMPLETED',
          adminNotes: 'Interview completed. Client was very impressed with Nora\'s communication skills.',
          updatedAt: new Date('2025-11-05T11:00:00Z')
        }
      });
      
      console.log(`✅ Interview marked as completed`);

      // Step 6: Client requests to hire
      console.log('\n📝 Step 6: Client requests to hire...');
      
      await prisma.interview_requests.update({
        where: { id: interviewId },
        data: {
          status: 'HIRE_REQUESTED',
          hireRequestedBy: 'client',
          hireRequestedAt: new Date('2025-11-05T12:00:00Z'),
          clientPreferredStart: new Date('2025-11-15T00:00:00Z'),
          updatedAt: new Date('2025-11-05T12:00:00Z')
        }
      });
      
      console.log(`✅ Client requested to hire (preferred start: Nov 15, 2025)`);

      // Step 7: Admin sends offer
      console.log('\n📝 Step 7: Admin sends offer...');
      
      await prisma.interview_requests.update({
        where: { id: interviewId },
        data: {
          status: 'OFFER_SENT',
          offerSentAt: new Date('2025-11-06T09:00:00Z'),
          adminNotes: 'Job offer sent to nora@nora.com. Position: Customer Service Representative. Waiting for candidate response.',
          updatedAt: new Date('2025-11-06T09:00:00Z')
        }
      });
      
      console.log(`✅ Offer sent to Nora`);

      // Step 8: Candidate accepts offer
      console.log('\n📝 Step 8: Candidate accepts offer...');
      
      await prisma.interview_requests.update({
        where: { id: interviewId },
        data: {
          status: 'OFFER_ACCEPTED',
          offerResponseAt: new Date(),
          adminNotes: 'OFFER ACCEPTED! Nora confirmed she can start on Nov 15, 2025. Ready to finalize hire and create staff account.',
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Offer accepted by Nora!`);

      // Final summary
      console.log('\n' + '='.repeat(60));
      console.log('🎉 SUCCESS! Hire flow is ready for testing!');
      console.log('='.repeat(60));
      console.log('\n📊 TIMELINE:');
      console.log('  1. Oct 28: Interview requested by Stephen');
      console.log('  2. Oct 29: Interview scheduled for Nov 5');
      console.log('  3. Nov 5:  Interview completed');
      console.log('  4. Nov 5:  Client requests to hire');
      console.log('  5. Nov 6:  Admin sends offer');
      console.log('  6. NOW:    Candidate accepts offer ✅');
      console.log('\n📍 NEXT STEPS FOR ADMIN:');
      console.log('  1. Go to Admin → Recruitment → Interviews');
      console.log('  2. See "OFFER ACCEPTED" status');
      console.log('  3. Click "Finalize Hire"');
      console.log('  4. Set final start date');
      console.log('  5. System creates staff account for nora@nora.com');
      console.log('  6. Staff member receives signup invitation');
      console.log('\n📍 NEXT STEPS FOR STAFF (NORA):');
      console.log('  1. Receive email invitation');
      console.log('  2. Click signup link');
      console.log('  3. Create account with nora@nora.com');
      console.log('  4. System auto-matches to recruitment record');
      console.log('  5. Profile auto-populated from BPOC data');
      console.log('  6. Assigned to StepTen company');
      console.log('\n🔗 TEST DATA:');
      console.log(`  Interview ID: ${interviewId}`);
      console.log(`  BPOC Candidate ID: ${bpocCandidateId}`);
      console.log(`  Client: ${stephen.name} (${stephen.email})`);
      console.log(`  Company: ${stephen.company.companyName}`);
      console.log(`  Candidate Name: ${candidateName}`);
      console.log(`  Email for Staff Signup: nora@nora.com`);
      console.log(`  Position: Customer Service Representative`);
      console.log(`  Preferred Start: Nov 15, 2025`);
      console.log('\n✨ Go to Admin → Recruitment → Interviews to see it!');
      console.log('='.repeat(60) + '\n');

    } catch (bpocError) {
      console.error('❌ Error with BPOC database:', bpocError);
      throw bpocError;
    }

  } catch (error) {
    console.error('\n❌ Error creating hire flow:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await bpocDB.end();
  }
}

createNoraHireFlow()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

