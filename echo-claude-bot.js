#!/usr/bin/env node
/**
 * ⚡ Echo Bot with Claude AI
 * Polls for mentions and responds with dynamic Claude-powered replies
 */

import 'dotenv/config';
import { WebClient } from '@slack/web-api';
import { EchoIntelligence } from './lib/echo-intelligence.js';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const echoIntelligence = new EchoIntelligence();

// Track processed messages to avoid duplicates
const processedMessages = new Set();

// Configuration
const POLL_INTERVAL = 3000; // Check every 3 seconds
const CHANNEL_ID = 'C09MFH9JTK5'; // general channel
let BOT_USER_ID = null; // Will be fetched dynamically

// Get bot's actual user ID
async function initBot() {
  try {
    const authResult = await slack.auth.test();
    BOT_USER_ID = authResult.user_id;
    
    console.log('⚡ Echo Agent with Claude AI starting...');
    console.log(`🤖 Bot User ID: ${BOT_USER_ID}`);
    console.log(`📢 Monitoring channel: ${CHANNEL_ID}`);
    console.log(`🧠 Using Claude AI: ${process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022'}`);
    console.log(`🔄 Polling every ${POLL_INTERVAL}ms`);
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize bot:', error.message);
    return false;
  }
}

async function checkForMentions() {
  try {
    // Get recent messages
    const result = await slack.conversations.history({
      channel: CHANNEL_ID,
      limit: 10
    });

    if (!result.messages) return;

    // Process messages in reverse order (oldest first)
    const messages = [...result.messages].reverse();
    let mentionCount = 0;
    let newMessageCount = 0;

    for (const message of messages) {
      // Skip if already processed
      if (processedMessages.has(message.ts)) continue;

      newMessageCount++;

      // Skip Echo's own messages - check both user and bot_profile
      const isEchoMessage = message.user === BOT_USER_ID || 
                           message.bot_id === BOT_USER_ID ||
                           message.username === 'Echo Agent006' ||
                           (message.bot_profile && message.bot_profile.name === 'Echo Agent006');
      
      if (isEchoMessage) {
        processedMessages.add(message.ts);
        continue;
      }

      // Check if bot is mentioned (works even if message came through bot integration)
      const botMentioned = message.text && (
        message.text.includes(`<@${BOT_USER_ID}>`) ||
        message.text.toLowerCase().includes('@echo') ||
        message.text.toLowerCase().includes('echo agent')
      );

      if (botMentioned) {
        mentionCount++;
        
        // Mark as processed IMMEDIATELY to prevent duplicate responses
        processedMessages.add(message.ts);
        
        console.log(`🎯 Mention detected from user ${message.user}`);
        
        // Remove bot mention from the message
        const cleanedMessage = message.text
          .replace(/<@[^>]+>/g, '')
          .replace(/@echo/gi, '')
          .trim();

        console.log(`📝 Message: "${cleanedMessage}"`);
        console.log(`🧠 Thinking with Claude AI...`);

        // Get Claude AI response with instruction to be brief
        const aiResponse = await echoIntelligence.think(
          `${cleanedMessage}\n\n(Keep your response brief and concise - 2-3 sentences max!)`, 
          {
            conversationId: CHANNEL_ID,
            eventType: 'mention',
            userId: message.user
          }
        );

        console.log(`💬 Response: "${aiResponse.response.substring(0, 100)}..."`);

        // Send response
        try {
          const result = await slack.chat.postMessage({
            channel: CHANNEL_ID,
            text: aiResponse.response,
            thread_ts: message.thread_ts || message.ts, // Reply in thread if applicable
            username: "Echo Agent006",
            icon_emoji: ":zap:"
          });

          if (result.ok) {
            console.log(`✅ Response sent successfully! Message TS: ${result.ts}\n`);
          } else {
            console.log(`⚠️ Slack API returned not OK: ${JSON.stringify(result)}\n`);
          }
        } catch (slackError) {
          console.error(`❌ Failed to send to Slack:`, slackError.message);
          console.error(`   Error data:`, slackError.data);
        }
      }
      // Message already marked as processed above (before Claude call)
    }

    // Log summary
    if (newMessageCount > 0 || mentionCount > 0) {
      console.log(`📋 Checked ${result.messages.length} messages (${newMessageCount} new) - Found ${mentionCount} mention${mentionCount !== 1 ? 's' : ''}`);
    }

    // Keep only last 100 message IDs in memory
    if (processedMessages.size > 100) {
      const messagesToKeep = Array.from(processedMessages).slice(-100);
      processedMessages.clear();
      messagesToKeep.forEach(ts => processedMessages.add(ts));
    }

  } catch (error) {
    console.error('❌ Error checking mentions:', error.message);
  }
}

// Initialize and start polling
(async () => {
  const initialized = await initBot();
  
  if (!initialized) {
    console.error('❌ Failed to initialize. Exiting...');
    process.exit(1);
  }
  
  console.log('🚀 Starting to monitor for mentions...\n');
  setInterval(checkForMentions, POLL_INTERVAL);
  
  // Check immediately on startup
  checkForMentions();
})();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚡ Echo Agent shutting down gracefully...');
  process.exit(0);
});

