#!/usr/bin/env node

/**
 * Create Linear Task for Activity Feed Implementation
 * 
 * This script:
 * 1. Queries Linear API to find team and user IDs
 * 2. Creates a detailed task for Emman
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const LINEAR_API_URL = 'https://api.linear.app/graphql';
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error('❌ ERROR: LINEAR_API_KEY not found in .env file');
  process.exit(1);
}

// Read markdown file
const markdownPath = path.join(__dirname, 'LINEAR-TASK-ACTIVITY-FEED-COMPLETE.md');
const content = fs.readFileSync(markdownPath, 'utf-8');

async function queryLinear(query, variables = {}) {
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': LINEAR_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  
  const result = await response.json();
  
  if (result.errors) {
    console.error('❌ Linear API Error:');
    console.error(JSON.stringify(result.errors, null, 2));
    throw new Error('Linear API request failed');
  }
  
  return result.data;
}

async function findTeamAndUser() {
  console.log('🔍 Searching for team and user...\n');
  
  // Query to find teams and users
  const query = `
    query {
      teams {
        nodes {
          id
          name
          key
        }
      }
      users {
        nodes {
          id
          name
          email
          displayName
        }
      }
    }
  `;
  
  const data = await queryLinear(query);
  
  // Find ShoreAgents team
  const team = data.teams.nodes.find(t => 
    t.name.toLowerCase().includes('shoreagent') || 
    t.name.toLowerCase().includes('software')
  );
  
  if (!team) {
    console.log('Available teams:');
    data.teams.nodes.forEach(t => console.log(`  - ${t.name} (${t.key})`));
    throw new Error('Could not find ShoreAgents Software team');
  }
  
  console.log(`✅ Found team: ${team.name} (${team.key})`);
  
  // Find user (try Emman first, then fallback to Stephen)
  let user = data.users.nodes.find(u => 
    u.name?.toLowerCase().includes('emman') || 
    u.displayName?.toLowerCase().includes('emman') ||
    u.email?.toLowerCase().includes('emman')
  );
  
  if (!user) {
    console.log('⚠️  Emman not found in Linear, assigning to Stephen (can reassign later)');
    user = data.users.nodes.find(u => 
      u.name?.toLowerCase().includes('stephen') || 
      u.email?.toLowerCase().includes('stephen')
    );
  }
  
  if (!user) {
    console.log('Available users:');
    data.users.nodes.forEach(u => console.log(`  - ${u.name} (${u.email})`));
    throw new Error('Could not find user');
  }
  
  console.log(`✅ Found user: ${user.name || user.displayName} (${user.email})\n`);
  
  return { team, user };
}

async function createLinearTask(teamId, assigneeId) {
  console.log('🚀 Creating Linear task...\n');
  
  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;
  
  const variables = {
    input: {
      title: '🎉 Activity Feed System - Complete Multi-Audience Implementation',
      description: content,
      teamId: teamId,
      assigneeId: assigneeId,
      priority: 1, // High priority
      labelIds: [],
    }
  };
  
  const data = await queryLinear(mutation, variables);
  
  if (data.issueCreate?.success) {
    const issue = data.issueCreate.issue;
    console.log('✅ Linear task created successfully!\n');
    console.log(`📌 ID: ${issue.identifier}`);
    console.log(`📝 Title: ${issue.title}`);
    console.log(`🔗 URL: ${issue.url}\n`);
    console.log('✨ Task is ready in Linear!');
    return issue;
  } else {
    throw new Error('Failed to create Linear task');
  }
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎯 Creating Linear Task: Activity Feed Implementation');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const { team, user } = await findTeamAndUser();
    const issue = await createLinearTask(team.id, user.id);
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ SUCCESS!');
    console.log('═══════════════════════════════════════════════════════');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

