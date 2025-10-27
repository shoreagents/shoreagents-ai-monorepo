require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function assignJinevaToNorasCompany() {
  try {
    console.log('🔍 Finding Nora\'s staff record...');
    
    // Find Nora by email
    const nora = await prisma.staff_users.findFirst({
      where: {
        email: 'nora4@nora.com'
      },
      include: {
        company: true
      }
    });

    if (!nora) {
      console.log('❌ Nora not found');
      return;
    }

    console.log(`✅ Found Nora: ${nora.name}`);
    console.log(`   Company: ${nora.company?.companyName || 'No company'}`);
    console.log(`   Company ID: ${nora.companyId}`);

    if (!nora.companyId) {
      console.log('❌ Nora has no company assigned');
      return;
    }

    // Jineva's management_users ID
    const jinevaId = 'e79455a3-d2a8-4f82-8e49-716e10bc362d';

    console.log('\n📝 Updating company with Jineva as account manager...');
    
    const updatedCompany = await prisma.company.update({
      where: {
        id: nora.companyId
      },
      data: {
        accountManagerId: jinevaId
      }
    });

    console.log('✅ SUCCESS! Account manager assigned!');
    console.log(`   Company: ${updatedCompany.companyName}`);
    console.log(`   Account Manager ID: ${updatedCompany.accountManagerId}`);
    
    // Verify by fetching the full relationship
    const companyWithManager = await prisma.company.findUnique({
      where: { id: nora.companyId },
      include: {
        management_users: true
      }
    });

    console.log('\n🎉 Verification:');
    console.log(`   Company: ${companyWithManager.companyName}`);
    console.log(`   Account Manager: ${companyWithManager.management_users?.name || 'None'}`);
    console.log(`   Manager Email: ${companyWithManager.management_users?.email || 'N/A'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

assignJinevaToNorasCompany();

