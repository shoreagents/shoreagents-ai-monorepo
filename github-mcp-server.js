#!/usr/bin/env node

/**
 * 🚀 GitHub MCP Server for Cursor
 * 
 * Complete GitHub integration with 25+ functions for repository management,
 * issues, pull requests, code management, and collaboration tools.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Create MCP server
const server = new Server(
  {
    name: 'github-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Repository Management
      {
        name: 'github_create_repository',
        description: 'Create a new GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Repository name' },
            description: { type: 'string', description: 'Repository description' },
            private: { type: 'boolean', description: 'Make repository private', default: false },
            autoInit: { type: 'boolean', description: 'Initialize with README', default: true },
            gitignoreTemplate: { type: 'string', description: 'Gitignore template (e.g., Node, Python)' },
            licenseTemplate: { type: 'string', description: 'License template (e.g., mit, apache-2.0)' },
          },
          required: ['name'],
        },
      },
      {
        name: 'github_get_repository_info',
        description: 'Get detailed information about a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner (username or org)' },
            repo: { type: 'string', description: 'Repository name' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github_fork_repository',
        description: 'Fork a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Original repository owner' },
            repo: { type: 'string', description: 'Repository name to fork' },
            organization: { type: 'string', description: 'Organization to fork to (optional)' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github_delete_repository',
        description: 'Delete a repository (use with caution!)',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            confirm: { type: 'boolean', description: 'Confirmation flag - must be true' },
          },
          required: ['owner', 'repo', 'confirm'],
        },
      },

      // Issues Management
      {
        name: 'github_create_issue',
        description: 'Create a new issue',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            title: { type: 'string', description: 'Issue title' },
            body: { type: 'string', description: 'Issue description' },
            labels: { type: 'array', items: { type: 'string' }, description: 'Issue labels' },
            assignees: { type: 'array', items: { type: 'string' }, description: 'Issue assignees' },
            milestone: { type: 'number', description: 'Milestone number' },
          },
          required: ['owner', 'repo', 'title'],
        },
      },
      {
        name: 'github_list_issues',
        description: 'List issues in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
            labels: { type: 'string', description: 'Filter by labels (comma-separated)' },
            assignee: { type: 'string', description: 'Filter by assignee' },
            creator: { type: 'string', description: 'Filter by creator' },
            perPage: { type: 'number', description: 'Number of issues per page', default: 30 },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github_update_issue',
        description: 'Update an existing issue',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            issueNumber: { type: 'number', description: 'Issue number' },
            title: { type: 'string', description: 'New issue title' },
            body: { type: 'string', description: 'New issue description' },
            state: { type: 'string', enum: ['open', 'closed'] },
            labels: { type: 'array', items: { type: 'string' }, description: 'Issue labels' },
            assignees: { type: 'array', items: { type: 'string' }, description: 'Issue assignees' },
          },
          required: ['owner', 'repo', 'issueNumber'],
        },
      },

      // Pull Requests Management
      {
        name: 'github_create_pull_request',
        description: 'Create a new pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            title: { type: 'string', description: 'Pull request title' },
            head: { type: 'string', description: 'Source branch' },
            base: { type: 'string', description: 'Target branch', default: 'main' },
            body: { type: 'string', description: 'Pull request description' },
            draft: { type: 'boolean', description: 'Create as draft', default: false },
          },
          required: ['owner', 'repo', 'title', 'head'],
        },
      },
      {
        name: 'github_list_pull_requests',
        description: 'List pull requests in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
            head: { type: 'string', description: 'Filter by source branch' },
            base: { type: 'string', description: 'Filter by target branch' },
            perPage: { type: 'number', description: 'Number of PRs per page', default: 30 },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github_merge_pull_request',
        description: 'Merge a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            pullNumber: { type: 'number', description: 'Pull request number' },
            mergeMethod: { type: 'string', enum: ['merge', 'squash', 'rebase'], default: 'merge' },
            commitTitle: { type: 'string', description: 'Custom commit title' },
            commitMessage: { type: 'string', description: 'Custom commit message' },
          },
          required: ['owner', 'repo', 'pullNumber'],
        },
      },

      // Code Management
      {
        name: 'github_get_file_contents',
        description: 'Get contents of a file from a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File path' },
            ref: { type: 'string', description: 'Branch, tag, or commit SHA', default: 'main' },
          },
          required: ['owner', 'repo', 'path'],
        },
      },
      {
        name: 'github_create_file',
        description: 'Create a new file in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File path' },
            message: { type: 'string', description: 'Commit message' },
            content: { type: 'string', description: 'File content (base64 encoded)' },
            branch: { type: 'string', description: 'Target branch', default: 'main' },
          },
          required: ['owner', 'repo', 'path', 'message', 'content'],
        },
      },
      {
        name: 'github_update_file',
        description: 'Update an existing file in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File path' },
            message: { type: 'string', description: 'Commit message' },
            content: { type: 'string', description: 'New file content (base64 encoded)' },
            sha: { type: 'string', description: 'Current file SHA (required for updates)' },
            branch: { type: 'string', description: 'Target branch', default: 'main' },
          },
          required: ['owner', 'repo', 'path', 'message', 'content', 'sha'],
        },
      },
      {
        name: 'github_delete_file',
        description: 'Delete a file from a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File path' },
            message: { type: 'string', description: 'Commit message' },
            sha: { type: 'string', description: 'File SHA (required for deletion)' },
            branch: { type: 'string', description: 'Target branch', default: 'main' },
          },
          required: ['owner', 'repo', 'path', 'message', 'sha'],
        },
      },

      // Branch Management
      {
        name: 'github_list_branches',
        description: 'List branches in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            protected: { type: 'boolean', description: 'Filter by protected status' },
            perPage: { type: 'number', description: 'Number of branches per page', default: 30 },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github_create_branch',
        description: 'Create a new branch',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            branch: { type: 'string', description: 'New branch name' },
            fromBranch: { type: 'string', description: 'Source branch', default: 'main' },
          },
          required: ['owner', 'repo', 'branch'],
        },
      },
      {
        name: 'github_delete_branch',
        description: 'Delete a branch',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            branch: { type: 'string', description: 'Branch name to delete' },
          },
          required: ['owner', 'repo', 'branch'],
        },
      },

      // Collaboration
      {
        name: 'github_list_collaborators',
        description: 'List repository collaborators',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            affiliation: { type: 'string', enum: ['outside', 'direct', 'all'], default: 'all' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github_add_collaborator',
        description: 'Add a collaborator to a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            username: { type: 'string', description: 'Username to add' },
            permission: { type: 'string', enum: ['pull', 'push', 'admin', 'maintain', 'triage'], default: 'push' },
          },
          required: ['owner', 'repo', 'username'],
        },
      },
      {
        name: 'github_remove_collaborator',
        description: 'Remove a collaborator from a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            username: { type: 'string', description: 'Username to remove' },
          },
          required: ['owner', 'repo', 'username'],
        },
      },

      // Search and Discovery
      {
        name: 'github_search_repositories',
        description: 'Search for repositories',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            sort: { type: 'string', enum: ['stars', 'forks', 'help-wanted-issues', 'updated'], default: 'stars' },
            order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            perPage: { type: 'number', description: 'Number of results per page', default: 30 },
          },
          required: ['query'],
        },
      },
      {
        name: 'github_search_issues',
        description: 'Search for issues and pull requests',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            sort: { type: 'string', enum: ['comments', 'reactions', 'interactions', 'created', 'updated'], default: 'updated' },
            order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            perPage: { type: 'number', description: 'Number of results per page', default: 30 },
          },
          required: ['query'],
        },
      },
      {
        name: 'github_search_code',
        description: 'Search for code',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            sort: { type: 'string', enum: ['indexed'], default: 'indexed' },
            order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            perPage: { type: 'number', description: 'Number of results per page', default: 30 },
          },
          required: ['query'],
        },
      },

      // User and Organization
      {
        name: 'github_get_user_info',
        description: 'Get information about a user or organization',
        inputSchema: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Username or organization name' },
          },
          required: ['username'],
        },
      },
      {
        name: 'github_list_user_repositories',
        description: 'List repositories for a user or organization',
        inputSchema: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Username or organization name' },
            type: { type: 'string', enum: ['all', 'owner', 'public', 'private', 'member'], default: 'owner' },
            sort: { type: 'string', enum: ['created', 'updated', 'pushed', 'full_name'], default: 'full_name' },
            direction: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
            perPage: { type: 'number', description: 'Number of repositories per page', default: 30 },
          },
          required: ['username'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Repository Management
      case 'github_create_repository':
        return await handleCreateRepository(args);
      case 'github_get_repository_info':
        return await handleGetRepositoryInfo(args);
      case 'github_fork_repository':
        return await handleForkRepository(args);
      case 'github_delete_repository':
        return await handleDeleteRepository(args);

      // Issues Management
      case 'github_create_issue':
        return await handleCreateIssue(args);
      case 'github_list_issues':
        return await handleListIssues(args);
      case 'github_update_issue':
        return await handleUpdateIssue(args);

      // Pull Requests Management
      case 'github_create_pull_request':
        return await handleCreatePullRequest(args);
      case 'github_list_pull_requests':
        return await handleListPullRequests(args);
      case 'github_merge_pull_request':
        return await handleMergePullRequest(args);

      // Code Management
      case 'github_get_file_contents':
        return await handleGetFileContents(args);
      case 'github_create_file':
        return await handleCreateFile(args);
      case 'github_update_file':
        return await handleUpdateFile(args);
      case 'github_delete_file':
        return await handleDeleteFile(args);

      // Branch Management
      case 'github_list_branches':
        return await handleListBranches(args);
      case 'github_create_branch':
        return await handleCreateBranch(args);
      case 'github_delete_branch':
        return await handleDeleteBranch(args);

      // Collaboration
      case 'github_list_collaborators':
        return await handleListCollaborators(args);
      case 'github_add_collaborator':
        return await handleAddCollaborator(args);
      case 'github_remove_collaborator':
        return await handleRemoveCollaborator(args);

      // Search and Discovery
      case 'github_search_repositories':
        return await handleSearchRepositories(args);
      case 'github_search_issues':
        return await handleSearchIssues(args);
      case 'github_search_code':
        return await handleSearchCode(args);

      // User and Organization
      case 'github_get_user_info':
        return await handleGetUserInfo(args);
      case 'github_list_user_repositories':
        return await handleListUserRepositories(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error.message}`,
        },
      ],
    };
  }
});

// Tool implementations
async function handleCreateRepository(args) {
  const { name, description, private: isPrivate = false, autoInit = true, gitignoreTemplate, licenseTemplate } = args;
  
  const repoData = {
    name,
    private: isPrivate,
    auto_init: autoInit,
    ...(description && { description }),
    ...(gitignoreTemplate && { gitignore_template: gitignoreTemplate }),
    ...(licenseTemplate && { license_template: licenseTemplate }),
  };

  const result = await octokit.rest.repos.createForAuthenticatedUser(repoData);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Repository created successfully!\n📁 Name: ${result.data.name}\n🔗 URL: ${result.data.html_url}\n🔒 Private: ${result.data.private ? 'Yes' : 'No'}\n📝 Description: ${result.data.description || 'None'}\n⭐ Stars: ${result.data.stargazers_count}\n🍴 Forks: ${result.data.forks_count}`,
      },
    ],
  };
}

async function handleGetRepositoryInfo(args) {
  const { owner, repo } = args;
  
  const result = await octokit.rest.repos.get({ owner, repo });
  const repoData = result.data;
  
  return {
    content: [
      {
        type: 'text',
        text: `📁 **Repository Information:**\n\n**Name:** ${repoData.name}\n**Full Name:** ${repoData.full_name}\n**Description:** ${repoData.description || 'None'}\n**URL:** ${repoData.html_url}\n**Clone URL:** ${repoData.clone_url}\n**Private:** ${repoData.private ? 'Yes' : 'No'}\n**Language:** ${repoData.language || 'None'}\n**Stars:** ${repoData.stargazers_count}\n**Forks:** ${repoData.forks_count}\n**Open Issues:** ${repoData.open_issues_count}\n**Default Branch:** ${repoData.default_branch}\n**Created:** ${new Date(repoData.created_at).toLocaleDateString()}\n**Updated:** ${new Date(repoData.updated_at).toLocaleDateString()}`,
      },
    ],
  };
}

async function handleForkRepository(args) {
  const { owner, repo, organization } = args;
  
  const forkData = organization ? { organization } : {};
  const result = await octokit.rest.repos.createFork({ owner, repo, ...forkData });
  
  return {
    content: [
      {
        type: 'text',
        text: `🍴 Repository forked successfully!\n📁 Original: ${owner}/${repo}\n📁 Fork: ${result.data.full_name}\n🔗 URL: ${result.data.html_url}\n⭐ Stars: ${result.data.stargazers_count}\n🍴 Forks: ${result.data.forks_count}`,
      },
    ],
  };
}

async function handleDeleteRepository(args) {
  const { owner, repo, confirm } = args;
  
  if (!confirm) {
    throw new Error('Deletion requires confirmation. Set confirm: true');
  }
  
  await octokit.rest.repos.delete({ owner, repo });
  
  return {
    content: [
      {
        type: 'text',
        text: `🗑️ Repository deleted successfully!\n📁 Repository: ${owner}/${repo}\n⚠️ This action cannot be undone.`,
      },
    ],
  };
}

async function handleCreateIssue(args) {
  const { owner, repo, title, body, labels, assignees, milestone } = args;
  
  const issueData = {
    owner,
    repo,
    title,
    ...(body && { body }),
    ...(labels && { labels }),
    ...(assignees && { assignees }),
    ...(milestone && { milestone }),
  };

  const result = await octokit.rest.issues.create(issueData);
  
  return {
    content: [
      {
        type: 'text',
        text: `🐛 Issue created successfully!\n📝 Title: ${result.data.title}\n🔗 URL: ${result.data.html_url}\n📊 Number: #${result.data.number}\n🏷️ Labels: ${result.data.labels.map(l => l.name).join(', ') || 'None'}\n👤 Assignees: ${result.data.assignees.map(a => a.login).join(', ') || 'None'}\n📅 Created: ${new Date(result.data.created_at).toLocaleString()}`,
      },
    ],
  };
}

async function handleListIssues(args) {
  const { owner, repo, state = 'open', labels, assignee, creator, perPage = 30 } = args;
  
  const params = {
    owner,
    repo,
    state,
    per_page: perPage,
    ...(labels && { labels }),
    ...(assignee && { assignee }),
    ...(creator && { creator }),
  };

  const result = await octokit.rest.issues.listForRepo(params);
  
  const issues = result.data.map(issue => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    labels: issue.labels.map(l => l.name),
    assignees: issue.assignees.map(a => a.login),
    created: new Date(issue.created_at).toLocaleDateString(),
    url: issue.html_url,
  }));
  
  return {
    content: [
      {
        type: 'text',
        text: `📋 **Issues in ${owner}/${repo}** (${issues.length} found):\n\n${issues.map(issue => 
          `#${issue.number} - ${issue.title}\n   State: ${issue.state} | Labels: ${issue.labels.join(', ') || 'None'}\n   Assignees: ${issue.assignees.join(', ') || 'None'}\n   Created: ${issue.created}\n   URL: ${issue.url}\n`
        ).join('\n')}`,
      },
    ],
  };
}

async function handleUpdateIssue(args) {
  const { owner, repo, issueNumber, title, body, state, labels, assignees } = args;
  
  const updateData = {
    owner,
    repo,
    issue_number: issueNumber,
    ...(title && { title }),
    ...(body && { body }),
    ...(state && { state }),
    ...(labels && { labels }),
    ...(assignees && { assignees }),
  };

  const result = await octokit.rest.issues.update(updateData);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Issue updated successfully!\n📝 Title: ${result.data.title}\n🔗 URL: ${result.data.html_url}\n📊 Number: #${result.data.number}\n🏷️ Labels: ${result.data.labels.map(l => l.name).join(', ') || 'None'}\n👤 Assignees: ${result.data.assignees.map(a => a.login).join(', ') || 'None'}\n📅 Updated: ${new Date(result.data.updated_at).toLocaleString()}`,
      },
    ],
  };
}

async function handleCreatePullRequest(args) {
  const { owner, repo, title, head, base = 'main', body, draft = false } = args;
  
  const prData = {
    owner,
    repo,
    title,
    head,
    base,
    ...(body && { body }),
    draft,
  };

  const result = await octokit.rest.pulls.create(prData);
  
  return {
    content: [
      {
        type: 'text',
        text: `🔀 Pull request created successfully!\n📝 Title: ${result.data.title}\n🔗 URL: ${result.data.html_url}\n📊 Number: #${result.data.number}\n🌿 From: ${head} → ${base}\n📝 Draft: ${result.data.draft ? 'Yes' : 'No'}\n📅 Created: ${new Date(result.data.created_at).toLocaleString()}`,
      },
    ],
  };
}

async function handleListPullRequests(args) {
  const { owner, repo, state = 'open', head, base, perPage = 30 } = args;
  
  const params = {
    owner,
    repo,
    state,
    per_page: perPage,
    ...(head && { head }),
    ...(base && { base }),
  };

  const result = await octokit.rest.pulls.list(params);
  
  const prs = result.data.map(pr => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    head: pr.head.ref,
    base: pr.base.ref,
    draft: pr.draft,
    created: new Date(pr.created_at).toLocaleDateString(),
    url: pr.html_url,
  }));
  
  return {
    content: [
      {
        type: 'text',
        text: `🔀 **Pull Requests in ${owner}/${repo}** (${prs.length} found):\n\n${prs.map(pr => 
          `#${pr.number} - ${pr.title}\n   State: ${pr.state} | Draft: ${pr.draft ? 'Yes' : 'No'}\n   From: ${pr.head} → ${pr.base}\n   Created: ${pr.created}\n   URL: ${pr.url}\n`
        ).join('\n')}`,
      },
    ],
  };
}

async function handleMergePullRequest(args) {
  const { owner, repo, pullNumber, mergeMethod = 'merge', commitTitle, commitMessage } = args;
  
  const mergeData = {
    owner,
    repo,
    pull_number: pullNumber,
    merge_method: mergeMethod,
    ...(commitTitle && { commit_title: commitTitle }),
    ...(commitMessage && { commit_message: commitMessage }),
  };

  const result = await octokit.rest.pulls.merge(mergeData);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Pull request merged successfully!\n📊 Number: #${pullNumber}\n🔀 Method: ${mergeMethod}\n📝 SHA: ${result.data.sha}\n📅 Merged: ${new Date(result.data.merged_at).toLocaleString()}`,
      },
    ],
  };
}

async function handleGetFileContents(args) {
  const { owner, repo, path, ref = 'main' } = args;
  
  const result = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref,
  });
  
  if (Array.isArray(result.data)) {
    // Directory
    const files = result.data.map(item => ({
      name: item.name,
      type: item.type,
      size: item.size,
      path: item.path,
    }));
    
    return {
      content: [
        {
          type: 'text',
          text: `📁 **Directory Contents:** ${path}\n\n${files.map(file => 
            `${file.type === 'dir' ? '📁' : '📄'} ${file.name}${file.size ? ` (${file.size} bytes)` : ''}`
          ).join('\n')}`,
        },
      ],
    };
  } else {
    // File
    const content = Buffer.from(result.data.content, 'base64').toString('utf-8');
    
    return {
      content: [
        {
          type: 'text',
          text: `📄 **File Contents:** ${path}\n\n\`\`\`\n${content}\n\`\`\``,
        },
      ],
    };
  }
}

async function handleCreateFile(args) {
  const { owner, repo, path, message, content, branch = 'main' } = args;
  
  const result = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content,
    branch,
  });
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ File created successfully!\n📄 Path: ${path}\n📝 Message: ${message}\n🌿 Branch: ${branch}\n📝 SHA: ${result.data.commit.sha}\n🔗 Commit URL: ${result.data.commit.html_url}`,
      },
    ],
  };
}

async function handleUpdateFile(args) {
  const { owner, repo, path, message, content, sha, branch = 'main' } = args;
  
  const result = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content,
    sha,
    branch,
  });
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ File updated successfully!\n📄 Path: ${path}\n📝 Message: ${message}\n🌿 Branch: ${branch}\n📝 SHA: ${result.data.commit.sha}\n🔗 Commit URL: ${result.data.commit.html_url}`,
      },
    ],
  };
}

async function handleDeleteFile(args) {
  const { owner, repo, path, message, sha, branch = 'main' } = args;
  
  const result = await octokit.rest.repos.deleteFile({
    owner,
    repo,
    path,
    message,
    sha,
    branch,
  });
  
  return {
    content: [
      {
        type: 'text',
        text: `🗑️ File deleted successfully!\n📄 Path: ${path}\n📝 Message: ${message}\n🌿 Branch: ${branch}\n📝 SHA: ${result.data.commit.sha}\n🔗 Commit URL: ${result.data.commit.html_url}`,
      },
    ],
  };
}

async function handleListBranches(args) {
  const { owner, repo, protected: isProtected, perPage = 30 } = args;
  
  const params = {
    owner,
    repo,
    per_page: perPage,
    ...(isProtected !== undefined && { protected: isProtected }),
  };

  const result = await octokit.rest.repos.listBranches(params);
  
  const branches = result.data.map(branch => ({
    name: branch.name,
    protected: branch.protected,
    commit: branch.commit.sha.substring(0, 7),
  }));
  
  return {
    content: [
      {
        type: 'text',
        text: `🌿 **Branches in ${owner}/${repo}** (${branches.length} found):\n\n${branches.map(branch => 
          `${branch.protected ? '🔒' : '🌿'} ${branch.name} (${branch.commit})`
        ).join('\n')}`,
      },
    ],
  };
}

async function handleCreateBranch(args) {
  const { owner, repo, branch, fromBranch = 'main' } = args;
  
  // Get the SHA of the source branch
  const sourceRef = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${fromBranch}`,
  });
  
  // Create the new branch
  const result = await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: sourceRef.data.object.sha,
  });
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Branch created successfully!\n🌿 Name: ${branch}\n📝 SHA: ${result.data.object.sha}\n🔗 From: ${fromBranch}`,
      },
    ],
  };
}

async function handleDeleteBranch(args) {
  const { owner, repo, branch } = args;
  
  await octokit.rest.git.deleteRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  
  return {
    content: [
      {
        type: 'text',
        text: `🗑️ Branch deleted successfully!\n🌿 Branch: ${branch}\n⚠️ This action cannot be undone.`,
      },
    ],
  };
}

async function handleListCollaborators(args) {
  const { owner, repo, affiliation = 'all' } = args;
  
  const result = await octokit.rest.repos.listCollaborators({
    owner,
    repo,
    affiliation,
  });
  
  const collaborators = result.data.map(collab => ({
    login: collab.login,
    permissions: collab.permissions,
    role: collab.role_name,
  }));
  
  return {
    content: [
      {
        type: 'text',
        text: `👥 **Collaborators in ${owner}/${repo}** (${collaborators.length} found):\n\n${collaborators.map(collab => 
          `👤 ${collab.login}\n   Role: ${collab.role}\n   Permissions: ${Object.keys(collab.permissions).filter(p => collab.permissions[p]).join(', ')}`
        ).join('\n\n')}`,
      },
    ],
  };
}

async function handleAddCollaborator(args) {
  const { owner, repo, username, permission = 'push' } = args;
  
  await octokit.rest.repos.addCollaborator({
    owner,
    repo,
    username,
    permission,
  });
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Collaborator added successfully!\n👤 Username: ${username}\n🔑 Permission: ${permission}\n📁 Repository: ${owner}/${repo}`,
      },
    ],
  };
}

async function handleRemoveCollaborator(args) {
  const { owner, repo, username } = args;
  
  await octokit.rest.repos.removeCollaborator({
    owner,
    repo,
    username,
  });
  
  return {
    content: [
      {
        type: 'text',
        text: `🗑️ Collaborator removed successfully!\n👤 Username: ${username}\n📁 Repository: ${owner}/${repo}`,
      },
    ],
  };
}

async function handleSearchRepositories(args) {
  const { query, sort = 'stars', order = 'desc', perPage = 30 } = args;
  
  const result = await octokit.rest.search.repos({
    q: query,
    sort,
    order,
    per_page: perPage,
  });
  
  const repos = result.data.items.map(repo => ({
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    url: repo.html_url,
  }));
  
  return {
    content: [
      {
        type: 'text',
        text: `🔍 **Repository Search Results** (${repos.length} found):\n\n${repos.map(repo => 
          `📁 ${repo.fullName}\n   ${repo.description || 'No description'}\n   ⭐ ${repo.stars} | 🍴 ${repo.forks} | 💻 ${repo.language || 'Unknown'}\n   🔗 ${repo.url}\n`
        ).join('\n')}`,
      },
    ],
  };
}

async function handleSearchIssues(args) {
  const { query, sort = 'updated', order = 'desc', perPage = 30 } = args;
  
  const result = await octokit.rest.search.issuesAndPullRequests({
    q: query,
    sort,
    order,
    per_page: perPage,
  });
  
  const issues = result.data.items.map(issue => ({
    title: issue.title,
    number: issue.number,
    state: issue.state,
    repository: issue.repository.full_name,
    labels: issue.labels.map(l => l.name),
    url: issue.html_url,
  }));
  
  return {
    content: [
      {
        type: 'text',
        text: `🔍 **Issue/PR Search Results** (${issues.length} found):\n\n${issues.map(issue => 
          `#${issue.number} - ${issue.title}\n   Repository: ${issue.repository}\n   State: ${issue.state}\n   Labels: ${issue.labels.join(', ') || 'None'}\n   🔗 ${issue.url}\n`
        ).join('\n')}`,
      },
    ],
  };
}

async function handleSearchCode(args) {
  const { query, sort = 'indexed', order = 'desc', perPage = 30 } = args;
  
  const result = await octokit.rest.search.code({
    q: query,
    sort,
    order,
    per_page: perPage,
  });
  
  const codeResults = result.data.items.map(item => ({
    name: item.name,
    path: item.path,
    repository: item.repository.full_name,
    url: item.html_url,
  }));
  
  return {
    content: [
      {
        type: 'text',
        text: `🔍 **Code Search Results** (${codeResults.length} found):\n\n${codeResults.map(result => 
          `📄 ${result.name}\n   Path: ${result.path}\n   Repository: ${result.repository}\n   🔗 ${result.url}\n`
        ).join('\n')}`,
      },
    ],
  };
}

async function handleGetUserInfo(args) {
  const { username } = args;
  
  const result = await octokit.rest.users.getByUsername({ username });
  const user = result.data;
  
  return {
    content: [
      {
        type: 'text',
        text: `👤 **User Information:**\n\n**Name:** ${user.name || user.login}\n**Username:** @${user.login}\n**Bio:** ${user.bio || 'No bio'}\n**Location:** ${user.location || 'Not specified'}\n**Company:** ${user.company || 'Not specified'}\n**Website:** ${user.blog || 'Not specified'}\n**Followers:** ${user.followers}\n**Following:** ${user.following}\n**Public Repos:** ${user.public_repos}\n**Created:** ${new Date(user.created_at).toLocaleDateString()}\n**URL:** ${user.html_url}`,
      },
    ],
  };
}

async function handleListUserRepositories(args) {
  const { username, type = 'owner', sort = 'full_name', direction = 'asc', perPage = 30 } = args;
  
  const result = await octokit.rest.repos.listForUser({
    username,
    type,
    sort,
    direction,
    per_page: perPage,
  });
  
  const repos = result.data.map(repo => ({
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    private: repo.private,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    url: repo.html_url,
  }));
  
  return {
    content: [
      {
        type: 'text',
        text: `📁 **Repositories for ${username}** (${repos.length} found):\n\n${repos.map(repo => 
          `${repo.private ? '🔒' : '📁'} ${repo.fullName}\n   ${repo.description || 'No description'}\n   ⭐ ${repo.stars} | 🍴 ${repo.forks} | 💻 ${repo.language || 'Unknown'}\n   🔗 ${repo.url}\n`
        ).join('\n')}`,
      },
    ],
  };
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 GitHub MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});


