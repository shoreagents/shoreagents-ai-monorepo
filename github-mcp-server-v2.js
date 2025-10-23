#!/usr/bin/env node
/**
 * GitHub MCP Server - Exact Copy of Working Slack Pattern
 */

const { Octokit } = require('@octokit/rest');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
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

// Load environment variables
loadEnvFile();

class GitHubMCPServer {
  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN;
    
    if (!this.githubToken) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
    
    this.octokit = new Octokit({
      auth: this.githubToken,
    });
    
    this.server = new Server(
      {
        name: 'github-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );
    
    this.setupHandlers();
  }
  
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_repository_info',
            description: 'Get information about a GitHub repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' }
              },
              required: ['owner', 'repo']
            }
          },
          {
            name: 'list_repositories',
            description: 'List repositories for a user',
            inputSchema: {
              type: 'object',
              properties: {
                username: { type: 'string', description: 'Username' }
              },
              required: ['username']
            }
          },
          {
            name: 'get_user_info',
            description: 'Get user information',
            inputSchema: {
              type: 'object',
              properties: {
                username: { type: 'string', description: 'Username' }
              },
              required: ['username']
            }
          },
          {
            name: 'list_issues',
            description: 'List issues for a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' }
              },
              required: ['owner', 'repo']
            }
          },
          {
            name: 'create_issue',
            description: 'Create a new issue',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' },
                title: { type: 'string', description: 'Issue title' }
              },
              required: ['owner', 'repo', 'title']
            }
          },
          {
            name: 'list_pull_requests',
            description: 'List pull requests',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' }
              },
              required: ['owner', 'repo']
            }
          },
          {
            name: 'get_file_contents',
            description: 'Get file contents',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' },
                path: { type: 'string', description: 'File path' }
              },
              required: ['owner', 'repo', 'path']
            }
          },
          {
            name: 'search_repositories',
            description: 'Search repositories',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' }
              },
              required: ['query']
            }
          },
          {
            name: 'create_repository',
            description: 'Create a new repository',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Repository name' },
                description: { type: 'string', description: 'Repository description' },
                private: { type: 'boolean', description: 'Whether repository is private' }
              },
              required: ['name']
            }
          },
          {
            name: 'delete_repository',
            description: 'Delete a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' }
              },
              required: ['owner', 'repo']
            }
          },
          {
            name: 'create_file',
            description: 'Create a new file in a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' },
                path: { type: 'string', description: 'File path' },
                content: { type: 'string', description: 'File content' },
                message: { type: 'string', description: 'Commit message' }
              },
              required: ['owner', 'repo', 'path', 'content', 'message']
            }
          },
          {
            name: 'update_file',
            description: 'Update an existing file',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' },
                path: { type: 'string', description: 'File path' },
                content: { type: 'string', description: 'New file content' },
                message: { type: 'string', description: 'Commit message' },
                sha: { type: 'string', description: 'File SHA (required for updates)' }
              },
              required: ['owner', 'repo', 'path', 'content', 'message', 'sha']
            }
          },
          {
            name: 'delete_file',
            description: 'Delete a file from repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' },
                path: { type: 'string', description: 'File path' },
                message: { type: 'string', description: 'Commit message' },
                sha: { type: 'string', description: 'File SHA (required for deletion)' }
              },
              required: ['owner', 'repo', 'path', 'message', 'sha']
            }
          },
          {
            name: 'create_pull_request',
            description: 'Create a new pull request',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' },
                title: { type: 'string', description: 'Pull request title' },
                body: { type: 'string', description: 'Pull request body' },
                head: { type: 'string', description: 'Source branch' },
                base: { type: 'string', description: 'Target branch' }
              },
              required: ['owner', 'repo', 'title', 'head', 'base']
            }
          },
          {
            name: 'merge_pull_request',
            description: 'Merge a pull request',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' },
                pull_number: { type: 'number', description: 'Pull request number' },
                merge_method: { type: 'string', description: 'Merge method', enum: ['merge', 'squash', 'rebase'] }
              },
              required: ['owner', 'repo', 'pull_number']
            }
          },
          {
            name: 'get_pull_request',
            description: 'Get a specific pull request',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' },
                pull_number: { type: 'number', description: 'Pull request number' }
              },
              required: ['owner', 'repo', 'pull_number']
            }
          },
          {
            name: 'list_commits',
            description: 'List commits for a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' }
              },
              required: ['owner', 'repo']
            }
          },
          {
            name: 'search_issues',
            description: 'Search for issues',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' }
              },
              required: ['query']
            }
          },
          {
            name: 'get_issue',
            description: 'Get a specific issue',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' },
                issue_number: { type: 'number', description: 'Issue number' }
              },
              required: ['owner', 'repo', 'issue_number']
            }
          }
        ]
      };
    });
    
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'github://user/profile',
            name: 'User Profile',
            description: 'Current user profile',
            mimeType: 'application/json'
          },
          {
            uri: 'github://repositories/list',
            name: 'Repositories',
            description: 'User repositories',
            mimeType: 'application/json'
          }
        ]
      };
    });
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        let result;
        
        switch (name) {
          case 'get_repository_info':
            result = await this.getRepositoryInfo(args.owner, args.repo);
            break;
          case 'list_repositories':
            result = await this.listRepositories(args.username);
            break;
          case 'get_user_info':
            result = await this.getUserInfo(args.username);
            break;
          case 'list_issues':
            result = await this.listIssues(args.owner, args.repo);
            break;
          case 'create_issue':
            result = await this.createIssue(args.owner, args.repo, args.title);
            break;
          case 'list_pull_requests':
            result = await this.listPullRequests(args.owner, args.repo);
            break;
          case 'get_file_contents':
            result = await this.getFileContents(args.owner, args.repo, args.path);
            break;
          case 'search_repositories':
            result = await this.searchRepositories(args.query);
            break;
          case 'create_repository':
            result = await this.createRepository(args.name, args.description, args.private);
            break;
          case 'delete_repository':
            result = await this.deleteRepository(args.owner, args.repo);
            break;
          case 'create_file':
            result = await this.createFile(args.owner, args.repo, args.path, args.content, args.message);
            break;
          case 'update_file':
            result = await this.updateFile(args.owner, args.repo, args.path, args.content, args.message, args.sha);
            break;
          case 'delete_file':
            result = await this.deleteFile(args.owner, args.repo, args.path, args.message, args.sha);
            break;
          case 'create_pull_request':
            result = await this.createPullRequest(args.owner, args.repo, args.title, args.body, args.head, args.base);
            break;
          case 'merge_pull_request':
            result = await this.mergePullRequest(args.owner, args.repo, args.pull_number, args.merge_method);
            break;
          case 'get_pull_request':
            result = await this.getPullRequest(args.owner, args.repo, args.pull_number);
            break;
          case 'list_commits':
            result = await this.listCommits(args.owner, args.repo);
            break;
          case 'search_issues':
            result = await this.searchIssues(args.query);
            break;
          case 'get_issue':
            result = await this.getIssue(args.owner, args.repo, args.issue_number);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
        
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
    
    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        let result;
        
        switch (uri) {
          case 'github://user/profile':
            result = await this.getCurrentUserProfile();
            break;
          case 'github://repositories/list':
            result = await this.getCurrentUserRepositories();
            break;
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
        
      } catch (error) {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ error: error.message }, null, 2)
            }
          ]
        };
      }
    });
  }
  
  // Tool implementations
  async getRepositoryInfo(owner, repo) {
    try {
      const response = await this.octokit.rest.repos.get({ owner, repo });
      return {
        success: true,
        repository: {
          name: response.data.name,
          full_name: response.data.full_name,
          description: response.data.description,
          html_url: response.data.html_url,
          stargazers_count: response.data.stargazers_count,
          forks_count: response.data.forks_count
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async listRepositories(username) {
    try {
      const response = await this.octokit.rest.repos.listForUser({ username, per_page: 30 });
      return {
        success: true,
        repositories: response.data.map(repo => ({
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getUserInfo(username) {
    try {
      const response = await this.octokit.rest.users.getByUsername({ username });
      return {
        success: true,
        user: {
          login: response.data.login,
          name: response.data.name,
          html_url: response.data.html_url,
          public_repos: response.data.public_repos
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async listIssues(owner, repo) {
    try {
      const response = await this.octokit.rest.issues.listForRepo({ owner, repo, per_page: 30 });
      return {
        success: true,
        issues: response.data.map(issue => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          html_url: issue.html_url
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async createIssue(owner, repo, title) {
    try {
      const response = await this.octokit.rest.issues.create({ owner, repo, title });
      return {
        success: true,
        issue: {
          number: response.data.number,
          title: response.data.title,
          html_url: response.data.html_url
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async listPullRequests(owner, repo) {
    try {
      const response = await this.octokit.rest.pulls.list({ owner, repo, per_page: 30 });
      return {
        success: true,
        pull_requests: response.data.map(pull => ({
          number: pull.number,
          title: pull.title,
          state: pull.state,
          html_url: pull.html_url
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getFileContents(owner, repo, path) {
    try {
      const response = await this.octokit.rest.repos.getContent({ owner, repo, path });
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return {
        success: true,
        content: content
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async searchRepositories(query) {
    try {
      const response = await this.octokit.rest.search.repos({ q: query, per_page: 30 });
      return {
        success: true,
        repositories: response.data.items.map(repo => ({
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async createRepository(name, description = '', isPrivate = false) {
    try {
      const response = await this.octokit.rest.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate
      });
      return {
        success: true,
        repository: {
          name: response.data.name,
          full_name: response.data.full_name,
          html_url: response.data.html_url,
          private: response.data.private
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async deleteRepository(owner, repo) {
    try {
      await this.octokit.rest.repos.delete({ owner, repo });
      return {
        success: true,
        message: `Repository ${owner}/${repo} deleted successfully`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async createFile(owner, repo, path, content, message) {
    try {
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64')
      });
      return {
        success: true,
        file: {
          path: path,
          sha: response.data.content.sha,
          html_url: response.data.content.html_url
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async updateFile(owner, repo, path, content, message, sha) {
    try {
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha
      });
      return {
        success: true,
        file: {
          path: path,
          sha: response.data.content.sha,
          html_url: response.data.content.html_url
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async deleteFile(owner, repo, path, message, sha) {
    try {
      const response = await this.octokit.rest.repos.deleteFile({
        owner,
        repo,
        path,
        message,
        sha
      });
      return {
        success: true,
        message: `File ${path} deleted successfully`,
        commit: response.data.commit.sha
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async createPullRequest(owner, repo, title, body, head, base) {
    try {
      const response = await this.octokit.rest.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base
      });
      return {
        success: true,
        pull_request: {
          number: response.data.number,
          title: response.data.title,
          html_url: response.data.html_url,
          state: response.data.state
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async mergePullRequest(owner, repo, pull_number, merge_method = 'merge') {
    try {
      const response = await this.octokit.rest.pulls.merge({
        owner,
        repo,
        pull_number,
        merge_method
      });
      return {
        success: true,
        merge: {
          sha: response.data.sha,
          merged: response.data.merged,
          message: response.data.message
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getPullRequest(owner, repo, pull_number) {
    try {
      const response = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number
      });
      return {
        success: true,
        pull_request: {
          number: response.data.number,
          title: response.data.title,
          body: response.data.body,
          state: response.data.state,
          html_url: response.data.html_url,
          head: response.data.head.ref,
          base: response.data.base.ref,
          mergeable: response.data.mergeable
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async listCommits(owner, repo) {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 30
      });
      return {
        success: true,
        commits: response.data.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author.name,
          date: commit.commit.author.date,
          html_url: commit.html_url
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async searchIssues(query) {
    try {
      const response = await this.octokit.rest.search.issuesAndPullRequests({
        q: query,
        per_page: 30
      });
      return {
        success: true,
        issues: response.data.items.map(issue => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          html_url: issue.html_url,
          repository_url: issue.repository_url
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getIssue(owner, repo, issue_number) {
    try {
      const response = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number
      });
      return {
        success: true,
        issue: {
          number: response.data.number,
          title: response.data.title,
          body: response.data.body,
          state: response.data.state,
          html_url: response.data.html_url,
          user: response.data.user.login,
          labels: response.data.labels.map(label => label.name),
          created_at: response.data.created_at,
          updated_at: response.data.updated_at
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Resource implementations
  async getCurrentUserProfile() {
    try {
      const response = await this.octokit.rest.users.getAuthenticated();
      return {
        login: response.data.login,
        name: response.data.name,
        html_url: response.data.html_url
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  async getCurrentUserRepositories() {
    try {
      const response = await this.octokit.rest.repos.listForAuthenticatedUser({ per_page: 30 });
      return {
        repositories: response.data.map(repo => ({
          name: repo.name,
          full_name: repo.full_name,
          html_url: repo.html_url
        }))
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub MCP Server running on stdio');
  }
}

// Main execution
async function main() {
  try {
    const server = new GitHubMCPServer();
    await server.run();
  } catch (error) {
    console.error('Error starting GitHub MCP server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GitHubMCPServer;
