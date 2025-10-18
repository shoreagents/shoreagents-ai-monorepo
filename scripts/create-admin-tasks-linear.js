#!/usr/bin/env node

/**
 * Create Linear Task: Admin Tasks Management Complete
 * 
 * This script creates a Linear task documenting the completion
 * of the Admin Tasks Management feature.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const LINEAR_API_URL = 'https://api.linear.app/graphql';
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error('❌ ERROR: LINEAR_API_KEY not found in .env file');
  process.exit(1);
}

// Read the markdown file
const markdownPath = path.join(__dirname, '..', 'LINEAR-ADMIN-TASKS-COMPLETE.md');
const content = fs.readFileSync(markdownPath, 'utf-8');

// Extract title
const titleMatch = content.match(/^#\s+(.+)$/m);
const title = titleMatch ? titleMatch[1] : '✅ Admin Tasks Management - COMPLETE';

async function makeLinearRequest(query, variables = {}) {
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
  console.log('🔍 Finding ShoreAgents team and Stephen...\n');

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
          active
        }
      }
    }
  `;

  const data = await makeLinearRequest(query);
  
  // Find ShoreAgents team (look for various name variations)
  const team = data.teams.nodes.find(t => 
    t.name.toLowerCase().includes('shoreagents') || 
    t.name.toLowerCase().includes('shore agents') ||
    t.key.toLowerCase().includes('sho')
  );

  // Find Stephen
  const stephen = data.users.nodes.find(u => 
    (u.name.toLowerCase().includes('stephen') || u.email.toLowerCase().includes('stephen')) && u.active
  );

  if (!team) {
    console.log('📋 Available teams:');
    data.teams.nodes.forEach(t => console.log(`  - ${t.name} (${t.key})`));
    throw new Error('ShoreAgents team not found');
  }

  if (!stephen) {
    console.log('👥 Available users:');
    data.users.nodes.forEach(u => console.log(`  - ${u.name} (${u.email})`));
    throw new Error('Stephen not found');
  }

  console.log(`✅ Found team: ${team.name} (${team.id})`);
  console.log(`✅ Found user: ${stephen.name} (${stephen.email})`);
  console.log('');

  return { teamId: team.id, stephenId: stephen.id, teamName: team.name, stephenName: stephen.name };
}

async function createTask(teamId, stephenId) {
  console.log('📝 Creating Linear task...\n');

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
      title: title,
      description: content,
      teamId: teamId,
      assigneeId: stephenId,
      priority: 1, // High priority
      stateId: null, // Will use default "Todo" state
    }
  };

  const data = await makeLinearRequest(mutation, variables);

  if (data.issueCreate?.success) {
    const issue = data.issueCreate.issue;
    return issue;
  } else {
    throw new Error('Failed to create task');
  }
}

async function main() {
  console.log('🚀 Creating Admin Tasks Management Complete Task\n');
  console.log('=' .repeat(60));
  console.log('');

  try {
    // Step 1: Find team and user
    const { teamId, stephenId, teamName, stephenName } = await findTeamAndUser();

    // Step 2: Create the task
    const issue = await createTask(teamId, stephenId);

    // Step 3: Success!
    console.log('=' .repeat(60));
    console.log('');
    console.log('✅ SUCCESS! Linear task created!\n');
    console.log(`📌 Task ID: ${issue.identifier}`);
    console.log(`📝 Title: ${issue.title}`);
    console.log(`👤 Assigned to: ${stephenName}`);
    console.log(`📋 Team: ${teamName}`);
    console.log(`🔗 URL: ${issue.url}`);
    console.log('');
    console.log('=' .repeat(60));
    console.log('');
    console.log('📊 Task Summary:');
    console.log('  • Admin Tasks Management - COMPLETE ✅');
    console.log('  • View-Only Mode Implemented 🔒');
    console.log('  • Professional Table View 📊');
    console.log('  • Dark Management Theme 🎨');
    console.log('  • All Features Tested ✓');
    console.log('  • Ready for Production 🚀');
    console.log('');
    console.log('🎯 Features Completed:');
    console.log('  ✓ Admin can view ALL tasks');
    console.log('  ✓ Admin CANNOT edit ANY tasks');
    console.log('  ✓ Sortable table with filters');
    console.log('  ✓ View-only modal with badge');
    console.log('  ✓ Stats dashboard');
    console.log('  ✓ Pushed to GitHub branch');
    console.log('');
    console.log('💡 Ready to merge to main!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run it!
main();

