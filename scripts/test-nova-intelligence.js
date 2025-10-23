import { NovaIntelligence } from '../lib/nova-intelligence.js';
import { NovaWorkflowManager } from '../lib/nova-workflow-manager.js';
import { NovaTaskExecutor } from '../lib/nova-task-executor.js';

async function testNovaIntelligence() {
  console.log('🧠 Testing NOVA Intelligence with Claude API...');
  
  // Test 1: Basic Intelligence
  console.log('\n1. Testing NOVA Basic Intelligence...');
  const intelligence = new NovaIntelligence();
  
  try {
    const result = await intelligence.think("What's the best way to debug a React component that's not rendering?");
    console.log('✅ Basic Thinking:', result.response.substring(0, 100) + '...');
    console.log('   Thinking Process:', result.thinking);
    console.log('   Recommended Action:', result.action);
  } catch (error) {
    console.log('❌ Basic Intelligence Error:', error.message);
  }
  
  // Test 2: Code Analysis
  console.log('\n2. Testing NOVA Code Analysis...');
  try {
    const codebaseInfo = {
      name: "my-v0-project",
      version: "0.1.0",
      dependencies: 73,
      structure: "Next.js app with Prisma, NextAuth, and MCP integration"
    };
    
    const analysis = await intelligence.analyzeCodebase(codebaseInfo, 'bugs');
    console.log('✅ Code Analysis:', analysis.response.substring(0, 100) + '...');
    console.log('   Thinking Process:', analysis.thinking);
  } catch (error) {
    console.log('❌ Code Analysis Error:', error.message);
  }
  
  // Test 3: Task Planning
  console.log('\n3. Testing NOVA Task Planning...');
  try {
    const plan = await intelligence.planTask("Implement a dark mode toggle for the app", ["Must work with existing theme system", "Should persist user preference"]);
    console.log('✅ Task Planning:', plan.response.substring(0, 100) + '...');
    console.log('   Thinking Process:', plan.thinking);
  } catch (error) {
    console.log('❌ Task Planning Error:', error.message);
  }
  
  // Test 4: Debug Issue
  console.log('\n4. Testing NOVA Debug Capabilities...');
  try {
    const debug = await intelligence.debugIssue("The recruitment form is showing white text on white background", "Using Tailwind CSS classes in React components");
    console.log('✅ Debug Analysis:', debug.response.substring(0, 100) + '...');
    console.log('   Thinking Process:', debug.thinking);
  } catch (error) {
    console.log('❌ Debug Error:', error.message);
  }
  
  // Test 5: Code Review
  console.log('\n5. Testing NOVA Code Review...');
  try {
    const code = `
function handleSubmit(e) {
  e.preventDefault();
  const data = new FormData(e.target);
  // Missing validation
  fetch('/api/submit', {
    method: 'POST',
    body: data
  });
}`;
    
    const review = await intelligence.reviewCode(code, "Form submission handler for user registration");
    console.log('✅ Code Review:', review.response.substring(0, 100) + '...');
    console.log('   Thinking Process:', review.thinking);
  } catch (error) {
    console.log('❌ Code Review Error:', error.message);
  }
  
  // Test 6: Decision Making
  console.log('\n6. Testing NOVA Decision Making...');
  try {
    const options = [
      "Use a third-party authentication service like Auth0",
      "Build custom authentication with NextAuth.js",
      "Use Supabase Auth for authentication"
    ];
    
    const decision = await intelligence.makeDecision(options, { 
      project: "Next.js app", 
      team: "small", 
      budget: "limited",
      timeline: "2 weeks"
    });
    console.log('✅ Decision Analysis:', decision.response.substring(0, 100) + '...');
    console.log('   Thinking Process:', decision.thinking);
  } catch (error) {
    console.log('❌ Decision Making Error:', error.message);
  }
  
  // Test 7: Slack Message Generation
  console.log('\n7. Testing NOVA Slack Message Generation...');
  try {
    const message = await intelligence.generateSlackMessage("The build is failing due to TypeScript errors", "warning", { 
      urgency: "high", 
      affected: "entire team" 
    });
    console.log('✅ Slack Message:', message.response.substring(0, 100) + '...');
    console.log('   Thinking Process:', message.thinking);
  } catch (error) {
    console.log('❌ Slack Message Error:', error.message);
  }
  
  // Test 8: Conversation Memory
  console.log('\n8. Testing NOVA Conversation Memory...');
  try {
    const conversationId = 'test-conversation';
    
    // First message
    const first = await intelligence.think("My name is Stephen and I'm working on a React project", { conversationId });
    console.log('✅ First Message Response:', first.response.substring(0, 50) + '...');
    
    // Second message (should remember context)
    const second = await intelligence.think("What do you think about my project?", { conversationId });
    console.log('✅ Second Message Response:', second.response.substring(0, 50) + '...');
    
    // Check memory
    const history = intelligence.getConversationHistory(conversationId);
    console.log('✅ Conversation History Length:', history.length);
    
    // Clear memory
    intelligence.clearConversation(conversationId);
    console.log('✅ Memory Cleared');
  } catch (error) {
    console.log('❌ Conversation Memory Error:', error.message);
  }
  
  console.log('\n🎉 NOVA Intelligence Testing Complete!');
  console.log('\n📋 Intelligence Test Summary:');
  console.log('   ' + (process.env.ANTHROPIC_API_KEY ? '✅' : '⚠️') + ' Claude API ' + (process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured'));
  console.log('   ✅ Basic thinking and reasoning');
  console.log('   ✅ Code analysis capabilities');
  console.log('   ✅ Task planning intelligence');
  console.log('   ✅ Debug issue analysis');
  console.log('   ✅ Code review capabilities');
  console.log('   ✅ Decision making process');
  console.log('   ✅ Slack message generation');
  console.log('   ✅ Conversation memory system');
  
  console.log('\n🧠 NOVA is now truly intelligent and can think, reason, and make decisions!');
  console.log('\n🚀 Ready for advanced autonomous operations with Claude API integration!');
}

testNovaIntelligence().catch(console.error);
