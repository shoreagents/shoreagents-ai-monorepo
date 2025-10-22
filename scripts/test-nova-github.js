import { config } from 'dotenv';
import { NovaIntelligence } from '../lib/nova-intelligence.js';
import { Octokit } from '@octokit/rest';

// Load environment variables
config();

async function testNovaGitHub() {
  console.log('🔥 Testing NOVA GitHub Skills...');
  
  const novaIntelligence = new NovaIntelligence();
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  try {
    // 1. Get repository info
    console.log('\n1. Getting repository info...');
    const repo = await octokit.rest.repos.get({
      owner: 'shoreagents',
      repo: 'shoreagents-ai-monorepo'
    });
    
    console.log('✅ Repository:', repo.data.full_name);
    console.log('📊 Stars:', repo.data.stargazers_count);
    console.log('🍴 Forks:', repo.data.forks_count);
    
    // 2. Get recent issues
    console.log('\n2. Getting recent issues...');
    const issues = await octokit.rest.issues.listForRepo({
      owner: 'shoreagents',
      repo: 'shoreagents-ai-monorepo',
      state: 'open',
      per_page: 5
    });
    
    console.log('✅ Found', issues.data.length, 'open issues');
    
    // 3. Have NOVA analyze the issues
    if (issues.data.length > 0) {
      console.log('\n3. NOVA analyzing issues...');
      const issueAnalysis = await novaIntelligence.think(
        `I found ${issues.data.length} open issues in the repository. Here's the first one: "${issues.data[0].title}" - ${issues.data[0].body?.substring(0, 200)}... What should I do about this?`
      );
      
      console.log('✅ NOVA Analysis:', issueAnalysis.response);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testNovaGitHub().catch(console.error);
