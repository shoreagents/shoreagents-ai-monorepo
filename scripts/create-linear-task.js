#!/usr/bin/env node

/**
 * Create Linear Task Script
 * 
 * This script creates a Linear task with documentation from a markdown file.
 * It reads the LINEAR_API_KEY from your .env file.
 * 
 * Usage:
 *   node scripts/create-linear-task.js <markdown-file> <team-id> <assignee-id> [status]
 * 
 * Example:
 *   node scripts/create-linear-task.js LINEAR-TASK-CLIENT-TICKETING-COMPLETE.md TEAM-123 USER-456 "In Progress"
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Linear GraphQL endpoint
const LINEAR_API_URL = 'https://api.linear.app/graphql';

// Get LINEAR_API_KEY from environment
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error('❌ ERROR: LINEAR_API_KEY not found in .env file');
  console.error('Please add LINEAR_API_KEY to your .env file');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node scripts/create-linear-task.js <markdown-file> <team-id> <assignee-id> [status]');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/create-linear-task.js LINEAR-TASK-CLIENT-TICKETING-COMPLETE.md TEAM-123 USER-456 "In Progress"');
  process.exit(1);
}

const [markdownFile, teamId, assigneeId, status = 'In Progress'] = args;

// Read markdown file
const markdownPath = path.join(process.cwd(), markdownFile);
if (!fs.existsSync(markdownPath)) {
  console.error(`❌ ERROR: File not found: ${markdownPath}`);
  process.exit(1);
}

const content = fs.readFileSync(markdownPath, 'utf-8');

// Extract title (first # heading)
const titleMatch = content.match(/^#\s+(.+)$/m);
const title = titleMatch ? titleMatch[1] : 'Client Ticketing System - Complete';

// Extract summary (first paragraph after title)
const lines = content.split('\n');
let summary = '';
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('**')) {
    summary = lines[i].trim();
    break;
  }
}

// GraphQL mutation to create issue
const createIssueMutation = `
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

// Prepare variables
const variables = {
  input: {
    title: title,
    description: content,
    teamId: teamId,
    assigneeId: assigneeId,
    priority: 1, // High priority
    labelIds: [], // Add label IDs if you have them
  }
};

// Make API request
async function createLinearTask() {
  console.log('🚀 Creating Linear task...');
  console.log(`📝 Title: ${title}`);
  console.log(`👤 Assignee ID: ${assigneeId}`);
  console.log(`📋 Team ID: ${teamId}`);
  console.log('');

  try {
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': LINEAR_API_KEY,
      },
      body: JSON.stringify({
        query: createIssueMutation,
        variables: variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('❌ Error creating Linear task:');
      console.error(JSON.stringify(result.errors, null, 2));
      process.exit(1);
    }

    if (result.data?.issueCreate?.success) {
      const issue = result.data.issueCreate.issue;
      console.log('✅ Linear task created successfully!');
      console.log('');
      console.log(`📌 ID: ${issue.identifier}`);
      console.log(`📝 Title: ${issue.title}`);
      console.log(`🔗 URL: ${issue.url}`);
      console.log('');
      console.log('✨ Task is ready in Linear!');
    } else {
      console.error('❌ Failed to create Linear task');
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error making API request:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the script
createLinearTask();


