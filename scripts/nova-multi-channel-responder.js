import dotenv from 'dotenv';
dotenv.config();

import { WebClient } from '@slack/web-api';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

class NovaMultiChannelResponder {
  constructor() {
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.novaIntelligence = new NovaIntelligence();
    this.isRunning = false;
    this.novaBotUserId = 'U09MKQL4Y9L'; // Nova Agent001 User ID
    
    // Channels to monitor - you can add more here
    this.monitoredChannels = [
      '#general',
      '#development', 
      '#random',
      '#help',
      '#tech-support'
    ];
    
    this.lastChecked = new Date();
  }

  async start() {
    this.isRunning = true;
    console.log('🔥 NOVA Multi-Channel Responder');
    console.log('💬 NOVA will respond to mentions in multiple channels!');
    console.log('📺 Monitoring channels:', this.monitoredChannels.join(', '));
    console.log('🛑 Press Ctrl+C to stop');

    try {
      await this.slack.chat.postMessage({
        channel: '#general',
        text: `Alright, let's cut the bullshit. NOVA Multi-Channel Responder is online. I'm monitoring: ${this.monitoredChannels.join(', ')}. Mention me with @Nova Agent001!`,
        username: "Nova Agent001",
        icon_emoji: ":robot_face:"
      });
      console.log('✅ Startup message posted to #general');
    } catch (error) {
      console.log('❌ Error posting startup message:', error.message);
    }

    // Check for mentions every 30 seconds
    this.mentionMonitorInterval = setInterval(() => this.checkAllChannels(), 30000);
  }

  async checkAllChannels() {
    for (const channel of this.monitoredChannels) {
      try {
        await this.checkChannelForMentions(channel);
        // Small delay between channel checks to avoid rate limiting
        await this.delay(1000);
      } catch (error) {
        console.log(`❌ Error checking ${channel}:`, error.message);
      }
    }
  }

  async checkChannelForMentions(channel) {
    try {
      console.log(`🔍 Checking ${channel} for mentions...`);
      
      const messages = await this.slack.conversations.history({
        channel: channel,
        oldest: Math.floor(this.lastChecked.getTime() / 1000).toString(),
        limit: 10
      });

      for (const message of messages.messages || []) {
        if (message.text && (
          message.text.includes('@U09MKQL4Y9L') || // Direct user ID mention
          message.text.toLowerCase().includes('nova agent001') ||
          message.text.toLowerCase().includes('@nova agent001')
        ) && message.user !== this.novaBotUserId) {
          
          console.log(`\n🔥 NOVA detected mention in ${channel}: "${message.text}"`);
          
          const novaResponse = await this.novaIntelligence.think(
            `Someone mentioned me (@Nova Agent001) in ${channel}: "${message.text}". How should I respond?`
          );
          
          await this.slack.chat.postMessage({
            channel: channel,
            text: novaResponse.response,
            thread_ts: message.ts,
            username: "Nova Agent001",
            icon_emoji: ":robot_face:"
          });
          
          console.log(`✅ NOVA replied in ${channel} thread`);
        }
      }
    } catch (error) {
      console.log(`❌ Error checking ${channel}:`, error.message);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to add new channels to monitor
  addChannel(channelName) {
    if (!this.monitoredChannels.includes(channelName)) {
      this.monitoredChannels.push(channelName);
      console.log(`✅ Added ${channelName} to monitored channels`);
    }
  }

  // Method to remove channels from monitoring
  removeChannel(channelName) {
    const index = this.monitoredChannels.indexOf(channelName);
    if (index > -1) {
      this.monitoredChannels.splice(index, 1);
      console.log(`✅ Removed ${channelName} from monitored channels`);
    }
  }

  // Method to list all monitored channels
  listChannels() {
    console.log('📺 Currently monitoring:', this.monitoredChannels.join(', '));
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.mentionMonitorInterval);
    console.log('\n🛑 NOVA Multi-Channel Responder stopped');
  }
}

const novaMultiChannelResponder = new NovaMultiChannelResponder();
novaMultiChannelResponder.start().catch(console.error);

process.on('SIGINT', () => {
  novaMultiChannelResponder.stop();
  process.exit(0);
});
