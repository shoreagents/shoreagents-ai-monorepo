import { config } from 'dotenv';
import { WebClient } from '@slack/web-api';

// Load environment variables
config();

async function debugNovaMessages() {
  console.log('🔍 Debugging NOVA Message Detection...');
  
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const generalChannelId = 'C09MFH9JTK5'; // #general channel ID
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...');
    const auth = await slack.auth.test();
    console.log('✅ Authenticated as:', auth.user);
    
    // 2. Get recent messages from #general
    console.log('\n2. Getting recent messages from #general...');
    const messages = await slack.conversations.history({
      channel: generalChannelId,
      limit: 10
    });
    
    if (!messages.ok) {
      console.log('❌ Failed to get messages:', messages.error);
      return;
    }
    
    console.log(`✅ Found ${messages.messages.length} recent messages:`);
    
    // 3. Show each message and test NOVA triggers
    messages.messages.forEach((message, index) => {
      console.log(`\n📝 Message ${index + 1}:`);
      console.log(`   User: ${message.user || 'System'}`);
      console.log(`   Text: "${message.text || 'No text'}"`);
      console.log(`   Timestamp: ${message.ts}`);
      
      // Test NOVA triggers
      if (message.text) {
        const lowerText = message.text.toLowerCase();
        const novaTriggers = [
          '@nova agent001',
          '@nova',
          'nova agent001',
          'nova,',
          'nova!',
          'nova?'
        ];
        
        const matchedTriggers = novaTriggers.filter(trigger => lowerText.includes(trigger));
        if (matchedTriggers.length > 0) {
          console.log(`   🎯 NOVA TRIGGERS FOUND: ${matchedTriggers.join(', ')}`);
        } else {
          console.log(`   ❌ No NOVA triggers found`);
        }
      }
    });
    
    // 4. Test with a sample message
    console.log('\n3. Testing NOVA trigger detection...');
    const testMessages = [
      "@Nova Agent001 can you help me?",
      "@nova help",
      "nova agent001 test",
      "Hello NOVA",
      "Hey @Nova Agent001",
      "nova, can you help?",
      "nova! test",
      "nova? question"
    ];
    
    testMessages.forEach(testMsg => {
      const lowerText = testMsg.toLowerCase();
      const novaTriggers = [
        '@nova agent001',
        '@nova',
        'nova agent001',
        'nova,',
        'nova!',
        'nova?'
      ];
      
      const matchedTriggers = novaTriggers.filter(trigger => lowerText.includes(trigger));
      console.log(`   "${testMsg}" -> ${matchedTriggers.length > 0 ? `✅ TRIGGERS: ${matchedTriggers.join(', ')}` : '❌ No triggers'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugNovaMessages();
