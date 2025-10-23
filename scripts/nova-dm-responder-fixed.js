import { config } from 'dotenv';
import { NovaIntelligence } from '../lib/nova-intelligence.js';
import { WebClient } from '@slack/web-api';

// Load environment variables
config();

class NovaDMResponderFixed {
  constructor() {
    this.novaIntelligence = new NovaIntelligence();
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.isRunning = false;
    this.processedMessages = new Set();
    this.lastCheckTime = new Date();
  }

  async start() {
    console.log('🔥 NOVA DM Responder - FIXED VERSION');
    console.log('💬 NOVA will respond to direct messages (rate limit friendly)');
    console.log('🛑 Press Ctrl+C to stop\n');
    
    this.isRunning = true;
    
    // Check for DMs every 30 seconds (much less aggressive)
    setInterval(async () => {
      if (this.isRunning) {
        await this.checkForDMs();
      }
    }, 30000); // 30 seconds instead of 5
    
    // Post startup message
    await this.postStartupMessage();
  }

  async postStartupMessage() {
    try {
      const message = "🔥 NOVA DM Responder (Fixed) is now online! Send me a direct message to test my intelligence.";
      
      await this.slack.chat.postMessage({
        channel: '#general',
        text: message,
        username: "Nova Agent001",
        icon_emoji: ":robot_face:"
      });
      
      console.log('✅ Startup message posted to #general');
    } catch (error) {
      console.log('❌ Error posting startup message:', error.message);
    }
  }

  async checkForDMs() {
    try {
      console.log('🔍 Checking for new DMs...');
      
      // Get list of conversations (DMs) - with error handling
      const conversations = await this.slack.conversations.list({
        types: 'im',
        limit: 5,
        exclude_archived: true
      });

      if (!conversations.ok) {
        console.log('❌ Failed to list conversations:', conversations.error);
        return;
      }

      console.log(`✅ Found ${conversations.channels?.length || 0} DM conversations`);

      for (const conversation of conversations.channels || []) {
        await this.checkConversation(conversation.id);
        // Add delay between conversation checks to avoid rate limits
        await this.delay(1000);
      }
      
      this.lastCheckTime = new Date();
    } catch (error) {
      console.log('❌ Error checking DMs:', error.message);
    }
  }

  async checkConversation(channelId) {
    try {
      // Get recent messages from this DM
      const messages = await this.slack.conversations.history({
        channel: channelId,
        limit: 3, // Reduced from 5 to 3
        oldest: Math.floor(this.lastCheckTime.getTime() / 1000) // Only get messages since last check
      });

      if (!messages.ok) {
        console.log(`❌ Failed to get history for ${channelId}:`, messages.error);
        return;
      }

      for (const message of messages.messages || []) {
        // Skip if we've already processed this message
        if (this.processedMessages.has(message.ts)) {
          continue;
        }

        // Skip bot messages
        if (message.bot_id || message.user === 'U09MFH9JTK5') {
          continue;
        }

        // Check if message mentions NOVA or is a direct question
        if (this.isMessageForNova(message.text)) {
          console.log(`\n🔥 NOVA received DM: "${message.text}"`);
          
          const novaResponse = await this.novaIntelligence.think(
            `Someone sent me a direct message: "${message.text}". How should I respond?`
          );
          
          // Reply in the same DM
          await this.slack.chat.postMessage({
            channel: channelId,
            text: novaResponse.response,
            username: "Nova Agent001",
            icon_emoji: ":robot_face:"
          });
          
          console.log('✅ NOVA replied to DM');
          
          // Mark message as processed
          this.processedMessages.add(message.ts);
        }
      }
    } catch (error) {
      console.log('❌ Error checking conversation:', error.message);
    }
  }

  isMessageForNova(text) {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    const novaTriggers = [
      'nova',
      'nova agent001',
      '@nova agent001',
      'hello',
      'hi',
      'help',
      'can you',
      'what can you do',
      'test'
    ];
    
    return novaTriggers.some(trigger => lowerText.includes(trigger));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    console.log('\n🛑 NOVA DM Responder stopped');
  }
}

// Start the DM responder
const nova = new NovaDMResponderFixed();
nova.start();

// Handle Ctrl+C
process.on('SIGINT', () => {
  nova.stop();
  process.exit(0);
});
