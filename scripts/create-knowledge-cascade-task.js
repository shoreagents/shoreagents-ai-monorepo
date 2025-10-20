#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read API key from .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/LINEAR_API_KEY=["']?([^"\'\n]+)["']?/);
const API_KEY = apiKeyMatch ? apiKeyMatch[1].trim().replace(/^['"]|['"]$/g, '') : null;

if (!API_KEY) {
  console.error('❌ LINEAR_API_KEY not found in .env file');
  process.exit(1);
}

console.log('✅ Linear API Key loaded');

function linearQuery(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    
    const options = {
      hostname: 'api.linear.app',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          console.log('Raw response:', body.substring(0, 500));
          const response = JSON.parse(body);
          if (response.errors) {
            console.error('GraphQL Errors:', JSON.stringify(response.errors, null, 2));
            reject(new Error(response.errors[0].message));
          } else {
            resolve(response.data);
          }
        } catch (e) {
          console.error('Parse error:', e);
          console.error('Response body:', body);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    // 1. Find ShoreAgents team
    console.log('🔍 Finding ShoreAgents team...');
    const teamsQuery = `
      query {
        teams {
          nodes {
            id
            name
          }
        }
      }
    `;
    
    const teamsData = await linearQuery(teamsQuery);
    const shoreAgentsTeam = teamsData.teams.nodes.find(t => 
      t.name.toLowerCase().includes('shoreagents') || t.name.toLowerCase().includes('shore')
    );
    
    if (!shoreAgentsTeam) {
      throw new Error('ShoreAgents team not found');
    }
    console.log(`✅ Found team: ${shoreAgentsTeam.name} (${shoreAgentsTeam.id})`);

    // 2. Find Lovell
    console.log('🔍 Finding Lovell...');
    const usersQuery = `
      query {
        users {
          nodes {
            id
            name
            email
          }
        }
      }
    `;
    
    const usersData = await linearQuery(usersQuery);
    const lovell = usersData.users.nodes.find(u => 
      u.name.toLowerCase().includes('lovell') || u.email.toLowerCase().includes('lovell')
    );
    
    if (!lovell) {
      throw new Error('Lovell not found in users');
    }
    console.log(`✅ Found user: ${lovell.name} (${lovell.email})`);

    // 3. Create the task
    console.log('📝 Creating Linear task...');
    const createIssueQuery = `
      mutation($teamId: String!, $title: String!, $description: String!, $assigneeId: String!) {
        issueCreate(
          input: {
            teamId: $teamId
            title: $title
            description: $description
            assigneeId: $assigneeId
            priority: 2
          }
        ) {
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

    const title = "QA & Polish: Knowledge Cascade System (3-Tier Docs)";
    
    const description = `## 🎯 Overview
Stephen has built a complete **Knowledge Cascade System** - a three-tier document hierarchy with color-coded sources, Supabase Storage integration, and AI assistant referencing.

**Your mission:** Test, polish, and ensure production readiness.

---

## 📚 What Was Built

### **Three Document Tiers:**
1. 🔴 **Admin Docs** - Management expertise (Stephen's knowledge base)
   - Shareable with selected staff/clients
   - Located: \`/admin/documents\`

2. 🟣 **Staff Docs** - Training materials
   - Auto-share with assigned client companies
   - Located: \`/knowledge-base\` (Staff portal)

3. 🔵 **Client Docs** - Company-specific documents
   - Clients can edit their own
   - Located: \`/client/knowledge-base\`

### **Key Features:**
- ✅ CloudConvert text extraction (PDF, DOC, DOCX, TXT, MD)
- ✅ Supabase Storage integration
- ✅ AI Assistant can reference all docs
- ✅ Color-coded badges everywhere
- ✅ Document comments system
- ✅ Auto-sharing logic
- ✅ Comprehensive logging

---

## 🧪 Testing Instructions

### **1. Test Client Document Upload**
- Login: \`steve@steve.com\` / \`qwerty12345\`
- Go to: \`http://localhost:3000/client/knowledge-base\`
- Click "Upload New Document"
- Upload a PDF or MD file
- **Expected:**
  - ✅ File shows in Supabase \`client\` bucket under \`client_docs/{companyId}/\`
  - ✅ Document appears with 🔵 Blue "Client" badge
  - ✅ Terminal shows: \`✅ [CLIENT] File uploaded SUCCESS\`
  - ✅ Can view document details by clicking on it

### **2. Test Staff Document Upload**
- Login: \`james@james.com\` / \`qwerty12345\`
- Go to: \`http://localhost:3000/knowledge-base\`
- Upload a document
- **Expected:**
  - ✅ File shows in Supabase \`staff\` bucket under \`staff_docs/{staffId}/\`
  - ✅ Document appears with 🟣 Purple "Staff" badge
  - ✅ Document auto-shares with James's assigned client company
  - ✅ Client can see this doc in their knowledge base

### **3. Test Admin Document Upload**
- Login as Admin (Stephen's account)
- Go to: \`http://localhost:3000/admin/documents\`
- Click "Upload Document" (modal should open)
- Upload a document
- **Share Options:**
  - Test "Share with all"
  - Test "Share with specific staff"
  - Test "Share with specific clients"
- **Expected:**
  - ✅ File shows in Supabase \`management\` bucket under \`management_docs/{adminId}/\`
  - ✅ Document appears with 🔴 Red "Admin" badge
  - ✅ Shared users can see the document

### **4. Test AI Assistant Integration**
- Open AI Chat Assistant (bottom right)
- Type \`@\` to trigger document mentions
- **Expected:**
  - ✅ Shows documents from all 3 sources (Admin, Staff, Client)
  - ✅ Each has color-coded badge (🔴🟣🔵)
  - ✅ Documents are sorted: Admin → Staff → Client
  - ✅ No duplicates
  - ✅ Sidebar shows "Referenced Documents" with badges

### **5. Test Document Comments**
- Open any document detail page
- Scroll to comments section
- Add a comment
- **Expected:**
  - ✅ Comment appears immediately
  - ✅ Shows correct user name and avatar
  - ✅ Timestamp is correct

### **6. Test Cross-Platform Visibility**
- Upload as Client → Check if Staff assigned to that client can see it
- Upload as Staff → Check if assigned Client can see it
- Upload as Admin (shared with all) → Check if Client and Staff can see it

### **7. Check Supabase Storage**
Go to Supabase Dashboard → Storage:
- \`client\` bucket → \`client_docs/\` folder
- \`staff\` bucket → \`staff_docs/\` folder
- \`management\` bucket → \`management_docs/\` folder

**Verify:**
- ✅ Files are in correct folders
- ✅ File paths follow: \`{folder}/{userId}/{timestamp}-{filename}\`
- ✅ Files are accessible via public URL

---

## 🔧 What to Polish

### **UI/UX:**
1. Document upload progress indicators
2. Error handling for failed uploads
3. File size validation (currently 10MB limit)
4. File type icons (PDF, DOC, TXT, etc.)
5. Search/filter functionality on document lists
6. Sorting options (date, title, category)

### **Admin Modal:**
1. Multi-select for staff/clients (currently single)
2. Preview of who can access the document
3. Validation messages
4. Success/failure toasts

### **Document Detail Pages:**
1. Download button for original files
2. Edit functionality (title, category)
3. Delete confirmation
4. Share/unshare toggle

### **Mobile Responsiveness:**
1. Test on mobile devices
2. Ensure modals work on small screens
3. Check badge visibility

---

## 📁 Key Files

### **API Routes:**
- \`app/api/admin/documents/route.ts\`
- \`app/api/client/documents/route.ts\`
- \`app/api/documents/route.ts\` (Staff)
- \`app/api/documents/[id]/comments/route.ts\`

### **UI Components:**
- \`components/ui/document-source-badge.tsx\`
- \`components/admin/document-upload-modal.tsx\`
- \`components/ai-chat-assistant.tsx\`

### **Pages:**
- \`app/admin/documents/page.tsx\`
- \`app/client/knowledge-base/page.tsx\`
- \`app/client/knowledge-base/[id]/page.tsx\`

### **Database:**
- \`prisma/schema.prisma\` → \`Document\` model
- \`DocumentSource\` enum: \`ADMIN | STAFF | CLIENT\`
- \`DocumentComment\` model

---

## 🐛 Known Issues
None! Stephen fixed all bugs including:
- ✅ MIME type detection
- ✅ Bucket structure (folders inside existing buckets)
- ✅ AI user lookup
- ✅ Next.js 15 async params

---

## ✅ Definition of Done
- [ ] All 7 test scenarios pass
- [ ] Files correctly stored in Supabase
- [ ] No console errors
- [ ] Mobile responsive
- [ ] UI polish complete
- [ ] Documentation updated
- [ ] Ready for production merge

---

## 📝 Notes
- **Branch:** \`full-stack-StepTen\`
- **Commit:** \`ba9ab43\`
- **Server:** \`http://localhost:3000\`
- **Test Logins:**
  - Client: \`steve@steve.com\` / \`qwerty12345\`
  - Staff: \`james@james.com\` / \`qwerty12345\`
  - Admin: Stephen's account

**Questions?** Slack Stephen! 🚀`;

    const variables = {
      teamId: shoreAgentsTeam.id,
      title: title,
      description: description,
      assigneeId: lovell.id
    };

    console.log('Variables:', { teamId: variables.teamId, assigneeId: variables.assigneeId, titleLength: variables.title.length, descLength: variables.description.length });

    const result = await linearQuery(createIssueQuery, variables);
    
    console.log('Result:', JSON.stringify(result, null, 2));

    if (result && result.issueCreate && result.issueCreate.success) {
      const issue = result.issueCreate.issue;
      console.log('\n✅ Linear task created successfully!');
      console.log(`📋 ID: ${issue.identifier}`);
      console.log(`📝 Title: ${issue.title}`);
      console.log(`🔗 URL: ${issue.url}`);
      console.log(`👤 Assigned to: ${lovell.name}`);
    } else {
      console.error('❌ Failed to create issue');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

