#!/usr/bin/env node
/**
 * Auto-Reply Test Script
 * Test the auto-reply functionality for Slack mentions
 */

const { WebClient } = require('@slack/web-api');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnvFile();

class AutoReplyTester {
  constructor() {
    this.slackToken = process.env.SLACK_BOT_TOKEN;
    this.client = new WebClient(this.slackToken);
    
    // Configuration
    this.config = {
      targetChannel: 'C09MFH9JTK5', // #general channel ID
      targetUserId: 'U09NFUU49UY', // Your user ID
      replyMessage: 'Hello! I received your mention. How can I help you today? 🤖',
      cooldownMinutes: 5,
      lastReplyTime: new Map()
    };
  }
  
  async checkMentions() {
    try {
      console.log('🔍 Checking for mentions in #general...');
      
      // Get recent messages from #general
      const response = await this.client.conversations.history({
        channel: this.config.targetChannel,
        limit: 10
      });
      
      const messages = response.messages;
      let mentionsFound = 0;
      const now = Date.now();
      
      console.log(`📋 Found ${messages.length} recent messages`);
      
      for (const message of messages) {
        // Check if message mentions the target user
        if (message.text && message.text.includes(`<@${this.config.targetUserId}>`)) {
          console.log(`🎯 Found mention in message: "${message.text}"`);
          
          // Check cooldown
          const lastReplyTime = this.config.lastReplyTime.get(message.user) || 0;
          const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
          
          if (now - lastReplyTime > cooldownMs) {
            // Send auto-reply
            console.log(`💬 Sending auto-reply to user ${message.user}...`);
            
            const replyResult = await this.client.chat.postMessage({
              channel: this.config.targetChannel,
              thread_ts: message.ts,
              text: this.config.replyMessage
            });
            
            if (replyResult.ok) {
              this.config.lastReplyTime.set(message.user, now);
              mentionsFound++;
              console.log(`✅ Auto-reply sent successfully!`);
            } else {
              console.log(`❌ Failed to send auto-reply: ${replyResult.error}`);
            }
          } else {
            console.log(`⏰ Cooldown active for user ${message.user}, skipping reply`);
          }
        }
      }
      
      console.log(`\n📊 Summary:`);
      console.log(`   Mentions found: ${mentionsFound}`);
      console.log(`   Messages checked: ${messages.length}`);
      
      return {
        success: true,
        mentionsFound,
        messagesChecked: messages.length
      };
      
    } catch (error) {
      console.error('❌ Error checking mentions:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  async sendTestMention() {
    try {
      console.log('📤 Sending test mention to #general...');
      
      const testMessage = `Hey <@${this.config.targetUserId}>, this is a test mention!`;
      
      const response = await this.client.chat.postMessage({
        channel: this.config.targetChannel,
        text: testMessage
      });
      
      if (response.ok) {
        console.log('✅ Test mention sent successfully!');
        console.log(`   Message: "${testMessage}"`);
        console.log(`   Timestamp: ${response.ts}`);
        return { success: true, timestamp: response.ts };
      } else {
        console.log(`❌ Failed to send test mention: ${response.error}`);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('❌ Error sending test mention:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Main execution
async function main() {
  const tester = new AutoReplyTester();
  
  console.log('🤖 Auto-Reply Tester Starting...');
  console.log(`   Target Channel: #general (${tester.config.targetChannel})`);
  console.log(`   Target User: ${tester.config.targetUserId}`);
  console.log(`   Reply Message: "${tester.config.replyMessage}"`);
  console.log(`   Cooldown: ${tester.config.cooldownMinutes} minutes`);
  console.log('');
  
  // Check for existing mentions
  await tester.checkMentions();
  
  console.log('\n' + '='.repeat(50));
  console.log('🔄 Running continuous monitoring (Ctrl+C to stop)...');
  
  // Continuous monitoring
  setInterval(async () => {
    console.log(`\n⏰ ${new Date().toLocaleTimeString()} - Checking for mentions...`);
    await tester.checkMentions();
  }, 30000); // Check every 30 seconds
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AutoReplyTester;


