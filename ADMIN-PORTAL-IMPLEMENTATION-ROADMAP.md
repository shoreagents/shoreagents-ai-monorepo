# 🚀 Admin Portal Implementation Roadmap

**Created:** October 13, 2025  
**Status:** Ready to Execute  
**Estimated Time:** 25-33 hours

---

## 📊 Current Status

✅ **Phase 1 Complete (100%)** - File Structure & Component Merge  
✅ **Phase 2 Complete (100%)** - Authentication & Authorization  
⏳ **Phase 3-7 Pending (0%)** - API Routes, Data Integration, Review System

**Current State:**
- All 14 admin pages exist at `/app/admin/*`
- All pages use MOCK DATA (hardcoded arrays)
- No API routes exist yet (`/app/api/admin/*` - 0 files)
- Auth protection working (ADMIN role required)
- AdminSidebar navigation functional

**What Works:**
- Can login as ADMIN and access admin portal
- Can see mock data in all admin pages
- Cannot access admin if STAFF or CLIENT role
- Visual design and layout complete

**What Doesn't Work:**
- No real database queries
- Can't create/edit/delete staff, clients, assignments
- No review scheduling system
- No email notifications
- No cross-portal data visibility

---

## 🎯 Implementation Strategy

### Priority Order (Critical Path):

1. **CRITICAL: Assignments API + Review Scheduling** (8-10 hours)
   - This is the CORE feature that unlocks everything else
   - Without this, reviews cannot be scheduled or tracked

2. **HIGH: Supporting APIs** (6-8 hours)  
   - Staff, Clients, Client Users APIs
   - Required to create assignments

3. **MEDIUM: Data Integration** (8-10 hours)
   - Connect all admin pages to database
   - Replace mock data with real queries

4. **MEDIUM: Client Review Form** (3-4 hours)
   - Allow clients to submit reviews

5. **LOW: Navigation & Polish** (2-3 hours)
   - Portal switching, login redirects

---

## 🔥 PHASE 3A: CRITICAL PATH - Assignments & Reviews (PRIORITY 1)

**Estimated Time:** 8-10 hours  
**Why First:** This is the most important feature - everything else depends on it

### Step 1: Create Review Scheduling Logic (1 hour)

**File:** `/lib/review-schedule.ts` (NEW)

```typescript
import { Review } from "@prisma/client"

export type ReviewMilestone = {
  type: "MONTH_1" | "MONTH_3" | "MONTH_5" | "RECURRING_6M"
  dueDate: Date
  daysUntilDue: number
  isOverdue: boolean
  isSent: boolean
}

// Calculate next review due
export function getNextReviewDue(
  startDate: Date,
  completedReviews: Review[]
): ReviewMilestone | null

// Get full schedule preview
export function getReviewSchedule(startDate: Date): ReviewMilestone[]

// Format review type for display
export function formatReviewType(type: string): string

// Calculate review status
export function getReviewStatus(milestone: ReviewMilestone): 
  "NOT_SENT" | "DUE_SOON" | "OVERDUE" | "PENDING" | "COMPLETED"
```

**Implementation Notes:**
- Month 1: startDate + 30 days
- Month 3: startDate + 90 days  
- Month 5: startDate + 150 days
- Recurring 6M: last review + 180 days (ongoing)
- Consider completed reviews from Review table
- Check Review.type field to determine which reviews are done

### Step 2: Create Assignments API (3-4 hours)

**File:** `/app/api/admin/assignments/route.ts` (NEW)

```typescript
// GET /api/admin/assignments
// - List all assignments with filters
// - Include: user, profile, client, manager, reviews
// - Calculate next review due date for each
// - Support filters: clientId, userId, status

// POST /api/admin/assignments
// - Create new staff assignment
// - Validate: staff exists, client exists, manager exists
// - Check uniqueness: [userId, clientId]
// - Return assignment with review schedule preview
```

**File:** `/app/api/admin/assignments/[id]/route.ts` (NEW)

```typescript
// GET /api/admin/assignments/[id]
// - Get single assignment with full details
// - Include review history

// PUT /api/admin/assignments/[id]  
// - Update assignment details
// - If startDate changes, recalculate review schedule

// DELETE /api/admin/assignments/[id]
// - Set isActive = false (soft delete)
// - Keep historical data
```

**Prisma Queries:**

```typescript
// List assignments with review data
const assignments = await prisma.staffAssignment.findMany({
  where: { isActive: true },
  include: {
    user: {
      include: {
        profile: true,
        reviewsReceived: {
          orderBy: { submittedDate: 'desc' }
        }
      }
    },
    client: true,
    manager: true,
  },
  orderBy: { startDate: 'desc' }
})

// Calculate for each assignment:
// - daysEmployed = today - startDate  
// - nextReview = getNextReviewDue(startDate, reviews)
// - reviewStatus = getReviewStatus(nextReview)
```

### Step 3: Create Reviews API (2-3 hours)

**File:** `/app/api/admin/reviews/route.ts` (NEW)

```typescript
// GET /api/admin/reviews
// - List all reviews with filters
// - Include: user, assignment details
// - Support filters: userId, clientId, type, status, dateRange
// - Show: submitted reviews + overdue reviews not sent

// Calculate "virtual" overdue reviews:
// - Get all assignments
// - Use getNextReviewDue() to find what's due
// - Check if review exists in database
// - If not, show as "NOT_SENT" or "OVERDUE"
```

**File:** `/app/api/admin/reviews/send/route.ts` (NEW)

```typescript
// POST /api/admin/reviews/send
// Body: { assignmentId, reviewType }
// - Validate assignment exists
// - Check if review already sent (prevent duplicates)
// - Send email to client manager with review link
// - Create review request record (optional tracking table)
// - Return success/failure
```

**File:** `/app/api/admin/reviews/[id]/route.ts` (NEW)

```typescript
// GET /api/admin/reviews/[id]
// - Get full review details including all answers
// - Parse answers JSON field
// - Calculate section scores
```

**Email Template (Future):**
```
Subject: Review Requested: [Staff Name] - [Review Type]

Hi [Manager Name],

Please submit a review for [Staff Name] who has been working as 
[Role] since [Start Date].

Review Type: [Month 1 / Month 3 / Month 5 / 6-Month Check-In]

Submit Review: [Link to /client/reviews/submit/[assignmentId]]

This review is due by: [Due Date]

Thank you!
Shore Agents Team
```

### Step 4: Update Assignments Page (2 hours)

**File:** `/app/admin/assignments/page.tsx`

Replace mock data with:

```typescript
// Fetch assignments
const response = await fetch('/api/admin/assignments')
const assignments = await response.json()

// For each assignment, show:
// - Staff info (name, avatar, role)
// - Client info (company, manager)
// - Start date, days employed
// - Next review due date + type
// - Review status badge
// - Actions: Edit, View Reviews, Send Review

// Add "Create Assignment" dialog:
// - Staff dropdown (from /api/admin/staff)
// - Client dropdown (from /api/admin/clients)
// - Manager dropdown (from /api/admin/client-users?clientId=X)
// - Role input
// - Start date picker
// - Rate input
// - Show review schedule preview (using getReviewSchedule())
```

### Step 5: Update Reviews Page (2 hours)

**File:** `/app/admin/reviews/page.tsx`

Replace mock data with:

```typescript
// Fetch reviews + calculate overdue
const response = await fetch('/api/admin/reviews')
const reviewsData = await response.json()

// Tabs:
// - All Reviews
// - Due This Month (filter by dueDate)
// - Overdue (isOverdue = true)
// - Completed (status = ACKNOWLEDGED)

// For each review, show:
// - Staff info
// - Client info
// - Review type badge
// - Due date (or submitted date if complete)
// - Status badge
// - Actions: 
//   - "Send Request" (if not sent)
//   - "View Answers" (if submitted)
//   - "Resend" (if overdue)
```

---

## 🔧 PHASE 3B: Supporting APIs (PRIORITY 2)

**Estimated Time:** 6-8 hours  
**Why Second:** Required to create assignments

### Step 6: Staff Management API (2 hours)

**File:** `/app/api/admin/staff/route.ts` (NEW)

```typescript
// GET /api/admin/staff
// - List all staff (role in [STAFF, TEAM_LEAD, MANAGER])
// - Include: profile, gamificationProfile, staffAssignments
// - Filters: role, employmentStatus, clientId
// - Calculate: active assignments count, productivity score

// POST /api/admin/staff
// - Create User + Profile in transaction
// - Hash password
// - Set default values
// - Send welcome email (optional)
```

**File:** `/app/api/admin/staff/[id]/route.ts` (NEW)

```typescript
// GET /api/admin/staff/[id]
// - Full staff details
// - Include: assignments, reviews, metrics, tasks

// PUT /api/admin/staff/[id]
// - Update user + profile
// - Can change: name, email, phone, role, salary, employmentStatus

// DELETE /api/admin/staff/[id]
// - Set employmentStatus = TERMINATED
// - Set staffAssignments.isActive = false
// - Soft delete (keep historical data)
```

### Step 7: Client Management API (2 hours)

**File:** `/app/api/admin/clients/route.ts` (NEW)

```typescript
// GET /api/admin/clients
// - List all clients
// - Include: _count for offshoreStaff, onshoreStaff
// - Calculate: active assignments, total staff

// POST /api/admin/clients
// - Create Client organization
// - Optionally create first ClientUser (owner)
```

**File:** `/app/api/admin/clients/[id]/route.ts` (NEW)

```typescript
// GET /api/admin/clients/[id]
// - Full client details
// - Include: all staff assignments, client users

// PUT /api/admin/clients/[id]
// - Update client details

// DELETE /api/admin/clients/[id]
// - Soft delete (or prevent if has active assignments)
```

### Step 8: Client Users API (2 hours)

**File:** `/app/api/admin/client-users/route.ts` (NEW)

```typescript
// GET /api/admin/client-users
// - List all client users
// - Include: client, managedOffshoreStaff count
// - Filter by: clientId, role

// POST /api/admin/client-users
// - Create client user account
// - Hash password
// - Link to client organization
// - Send welcome email
```

**File:** `/app/api/admin/client-users/[id]/route.ts` (NEW)

```typescript
// GET /api/admin/client-users/[id]
// - Full user details
// - Include: client, managed staff

// PUT /api/admin/client-users/[id]
// - Update user details

// DELETE /api/admin/client-users/[id]
// - Deactivate account
```

### Step 9: Dashboard Stats API (1-2 hours)

**File:** `/app/api/admin/stats/route.ts` (NEW)

```typescript
// GET /api/admin/stats
// Returns:
{
  totalStaff: number
  regularStaff: number
  probationStaff: number
  activeClients: number
  pendingReviews: number
  reviewBreakdown: { month1, month3, month5, recurring }
  openTickets: number
  ticketPriority: { low, medium, high, urgent }
  staffClockedIn: number
  avgProductivity: number
}
```

**Queries:**

```typescript
// Staff counts
const totalStaff = await prisma.user.count({
  where: { role: { in: ['STAFF', 'TEAM_LEAD', 'MANAGER'] } }
})

const regularStaff = await prisma.profile.count({
  where: { 
    employmentStatus: 'REGULAR',
    user: { role: { in: ['STAFF', 'TEAM_LEAD', 'MANAGER'] } }
  }
})

// Calculate pending reviews from assignments
const assignments = await prisma.staffAssignment.findMany({
  where: { isActive: true },
  include: {
    user: { include: { reviewsReceived: true } }
  }
})

// Use getNextReviewDue() to count overdue reviews

// Tickets
const openTickets = await prisma.ticket.count({
  where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
})

// Clocked in
const staffClockedIn = await prisma.timeEntry.count({
  where: { clockOut: null }
})

// Productivity
const avgProductivity = await prisma.performanceMetric.aggregate({
  _avg: { productivityScore: true },
  where: {
    date: { gte: thirtyDaysAgo }
  }
})
```

---

## 📊 PHASE 4: Data Integration (PRIORITY 3)

**Estimated Time:** 8-10 hours  
**Why Third:** Make admin pages functional with real data

### Step 10: Dashboard Page (1 hour)

**File:** `/app/admin/page.tsx`

- Replace mock stats with data from `/api/admin/stats`
- Fetch recent activity (last 20 activity posts, tickets, reviews)
- Fetch reviews due this week (filter by dueDate)
- Convert to server component with `await fetch()`

### Step 11: Staff Management Page (1 hour)

**File:** `/app/admin/staff/page.tsx`

- Fetch from `/api/admin/staff`
- Add "Create Staff" dialog with form
- Add filters: role, employment status, client
- Add search by name/email
- Connect Edit/View/Delete buttons to API

### Step 12: Client Management Page (1 hour)

**File:** `/app/admin/clients/page.tsx`

- Fetch from `/api/admin/clients`
- Add "Create Client" dialog
- Show staff count, active assignments
- Connect Edit/View/Delete buttons

### Step 13: Client Users Page (1 hour)

**File:** `/app/admin/client-users/page.tsx`

- Fetch from `/api/admin/client-users`
- Add "Create Client User" dialog
- Filter by client, role
- Show managed staff count

### Step 14: Other Admin Pages (4-6 hours)

**Connect to existing APIs:**

- **Tasks** → Use existing `/api/tasks` with admin access
- **Tickets** → Use existing `/api/tickets` with admin view
- **Documents** → Use existing `/api/documents` with admin access
- **Time Tracking** → Query `TimeEntry`, `PerformanceMetric`
- **Gamification** → Query `GamificationProfile`, `Kudos`, `UserBadge`
- **Analytics** → Aggregate from multiple tables
- **Activity** → Use existing `/api/activity` posts
- **Settings** → System configuration (future)

---

## 📝 PHASE 6: Client Review Submission (PRIORITY 4)

**Estimated Time:** 3-4 hours  
**Why Fourth:** Complete the review workflow loop

### Step 15: Client Review Form Page (3-4 hours)

**File:** `/app/client/reviews/submit/[assignmentId]/page.tsx` (NEW)

```typescript
// 1. Fetch assignment details
const assignment = await fetch(`/api/admin/assignments/${assignmentId}`)

// 2. Determine review type based on:
//    - Start date
//    - Completed reviews
//    - Use getNextReviewDue()

// 3. Load questions from review-templates.ts
import { getQuestionsForReview } from "@/lib/review-templates"
const questions = getQuestionsForReview(reviewType)

// 4. Render form sections
//    - Staff info header (avatar, name, role, client)
//    - Review type badge
//    - Progress indicator (e.g. "3 of 5 sections complete")
//    - Question sections with proper field types:
//      * rating → Radio buttons with labels
//      * text → Textarea
//      * select → Dropdown
//      * checkbox → Checkboxes

// 5. Answer state management
const [answers, setAnswers] = useState({})

// 6. Save draft functionality (optional)
// POST /api/client/reviews/draft

// 7. Submit review
// POST /api/client/reviews
// Body: {
//   assignmentId,
//   type: reviewType,
//   answers: answers,
//   client: clientName,
//   reviewer: clientUserName,
//   reviewerTitle: clientUserRole
// }
// Calculate overallScore from rating answers
// Create Review record
// Redirect to success page
```

**API:** `/app/api/client/reviews/route.ts`

```typescript
// POST /api/client/reviews
// - Validate client user is logged in
// - Validate assignment exists
// - Check client user has permission (is manager or client admin)
// - Calculate overall score from rating answers
// - Create Review record
// - Send notification to staff member
// - Return success
```

---

## 🔄 PHASE 5: Navigation & Polish (PRIORITY 5)

**Estimated Time:** 2-3 hours  
**Why Last:** Nice to have, but not blocking functionality

### Step 16: Login Role-Based Redirect (30 min)

**File:** `/app/login/page.tsx`

```typescript
// After successful authentication:
if (session.user.role === "ADMIN") {
  redirect("/admin")
} else if (session.user.role === "CLIENT") {
  redirect("/client")
} else {
  redirect("/") // Staff portal
}
```

### Step 17: Staff Sidebar Portal Switcher (30 min)

**File:** `/components/dashboard-sidebar.tsx`

```typescript
// Add at bottom of sidebar:
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

### Step 18: Client Sidebar Portal Switcher (30 min)

**File:** `/components/client-sidebar.tsx`

```typescript
// Add at bottom of sidebar:
{session.clientUser.role === "OWNER" && (
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

### Step 19: Admin Assets Cleanup (30 min)

- Verify all images in `/public/admin/` are used
- Remove unused placeholders
- Add default avatars if needed

---

## ✅ PHASE 7: Testing & Validation

**Estimated Time:** 4-6 hours  
**Why Last:** Validate everything works end-to-end

### Test Checklist:

**Authentication (30 min)**
- [ ] Admin can access `/admin/*`
- [ ] Staff redirected to `/` when trying `/admin`
- [ ] Client redirected to `/client` when trying `/admin`
- [ ] Login redirects correctly based on role
- [ ] Logout works from admin portal

**Staff Management (30 min)**
- [ ] Create new staff member
- [ ] Staff appears in staff list
- [ ] Edit staff details
- [ ] View staff profile
- [ ] Change employment status
- [ ] Deactivate staff

**Client Management (30 min)**
- [ ] Create new client organization
- [ ] Client appears in client list
- [ ] Edit client details
- [ ] Create client user for organization
- [ ] View client details page

**Assignments (1 hour)**
- [ ] Create staff assignment
- [ ] Assignment appears in list
- [ ] Review schedule calculates correctly
- [ ] Next review due date shown
- [ ] Review status badge accurate
- [ ] Edit assignment
- [ ] End assignment

**Review System (2 hours)**
- [ ] Reviews page shows overdue reviews
- [ ] Calculate due dates correctly:
  - [ ] Month 1: startDate + 30 days
  - [ ] Month 3: startDate + 90 days
  - [ ] Month 5: startDate + 150 days
  - [ ] Recurring 6M: last review + 180 days
- [ ] "Send Review Request" button works
- [ ] Client receives review link (check console/logs)
- [ ] Client can access review form
- [ ] Client can submit review
- [ ] Review appears in admin panel
- [ ] Staff sees review in their portal
- [ ] Review status changes to "Completed"

**Cross-Portal (1 hour)**
- [ ] Admin can switch to staff portal
- [ ] Admin can switch to client portal
- [ ] Documents from staff visible in admin
- [ ] Tasks from clients visible in admin
- [ ] Time entries visible in admin
- [ ] Tickets visible in admin

**Dashboard Stats (30 min)**
- [ ] Staff count accurate
- [ ] Client count accurate
- [ ] Pending reviews count matches
- [ ] Open tickets count matches
- [ ] Clocked in staff count works
- [ ] Productivity average calculates

---

## 🚀 Execution Plan

### Day 1 (8 hours)
- ✅ Step 1: Review scheduling logic (1h)
- ✅ Step 2: Assignments API (4h)
- ✅ Step 3: Reviews API (3h)

### Day 2 (8 hours)
- ✅ Step 4: Update assignments page (2h)
- ✅ Step 5: Update reviews page (2h)
- ✅ Step 6: Staff API (2h)
- ✅ Step 7: Client API (2h)

### Day 3 (8 hours)
- ✅ Step 8: Client Users API (2h)
- ✅ Step 9: Dashboard Stats API (2h)
- ✅ Step 10-13: Core admin pages (4h)

### Day 4 (6 hours)
- ✅ Step 14: Other admin pages (4h)
- ✅ Step 15: Client review form (2h)

### Day 5 (3 hours)
- ✅ Step 16-19: Navigation & polish (2h)
- ✅ Initial testing (1h)

### Day 6 (4 hours)
- ✅ Comprehensive testing
- ✅ Bug fixes
- ✅ Documentation updates

---

## 📦 File Checklist

### New Files to Create (23 files):

**API Routes (13 files):**
- [ ] `/app/api/admin/staff/route.ts`
- [ ] `/app/api/admin/staff/[id]/route.ts`
- [ ] `/app/api/admin/clients/route.ts`
- [ ] `/app/api/admin/clients/[id]/route.ts`
- [ ] `/app/api/admin/client-users/route.ts`
- [ ] `/app/api/admin/client-users/[id]/route.ts`
- [ ] `/app/api/admin/assignments/route.ts`
- [ ] `/app/api/admin/assignments/[id]/route.ts`
- [ ] `/app/api/admin/reviews/route.ts`
- [ ] `/app/api/admin/reviews/send/route.ts`
- [ ] `/app/api/admin/reviews/[id]/route.ts`
- [ ] `/app/api/admin/stats/route.ts`
- [ ] `/app/api/client/reviews/route.ts`

**Client Pages (1 file):**
- [ ] `/app/client/reviews/submit/[assignmentId]/page.tsx`

**Libraries (1 file):**
- [ ] `/lib/review-schedule.ts`

**Files to Modify (20 files):**
- [ ] `/app/admin/page.tsx` - Replace mock stats
- [ ] `/app/admin/staff/page.tsx` - Connect to API
- [ ] `/app/admin/clients/page.tsx` - Connect to API
- [ ] `/app/admin/client-users/page.tsx` - Connect to API
- [ ] `/app/admin/assignments/page.tsx` - Connect to API
- [ ] `/app/admin/reviews/page.tsx` - Connect to API
- [ ] `/app/admin/tasks/page.tsx` - Connect to API
- [ ] `/app/admin/tickets/page.tsx` - Connect to API
- [ ] `/app/admin/documents/page.tsx` - Connect to API
- [ ] `/app/admin/time-tracking/page.tsx` - Connect to API
- [ ] `/app/admin/gamification/page.tsx` - Connect to API
- [ ] `/app/admin/analytics/page.tsx` - Connect to API
- [ ] `/app/admin/activity/page.tsx` - Connect to API
- [ ] `/app/admin/settings/page.tsx` - Connect to API
- [ ] `/app/login/page.tsx` - Add role redirect
- [ ] `/components/dashboard-sidebar.tsx` - Add admin link
- [ ] `/components/client-sidebar.tsx` - Add admin link

---

## ⚠️ Important Considerations

### Database Schema Notes:
- `User.role` → STAFF, TEAM_LEAD, MANAGER, ADMIN, CLIENT
- `Profile.employmentStatus` → PROBATION, REGULAR, TERMINATED
- `StaffAssignment` → Links User (staff) to Client, has managerId (ClientUser)
- `Review.type` → MONTH_1, MONTH_3, MONTH_5, RECURRING_6M, AD_HOC
- `Review.answers` → JSON field with question/answer pairs

### Review Scheduling Logic:
- Calculate from `StaffAssignment.startDate`
- Check which reviews exist in `Review` table
- Only show next due review (not all future reviews)
- Overdue = dueDate < today AND review not submitted

### Authentication:
- Admin APIs should check `session.user.role === "ADMIN"`
- Client review submission should check `session.clientUser` exists
- Use `auth()` from `@/lib/auth` for server components
- Use `useSession()` for client components

### Performance:
- Use Prisma `include` wisely (avoid over-fetching)
- Consider pagination for large lists (staff, assignments)
- Cache dashboard stats (optional, future optimization)

### Email Notifications (Future):
- For MVP, can log email content to console
- Later: integrate SendGrid, Resend, or Nodemailer
- Email template in `/lib/email-templates.ts`

---

## 🎯 Success Metrics

**Milestone 1: Critical Path Complete** (Day 1-2)
- ✅ Can create staff assignments
- ✅ Review due dates calculate correctly
- ✅ Can view assignments page with real data
- ✅ Can view reviews page with real data

**Milestone 2: Full CRUD Operations** (Day 3)
- ✅ Can create/edit/delete staff, clients, client users
- ✅ Dashboard shows real statistics
- ✅ All core admin pages connected

**Milestone 3: Review Workflow Complete** (Day 4)
- ✅ Can send review requests
- ✅ Clients can submit reviews
- ✅ Reviews appear in admin panel
- ✅ Staff can see reviews

**Milestone 4: Production Ready** (Day 5-6)
- ✅ All tests passing
- ✅ Navigation seamless
- ✅ No console errors
- ✅ Documentation updated

---

## 🔗 Reference Documents

- `ADMIN-PORTAL-INTEGRATION-PLAN.md` - Original integration plan
- `lib/review-templates.ts` - Review question templates
- `prisma/schema.prisma` - Database schema
- `CRITICAL-PATTERNS-DO-NOT-BREAK.md` - Coding guidelines
- `CLIENT-PORTAL-SETUP.md` - Client portal reference

---

**Ready to Execute!** 🚀  
Start with Step 1: Create Review Scheduling Logic

**Last Updated:** October 13, 2025

