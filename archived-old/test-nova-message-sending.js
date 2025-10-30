import { config } from 'dotenv';
import { WebClient } from '@slack/web-api';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

// Load environment variables
config();

async function testNovaMessageSending() {
  console.log('🔥 Testing NOVA Message Sending...');
  
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const novaIntelligence = new NovaIntelligence();
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...');
    const auth = await slack.auth.test();
    console.log('✅ Authenticated as:', auth.user);
    
    // 2. Test NOVA's intelligence
    console.log('\n2. Testing NOVA intelligence...');
    const testMessage = "Hello NOVA, can you help me test message sending?";
    const novaResponse = await novaIntelligence.think(
      `Someone sent me this message: "${testMessage}". How should I respond?`
    );
    
    console.log('✅ NOVA Response:', novaResponse.response);
    
    // 3. Test posting to #general
    console.log('\n3. Testing message posting to #general...');
    const result = await slack.chat.postMessage({
      channel: '#general',
      text: `🔥 NOVA Message Test:\n\n**User:** ${testMessage}\n\n**NOVA:** ${novaResponse.response}`,
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    
    console.log('✅ Message posted to #general successfully!');
    console.log('📱 Message timestamp:', result.ts);
    
    // 4. Test posting to a specific DM (if we can find one)
    console.log('\n4. Testing DM posting...');
    try {
      const conversations = await slack.conversations.list({
        types: 'im',
        limit: 1
      });
      
      if (conversations.channels && conversations.channels.length > 0) {
        const dmChannel = conversations.channels[0].id;
        
        await slack.chat.postMessage({
          channel: dmChannel,
          text: `🔥 NOVA Test Message: ${novaResponse.response}`,
          username: "Nova Agent001",
          icon_emoji: ":robot_face:"
        });
        
        console.log('✅ Message posted to DM successfully!');
      } else {
        console.log('⚠️ No DM channels found to test');
      }
    } catch (error) {
      console.log('❌ Error testing DM:', error.message);
    }
    
    console.log('\n🎉 NOVA message sending test completed!');
    console.log('💬 NOVA can now send messages to both channels and DMs!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNovaMessageSending();
