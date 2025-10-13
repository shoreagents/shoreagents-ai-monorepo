# ✅ Admin Portal - Implementation Checklist

**Status:** Ready to Execute  
**Started:** October 13, 2025  
**Progress:** 22% Complete

---

## 📊 Overview

```
Phase 1: File Structure        ████████████████████ 100% ✅
Phase 2: Authentication        ████████████████████ 100% ✅
Phase 3: API Routes            ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: Data Integration      ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: Navigation            ███████░░░░░░░░░░░░░  33%
Phase 6: Review Submission     ░░░░░░░░░░░░░░░░░░░░   0%
Phase 7: Testing               ░░░░░░░░░░░░░░░░░░░░   0%
                               ────────────────────
Overall:                       ████░░░░░░░░░░░░░░░░  22%
```

**Time Completed:** 5 hours  
**Time Remaining:** 25-33 hours  
**Target Completion:** Day 6

---

## 🔥 CRITICAL PATH (Do These First)

### 🎯 Step 1: Review Scheduling Logic
**File:** `/lib/review-schedule.ts` (NEW)  
**Time:** 1 hour  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Create file
- [ ] Define `ReviewMilestone` type
- [ ] Implement `getNextReviewDue()` function
  - [ ] Month 1 logic (startDate + 30 days)
  - [ ] Month 3 logic (startDate + 90 days)
  - [ ] Month 5 logic (startDate + 150 days)
  - [ ] Recurring 6M logic (lastReview + 180 days)
- [ ] Implement `getReviewSchedule()` function
- [ ] Implement `formatReviewType()` helper
- [ ] Implement `getReviewStatus()` helper
- [ ] Test with sample dates

**Dependencies:** None  
**Blocks:** Step 2, 3, 4, 5

---

### 🎯 Step 2: Assignments API
**Files:** `/app/api/admin/assignments/route.ts`, `/app/api/admin/assignments/[id]/route.ts` (NEW)  
**Time:** 3-4 hours  
**Status:** ⏳ Not Started

**Checklist:**

#### `route.ts` (List & Create)
- [ ] Create file
- [ ] GET handler - List assignments
  - [ ] Add authentication check (ADMIN only)
  - [ ] Query StaffAssignment with includes
  - [ ] Include: user, profile, client, manager, reviews
  - [ ] Add filters: clientId, userId, status
  - [ ] Calculate nextReviewDue for each
  - [ ] Calculate daysEmployed for each
  - [ ] Sort by startDate desc
  - [ ] Return JSON
- [ ] POST handler - Create assignment
  - [ ] Validate input (userId, clientId, managerId, role, startDate, rate)
  - [ ] Check user exists and is STAFF
  - [ ] Check client exists
  - [ ] Check manager exists and belongs to client
  - [ ] Check uniqueness [userId, clientId]
  - [ ] Create StaffAssignment
  - [ ] Return assignment with review schedule
- [ ] Error handling
- [ ] Test with curl/Postman

#### `[id]/route.ts` (Get, Update, Delete)
- [ ] Create file
- [ ] GET handler - Single assignment
  - [ ] Auth check
  - [ ] Find assignment by id
  - [ ] Include all relations
  - [ ] Calculate review data
  - [ ] Return JSON
- [ ] PUT handler - Update assignment
  - [ ] Auth check
  - [ ] Validate input
  - [ ] Update record
  - [ ] If startDate changed, recalculate reviews
  - [ ] Return updated assignment
- [ ] DELETE handler - End assignment
  - [ ] Auth check
  - [ ] Set isActive = false
  - [ ] Set endDate = now
  - [ ] Return success
- [ ] Error handling
- [ ] Test CRUD operations

**Dependencies:** Step 1, Step 6-8 (for staff/client to exist)  
**Blocks:** Step 4, 5

---

### 🎯 Step 3: Reviews API
**Files:** `/app/api/admin/reviews/route.ts`, `/app/api/admin/reviews/send/route.ts`, `/app/api/admin/reviews/[id]/route.ts` (NEW)  
**Time:** 2-3 hours  
**Status:** ⏳ Not Started

**Checklist:**

#### `route.ts` (List Reviews)
- [ ] Create file
- [ ] GET handler - List reviews
  - [ ] Auth check
  - [ ] Query Review model
  - [ ] Include user, profile
  - [ ] Add filters: userId, clientId, type, status, dateRange
  - [ ] Fetch all active assignments
  - [ ] Calculate overdue reviews using getNextReviewDue()
  - [ ] Merge submitted + calculated overdue
  - [ ] Sort by due date
  - [ ] Return JSON

#### `send/route.ts` (Send Review Request)
- [ ] Create file
- [ ] POST handler - Send review
  - [ ] Auth check
  - [ ] Validate: assignmentId, reviewType
  - [ ] Check assignment exists
  - [ ] Get assignment with user, client, manager
  - [ ] Check if review already sent (prevent duplicates)
  - [ ] Log email content (or send via email service)
  - [ ] Create review request tracking (optional)
  - [ ] Return success

#### `[id]/route.ts` (Get Review Details)
- [ ] Create file
- [ ] GET handler - Review details
  - [ ] Auth check
  - [ ] Find review by id
  - [ ] Include user
  - [ ] Parse answers JSON
  - [ ] Calculate section scores
  - [ ] Return JSON

**Dependencies:** Step 1, 2  
**Blocks:** Step 5

---

### 🎯 Step 4: Update Assignments Page
**File:** `/app/admin/assignments/page.tsx`  
**Time:** 2 hours  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Remove mock data array
- [ ] Fetch from `/api/admin/assignments`
- [ ] Convert to client component or use server fetch
- [ ] Display assignments in table
  - [ ] Staff avatar, name
  - [ ] Client company
  - [ ] Manager name
  - [ ] Role, start date
  - [ ] Days employed (calculated)
  - [ ] Next review due date
  - [ ] Review type badge
  - [ ] Status badge (Active/Ended)
- [ ] Add filters
  - [ ] Filter by client
  - [ ] Filter by status
  - [ ] Search by staff name
- [ ] Add "Create Assignment" dialog
  - [ ] Staff dropdown (from /api/admin/staff)
  - [ ] Client dropdown (from /api/admin/clients)
  - [ ] Manager dropdown (from /api/admin/client-users)
  - [ ] Role input
  - [ ] Start date picker
  - [ ] Rate input
  - [ ] Show review schedule preview
  - [ ] Submit handler → POST /api/admin/assignments
- [ ] Add row actions
  - [ ] Edit button → open dialog
  - [ ] View button → show details
  - [ ] Delete button → end assignment
- [ ] Test create, edit, delete flows

**Dependencies:** Step 2, 6-8  
**Blocks:** None

---

### 🎯 Step 5: Update Reviews Page
**File:** `/app/admin/reviews/page.tsx`  
**Time:** 2 hours  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Remove mock data array
- [ ] Fetch from `/api/admin/reviews`
- [ ] Convert to client component or use server fetch
- [ ] Add tabs
  - [ ] All Reviews
  - [ ] Due This Month
  - [ ] Overdue
  - [ ] Completed
- [ ] Display reviews in table
  - [ ] Staff avatar, name
  - [ ] Client company
  - [ ] Review type badge
  - [ ] Due date (or submitted date)
  - [ ] Status badge
  - [ ] Days overdue (if applicable)
- [ ] Add filters
  - [ ] Filter by client
  - [ ] Filter by review type
  - [ ] Filter by status
  - [ ] Search by staff name
- [ ] Add actions per review
  - [ ] "Send Request" button (if not sent)
    - [ ] POST to /api/admin/reviews/send
    - [ ] Show success toast
  - [ ] "View Answers" button (if submitted)
    - [ ] Show dialog with full review
  - [ ] "Resend" button (if overdue)
- [ ] Test send review flow

**Dependencies:** Step 3  
**Blocks:** None

---

## 🔧 SUPPORTING APIs (Do After Critical Path)

### 🎯 Step 6: Staff Management API
**Files:** `/app/api/admin/staff/route.ts`, `/app/api/admin/staff/[id]/route.ts` (NEW)  
**Time:** 2 hours  
**Status:** ⏳ Not Started

**Checklist:**

#### `route.ts`
- [ ] Create file
- [ ] GET handler - List staff
  - [ ] Auth check
  - [ ] Query User where role in [STAFF, TEAM_LEAD, MANAGER]
  - [ ] Include: profile, gamificationProfile, staffAssignments
  - [ ] Filters: role, employmentStatus, clientId
  - [ ] Calculate: active assignments count
  - [ ] Return JSON
- [ ] POST handler - Create staff
  - [ ] Auth check
  - [ ] Validate input
  - [ ] Hash password
  - [ ] Create User + Profile in transaction
  - [ ] Return new staff member

#### `[id]/route.ts`
- [ ] Create file
- [ ] GET handler - Staff details
- [ ] PUT handler - Update staff
- [ ] DELETE handler - Terminate (set employmentStatus = TERMINATED)
- [ ] Test CRUD

**Dependencies:** None  
**Blocks:** Step 2 (assignments need staff to exist)

---

### 🎯 Step 7: Client Management API
**Files:** `/app/api/admin/clients/route.ts`, `/app/api/admin/clients/[id]/route.ts` (NEW)  
**Time:** 2 hours  
**Status:** ⏳ Not Started

**Checklist:**

#### `route.ts`
- [ ] Create file
- [ ] GET handler - List clients
  - [ ] Auth check
  - [ ] Query Client
  - [ ] Include: _count for staff
  - [ ] Calculate: active assignments
  - [ ] Return JSON
- [ ] POST handler - Create client
  - [ ] Auth check
  - [ ] Validate input
  - [ ] Create Client
  - [ ] Optionally create first ClientUser (owner)
  - [ ] Return new client

#### `[id]/route.ts`
- [ ] Create file
- [ ] GET handler - Client details
- [ ] PUT handler - Update client
- [ ] DELETE handler - Soft delete
- [ ] Test CRUD

**Dependencies:** None  
**Blocks:** Step 2 (assignments need clients to exist)

---

### 🎯 Step 8: Client Users API
**Files:** `/app/api/admin/client-users/route.ts`, `/app/api/admin/client-users/[id]/route.ts` (NEW)  
**Time:** 2 hours  
**Status:** ⏳ Not Started

**Checklist:**

#### `route.ts`
- [ ] Create file
- [ ] GET handler - List client users
  - [ ] Auth check
  - [ ] Query ClientUser
  - [ ] Include: client, managedOffshoreStaff count
  - [ ] Filters: clientId, role
  - [ ] Return JSON
- [ ] POST handler - Create client user
  - [ ] Auth check
  - [ ] Validate input
  - [ ] Hash password
  - [ ] Create ClientUser
  - [ ] Return new user

#### `[id]/route.ts`
- [ ] Create file
- [ ] GET handler - User details
- [ ] PUT handler - Update user
- [ ] DELETE handler - Deactivate
- [ ] Test CRUD

**Dependencies:** Step 7 (need clients to exist)  
**Blocks:** Step 2 (assignments need managers to exist)

---

### 🎯 Step 9: Dashboard Stats API
**File:** `/app/api/admin/stats/route.ts` (NEW)  
**Time:** 1-2 hours  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Create file
- [ ] GET handler
  - [ ] Auth check
  - [ ] Query totalStaff count
  - [ ] Query regularStaff count (employmentStatus)
  - [ ] Query probationStaff count
  - [ ] Query activeClients count
  - [ ] Calculate pendingReviews (from assignments + getNextReviewDue)
  - [ ] Calculate reviewBreakdown by type
  - [ ] Query openTickets count
  - [ ] Query ticketPriority breakdown
  - [ ] Query staffClockedIn count (timeEntry.clockOut = null)
  - [ ] Calculate avgProductivity (last 30 days)
  - [ ] Return JSON with all stats
- [ ] Test with curl

**Dependencies:** Step 1  
**Blocks:** Step 10

---

## 📊 DATA INTEGRATION (Connect UI to Database)

### 🎯 Step 10: Dashboard Page
**File:** `/app/admin/page.tsx`  
**Time:** 1 hour  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Remove mock stats
- [ ] Fetch from `/api/admin/stats`
- [ ] Fetch recent activity (last 20 posts/tickets/reviews)
- [ ] Fetch reviews due this week
- [ ] Update stat cards with real data
- [ ] Update "Reviews Due This Week" table
- [ ] Update "Recent Activity" list
- [ ] Test data accuracy

**Dependencies:** Step 9  
**Blocks:** None

---

### 🎯 Step 11: Staff Management Page
**File:** `/app/admin/staff/page.tsx`  
**Time:** 1 hour  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Remove mock data
- [ ] Fetch from `/api/admin/staff`
- [ ] Display staff table
- [ ] Add filters (role, employment status, client)
- [ ] Add search (name, email)
- [ ] Add "Create Staff" dialog
  - [ ] Form fields: name, email, password, role, phone, location, startDate, currentRole, salary
  - [ ] Submit → POST /api/admin/staff
- [ ] Add row actions (Edit, View, Deactivate)
- [ ] Test create/edit/delete

**Dependencies:** Step 6  
**Blocks:** None

---

### 🎯 Step 12: Clients Page
**File:** `/app/admin/clients/page.tsx`  
**Time:** 1 hour  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Remove mock data
- [ ] Fetch from `/api/admin/clients`
- [ ] Display clients table
- [ ] Add "Create Client" dialog
  - [ ] Form fields: companyName, industry, location, billingEmail
  - [ ] Submit → POST /api/admin/clients
- [ ] Add row actions
- [ ] Test CRUD

**Dependencies:** Step 7  
**Blocks:** None

---

### 🎯 Step 13: Client Users Page
**File:** `/app/admin/client-users/page.tsx`  
**Time:** 1 hour  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Remove mock data
- [ ] Fetch from `/api/admin/client-users`
- [ ] Display users table
- [ ] Add filters (client, role)
- [ ] Add "Create Client User" dialog
  - [ ] Client dropdown
  - [ ] Form fields: name, email, password, role, title
  - [ ] Submit → POST /api/admin/client-users
- [ ] Add row actions
- [ ] Test CRUD

**Dependencies:** Step 8  
**Blocks:** None

---

### 🎯 Step 14: Other Admin Pages
**Time:** 4-6 hours  
**Status:** ⏳ Not Started

**Checklist:**

#### Tasks Page
- [ ] `/app/admin/tasks/page.tsx`
- [ ] Fetch from existing `/api/tasks` with admin access
- [ ] Show tasks from all users
- [ ] Filter by source (CLIENT, STAFF, MANAGEMENT)
- [ ] Add CRUD operations

#### Tickets Page
- [ ] `/app/admin/tickets/page.tsx`
- [ ] Fetch from existing `/api/tickets`
- [ ] Show all tickets
- [ ] Filter by status, priority
- [ ] Add admin response capability

#### Documents Page
- [ ] `/app/admin/documents/page.tsx`
- [ ] Fetch from existing `/api/documents`
- [ ] Show documents from staff + clients
- [ ] Badge for source (STAFF/CLIENT)
- [ ] Add filters

#### Time Tracking Page
- [ ] `/app/admin/time-tracking/page.tsx`
- [ ] Query TimeEntry, PerformanceMetric
- [ ] Show all staff time entries
- [ ] Aggregate by staff, date range
- [ ] Show productivity metrics

#### Gamification Page
- [ ] `/app/admin/gamification/page.tsx`
- [ ] Query GamificationProfile, Kudos, UserBadge
- [ ] Show leaderboard
- [ ] Show badge distribution
- [ ] Admin can award badges/kudos

#### Analytics Page
- [ ] `/app/admin/analytics/page.tsx`
- [ ] Aggregate data from multiple models
- [ ] Charts: staff growth, productivity trends, client satisfaction
- [ ] Time range filters

#### Activity Page
- [ ] `/app/admin/activity/page.tsx`
- [ ] Fetch from existing `/api/activity`
- [ ] Show all posts
- [ ] Admin moderation actions
- [ ] Filter by type

#### Settings Page
- [ ] `/app/admin/settings/page.tsx`
- [ ] System configuration (future)
- [ ] Email templates
- [ ] Notification settings

**Dependencies:** Existing APIs  
**Blocks:** None

---

## 📝 CLIENT REVIEW FORM (Complete the Loop)

### 🎯 Step 15: Client Review Submission Page
**File:** `/app/client/reviews/submit/[assignmentId]/page.tsx` (NEW)  
**Time:** 3-4 hours  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Create file
- [ ] Create Client Review API: `/app/api/client/reviews/route.ts`
- [ ] Fetch assignment details
  - [ ] GET /api/admin/assignments/[assignmentId]
  - [ ] Include user, client, manager
- [ ] Determine review type
  - [ ] Use getNextReviewDue() based on start date
- [ ] Load questions
  - [ ] Import getQuestionsForReview from review-templates
  - [ ] Get questions for review type
- [ ] Build form UI
  - [ ] Staff info header (avatar, name, role, company)
  - [ ] Review type badge
  - [ ] Progress indicator
  - [ ] Render sections
    - [ ] Rating questions → Radio buttons with labels
    - [ ] Text questions → Textarea
    - [ ] Select questions → Dropdown
    - [ ] Checkbox questions → Checkboxes
  - [ ] Answer state management
- [ ] Save draft functionality (optional)
  - [ ] Store in localStorage or database
- [ ] Submit review
  - [ ] Validate all required fields
  - [ ] Calculate overallScore from rating answers
  - [ ] POST to /api/client/reviews
  - [ ] Show success message
  - [ ] Redirect to confirmation page
- [ ] Create API handler
  - [ ] Auth check (client user)
  - [ ] Validate input
  - [ ] Create Review record
  - [ ] Send notification to staff
  - [ ] Return success
- [ ] Test full review submission flow

**Dependencies:** Step 1, 2, 3  
**Blocks:** None

---

## 🎨 NAVIGATION & POLISH

### 🎯 Step 16: Login Role-Based Redirect
**File:** `/app/login/page.tsx`  
**Time:** 30 minutes  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Find login success handler
- [ ] Add role-based redirect logic
  - [ ] If ADMIN → /admin
  - [ ] If CLIENT → /client
  - [ ] Else → / (staff portal)
- [ ] Test with different roles

**Dependencies:** None  
**Blocks:** None

---

### 🎯 Step 17: Staff Sidebar Portal Switcher
**File:** `/components/dashboard-sidebar.tsx`  
**Time:** 30 minutes  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Open file
- [ ] Find sidebar menu items section
- [ ] Add conditional admin link
  ```tsx
  {session.user.role === "ADMIN" && (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href="/admin">
          <Settings className="h-4 w-4" />
          Admin Panel
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )}
  ```
- [ ] Test visibility (only shows for ADMIN)

**Dependencies:** None  
**Blocks:** None

---

### 🎯 Step 18: Client Sidebar Portal Switcher
**File:** `/components/client-sidebar.tsx`  
**Time:** 30 minutes  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Open file
- [ ] Add conditional admin link (for OWNER/ADMIN client users)
- [ ] Test visibility

**Dependencies:** None  
**Blocks:** None

---

### 🎯 Step 19: Asset Cleanup
**Time:** 30 minutes  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Review `/public/admin/` directory
- [ ] Remove unused placeholder images
- [ ] Verify all images referenced in pages exist
- [ ] Add missing default avatars if needed

**Dependencies:** None  
**Blocks:** None

---

## ✅ TESTING & VALIDATION

### 🎯 Authentication Tests
**Time:** 30 minutes  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Login as ADMIN → should access /admin
- [ ] Login as STAFF → should be blocked from /admin
- [ ] Login as CLIENT → should be blocked from /admin
- [ ] Login redirects to correct portal based on role
- [ ] Logout works from admin portal

---

### 🎯 Staff Management Tests
**Time:** 30 minutes  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Create new staff member
- [ ] Staff appears in list
- [ ] Edit staff details
- [ ] View staff profile page
- [ ] Change employment status
- [ ] Deactivate staff
- [ ] Deactivated staff doesn't show in active list

---

### 🎯 Client Management Tests
**Time:** 30 minutes  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Create new client organization
- [ ] Client appears in list
- [ ] Edit client details
- [ ] Create client user for organization
- [ ] View client details page
- [ ] Delete client (should warn if has active assignments)

---

### 🎯 Assignment Tests
**Time:** 1 hour  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Create staff assignment
  - [ ] Staff dropdown populated
  - [ ] Client dropdown populated
  - [ ] Manager dropdown filtered by selected client
  - [ ] Review schedule preview shows correctly
- [ ] Assignment appears in list
- [ ] Days employed calculates correctly
- [ ] Next review due date correct
- [ ] Review type badge correct
- [ ] Status badge accurate
- [ ] Edit assignment
  - [ ] Change start date → review schedule updates
- [ ] End assignment
  - [ ] Status changes to "Ended"
  - [ ] No longer shows next review

---

### 🎯 Review System Tests
**Time:** 2 hours  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Reviews page shows correct data
- [ ] Overdue reviews calculated accurately
- [ ] Due date logic correct:
  - [ ] Month 1: startDate + 30 days ✓
  - [ ] Month 3: startDate + 90 days ✓
  - [ ] Month 5: startDate + 150 days ✓
  - [ ] Recurring 6M: lastReview + 180 days ✓
- [ ] Tabs filter correctly (All, Due This Month, Overdue, Completed)
- [ ] "Send Review Request" button works
  - [ ] Email logged to console (or sent)
  - [ ] Status changes to "Sent"
- [ ] Client receives review link
  - [ ] Navigate to /client/reviews/submit/[assignmentId]
  - [ ] Form loads with correct questions
  - [ ] Staff info displays correctly
  - [ ] Review type correct
- [ ] Client submits review
  - [ ] All required fields validated
  - [ ] Form submits successfully
  - [ ] Success message shown
- [ ] Review appears in admin panel
  - [ ] Status = "Completed"
  - [ ] Overall score calculated
  - [ ] Can view answers
- [ ] Staff sees review in their portal
  - [ ] Review visible on /reviews page
  - [ ] Can acknowledge review
- [ ] Create second review for same staff
  - [ ] Next review due date updates correctly

---

### 🎯 Cross-Portal Tests
**Time:** 1 hour  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Admin can switch to staff portal
- [ ] Admin can switch to client portal
- [ ] Staff with ADMIN role sees admin link
- [ ] Documents uploaded by staff visible in admin
- [ ] Documents uploaded by client visible in admin
- [ ] Tasks created by client visible in admin tasks
- [ ] Time entries from staff visible in admin time tracking
- [ ] Tickets from staff visible in admin tickets
- [ ] Activity posts visible in admin activity feed

---

### 🎯 Dashboard Stats Tests
**Time:** 30 minutes  
**Status:** ⏳ Not Started

**Checklist:**
- [ ] Staff count matches
- [ ] Regular/Probation breakdown correct
- [ ] Client count matches
- [ ] Pending reviews count accurate
- [ ] Review breakdown by type correct
- [ ] Open tickets count matches
- [ ] Ticket priority breakdown correct
- [ ] Clocked in staff count works
- [ ] Productivity average calculates
- [ ] Recent activity shows latest items
- [ ] Reviews due this week filtered correctly

---

## 📈 Progress Summary

**Total Checklist Items:** ~300+  
**Completed:** ~50 (Phases 1-2)  
**Remaining:** ~250

**Critical Path Items (Must Do):** 50  
**Supporting Items:** 100  
**Data Integration Items:** 50  
**Testing Items:** 50

---

## 🎯 Daily Targets

**Day 1 (8 hours)**
- [ ] Complete Steps 1-3 (Review logic + APIs)
- [ ] Target: 3 critical APIs functional

**Day 2 (8 hours)**
- [ ] Complete Steps 4-7 (UI + Supporting APIs)
- [ ] Target: Assignments page working, staff/client APIs ready

**Day 3 (8 hours)**
- [ ] Complete Steps 8-10 (Client users + Dashboard)
- [ ] Target: Dashboard showing real data

**Day 4 (6 hours)**
- [ ] Complete Steps 11-15 (Admin pages + Review form)
- [ ] Target: All core pages connected, review submission works

**Day 5 (3 hours)**
- [ ] Complete Steps 16-19 (Navigation + Polish)
- [ ] Target: Seamless navigation, clean UI

**Day 6 (4 hours)**
- [ ] Complete all testing
- [ ] Target: All tests passing, production ready

---

## 🚀 Quick Start Command

```bash
# 1. Start development server
cd "gamified-dashboard (1)"
pnpm dev

# 2. Open in browser
open http://localhost:3000/admin

# 3. Start with Step 1
# Create: lib/review-schedule.ts
```

---

**Last Updated:** October 13, 2025  
**Next Action:** Create `/lib/review-schedule.ts`

**Let's build this! 🚀**

