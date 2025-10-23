import { config } from 'dotenv';
import { NovaIntelligence } from '../lib/nova-intelligence.js';
import { WebClient } from '@slack/web-api';

// Load environment variables
config();

class NovaUltraConservativeUniversal {
  constructor() {
    this.novaIntelligence = new NovaIntelligence();
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.isRunning = false;
    this.processedMessages = new Set();
    this.novaBotUserId = 'U09MKQL4Y9L'; // NOVA's bot user ID
    this.lastCheckTime = new Date();
    this.memberChannels = []; // Will be populated with channels NOVA is a member of
  }

  async start() {
    console.log('🔥 NOVA Ultra Conservative Universal Mode');
    console.log('💬 NOVA will check ALL member channels every 2 minutes (very conservative)');
    console.log('🛑 Press Ctrl+C to stop\n');
    
    this.isRunning = true;
    
    // Load channels NOVA is a member of
    await this.loadMemberChannels();
    
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

  async loadMemberChannels() {
    try {
      console.log('🔍 Loading channels NOVA is a member of...');
      
      const channels = await this.slack.conversations.list({
        types: 'public_channel,private_channel',
        limit: 100
      });

      this.memberChannels = channels.channels?.filter(channel => channel.is_member) || [];
      
      console.log(`✅ NOVA is a member of ${this.memberChannels.length} channels:`);
      this.memberChannels.forEach((channel, index) => {
        console.log(`   ${index + 1}. #${channel.name} (${channel.id})`);
      });
    } catch (error) {
      console.log('❌ Error loading member channels:', error.message);
      // Fallback to known working channels
      this.memberChannels = [
        { id: 'C09MFH9JTK5', name: 'general' },
        { id: 'C09MU5YSXFC', name: 'development' }
      ];
      console.log('⚠️ Using fallback channels:', this.memberChannels.map(c => `#${c.name}`).join(', '));
    }
  }

  async postStartupMessage() {
    try {
      const message = `🔥 NOVA Ultra Conservative Universal Mode is online! I'm monitoring ${this.memberChannels.length} channels and will check every 2 minutes to avoid rate limits.`;
      
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
      console.log('🔍 Checking for new messages (ultra conservative universal mode)...');
      
      // Check all member channels for mentions
      for (const channel of this.memberChannels) {
        await this.checkChannelForMentions(channel);
        // Small delay between channels to avoid rate limits
        await this.delay(1000);
      }
      
      this.lastCheckTime = new Date();
    } catch (error) {
      console.log('❌ Error checking messages:', error.message);
    }
  }

  async checkChannelForMentions(channel) {
    try {
      console.log(`🔍 Checking #${channel.name} for mentions...`);
      
      const messages = await this.slack.conversations.history({
        channel: channel.id, // Use channel ID
        limit: 10, // Only get last 10 messages
        oldest: Math.floor(this.lastCheckTime.getTime() / 1000)
      });

      if (!messages.ok) {
        console.log(`❌ Failed to get #${channel.name} history:`, messages.error);
        return;
      }

      console.log(`✅ Found ${messages.messages?.length || 0} recent messages in #${channel.name}`);

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
          console.log(`\n🔥 NOVA detected mention in #${channel.name}: "${message.text}"`);
          console.log(`   User: ${message.user}, Bot ID: ${this.novaBotUserId}`);
          
          // Skip if it's NOVA's own message
          if (message.user === this.novaBotUserId) {
            console.log('   ⏭️ Skipping - this is NOVA\'s own message');
            continue;
          }
          
          try {
            const novaResponse = await this.novaIntelligence.think(
              `Someone mentioned me in #${channel.name}: "${message.text}". How should I respond?`
            );
            
            // Reply in thread to avoid cluttering the channel
            const result = await this.slack.chat.postMessage({
              channel: channel.id, // Use channel ID
              text: novaResponse.response,
              thread_ts: message.ts, // Reply in thread
              username: "Nova Agent001",
              icon_emoji: ":robot_face:"
            });
            
            console.log(`✅ NOVA replied in #${channel.name} thread successfully!`);
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
      console.log(`❌ Error checking #${channel.name}:`, error.message);
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
    console.log('\n🛑 NOVA Ultra Conservative Universal stopped');
  }
}

// Start the ultra conservative universal responder
const nova = new NovaUltraConservativeUniversal();
nova.start();

// Handle Ctrl+C
process.on('SIGINT', () => {
  nova.stop();
  process.exit(0);
});
