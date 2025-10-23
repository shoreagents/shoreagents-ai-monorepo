#!/usr/bin/env node
/**
 * Linear MCP Server
 * Model Context Protocol server for Linear integration
 */

const { LinearClient } = require('@linear/sdk');
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

class LinearMCPServer {
  constructor() {
    // Try to get token from environment variable (from mcp.json)
    this.linearToken = process.env.LINEAR_TOKEN;
    
    // If not found, try to load from .env.local file
    if (!this.linearToken) {
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
        this.linearToken = process.env.LINEAR_TOKEN;
      }
    }
    
    if (!this.linearToken) {
      throw new Error('LINEAR_TOKEN environment variable is required');
    }
    
    this.client = new LinearClient({
      apiKey: this.linearToken,
    });
    
    this.server = new Server(
      {
        name: 'linear-mcp-server',
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
            name: 'get_teams',
            description: 'Get all teams in the workspace',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'get_team',
            description: 'Get a specific team by ID',
            inputSchema: {
              type: 'object',
              properties: {
                teamId: { type: 'string', description: 'Team ID' }
              },
              required: ['teamId']
            }
          },
          {
            name: 'get_issues',
            description: 'Get issues from a team',
            inputSchema: {
              type: 'object',
              properties: {
                teamId: { type: 'string', description: 'Team ID' },
                state: { type: 'string', description: 'Issue state filter', enum: ['backlog', 'unstarted', 'started', 'completed', 'canceled'] },
                limit: { type: 'number', description: 'Number of issues to return', default: 50 }
              },
              required: ['teamId']
            }
          },
          {
            name: 'get_issue',
            description: 'Get a specific issue by ID',
            inputSchema: {
              type: 'object',
              properties: {
                issueId: { type: 'string', description: 'Issue ID' }
              },
              required: ['issueId']
            }
          },
          {
            name: 'create_issue',
            description: 'Create a new issue',
            inputSchema: {
              type: 'object',
              properties: {
                teamId: { type: 'string', description: 'Team ID' },
                title: { type: 'string', description: 'Issue title' },
                description: { type: 'string', description: 'Issue description' },
                priority: { type: 'number', description: 'Priority (1-4)', enum: [1, 2, 3, 4] },
                stateId: { type: 'string', description: 'State ID' },
                assigneeId: { type: 'string', description: 'Assignee user ID' },
                labelIds: { type: 'array', description: 'Label IDs', items: { type: 'string' } }
              },
              required: ['teamId', 'title']
            }
          },
          {
            name: 'update_issue',
            description: 'Update an existing issue',
            inputSchema: {
              type: 'object',
              properties: {
                issueId: { type: 'string', description: 'Issue ID' },
                title: { type: 'string', description: 'New title' },
                description: { type: 'string', description: 'New description' },
                priority: { type: 'number', description: 'Priority (1-4)', enum: [1, 2, 3, 4] },
                stateId: { type: 'string', description: 'New state ID' },
                assigneeId: { type: 'string', description: 'New assignee user ID' },
                labelIds: { type: 'array', description: 'New label IDs', items: { type: 'string' } }
              },
              required: ['issueId']
            }
          },
          {
            name: 'get_projects',
            description: 'Get all projects',
            inputSchema: {
              type: 'object',
              properties: {
                teamId: { type: 'string', description: 'Filter by team ID' }
              },
              required: []
            }
          },
          {
            name: 'get_project',
            description: 'Get a specific project by ID',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'string', description: 'Project ID' }
              },
              required: ['projectId']
            }
          },
          {
            name: 'create_project',
            description: 'Create a new project',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Project name' },
                description: { type: 'string', description: 'Project description' },
                teamIds: { type: 'array', description: 'Team IDs', items: { type: 'string' } },
                state: { type: 'string', description: 'Project state', enum: ['planned', 'started', 'paused', 'completed', 'canceled'] }
              },
              required: ['name']
            }
          },
          {
            name: 'get_users',
            description: 'Get all users in the workspace',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'get_user',
            description: 'Get a specific user by ID',
            inputSchema: {
              type: 'object',
              properties: {
                userId: { type: 'string', description: 'User ID' }
              },
              required: ['userId']
            }
          },
          {
            name: 'get_states',
            description: 'Get all states for a team',
            inputSchema: {
              type: 'object',
              properties: {
                teamId: { type: 'string', description: 'Team ID' }
              },
              required: ['teamId']
            }
          },
          {
            name: 'get_labels',
            description: 'Get all labels for a team',
            inputSchema: {
              type: 'object',
              properties: {
                teamId: { type: 'string', description: 'Team ID' }
              },
              required: ['teamId']
            }
          },
          {
            name: 'search_issues',
            description: 'Search for issues',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                teamId: { type: 'string', description: 'Filter by team ID' },
                limit: { type: 'number', description: 'Number of results', default: 20 }
              },
              required: ['query']
            }
          },
          {
            name: 'get_me',
            description: 'Get current user information',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
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
            uri: 'linear://user/profile',
            name: 'User Profile',
            description: 'Get current user profile information',
            mimeType: 'application/json'
          },
          {
            uri: 'linear://teams/list',
            name: 'Teams List',
            description: 'Get list of all teams',
            mimeType: 'application/json'
          },
          {
            uri: 'linear://issues/my',
            name: 'My Issues',
            description: 'Get issues assigned to current user',
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
          case 'get_teams':
            result = await this.getTeams();
            break;
          case 'get_team':
            result = await this.getTeam(args.teamId);
            break;
          case 'get_issues':
            result = await this.getIssues(args.teamId, args.state, args.limit);
            break;
          case 'get_issue':
            result = await this.getIssue(args.issueId);
            break;
          case 'create_issue':
            result = await this.createIssue(args);
            break;
          case 'update_issue':
            result = await this.updateIssue(args);
            break;
          case 'get_projects':
            result = await this.getProjects(args.teamId);
            break;
          case 'get_project':
            result = await this.getProject(args.projectId);
            break;
          case 'create_project':
            result = await this.createProject(args);
            break;
          case 'get_users':
            result = await this.getUsers();
            break;
          case 'get_user':
            result = await this.getUser(args.userId);
            break;
          case 'get_states':
            result = await this.getStates(args.teamId);
            break;
          case 'get_labels':
            result = await this.getLabels(args.teamId);
            break;
          case 'search_issues':
            result = await this.searchIssues(args.query, args.teamId, args.limit);
            break;
          case 'get_me':
            result = await this.getMe();
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
          case 'linear://user/profile':
            result = await this.getMe();
            break;
          case 'linear://teams/list':
            result = await this.getTeams();
            break;
          case 'linear://issues/my':
            result = await this.getMyIssues();
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
  async getTeams() {
    try {
      const teams = await this.client.teams();
      return {
        success: true,
        teams: teams.nodes.map(team => ({
          id: team.id,
          name: team.name,
          key: team.key,
          description: team.description,
          color: team.color,
          icon: team.icon
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getTeam(teamId) {
    try {
      const team = await this.client.team(teamId);
      return {
        success: true,
        team: {
          id: team.id,
          name: team.name,
          key: team.key,
          description: team.description,
          color: team.color,
          icon: team.icon
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getIssues(teamId, state = null, limit = 50) {
    try {
      const issues = await this.client.issues({
        filter: {
          team: { id: { eq: teamId } },
          ...(state && { state: { name: { eq: state } } })
        },
        first: limit
      });
      
      return {
        success: true,
        issues: issues.nodes.map(issue => ({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description,
          priority: issue.priority,
          state: issue.state?.name,
          assignee: issue.assignee?.name,
          team: issue.team?.name,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getIssue(issueId) {
    try {
      const issue = await this.client.issue(issueId);
      return {
        success: true,
        issue: {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description,
          priority: issue.priority,
          state: issue.state?.name,
          assignee: issue.assignee?.name,
          team: issue.team?.name,
          labels: issue.labels?.nodes?.map(label => label.name),
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async createIssue(args) {
    try {
      const issue = await this.client.issueCreate({
        teamId: args.teamId,
        title: args.title,
        description: args.description,
        priority: args.priority,
        stateId: args.stateId,
        assigneeId: args.assigneeId,
        labelIds: args.labelIds
      });
      
      return {
        success: true,
        issue: {
          id: issue.issue.id,
          identifier: issue.issue.identifier,
          title: issue.issue.title,
          url: issue.issue.url
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async updateIssue(args) {
    try {
      const issue = await this.client.issueUpdate(args.issueId, {
        title: args.title,
        description: args.description,
        priority: args.priority,
        stateId: args.stateId,
        assigneeId: args.assigneeId,
        labelIds: args.labelIds
      });
      
      return {
        success: true,
        issue: {
          id: issue.issue.id,
          identifier: issue.issue.identifier,
          title: issue.issue.title
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getProjects(teamId = null) {
    try {
      const projects = await this.client.projects({
        filter: teamId ? { teams: { id: { eq: teamId } } } : undefined,
        first: 50
      });
      
      return {
        success: true,
        projects: projects.nodes.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          state: project.state,
          progress: project.progress,
          teams: project.teams?.nodes?.map(team => team.name)
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getProject(projectId) {
    try {
      const project = await this.client.project(projectId);
      return {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          state: project.state,
          progress: project.progress,
          teams: project.teams?.nodes?.map(team => team.name)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async createProject(args) {
    try {
      const project = await this.client.projectCreate({
        name: args.name,
        description: args.description,
        teamIds: args.teamIds,
        state: args.state
      });
      
      return {
        success: true,
        project: {
          id: project.project.id,
          name: project.project.name,
          url: project.project.url
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getUsers() {
    try {
      const users = await this.client.users();
      return {
        success: true,
        users: users.nodes.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          active: user.active
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getUser(userId) {
    try {
      const user = await this.client.user(userId);
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          active: user.active
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getStates(teamId) {
    try {
      const states = await this.client.workflowStates({
        filter: { team: { id: { eq: teamId } } }
      });
      
      return {
        success: true,
        states: states.nodes.map(state => ({
          id: state.id,
          name: state.name,
          type: state.type,
          color: state.color,
          position: state.position
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getLabels(teamId) {
    try {
      const labels = await this.client.issueLabels({
        filter: { team: { id: { eq: teamId } } }
      });
      
      return {
        success: true,
        labels: labels.nodes.map(label => ({
          id: label.id,
          name: label.name,
          color: label.color,
          description: label.description
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async searchIssues(query, teamId = null, limit = 20) {
    try {
      const issues = await this.client.issues({
        filter: {
          title: { contains: query },
          ...(teamId && { team: { id: { eq: teamId } } })
        },
        first: limit
      });
      
      return {
        success: true,
        issues: issues.nodes.map(issue => ({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          state: issue.state?.name,
          assignee: issue.assignee?.name,
          team: issue.team?.name
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getMe() {
    try {
      const viewer = await this.client.viewer;
      return {
        success: true,
        user: {
          id: viewer.id,
          name: viewer.name,
          email: viewer.email,
          avatarUrl: viewer.avatarUrl,
          active: viewer.active
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getMyIssues() {
    try {
      const viewer = await this.client.viewer;
      const issues = await this.client.issues({
        filter: { assignee: { id: { eq: viewer.id } } },
        first: 50
      });
      
      return {
        success: true,
        issues: issues.nodes.map(issue => ({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          state: issue.state?.name,
          team: issue.team?.name,
          priority: issue.priority
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Linear MCP Server running on stdio');
  }
}

// Main execution
async function main() {
  try {
    const server = new LinearMCPServer();
    await server.run();
  } catch (error) {
    console.error('Error starting Linear MCP server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LinearMCPServer;



