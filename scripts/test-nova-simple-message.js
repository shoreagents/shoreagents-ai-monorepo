import { config } from 'dotenv';
import { WebClient } from '@slack/web-api';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

// Load environment variables
config();

async function testNovaSimpleMessage() {
  console.log('🔥 Testing NOVA Simple Message (No Rate Limits)...');
  
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const novaIntelligence = new NovaIntelligence();
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...');
    const auth = await slack.auth.test();
    console.log('✅ Authenticated as:', auth.user);
    
    // 2. Test NOVA's intelligence
    console.log('\n2. Testing NOVA intelligence...');
    const testMessage = "Testing NOVA's message sending capability";
    const novaResponse = await novaIntelligence.think(
      `Someone is testing my message sending: "${testMessage}". Give a brief, confident response.`
    );
    
    console.log('✅ NOVA Response:', novaResponse.response);
    
    // 3. Test posting to #general (single message, no loops)
    console.log('\n3. Testing single message post to #general...');
    const result = await slack.chat.postMessage({
      channel: '#general',
      text: `🔥 NOVA Test Message:\n\n${novaResponse.response}`,
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    
    console.log('✅ Message posted to #general successfully!');
    console.log('📱 Message timestamp:', result.ts);
    
    console.log('\n🎉 NOVA simple message test completed!');
    console.log('💬 NOVA can send messages without hitting rate limits!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNovaSimpleMessage();
