import { config } from 'dotenv';
import { NovaIntelligence } from '../lib/nova-intelligence.js';
import { WebClient } from '@slack/web-api';

// Load environment variables
config();

class NovaUltraConservative {
  constructor() {
    this.novaIntelligence = new NovaIntelligence();
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.isRunning = false;
    this.processedMessages = new Set();
    this.novaBotUserId = 'U09MKQL4Y9L'; // NOVA's bot user ID
    this.lastCheckTime = new Date();
  }

  async start() {
    console.log('🔥 NOVA Ultra Conservative Mode');
    console.log('💬 NOVA will check for messages every 2 minutes (very conservative)');
    console.log('🛑 Press Ctrl+C to stop\n');
    
    this.isRunning = true;
    
    // Check for messages every 2 minutes (ultra conservative)
    setInterval(async () => {
      if (this.isRunning) {
        await this.checkForMessages();
      }
    }, 120000); // 2 minutes = 120,000ms
    
    // Post startup message
    await this.postStartupMessage();
    
    // Do one initial check
    await this.checkForMessages();
  }

  async postStartupMessage() {
    try {
      const message = "🔥 NOVA Ultra Conservative Mode is online! I'll check for messages every 2 minutes to avoid rate limits.";
      
      await this.slack.chat.postMessage({
        channel: 'C09MFH9JTK5', // #general channel ID
        text: message,
        username: "Nova Agent001",
        icon_emoji: ":robot_face:"
      });
      
      console.log('✅ Startup message posted to #general');
    } catch (error) {
      console.log('❌ Error posting startup message:', error.message);
    }
  }

  async checkForMessages() {
    try {
      console.log('🔍 Checking for new messages (ultra conservative mode)...');
      
      // Only check #general channel for mentions, not DMs
      await this.checkGeneralChannel();
      
      this.lastCheckTime = new Date();
    } catch (error) {
      console.log('❌ Error checking messages:', error.message);
    }
  }

  async checkGeneralChannel() {
    try {
      // Get recent messages from #general only (using channel ID)
      const messages = await this.slack.conversations.history({
        channel: 'C09MFH9JTK5', // #general channel ID
        limit: 10, // Only get last 10 messages
        oldest: Math.floor(this.lastCheckTime.getTime() / 1000)
      });

      if (!messages.ok) {
        console.log('❌ Failed to get #general history:', messages.error);
        return;
      }

      console.log(`✅ Found ${messages.messages?.length || 0} recent messages in #general`);

      for (const message of messages.messages || []) {
        // Skip if we've already processed this message
        if (this.processedMessages.has(message.ts)) {
          continue;
        }

        // Skip bot messages and NOVA's own messages
        if (message.bot_id || message.user === this.novaBotUserId) {
          continue;
        }

        // Skip system messages
        if (!message.text || message.text.trim() === '') {
          continue;
        }

        // Check if message mentions NOVA
        if (this.isMessageForNova(message.text)) {
          console.log(`\n🔥 NOVA detected mention in #general: "${message.text}"`);
          console.log(`   User: ${message.user}, Bot ID: ${this.novaBotUserId}`);
          
          // Skip if it's NOVA's own message
          if (message.user === this.novaBotUserId) {
            console.log('   ⏭️ Skipping - this is NOVA\'s own message');
            continue;
          }
          
          try {
            const novaResponse = await this.novaIntelligence.think(
              `Someone mentioned me in #general: "${message.text}". How should I respond?`
            );
            
            // Reply in thread to avoid cluttering the channel
            const result = await this.slack.chat.postMessage({
              channel: 'C09MFH9JTK5', // #general channel ID
              text: novaResponse.response,
              thread_ts: message.ts, // Reply in thread
              username: "Nova Agent001",
              icon_emoji: ":robot_face:"
            });
            
            console.log('✅ NOVA replied in thread successfully!');
            console.log('📱 Message timestamp:', result.ts);
            
            // Mark message as processed
            this.processedMessages.add(message.ts);
            
            // Add delay to avoid rate limits
            await this.delay(2000);
            
          } catch (error) {
            console.log('❌ Error sending NOVA response:', error.message);
          }
        }
      }
    } catch (error) {
      console.log('❌ Error checking #general:', error.message);
    }
  }

  isMessageForNova(text) {
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    console.log('\n🛑 NOVA Ultra Conservative stopped');
  }
}

// Start the ultra conservative responder
const nova = new NovaUltraConservative();
nova.start();

// Handle Ctrl+C
process.on('SIGINT', () => {
  nova.stop();
  process.exit(0);
});
