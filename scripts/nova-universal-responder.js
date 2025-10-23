import dotenv from 'dotenv';
dotenv.config();

import { WebClient } from '@slack/web-api';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

class NovaUniversalResponder {
  constructor() {
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.novaIntelligence = new NovaIntelligence();
    this.isRunning = false;
    this.novaBotUserId = 'U09MKQL4Y9L'; // Nova Agent001 User ID
    this.memberChannels = []; // Will be populated with channels NOVA is a member of
    this.lastChecked = new Date();
  }

  async start() {
    this.isRunning = true;
    console.log('🔥 NOVA Universal Responder');
    console.log('💬 NOVA will respond to mentions in ALL channels she\'s a member of!');
    console.log('🛑 Press Ctrl+C to stop');

    // Get all channels NOVA is a member of
    await this.loadMemberChannels();

    try {
      await this.slack.chat.postMessage({
        channel: 'C09MFH9JTK5', // #general channel ID
        text: `Alright, let's cut the bullshit. NOVA Universal Responder is online. I'm monitoring ${this.memberChannels.length} channels. Mention me with @Nova Agent001!`,
        username: "Nova Agent001",
        icon_emoji: ":robot_face:"
      });
      console.log('✅ Startup message posted to #general');
    } catch (error) {
      console.log('❌ Error posting startup message:', error.message);
    }

    // Check for mentions every 30 seconds
    this.mentionMonitorInterval = setInterval(() => this.checkAllMemberChannels(), 30000);
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

  async checkAllMemberChannels() {
    for (const channel of this.memberChannels) {
      try {
        await this.checkChannelForMentions(channel);
        // Small delay between channel checks to avoid rate limiting
        await this.delay(500);
      } catch (error) {
        console.log(`❌ Error checking #${channel.name}:`, error.message);
      }
    }
  }

  async checkChannelForMentions(channel) {
    try {
      console.log(`🔍 Checking #${channel.name} for mentions...`);
      
      const messages = await this.slack.conversations.history({
        channel: channel.id, // Use channel ID, not name
        oldest: Math.floor(this.lastChecked.getTime() / 1000).toString(),
        limit: 10
      });

      for (const message of messages.messages || []) {
        if (message.text && (
          message.text.includes('@U09MKQL4Y9L') || // Direct user ID mention
          message.text.toLowerCase().includes('nova agent001') ||
          message.text.toLowerCase().includes('@nova agent001')
        ) && message.user !== this.novaBotUserId) {
          
          console.log(`\n🔥 NOVA detected mention in #${channel.name}: "${message.text}"`);
          
          const novaResponse = await this.novaIntelligence.think(
            `Someone mentioned me (@Nova Agent001) in #${channel.name}: "${message.text}". How should I respond?`
          );
          
          await this.slack.chat.postMessage({
            channel: channel.id, // Use channel ID
            text: novaResponse.response,
            thread_ts: message.ts,
            username: "Nova Agent001",
            icon_emoji: ":robot_face:"
          });
          
          console.log(`✅ NOVA replied in #${channel.name} thread`);
        }
      }
    } catch (error) {
      console.log(`❌ Error checking #${channel.name}:`, error.message);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to refresh member channels
  async refreshMemberChannels() {
    await this.loadMemberChannels();
    console.log('🔄 Member channels refreshed');
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.mentionMonitorInterval);
    console.log('\n🛑 NOVA Universal Responder stopped');
  }
}

const novaUniversalResponder = new NovaUniversalResponder();
novaUniversalResponder.start().catch(console.error);

process.on('SIGINT', () => {
  novaUniversalResponder.stop();
  process.exit(0);
});
