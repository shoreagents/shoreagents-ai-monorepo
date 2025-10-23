#!/usr/bin/env node
/**
 * Quick test for Echo Intelligence
 */

import 'dotenv/config';
import { EchoIntelligence } from './lib/echo-intelligence.js';

console.log('🧪 Testing Echo Intelligence...\n');

// Check environment variables
console.log('Environment Check:');
console.log('✅ CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? 'Set' : 'Not set');
console.log('✅ CLAUDE_SECONDARY_API_KEY:', process.env.CLAUDE_SECONDARY_API_KEY ? 'Set' : 'Not set');
console.log('✅ CLAUDE_MODEL:', process.env.CLAUDE_MODEL || 'Using default');
console.log('✅ SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? 'Set' : 'Not set');
console.log('✅ ECHO_CHANNEL_ID:', process.env.ECHO_CHANNEL_ID || 'Not set');
console.log('');

// Test Echo's intelligence
async function testEcho() {
  try {
    console.log('🧠 Initializing Echo...');
    const echo = new EchoIntelligence();
    
    console.log('⚡ Testing Echo with a simple question...\n');
    
    const response = await echo.think('Hey Echo! What\'s 1+1?', {
      conversationId: 'test',
      eventType: 'test'
    });
    
    console.log('Echo Response:');
    console.log('💬', response.response);
    console.log('');
    console.log('✅ Echo is working! The AI agent is alive and responding!\n');
    
  } catch (error) {
    console.error('❌ Error testing Echo:', error.message);
    if (error.status) {
      console.error('   Status:', error.status);
    }
    if (error.error) {
      console.error('   Error details:', error.error);
    }
  }
}

testEcho();

