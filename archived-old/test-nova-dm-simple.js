import { config } from 'dotenv';
import { WebClient } from '@slack/web-api';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

// Load environment variables
config();

async function testNovaDM() {
  console.log('🔥 Testing NOVA DM Response...');
  
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const novaIntelligence = new NovaIntelligence();
  
  try {
    // 1. Test basic authentication
    console.log('\n1. Testing authentication...');
    const auth = await slack.auth.test();
    console.log('✅ Authenticated as:', auth.user);
    
    // 2. Test posting to #general
    console.log('\n2. Testing message posting...');
    const result = await slack.chat.postMessage({
      channel: '#general',
      text: '🔥 NOVA DM Test: I can post messages! Send me a DM to test my intelligence.',
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    console.log('✅ Message posted to #general');
    
    // 3. Test NOVA's intelligence
    console.log('\n3. Testing NOVA intelligence...');
    const testMessage = "Hello NOVA, can you help me with a coding problem?";
    const novaResponse = await novaIntelligence.think(
      `Someone sent me this message: "${testMessage}". How should I respond?`
    );
    console.log('✅ NOVA Response:', novaResponse.response);
    
    // 4. Test listing conversations
    console.log('\n4. Testing conversation listing...');
    const conversations = await slack.conversations.list({
      types: 'im',
      limit: 3
    });
    console.log('✅ Found', conversations.channels?.length || 0, 'DM conversations');
    
    console.log('\n🎉 NOVA DM test completed successfully!');
    console.log('💬 Now send NOVA a direct message to test her response!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNovaDM();
