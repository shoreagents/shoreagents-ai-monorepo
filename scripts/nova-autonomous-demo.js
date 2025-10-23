import { config } from 'dotenv';
import { NovaIntelligence } from '../lib/nova-intelligence.js';
import { WebClient } from '@slack/web-api';
import { Octokit } from '@octokit/rest';

// Load environment variables
config();

class NovaAutonomousDemo {
  constructor() {
    this.novaIntelligence = new NovaIntelligence();
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.github = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.isRunning = false;
  }

  async startMonitoring() {
    console.log('🔥 NOVA Autonomous Mode - DEMO VERSION');
    console.log('⚠️  This is a DEMO - NOVA will check for new issues every 30 seconds');
    console.log('🛑 Press Ctrl+C to stop\n');
    
    this.isRunning = true;
    
    // Check for new GitHub issues every 30 seconds
    setInterval(async () => {
      if (this.isRunning) {
        await this.checkForNewIssues();
      }
    }, 30000);
    
    // Check for Slack mentions every 10 seconds
    setInterval(async () => {
      if (this.isRunning) {
        await this.checkForSlackMentions();
      }
    }, 10000);
  }

  async checkForNewIssues() {
    try {
      const issues = await this.github.rest.issues.listForRepo({
        owner: 'shoreagents',
        repo: 'shoreagents-ai-monorepo',
        state: 'open',
        sort: 'updated',
        per_page: 1
      });

      if (issues.data.length > 0) {
        const latestIssue = issues.data[0];
        const now = new Date();
        const issueTime = new Date(latestIssue.updated_at);
        const timeDiff = now - issueTime;
        
        // If issue was updated in the last 2 minutes, NOVA responds
        if (timeDiff < 120000) {
          console.log(`\n🔥 NOVA detected new/updated issue: "${latestIssue.title}"`);
          
          const novaResponse = await this.novaIntelligence.think(
            `Someone just updated this GitHub issue: "${latestIssue.title}" - ${latestIssue.body?.substring(0, 200)}... Should I respond to this?`
          );
          
          console.log('✅ NOVA Analysis:', novaResponse.response);
          
          // Post to Slack about it
          await this.slack.chat.postMessage({
            channel: '#general',
            text: `🔥 NOVA detected GitHub activity: "${latestIssue.title}"\n\n${novaResponse.response}`,
            username: "NOVA",
            icon_emoji: ":robot_face:"
          });
        }
      }
    } catch (error) {
      console.log('❌ Error checking issues:', error.message);
    }
  }

  async checkForSlackMentions() {
    try {
      // Get recent messages from #general
      const messages = await this.slack.conversations.history({
        channel: 'C09MFH9JTK5', // #general channel ID
        limit: 10
      });

      for (const message of messages.messages || []) {
        if (message.text && (
          message.text.toLowerCase().includes('nova') ||
          message.text.toLowerCase().includes('nova agent001') ||
          message.text.includes('@Nova Agent001')
        ) && message.user !== 'U09MFH9JTK5') { // Don't respond to herself
          
          console.log(`\n🔥 NOVA detected mention: "${message.text}"`);
          
          const novaResponse = await this.novaIntelligence.think(
            `Someone mentioned me (@Nova Agent001) in Slack: "${message.text}". How should I respond?`
          );
          
          // Reply in thread
          await this.slack.chat.postMessage({
            channel: 'C09MFH9JTK5',
            text: novaResponse.response,
            thread_ts: message.ts,
            username: "Nova Agent001",
            icon_emoji: ":robot_face:"
          });
          
          console.log('✅ NOVA replied in Slack thread');
        }
      }
    } catch (error) {
      console.log('❌ Error checking Slack:', error.message);
    }
  }

  stop() {
    this.isRunning = false;
    console.log('\n🛑 NOVA Autonomous Mode stopped');
  }
}

// Start the demo
const nova = new NovaAutonomousDemo();
nova.startMonitoring();

// Handle Ctrl+C
process.on('SIGINT', () => {
  nova.stop();
  process.exit(0);
});
