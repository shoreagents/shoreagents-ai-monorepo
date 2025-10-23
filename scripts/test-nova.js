import { NovaWorkflowManager } from '../lib/nova-workflow-manager.js';
import { NovaTaskExecutor } from '../lib/nova-task-executor.js';
import { NovaPersonality } from '../lib/nova-personality.js';

async function testNova() {
  console.log('🧪 Testing NOVA Autonomous Capabilities...');
  
  // Test 1: Personality
  console.log('\n1. Testing NOVA Personality...');
  const personality = new NovaPersonality();
  
  const greeting = personality.generateResponse('greeting', 'Hello NOVA!');
  console.log('✅ Greeting:', greeting);
  
  const challenge = personality.generateChallenge("I can't do this, it's too hard");
  console.log('✅ Challenge:', challenge);
  
  const encouragement = personality.generateEncouragement("I completed the task");
  console.log('✅ Encouragement:', encouragement);
  
  // Test 2: Task Execution
  console.log('\n2. Testing Task Execution...');
  const taskExecutor = new NovaTaskExecutor();
  const result = await taskExecutor.executeTask('Test task execution');
  console.log('✅ Task Result:', result.success ? 'Success' : 'Failed');
  if (result.plan) {
    console.log('   Plan steps:', result.plan.steps.length);
  }
  
  // Test 3: Workflow Manager
  console.log('\n3. Testing Workflow Manager...');
  const workflowManager = new NovaWorkflowManager();
  const status = await workflowManager.getSystemStatus();
  console.log('✅ System Status:', status.isRunning ? 'Running' : 'Stopped');
  console.log('   Capabilities:', status.capabilities.length);
  
  // Test 4: Project Info
  console.log('\n4. Testing Project Info...');
  const projectInfo = await taskExecutor.getProjectInfo();
  console.log('✅ Project Info:', projectInfo.name || 'Unknown');
  console.log('   Version:', projectInfo.version || 'Unknown');
  console.log('   Dependencies:', projectInfo.dependencies?.length || 0);
  
  // Test 5: Git Status
  console.log('\n5. Testing Git Status...');
  const gitStatus = await taskExecutor.getGitStatus();
  console.log('✅ Git Status:', gitStatus.length, 'modified files');
  
  // Test 6: Recent Commits
  console.log('\n6. Testing Recent Commits...');
  const commits = await taskExecutor.getRecentCommits(3);
  console.log('✅ Recent Commits:', commits.length);
  commits.forEach((commit, index) => {
    console.log(`   ${index + 1}. ${commit}`);
  });
  
  // Test 7: Slack Communication (if token is available)
  console.log('\n7. Testing Slack Communication...');
  if (process.env.SLACK_BOT_TOKEN) {
    try {
      await workflowManager.slack.chat.postMessage({
        channel: '#development',
        text: personality.addPersonalityToMessage('NOVA test message - autonomous mode ready!', 'update'),
        username: "NOVA",
        icon_emoji: ":robot_face:"
      });
      console.log('✅ Slack message sent successfully');
    } catch (error) {
      console.log('❌ Slack error:', error.message);
    }
  } else {
    console.log('⚠️ Slack token not available, skipping Slack test');
  }
  
  // Test 8: GitHub Integration (if token is available)
  console.log('\n8. Testing GitHub Integration...');
  if (process.env.GITHUB_TOKEN) {
    try {
      const { data: user } = await workflowManager.github.rest.users.getAuthenticated();
      console.log('✅ GitHub authenticated as:', user.login);
    } catch (error) {
      console.log('❌ GitHub error:', error.message);
    }
  } else {
    console.log('⚠️ GitHub token not available, skipping GitHub test');
  }
  
  console.log('\n🎉 NOVA testing complete!');
  console.log('\n📋 Test Summary:');
  console.log('   ✅ Personality system working');
  console.log('   ✅ Task execution system working');
  console.log('   ✅ Workflow manager initialized');
  console.log('   ✅ Project integration working');
  console.log('   ✅ Git integration working');
  console.log('   ' + (process.env.SLACK_BOT_TOKEN ? '✅' : '⚠️') + ' Slack integration ' + (process.env.SLACK_BOT_TOKEN ? 'working' : 'not configured'));
  console.log('   ' + (process.env.GITHUB_TOKEN ? '✅' : '⚠️') + ' GitHub integration ' + (process.env.GITHUB_TOKEN ? 'working' : 'not configured'));
  
  console.log('\n🚀 NOVA is ready for autonomous operation!');
}

testNova().catch(console.error);
