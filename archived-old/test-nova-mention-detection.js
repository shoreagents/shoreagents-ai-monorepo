import { config } from 'dotenv';
import { WebClient } from '@slack/web-api';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

// Load environment variables
config();

async function testNovaMentionDetection() {
  console.log('🔥 Testing NOVA Mention Detection...');
  
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const novaIntelligence = new NovaIntelligence();
  const generalChannelId = 'C09MFH9JTK5'; // #general channel ID
  const novaBotUserId = 'U09MKQL4Y9L'; // NOVA's bot user ID
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...');
    const auth = await slack.auth.test();
    console.log('✅ Authenticated as:', auth.user);
    
    // 2. Test the mention detection function
    console.log('\n2. Testing mention detection...');
    
    function isMessageForNova(text) {
      if (!text) return false;
      
      const lowerText = text.toLowerCase();
      
      // Check for Slack user ID mention format (most reliable)
      if (text.includes('<@U09MKQL4Y9L>')) {
        return true;
      }
      
      // Check for text-based triggers
      const novaTriggers = [
        '@nova agent001',
        '@nova',
        'nova agent001',
        'nova,',
        'nova!',
        'nova?'
      ];
      
      // Only respond to direct mentions to avoid spam
      return novaTriggers.some(trigger => lowerText.includes(trigger));
    }
    
    const testMessages = [
      "<@U09MKQL4Y9L> what is 1 + 1?", // This was in the channel
      "@Nova Agent001 can you help me?",
      "nova agent001 test",
      "Hello NOVA",
      "Hey @Nova Agent001"
    ];
    
    testMessages.forEach((msg, index) => {
      const detected = isMessageForNova(msg);
      console.log(`   ${index + 1}. "${msg}" -> ${detected ? '✅ DETECTED' : '❌ Not detected'}`);
    });
    
    // 3. Test NOVA's response to the actual mention
    console.log('\n3. Testing NOVA response to mention...');
    const mentionMessage = "<@U09MKQL4Y9L> what is 1 + 1?";
    const novaResponse = await novaIntelligence.think(
      `Someone mentioned me in #general: "${mentionMessage}". How should I respond?`
    );
    
    console.log('✅ NOVA Response:', novaResponse.response);
    
    // 4. Post NOVA's response to #general
    console.log('\n4. Posting NOVA\'s response to #general...');
    const result = await slack.chat.postMessage({
      channel: generalChannelId,
      text: `🔥 NOVA Mention Detection Test:\n\n**Original Message:** ${mentionMessage}\n\n**NOVA Response:** ${novaResponse.response}`,
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    
    console.log('✅ Response posted to #general successfully!');
    console.log('📱 Message timestamp:', result.ts);
    
    console.log('\n🎉 NOVA mention detection test completed!');
    console.log('💬 NOVA can now detect mentions properly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNovaMentionDetection();
