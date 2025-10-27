const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignNoraToStephensCompany() {
  try {
    console.log('🔍 Finding Stephen\'s client user record...');
    
    // Find Stephen by his email
    const stephen = await prisma.client_users.findFirst({
      where: {
        email: 'stephen@stepten.io'
      },
      include: {
        company: {
          include: {
            management_users: true
          }
        }
      }
    });

    if (!stephen) {
      console.log('❌ Stephen not found');
      return;
    }

    console.log(`✅ Found Stephen: ${stephen.name}`);
    console.log(`   Client User ID: ${stephen.id}`);
    console.log(`   Company ID: ${stephen.companyId}`);
    console.log(`   Company Name: ${stephen.company?.companyName || 'No company'}`);

    if (!stephen.companyId) {
      console.log('❌ Stephen has no company assigned');
      return;
    }

    const stephenCompanyId = stephen.companyId;

    // Jineva's management_users ID
    const jinevaId = 'e79455a3-d2a8-4f82-8e49-716e10bc362d';

    // Step 1: Assign Jineva as account manager if not already assigned
    if (!stephen.company.accountManagerId) {
      console.log('\n📝 Assigning Jineva as account manager...');
      await prisma.company.update({
        where: { id: stephenCompanyId },
        data: {
          accountManagerId: jinevaId,
          updatedAt: new Date()
        }
      });
      console.log('✅ Jineva assigned as account manager!');
    } else {
      console.log(`\n✅ Account manager already assigned: ${stephen.company.management_users?.name || 'Unknown'}`);
    }

    // Step 2: Find Nora
    console.log('\n🔍 Finding Nora...');
    const nora = await prisma.staff_users.findFirst({
      where: {
        email: 'nora4@nora.com'
      }
    });

    if (!nora) {
      console.log('❌ Nora not found');
      return;
    }

    console.log(`✅ Found Nora: ${nora.name}`);
    console.log(`   Current Company ID: ${nora.companyId || 'None'}`);

    // Step 3: Assign Nora to Stephen's company
    console.log(`\n📝 Assigning Nora to ${stephen.company?.companyName}...`);
    const updatedNora = await prisma.staff_users.update({
      where: { id: nora.id },
      data: {
        companyId: stephenCompanyId,
        updatedAt: new Date()
      }
    });

    console.log('✅ SUCCESS! Nora assigned to Stephen\'s company!');

    // Step 4: Verify by fetching Nora with full details
    console.log('\n🎉 Final Verification:');
    const noraWithCompany = await prisma.staff_users.findUnique({
      where: { id: nora.id },
      include: {
        company: {
          include: {
            management_users: true
          }
        }
      }
    });

    console.log(`   Staff: ${noraWithCompany.name}`);
    console.log(`   Email: ${noraWithCompany.email}`);
    console.log(`   Company: ${noraWithCompany.company?.companyName || 'None'}`);
    console.log(`   Account Manager: ${noraWithCompany.company?.management_users?.name || 'None'}`);
    console.log(`   Manager Email: ${noraWithCompany.company?.management_users?.email || 'N/A'}`);

    console.log('\n✅ All done! Nora can now log in and see Jineva as her account manager! 🚀');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

assignNoraToStephensCompany();

