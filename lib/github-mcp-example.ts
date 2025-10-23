// Example usage of GitHub MCP Extensions
import { GitHubMCPExtensions } from './lib/github-mcp-extensions';

async function exampleUsage() {
  console.log('🚀 GitHub MCP Extensions Demo');
  
  // Example 1: Create a repository
  console.log('\n📁 Creating a new repository...');
  const newRepo = await GitHubMCPExtensions.createRepository(
    'mcp-test-repo',
    'A test repository created via MCP extensions',
    false // public
  );
  
  if (newRepo.success) {
    console.log('✅ Repository created:', newRepo.repository.html_url);
    
    // Example 2: Create a file in the new repository
    console.log('\n📄 Creating a README file...');
    const readmeFile = await GitHubMCPExtensions.createFile(
      'your-username', // Replace with your GitHub username
      'mcp-test-repo',
      'README.md',
      `# MCP Test Repository

This repository was created using GitHub MCP Extensions!

## Features Added:
- ✅ Repository creation
- ✅ File creation
- ✅ Pull request creation
- ✅ Repository management

Created at: ${new Date().toISOString()}
`,
      'Add README file via MCP extensions'
    );
    
    if (readmeFile.success) {
      console.log('✅ README file created successfully');
    } else {
      console.log('❌ Failed to create README:', readmeFile.error);
    }
  } else {
    console.log('❌ Failed to create repository:', newRepo.error);
  }
  
  // Example 3: Create a pull request (if you have a fork)
  console.log('\n🔀 Creating a pull request...');
  const newPR = await GitHubMCPExtensions.createPullRequest(
    'your-username', // Replace with your GitHub username
    'mcp-test-repo',
    'Add MCP documentation',
    'This PR adds documentation about MCP extensions usage.',
    'feature-branch', // You'd need to create this branch first
    'main'
  );
  
  if (newPR.success) {
    console.log('✅ Pull request created:', newPR.pullRequest.html_url);
  } else {
    console.log('❌ Failed to create pull request:', newPR.error);
  }
}

// Run the example (uncomment to test)
// exampleUsage().catch(console.error);

export { GitHubMCPExtensions };



