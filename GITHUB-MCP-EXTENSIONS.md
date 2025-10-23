# GitHub MCP Extensions

This module extends the built-in GitHub MCP functionality with additional features that aren't available in the base MCP server.

## 🚀 Features Added

### ✅ Repository Management
- **Create repositories** - Create new public/private repositories
- **Delete repositories** - Remove repositories (use with caution!)
- **Update repository settings** - Modify repository properties

### ✅ File Operations
- **Create files** - Add new files to repositories
- **Update files** - Modify existing files
- **Delete files** - Remove files from repositories

### ✅ Pull Request Management
- **Create pull requests** - Open new pull requests
- **Merge pull requests** - Merge pull requests with different strategies

## 📋 Setup Instructions

### 1. Install Dependencies
```bash
npm install @octokit/rest
```

### 2. Get GitHub Token
1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select these scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `user` (Update user data)
   - ✅ `admin:org` (Full control of orgs and teams)
4. Copy the generated token

### 3. Add to Environment
Add to your `.env.local` file:
```bash
GITHUB_TOKEN="your-github-token-here"
```

### 4. Import and Use
```typescript
import { GitHubMCPExtensions } from './lib/github-mcp-extensions';

// Create a repository
const newRepo = await GitHubMCPExtensions.createRepository(
  'my-new-repo',
  'Description of my repository',
  false // public
);

// Create a file
const newFile = await GitHubMCPExtensions.createFile(
  'username',
  'my-new-repo',
  'README.md',
  '# My Repository\n\nCreated via MCP extensions!',
  'Add README file'
);
```

## 🔧 Available Functions

### Repository Management
```typescript
// Create repository
GitHubMCPExtensions.createRepository(name, description?, isPrivate?)

// Delete repository
GitHubMCPExtensions.deleteRepository(owner, repo)

// Update repository settings
GitHubMCPExtensions.updateRepository(owner, repo, updates)
```

### File Operations
```typescript
// Create file
GitHubMCPExtensions.createFile(owner, repo, path, content, message)

// Update file (requires file SHA)
GitHubMCPExtensions.updateFile(owner, repo, path, content, message, sha)

// Delete file (requires file SHA)
GitHubMCPExtensions.deleteFile(owner, repo, path, message, sha)
```

### Pull Request Management
```typescript
// Create pull request
GitHubMCPExtensions.createPullRequest(owner, repo, title, body, head, base)

// Merge pull request
GitHubMCPExtensions.mergePullRequest(owner, repo, pullNumber, mergeMethod?)
```

## 📝 Usage Examples

### Create a Complete Repository Setup
```typescript
async function createProjectRepository() {
  // 1. Create repository
  const repo = await GitHubMCPExtensions.createRepository(
    'my-awesome-project',
    'An awesome project created via MCP',
    false
  );
  
  if (repo.success) {
    // 2. Add README
    await GitHubMCPExtensions.createFile(
      'your-username',
      'my-awesome-project',
      'README.md',
      `# My Awesome Project

This project was created using GitHub MCP Extensions!

## Features
- ✅ Automated repository creation
- ✅ File management
- ✅ Pull request automation

Created: ${new Date().toISOString()}
`,
      'Add initial README'
    );
    
    // 3. Add package.json
    await GitHubMCPExtensions.createFile(
      'your-username',
      'my-awesome-project',
      'package.json',
      JSON.stringify({
        name: 'my-awesome-project',
        version: '1.0.0',
        description: 'An awesome project',
        main: 'index.js',
        scripts: {
          start: 'node index.js'
        }
      }, null, 2),
      'Add package.json'
    );
  }
}
```

### Create a Pull Request
```typescript
async function createFeaturePR() {
  const pr = await GitHubMCPExtensions.createPullRequest(
    'username',
    'repository',
    'Add new feature',
    `## Description
This PR adds a new feature to the project.

## Changes
- Added new functionality
- Updated documentation
- Fixed bugs

## Testing
- [ ] Tested locally
- [ ] All tests pass
`,
    'feature-branch',
    'main'
  );
  
  if (pr.success) {
    console.log('PR created:', pr.pullRequest.html_url);
  }
}
```

## ⚠️ Important Notes

1. **Token Security**: Never commit your GitHub token to version control
2. **Rate Limits**: GitHub API has rate limits (5000 requests/hour for authenticated users)
3. **Permissions**: Ensure your token has the necessary scopes for the operations you need
4. **Error Handling**: Always check the `success` property in responses
5. **File SHA**: For update/delete operations, you need the file's SHA (get it from the GitHub API first)

## 🔗 Integration with Existing MCP

This extension works alongside your existing GitHub MCP tools:
- Use **existing MCP** for: searching, reading, listing
- Use **these extensions** for: creating, updating, deleting

## 🐛 Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check your GitHub token
2. **403 Forbidden**: Verify token scopes
3. **404 Not Found**: Repository doesn't exist or you don't have access
4. **422 Unprocessable Entity**: Invalid data (e.g., file already exists)

### Debug Mode
```typescript
// Enable debug logging
process.env.DEBUG = 'octokit:*';
```

## 📚 Resources

- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [GitHub Token Scopes](https://docs.github.com/en/developers/apps/scopes-for-oauth-apps)



