const fs = require('fs');
const https = require('https');

// Get from environment or pass as argument
const LINEAR_API_KEY = process.argv[2] || process.env.LINEAR_API_KEY || 'YOUR_LINEAR_API_KEY_HERE';
const TEAM_ID = 'c5744c01-56b9-4f07-a09b-93f4f85c1ab9';

const taskData = JSON.parse(fs.readFileSync('./LINEAR-TASK-JAMES-BREAK-POLISH-SHORT.json', 'utf8'));

console.log('🚀 Creating Linear task for James...');
console.log('📋 Title:', taskData.title);
console.log('👥 Team: ShoreAgents (SHO)');
console.log('');

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
    teamId: TEAM_ID
  }
};

const requestBody = JSON.stringify({ query: mutation, variables });

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
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.errors) {
        console.error('❌ ERROR:', JSON.stringify(response.errors, null, 2));
        process.exit(1);
      }
      if (response.data && response.data.issueCreate && response.data.issueCreate.success) {
        const issue = response.data.issueCreate.issue;
        
        console.log('✅ SUCCESS! Linear task created!');
        console.log('');
        console.log('   🎯 Task ID:', issue.identifier);
        console.log('   📝 Title:', issue.title);
        console.log('   🔗 URL:', issue.url);
        console.log('   ⏱️  Estimate:', issue.estimate, 'hours');
        console.log('   🔥 Priority:', issue.priority);
        console.log('');
        
        const markdown = `# LINEAR TASK CREATED: JAMES - BREAK SYSTEM POLISH

## Task Details:
- **Task ID:** ${issue.identifier}
- **Title:** ${issue.title}
- **URL:** ${issue.url}
- **Priority:** ${issue.priority} (Medium)
- **Estimate:** ${issue.estimate} hours
- **Team:** ShoreAgents (SHO)
- **Created:** ${new Date().toISOString()}

---

## Quick Summary:

**Mission:** Finish Break System (95% to 100%)

**3 Tasks for James:**
1. Away From Desk - Add reason selector (1-2h)
2. Clock Out Confirmation - Add dialog (1-2h)
3. Auto Clock Out - End of shift logout (2-3h)

**Total Estimate:** 5-8 hours (1 day)

---

## Documentation in Repo:

START HERE: BREAK-SYSTEM-COMPLETE-OCT-15-2025.md (95 KB - everything James needs!)

Also Read:
- BREAK-SYSTEM-HANDOFF-TO-JAMES.md - Complete handoff guide
- BREAK-TRACKER-STATUS-OCT-15-2025.md - Bug tracking
- SCHEDULED-BREAKS-FIX-OCT-15-2025.md - Scheduler details

---

## Key Files:

Code:
- components/time-tracking.tsx (952 lines)
- components/break-modal.tsx (388 lines)
- components/shift-modal.tsx - Example for James
- app/api/breaks/start/route.ts - Save away reason

Testing Mode: All breaks = 1 minute (line 178 in time-tracking.tsx)

---

## GitHub:

Branch: full-stack-StepTen
URL: https://github.com/shoreagents/shoreagents-ai-monorepo/tree/full-stack-StepTen
Commits: 3 commits pushed (84b27e5 latest)

---

## Linear Task:

${issue.url}

Status: Ready for James! All documentation and code in GitHub.

---

Created by: Stephen + AI Assistant
Date: October 15, 2025
Core System: 95% Complete - Production Ready ✅
`;
        
        fs.writeFileSync('./LINEAR-TASK-JAMES-CREATED.md', markdown);
        console.log('📄 Task info saved to LINEAR-TASK-JAMES-CREATED.md');
        console.log('');
        console.log('🎉 ALL DONE! Send this URL to James:');
        console.log('   ' + issue.url);
        console.log('');
        
        process.exit(0);
      } else {
        console.error('❌ Unexpected response format');
        console.error(JSON.stringify(response, null, 2));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Parse error:', error);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
  process.exit(1);
});

req.write(requestBody);
req.end();

