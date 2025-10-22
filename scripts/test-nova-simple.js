import { config } from 'dotenv';
import { NovaIntelligence } from '../lib/nova-intelligence.js';

// Load environment variables from .env file
config();

async function testNovaSimple() {
  console.log('🧠 Testing NOVA Intelligence - Simple Test...');
  
  // Check if API key is loaded
  console.log('🔑 API Key loaded:', process.env.CLAUDE_API_KEY ? 'YES' : 'NO');
  console.log('🤖 Model:', process.env.CLAUDE_MODEL || 'default');
  
  const novaIntelligence = new NovaIntelligence();
  
  try {
    console.log('\n1. Testing basic thinking...');
    const result = await novaIntelligence.think("What's 2+2?");
    console.log('✅ NOVA Response:', result.response);
    console.log('✅ Thinking Process:', result.thinking);
    console.log('✅ Recommended Action:', result.action);
    
    console.log('\n🎉 NOVA Intelligence is working!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testNovaSimple().catch(console.error);
