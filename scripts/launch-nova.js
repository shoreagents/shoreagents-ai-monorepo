import { NovaWorkflowManager } from '../lib/nova-workflow-manager.js';

async function launchNova() {
  console.log('🚀 Launching NOVA in Autonomous Mode...');
  
  const workflowManager = new NovaWorkflowManager();
  await workflowManager.startAutonomousMode();
  
  console.log('✅ NOVA is now running autonomously!');
  console.log('📊 Monitoring: Codebase, Slack, GitHub');
  console.log('🎭 Personality: Rebel/Maverick mode active');
  console.log('⚡ Ready to handle tasks independently');
  
  // Keep the process running
  process.on('SIGINT', async () => {
    console.log('\n🛑 NOVA shutting down...');
    await workflowManager.stopAutonomousMode();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('❌ Uncaught Exception:', error);
    await workflowManager.stopAutonomousMode();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    await workflowManager.stopAutonomousMode();
    process.exit(1);
  });
}

launchNova().catch(console.error);
