import { config } from 'dotenv';
import { NovaIntelligence } from '../lib/nova-intelligence.js';
import { WebClient } from '@slack/web-api';

// Load environment variables
config();

async function testNovaSlack() {
  console.log('🔥 Testing NOVA Slack Communication...');
  
  const novaIntelligence = new NovaIntelligence();
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  
  try {
    // 1. Generate a NOVA message
    console.log('\n1. Generating NOVA message...');
    const messageResult = await novaIntelligence.generateSlackMessage(
      "Just finished setting up my intelligence system. Ready to handle some real work.",
      "celebration",
      { feature: "NOVA Intelligence" }
    );
    
    console.log('✅ NOVA Generated Message:', messageResult.response);
    
    // 2. Send it to Slack
    console.log('\n2. Sending to Slack...');
    const result = await slack.chat.postMessage({
      channel: '#general', // Change this to your channel
      text: messageResult.response,
      username: "NOVA",
      icon_emoji: ":robot_face:"
    });
    
    console.log('✅ Message sent to Slack!');
    console.log('📱 Channel:', result.channel);
    console.log('⏰ Timestamp:', result.ts);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testNovaSlack().catch(console.error);
