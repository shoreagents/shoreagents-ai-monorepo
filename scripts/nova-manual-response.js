import { config } from 'dotenv';
import { NovaIntelligence } from '../lib/nova-intelligence.js';
import { WebClient } from '@slack/web-api';

// Load environment variables
config();

async function novaManualResponse() {
  console.log('🔥 NOVA Manual Response Test...');
  
  const novaIntelligence = new NovaIntelligence();
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  
  try {
    // Simulate Stephen's message
    const stephenMessage = "Fix the fucking APP settings!!!!!! Recive Message is off";
    
    console.log('\n📨 Simulating Stephen\'s message:', stephenMessage);
    
    // Get NOVA's response
    console.log('\n🧠 Getting NOVA\'s response...');
    const novaResponse = await novaIntelligence.think(
      `Stephen just sent me this frustrated message: "${stephenMessage}". He's clearly frustrated about app settings and message reception issues. How should I respond to help him?`
    );
    
    console.log('✅ NOVA\'s Analysis:', novaResponse.response);
    
    // Post NOVA's response to #general (since DM channel access is restricted)
    console.log('\n📤 Posting NOVA\'s response to #general...');
    const result = await slack.chat.postMessage({
      channel: '#general',
      text: `@Stephen Atcheler - Here's my response to your app settings issue:\n\n${novaResponse.response}`,
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    
    console.log('✅ Response posted to DM!');
    console.log('📱 Channel:', result.channel);
    console.log('⏰ Timestamp:', result.ts);
    
    // Also post to #general for visibility
    console.log('\n📤 Posting to #general for visibility...');
    await slack.chat.postMessage({
      channel: '#general',
      text: `🔥 NOVA responded to Stephen's DM about app settings issues. Check the DM for the full response.`,
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    
    console.log('✅ Summary posted to #general');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

novaManualResponse().catch(console.error);
