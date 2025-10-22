import { config } from 'dotenv';
import { WebClient } from '@slack/web-api';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

// Load environment variables
config();

async function testNovaChannelAccess() {
  console.log('🔥 Testing NOVA Channel Access...');
  
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const novaIntelligence = new NovaIntelligence();
  const generalChannelId = 'C09MFH9JTK5'; // #general channel ID
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...');
    const auth = await slack.auth.test();
    console.log('✅ Authenticated as:', auth.user);
    
    // 2. Test channel history access
    console.log('\n2. Testing channel history access...');
    const messages = await slack.conversations.history({
      channel: generalChannelId,
      limit: 5
    });
    
    if (messages.ok) {
      console.log('✅ Can access #general channel history');
      console.log(`✅ Found ${messages.messages.length} recent messages`);
    } else {
      console.log('❌ Cannot access #general channel:', messages.error);
      return;
    }
    
    // 3. Test NOVA's intelligence
    console.log('\n3. Testing NOVA intelligence...');
    const testMessage = "Testing NOVA's channel access and intelligence";
    const novaResponse = await novaIntelligence.think(
      `Someone is testing my channel access: "${testMessage}". Give a brief, confident response.`
    );
    
    console.log('✅ NOVA Response:', novaResponse.response);
    
    // 4. Test posting to #general
    console.log('\n4. Testing message posting to #general...');
    const result = await slack.chat.postMessage({
      channel: generalChannelId,
      text: `🔥 NOVA Channel Access Test:\n\n${novaResponse.response}`,
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    
    console.log('✅ Message posted to #general successfully!');
    console.log('📱 Message timestamp:', result.ts);
    
    console.log('\n🎉 NOVA channel access test completed!');
    console.log('💬 NOVA can now access #general channel properly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNovaChannelAccess();
