import { config } from 'dotenv';
import { NovaIntelligence } from '../lib/nova-intelligence.js';
import { WebClient } from '@slack/web-api';

// Load environment variables
config();

class NovaDMResponderActive {
  constructor() {
    this.novaIntelligence = new NovaIntelligence();
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.isRunning = false;
    this.processedMessages = new Set();
    this.novaBotUserId = 'U09MKQL4Y9L'; // NOVA's bot user ID
  }

  async start() {
    console.log('🔥 NOVA DM Responder - ACTIVE MODE');
    console.log('💬 NOVA will respond to ALL direct messages');
    console.log('🛑 Press Ctrl+C to stop\n');
    
    this.isRunning = true;
    
    // Check for DMs every 15 seconds (more responsive)
    setInterval(async () => {
      if (this.isRunning) {
        await this.checkForDMs();
      }
    }, 15000); // 15 seconds for better responsiveness
    
    // Post startup message
    await this.postStartupMessage();
  }

  async postStartupMessage() {
    try {
      const message = "🔥 NOVA is now ACTIVE and listening for DMs! Send me any message to test my intelligence.";
      
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
        limit: 10,
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
        await this.delay(500);
      }
      
    } catch (error) {
      console.log('❌ Error checking DMs:', error.message);
    }
  }

  async checkConversation(channelId) {
    try {
      // Get recent messages from this DM (last 5 messages)
      const messages = await this.slack.conversations.history({
        channel: channelId,
        limit: 5
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

        // Skip bot messages and NOVA's own messages
        if (message.bot_id || message.user === this.novaBotUserId) {
          continue;
        }

        // Skip system messages
        if (!message.text || message.text.trim() === '') {
          continue;
        }

        // Check if message is for NOVA (more lenient detection)
        if (this.isMessageForNova(message.text)) {
          console.log(`\n🔥 NOVA received DM: "${message.text}"`);
          
          try {
            const novaResponse = await this.novaIntelligence.think(
              `Someone sent me a direct message: "${message.text}". How should I respond?`
            );
            
            // Reply in the same DM
            const result = await this.slack.chat.postMessage({
              channel: channelId,
              text: novaResponse.response,
              username: "Nova Agent001",
              icon_emoji: ":robot_face:"
            });
            
            console.log('✅ NOVA replied to DM successfully!');
            console.log('📱 Message timestamp:', result.ts);
            
            // Mark message as processed
            this.processedMessages.add(message.ts);
            
            // Add delay to avoid rate limits
            await this.delay(1000);
            
          } catch (error) {
            console.log('❌ Error sending NOVA response:', error.message);
          }
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
      'hey',
      'help',
      'can you',
      'what can you do',
      'test',
      'how are you',
      'what\'s up',
      'good morning',
      'good afternoon',
      'good evening',
      'thanks',
      'thank you',
      'bye',
      'goodbye'
    ];
    
    // More lenient - respond to any message that contains these triggers
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
const nova = new NovaDMResponderActive();
nova.start();

// Handle Ctrl+C
process.on('SIGINT', () => {
  nova.stop();
  process.exit(0);
});
