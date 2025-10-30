#!/usr/bin/env node

/**
 * Create Linear Task for James - Break System Polish
 * 
 * Usage:
 *   export LINEAR_API_KEY="your-api-key-here"
 *   node create-linear-task-james.js
 * 
 * Or pass API key as argument:
 *   node create-linear-task-james.js your-api-key-here
 */

const fs = require('fs');
const https = require('https');

// Get API key from environment or argument
const LINEAR_API_KEY = process.argv[2] || process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error('❌ ERROR: Linear API key not provided!');
  console.error('');
  console.error('Usage:');
  console.error('  export LINEAR_API_KEY="lin_api_..."');
  console.error('  node create-linear-task-james.js');
  console.error('');
  console.error('Or:');
  console.error('  node create-linear-task-james.js lin_api_...');
  process.exit(1);
}

// Read task JSON
const taskData = JSON.parse(
  fs.readFileSync('./LINEAR-TASK-JAMES-BREAK-POLISH.json', 'utf8')
);

console.log('🚀 Creating Linear task for James...');
console.log('');
console.log('📋 Task Details:');
console.log(`   Title: ${taskData.title}`);
console.log(`   Priority: ${taskData.priority}`);
console.log(`   Estimate: ${taskData.estimate} hours`);
console.log('');

// GraphQL mutation to create issue
const mutation = `
mutation CreateIssue($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue {
      id
      identifier
      title
      url
      priority
      estimate
    }
  }
}
`;

const variables = {
  input: {
    title: taskData.title,
    description: taskData.description,
    priority: taskData.priority,
    estimate: taskData.estimate,
    // These will be set if provided in the JSON
    ...(taskData.teamId && { teamId: taskData.teamId }),
    ...(taskData.projectId && { projectId: taskData.projectId }),
    ...(taskData.assigneeId && { assigneeId: taskData.assigneeId }),
    ...(taskData.labelIds && taskData.labelIds.length > 0 && { labelIds: taskData.labelIds }),
  }
};

const requestBody = JSON.stringify({
  query: mutation,
  variables: variables
});

const options = {
  hostname: 'api.linear.app',
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': LINEAR_API_KEY,
    'Content-Length': Buffer.byteLength(requestBody)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.errors) {
        console.error('❌ ERROR creating task:');
        console.error(JSON.stringify(response.errors, null, 2));
        process.exit(1);
      }

      if (response.data && response.data.issueCreate && response.data.issueCreate.success) {
        const issue = response.data.issueCreate.issue;
        
        console.log('✅ SUCCESS! Linear task created:');
        console.log('');
        console.log(`   🎯 Task ID: ${issue.identifier}`);
        console.log(`   📝 Title: ${issue.title}`);
        console.log(`   🔗 URL: ${issue.url}`);
        console.log(`   ⏱️  Estimate: ${issue.estimate || 'N/A'} hours`);
        console.log(`   🔥 Priority: ${issue.priority}`);
        console.log('');
        console.log('📄 Saving task info to LINEAR-TASK-JAMES-CREATED.md...');
        
        // Create markdown file with task details
        const markdown = `# LINEAR TASK CREATED: JAMES - BREAK SYSTEM POLISH

## Task Details:
- **Task ID:** ${issue.identifier}
- **Title:** ${issue.title}
- **URL:** ${issue.url}
- **Priority:** ${issue.priority} (2 = Medium)
- **Estimate:** ${issue.estimate || 'N/A'} hours
- **Created:** ${new Date().toISOString()}

---

## Quick Summary:

**Mission:** Finish polishing the Break Tracking System (3 outstanding features)

**What James Needs to Do:**
1. **Away From Desk** - Add reason selector (restroom, water, etc.)
2. **Clock Out Confirmation** - Add "Are you sure?" dialog with shift summary
3. **Auto Clock Out** - Implement end-of-shift auto-logout

**Core System Status:** 95% Complete - Production Ready ✅

**Estimated Time:** 5-8 hours (1 day)

**Files to Focus On:**
- \`components/time-tracking.tsx\`
- \`components/shift-modal.tsx\`
- \`app/api/breaks/start/route.ts\`

**Documentation:**
- \`BREAK-SYSTEM-COMPLETE-OCT-15-2025.md\` - Full system docs
- \`BREAK-TRACKER-STATUS-OCT-15-2025.md\` - Bug tracking
- \`SCHEDULED-BREAKS-FIX-OCT-15-2025.md\` - Scheduler fixes

---

## Task Details in Linear:

View full task description, requirements, testing instructions, and code examples in Linear:

**${issue.url}**

---

**GitHub Branch:** \`full-stack-StepTen\`  
**Commit:** \`5890129\` - Complete Break Tracking System  
**Date:** October 15, 2025
`;

        fs.writeFileSync('./LINEAR-TASK-JAMES-CREATED.md', markdown);
        
        console.log('✅ Task info saved!');
        console.log('');
        console.log('🎉 All done! Send this to James:');
        console.log(`   ${issue.url}`);
        console.log('');
        
      } else {
        console.error('❌ ERROR: Unexpected response format');
        console.error(JSON.stringify(response, null, 2));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ ERROR parsing response:');
      console.error(error);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ ERROR making request:');
  console.error(error);
  process.exit(1);
});

req.write(requestBody);
req.end();

