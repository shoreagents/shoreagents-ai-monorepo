import { config } from 'dotenv';
import { WebClient } from '@slack/web-api';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

// Load environment variables
config();

async function testNovaDMResponse() {
  console.log('🔥 NOVA Manual DM Test - No Rate Limits!');
  
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const novaIntelligence = new NovaIntelligence();
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...');
    const auth = await slack.auth.test();
    console.log('✅ Authenticated as:', auth.user);
    
    // 2. Get the specific DM channel (Cipher Seven)
    console.log('\n2. Getting DM channel info...');
    const channelId = 'D09MJ7RFV2R'; // Cipher Seven DM channel
    
    // 3. Get recent messages from this DM
    console.log('\n3. Getting recent messages from Cipher Seven DM...');
    const messages = await slack.conversations.history({
      channel: channelId,
      limit: 5
    });
    
    console.log('✅ Found', messages.messages?.length || 0, 'messages in DM');
    
    // 4. Show recent messages
    if (messages.messages && messages.messages.length > 0) {
      console.log('\n📨 Recent messages:');
      messages.messages.forEach((msg, index) => {
        if (msg.text && !msg.bot_id) {
          console.log(`   ${index + 1}. "${msg.text}" (${new Date(msg.ts * 1000).toLocaleString()})`);
        }
      });
    }
    
    // 5. Test NOVA's intelligence with a sample message
    console.log('\n4. Testing NOVA intelligence...');
    const testMessage = "Hello NOVA, can you help me test your DM response?";
    const novaResponse = await novaIntelligence.think(
      `Someone sent me this message in a DM: "${testMessage}". How should I respond?`
    );
    
    console.log('✅ NOVA Response:', novaResponse.response);
    
    // 6. Post NOVA's response to the DM
    console.log('\n5. Posting NOVA response to Cipher Seven DM...');
    const result = await slack.chat.postMessage({
      channel: channelId,
      text: `🔥 NOVA Test Response:\n\n${novaResponse.response}`,
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    
    console.log('✅ Response posted to DM!');
    console.log('📱 Message timestamp:', result.ts);
    
    // 7. Also post to #general for visibility
    console.log('\n6. Posting test summary to #general...');
    await slack.chat.postMessage({
      channel: '#general',
      text: '🔥 NOVA DM Test Complete! Check the Cipher Seven DM for her response.',
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    
    console.log('\n🎉 NOVA DM test completed successfully!');
    console.log('💬 Check the Cipher Seven DM to see NOVA\'s response!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('missing_scope')) {
      console.log('\n🔧 Missing Scope Error - You need to add these scopes:');
      console.log('   - im:read');
      console.log('   - im:history');
      console.log('   - mpim:read');
      console.log('   - mpim:history');
      console.log('\nThen REINSTALL the Slack app!');
    }
  }
}

testNovaDMResponse();
