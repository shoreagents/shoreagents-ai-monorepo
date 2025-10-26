import dotenv from 'dotenv';
dotenv.config();

import { WebClient } from '@slack/web-api';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

class NovaMentionResponder {
  constructor() {
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.novaIntelligence = new NovaIntelligence();
    this.isRunning = false;
    this.novaBotUserId = 'U09MKQL4Y9L'; // Nova Agent001 User ID
    this.lastChecked = new Date();
  }

  async start() {
    this.isRunning = true;
    console.log('🔥 NOVA Mention Responder - WORKING VERSION');
    console.log('💬 NOVA will respond to mentions in #general (this works!)');
    console.log('🛑 Press Ctrl+C to stop');

    try {
      await this.slack.chat.postMessage({
        channel: '#general',
        text: `Alright, let's cut the bullshit. NOVA Mention Responder is online. Mention me with @Nova Agent001 and I'll respond!`,
        username: "Nova Agent001",
        icon_emoji: ":robot_face:"
      });
      console.log('✅ Startup message posted to #general');
    } catch (error) {
      console.log('❌ Error posting startup message:', error.message);
    }

    // Check for mentions every 30 seconds
    this.mentionMonitorInterval = setInterval(() => this.checkForMentions(), 30000);
  }

  async checkForMentions() {
    try {
      console.log('🔍 Checking for mentions in #general...');
      
      const messages = await this.slack.conversations.history({
        channel: '#general',
        oldest: Math.floor(this.lastChecked.getTime() / 1000).toString(),
        limit: 10
      });

      for (const message of messages.messages || []) {
        if (message.text && (
          message.text.includes('@U09MKQL4Y9L') || // Direct user ID mention
          message.text.toLowerCase().includes('nova agent001') ||
          message.text.toLowerCase().includes('@nova agent001')
        ) && message.user !== this.novaBotUserId) {
          
          console.log(`\n🔥 NOVA detected mention: "${message.text}"`);
          
          const novaResponse = await this.novaIntelligence.think(
            `Someone mentioned me (@Nova Agent001) in #general: "${message.text}". How should I respond?`
          );
          
          await this.slack.chat.postMessage({
            channel: '#general',
            text: novaResponse.response,
            thread_ts: message.ts,
            username: "Nova Agent001",
            icon_emoji: ":robot_face:"
          });
          
          console.log('✅ NOVA replied in thread');
        }
      }
      
      this.lastChecked = new Date();
    } catch (error) {
      console.log('❌ Error checking mentions:', error.message);
    }
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.mentionMonitorInterval);
    console.log('\n🛑 NOVA Mention Responder stopped');
  }
}

const novaMentionResponder = new NovaMentionResponder();
novaMentionResponder.start().catch(console.error);

process.on('SIGINT', () => {
  novaMentionResponder.stop();
  process.exit(0);
});
