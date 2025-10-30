import { config } from 'dotenv';
import { WebClient } from '@slack/web-api';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

// Load environment variables
config();

async function testNovaMentionResponse() {
  console.log('🔥 Testing NOVA Mention Response...');
  
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const novaIntelligence = new NovaIntelligence();
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...');
    const auth = await slack.auth.test();
    console.log('✅ Authenticated as:', auth.user);
    
    // 2. Simulate a mention and get NOVA's response
    console.log('\n2. Testing NOVA mention response...');
    const mentionMessage = "@Nova Agent001 can you help me with a coding problem?";
    const novaResponse = await novaIntelligence.think(
      `Someone mentioned me (@Nova Agent001) in Slack: "${mentionMessage}". How should I respond?`
    );
    
    console.log('✅ NOVA Response:', novaResponse.response);
    
    // 3. Post the test to #general
    console.log('\n3. Posting test mention to #general...');
    const result = await slack.chat.postMessage({
      channel: '#general',
      text: `🔥 NOVA Mention Test:\n\n**User:** ${mentionMessage}\n\n**NOVA Response:** ${novaResponse.response}`,
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    
    console.log('✅ Test mention posted to #general successfully!');
    console.log('📱 Message timestamp:', result.ts);
    
    console.log('\n🎉 NOVA mention response test completed!');
    console.log('💬 NOVA can respond to mentions without rate limits!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNovaMentionResponse();
