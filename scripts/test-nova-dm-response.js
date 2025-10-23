import dotenv from 'dotenv';
dotenv.config();

import { WebClient } from '@slack/web-api';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

async function testNovaDMResponse() {
  console.log('🔥 Testing NOVA DM Response...');

  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const novaIntelligence = new NovaIntelligence();
  const novaBotUserId = 'U09MKQL4Y9L'; // Nova Agent001 User ID

  // 1. Test authentication
  console.log('\n1. Testing authentication...');
  try {
    const authTest = await slack.auth.test();
    console.log('✅ Authenticated as:', authTest.user);
    console.log('✅ Bot ID:', authTest.user_id);
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return;
  }

  // 2. List all DM conversations
  console.log('\n2. Listing DM conversations...');
  try {
    const conversations = await slack.conversations.list({
      types: 'im', // Direct messages only
      limit: 20
    });
    
    if (conversations.channels && conversations.channels.length > 0) {
      console.log(`✅ Found ${conversations.channels.length} DM conversations:`);
      conversations.channels.forEach((conv, index) => {
        console.log(`   ${index + 1}. Channel ID: ${conv.id}`);
      });
    } else {
      console.log('⚠️ No DM conversations found.');
      console.log('💡 Try sending a DM to @Nova Agent001 first!');
    }
  } catch (error) {
    console.error('❌ Error listing DM conversations:', error.message);
  }

  // 3. Test NOVA intelligence with a simulated DM
  console.log('\n3. Testing NOVA intelligence with simulated DM...');
  const simulatedDM = "Hey NOVA, I'm having trouble with a React hydration error. Can you help?";
  console.log(`📨 Simulated DM: "${simulatedDM}"`);
  
  const novaResponse = await novaIntelligence.think(
    `Someone sent me a direct message: "${simulatedDM}". How should I respond to this debugging request?`
  );
  
  console.log('✅ NOVA Response:', novaResponse.response);
  console.log('   Thinking Process:', novaResponse.thinking);
  console.log('   Recommended Action:', novaResponse.action);

  // 4. Post NOVA's response to #general for visibility
  console.log('\n4. Posting NOVA\'s response to #general for visibility...');
  try {
    await slack.chat.postMessage({
      channel: '#general',
      text: `🧪 **DM Test Response:**\n\n**Simulated DM:** "${simulatedDM}"\n\n**NOVA's Response:** ${novaResponse.response}`,
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    console.log('✅ Test response posted to #general');
  } catch (error) {
    console.error('❌ Error posting to #general:', error.message);
  }

  console.log('\n🎉 NOVA DM test completed!');
  console.log('💬 Now try sending a real DM to @Nova Agent001 in Slack!');
}

testNovaDMResponse().catch(console.error);
