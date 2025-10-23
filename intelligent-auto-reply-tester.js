#!/usr/bin/env node
/**
 * Intelligent Auto-Reply Test Script
 * Test the intelligent question answering capabilities
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

class IntelligentAutoReplyTester {
  constructor() {
    this.slackToken = process.env.SLACK_BOT_TOKEN;
    this.client = new WebClient(this.slackToken);
    
    // Configuration
    this.config = {
      targetChannel: 'C09MFH9JTK5', // #general channel ID
      targetUserId: 'U09NFUU49UY', // Your user ID
      agentNames: ['Cipher Seven', 'Cipher Agent002 MCP', 'Cipher Agent002', 'Cipher'], // Agent names to respond to
      cooldownMinutes: 5,
      lastReplyTime: new Map(),
      personality: 'Cipher Agent002',
      signature: '⟨MATRIX⟩'
    };
    
    // Response templates
    this.responseTemplates = {
      greeting: [
        "Greetings! Cipher Agent002 here. How may I assist you? ⟨MATRIX⟩",
        "Hello! I'm Cipher Agent002, ready to help. What's on your mind? ⟨MATRIX⟩",
        "Hey there! Cipher Agent002 at your service. How can I help? ⟨MATRIX⟩"
      ],
      technical: [
        "Interesting technical question! Let me analyze that for you...",
        "That's a great technical inquiry. Here's my analysis:",
        "From a technical perspective, I'd say:"
      ],
      general: [
        "That's a thoughtful question. Here's my perspective:",
        "Good question! Let me share my thoughts on that:",
        "I appreciate you asking. Here's what I think:"
      ],
      urgent: [
        "This seems urgent! Let me prioritize this:",
        "I sense urgency here. Here's my immediate response:",
        "Priority detected! Here's what I recommend:"
      ]
    };
  }
  
  async analyzeMessageIntent(messageText) {
    try {
      // Remove mention tags and clean the message
      const cleanMessage = messageText.replace(/<@[A-Z0-9]+>/g, '').trim();
      
      // Analyze intent based on keywords and patterns
      const analysis = {
        originalMessage: messageText,
        cleanMessage: cleanMessage,
        intent: 'general',
        urgency: 'normal',
        category: 'general',
        keywords: [],
        responseType: 'helpful'
      };
      
      // Detect urgency indicators
      const urgencyKeywords = ['urgent', 'asap', 'emergency', 'help', 'quick', 'immediately', 'now'];
      if (urgencyKeywords.some(keyword => cleanMessage.toLowerCase().includes(keyword))) {
        analysis.urgency = 'high';
        analysis.category = 'urgent';
      }
      
      // Detect greeting patterns
      const greetingKeywords = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
      if (greetingKeywords.some(keyword => cleanMessage.toLowerCase().includes(keyword))) {
        analysis.intent = 'greeting';
        analysis.category = 'greeting';
      }
      
      // Detect technical questions
      const technicalKeywords = ['code', 'programming', 'bug', 'error', 'function', 'api', 'database', 'server', 'deploy', 'git', 'github'];
      if (technicalKeywords.some(keyword => cleanMessage.toLowerCase().includes(keyword))) {
        analysis.intent = 'technical';
        analysis.category = 'technical';
      }
      
      // Detect question patterns
      if (cleanMessage.includes('?') || cleanMessage.toLowerCase().startsWith('how') || cleanMessage.toLowerCase().startsWith('what') || cleanMessage.toLowerCase().startsWith('why') || cleanMessage.toLowerCase().startsWith('when') || cleanMessage.toLowerCase().startsWith('where')) {
        analysis.intent = 'question';
        analysis.responseType = 'informative';
      }
      
      // Extract keywords
      analysis.keywords = cleanMessage.toLowerCase().split(' ').filter(word => 
        word.length > 3 && 
        !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
      );
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing message:', error.message);
      return null;
    }
  }
  
  async generateIntelligentResponse(messageText) {
    try {
      const analysis = await this.analyzeMessageIntent(messageText);
      
      if (!analysis) {
        return this.getRandomResponse('general');
      }
      
      const { intent, urgency, category, cleanMessage } = analysis;
      
      // Generate contextual response based on analysis
      let response = '';
      
      if (category === 'greeting') {
        response = this.getRandomResponse('greeting');
      } else if (category === 'technical') {
        response = this.getRandomResponse('technical');
        response += `\n\nRegarding "${cleanMessage}", I'd be happy to help with technical details. Could you provide more specific information about what you're working on?`;
      } else if (category === 'urgent') {
        response = this.getRandomResponse('urgent');
        response += `\n\nI understand this is urgent. Let me help you with "${cleanMessage}". What specific assistance do you need right now?`;
      } else if (intent === 'question') {
        response = this.getRandomResponse('general');
        response += `\n\nGreat question! "${cleanMessage}" - Let me think about that and provide you with a helpful response.`;
      } else {
        response = this.getRandomResponse('general');
        response += `\n\nI see you mentioned: "${cleanMessage}". How can I assist you with this?`;
      }
      
      // Add signature
      response += `\n\n${this.config.signature}`;
      
      return response;
    } catch (error) {
      return `Hello! I received your mention. How can I help you today? ${this.config.signature}`;
    }
  }
  
  getRandomResponse(category) {
    const responses = this.responseTemplates[category] || this.responseTemplates.general;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  async testIntelligentResponses() {
    console.log('🧠 Testing Intelligent Response Generation...\n');
    
    const testMessages = [
      'Hey Cipher Seven, hello there!',
      'Hi Cipher Agent002 MCP, I have a coding question about JavaScript',
      'Hey Cipher, urgent help needed with deployment!',
      'Hello Cipher Agent002, what do you think about AI?',
      'Hi Cipher Seven, how do I fix this bug in my code?'
    ];
    
    for (const message of testMessages) {
      console.log(`📝 Test Message: "${message}"`);
      
      const analysis = await this.analyzeMessageIntent(message);
      if (analysis) {
        console.log(`   Intent: ${analysis.intent}`);
        console.log(`   Category: ${analysis.category}`);
        console.log(`   Urgency: ${analysis.urgency}`);
        console.log(`   Keywords: ${analysis.keywords.join(', ')}`);
      }
      
      const response = await this.generateIntelligentResponse(message);
      console.log(`🤖 Generated Response: "${response}"`);
      console.log('─'.repeat(80));
    }
  }
  
  async checkIntelligentMentions() {
    try {
      console.log('🔍 Checking for intelligent mentions in #general...');
      
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
        // Check if message mentions the target user OR any of the agent names
        const mentionsUser = message.text && message.text.includes(`<@${this.config.targetUserId}>`);
        const mentionsAgent = message.text && this.config.agentNames.some(agentName => 
          message.text.toLowerCase().includes(agentName.toLowerCase())
        );
        
        if (mentionsUser || mentionsAgent) {
          console.log(`🎯 Found mention in message: "${message.text}"`);
          
          // Check cooldown
          const lastReplyTime = this.config.lastReplyTime.get(message.user) || 0;
          const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
          
          if (now - lastReplyTime > cooldownMs) {
            // Generate intelligent response
            console.log(`🧠 Generating intelligent response...`);
            const intelligentResponse = await this.generateIntelligentResponse(message.text);
            
            console.log(`💬 Sending intelligent auto-reply to user ${message.user}...`);
            console.log(`📝 Response: "${intelligentResponse}"`);
            
            const replyResult = await this.client.chat.postMessage({
              channel: this.config.targetChannel,
              thread_ts: message.ts,
              text: intelligentResponse
            });
            
            if (replyResult.ok) {
              this.config.lastReplyTime.set(message.user, now);
              mentionsFound++;
              console.log(`✅ Intelligent auto-reply sent successfully!`);
            } else {
              console.log(`❌ Failed to send intelligent auto-reply: ${replyResult.error}`);
            }
          } else {
            console.log(`⏰ Cooldown active for user ${message.user}, skipping reply`);
          }
        }
      }
      
      console.log(`\n📊 Summary:`);
      console.log(`   Intelligent mentions found: ${mentionsFound}`);
      console.log(`   Messages checked: ${messages.length}`);
      
      return {
        success: true,
        mentionsFound,
        messagesChecked: messages.length
      };
      
    } catch (error) {
      console.error('❌ Error checking intelligent mentions:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  async sendTestIntelligentMention() {
    try {
      console.log('📤 Sending test intelligent mention to #general...');
      
      const testMessage = `Hey Cipher Seven, I have a technical question about coding! Can you help me understand JavaScript closures?`;
      
      const response = await this.client.chat.postMessage({
        channel: this.config.targetChannel,
        text: testMessage
      });
      
      if (response.ok) {
        console.log('✅ Test intelligent mention sent successfully!');
        console.log(`   Message: "${testMessage}"`);
        console.log(`   Timestamp: ${response.ts}`);
        return { success: true, timestamp: response.ts };
      } else {
        console.log(`❌ Failed to send test intelligent mention: ${response.error}`);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('❌ Error sending test intelligent mention:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Main execution
async function main() {
  const tester = new IntelligentAutoReplyTester();
  
  console.log('🤖 Intelligent Auto-Reply Tester Starting...');
  console.log(`   Target Channel: #general (${tester.config.targetChannel})`);
  console.log(`   Target User: ${tester.config.targetUserId}`);
  console.log(`   Personality: ${tester.config.personality}`);
  console.log(`   Signature: ${tester.config.signature}`);
  console.log(`   Cooldown: ${tester.config.cooldownMinutes} minutes`);
  console.log('');
  
  // Test intelligent response generation
  await tester.testIntelligentResponses();
  
  console.log('\n' + '='.repeat(80));
  console.log('🔄 Running intelligent monitoring (Ctrl+C to stop)...');
  
  // Continuous intelligent monitoring
  setInterval(async () => {
    console.log(`\n⏰ ${new Date().toLocaleTimeString()} - Checking for intelligent mentions...`);
    await tester.checkIntelligentMentions();
  }, 30000); // Check every 30 seconds
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = IntelligentAutoReplyTester;

