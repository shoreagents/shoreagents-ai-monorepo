# 🚀 Admin Portal Quick Start Guide

**Last Updated:** October 13, 2025

---

## ✅ What's Already Done

✓ All 14 admin pages exist at `/app/admin/*`  
✓ Admin authentication (ADMIN role required)  
✓ Admin sidebar navigation  
✓ All UI components and design complete  
✓ Mock data showing in all pages  

**You can already:**
- Login as ADMIN and see the admin portal
- Navigate between all admin pages
- See mock data in beautiful UI
- Cannot yet: Create/edit/delete real data

---

## 🎯 What We're Building

Transform the admin portal from **mock data** → **fully functional** with:
- Real database queries
- Staff/Client/Assignment management
- **CRITICAL:** Review scheduling system (Month 1/3/5, Recurring 6M)
- Client review submission forms
- Dashboard statistics
- Cross-portal navigation

---

## 📊 Progress Tracker

### 🔥 PHASE 3A: Critical Path (PRIORITY 1)
**Goal:** Get assignments + review scheduling working

- [ ] Step 1: Create `/lib/review-schedule.ts` (1h)
- [ ] Step 2: Create `/app/api/admin/assignments/route.ts` (4h)
- [ ] Step 3: Create `/app/api/admin/reviews/route.ts` (3h)
- [ ] Step 4: Update `/app/admin/assignments/page.tsx` (2h)
- [ ] Step 5: Update `/app/admin/reviews/page.tsx` (2h)

**Time:** 8-10 hours | **Impact:** 🔥 HIGH - Core feature

---

### 🔧 PHASE 3B: Supporting APIs (PRIORITY 2)
**Goal:** Create staff, clients, client users

- [ ] Step 6: Create `/app/api/admin/staff/**` (2h)
- [ ] Step 7: Create `/app/api/admin/clients/**` (2h)
- [ ] Step 8: Create `/app/api/admin/client-users/**` (2h)
- [ ] Step 9: Create `/app/api/admin/stats/route.ts` (2h)

**Time:** 6-8 hours | **Impact:** 🔥 HIGH - Required for assignments

---

### 📊 PHASE 4: Data Integration (PRIORITY 3)
**Goal:** Connect all admin pages to database

- [ ] Step 10: Dashboard page → real stats (1h)
- [ ] Step 11: Staff page → real data + CRUD (1h)
- [ ] Step 12: Clients page → real data + CRUD (1h)
- [ ] Step 13: Client Users page → real data + CRUD (1h)
- [ ] Step 14: Other pages (tasks, tickets, docs, etc.) (4-6h)

**Time:** 8-10 hours | **Impact:** 🟡 MEDIUM - Makes pages functional

---

### 📝 PHASE 6: Review Submission (PRIORITY 4)
**Goal:** Let clients submit reviews

- [ ] Step 15: Create `/app/client/reviews/submit/[assignmentId]/page.tsx` (3-4h)
- [ ] Create `/app/api/client/reviews/route.ts` (included)

**Time:** 3-4 hours | **Impact:** 🟡 MEDIUM - Completes review loop

---

### 🎨 PHASE 5: Polish (PRIORITY 5)
**Goal:** Navigation and UX improvements

- [ ] Step 16: Login role-based redirect (30m)
- [ ] Step 17: Staff sidebar → add admin link (30m)
- [ ] Step 18: Client sidebar → add admin link (30m)
- [ ] Step 19: Asset cleanup (30m)

**Time:** 2-3 hours | **Impact:** 🟢 LOW - Nice to have

---

### ✅ PHASE 7: Testing (FINAL)
**Goal:** Ensure everything works

- [ ] Authentication tests (30m)
- [ ] Staff management tests (30m)
- [ ] Client management tests (30m)
- [ ] Assignment tests (1h)
- [ ] Review system tests (2h)
- [ ] Cross-portal tests (1h)
- [ ] Dashboard stats tests (30m)

**Time:** 4-6 hours | **Impact:** ✅ CRITICAL - Quality assurance

---

## 📈 Overall Progress

```
███░░░░░░░░░░░░░░░░░ 22% Complete

Completed: 5 hours (Phases 1 & 2)
Remaining: 25-33 hours (Phases 3-7)
Total Estimate: 30-38 hours
```

**Current Phase:** Starting Phase 3A  
**Next Action:** Create `/lib/review-schedule.ts`

---

## 🎯 Critical Path (Must Do First)

These steps unlock everything else:

1. **Review Scheduling Logic** → Calculate due dates
2. **Assignments API** → Store staff-client relationships
3. **Reviews API** → Track and send review requests
4. **Staff/Client APIs** → Required to create assignments
5. **Update UI** → Connect pages to APIs

**Why This Order?**
- Can't create assignments without staff/clients
- Can't schedule reviews without assignments
- Can't send reviews without review scheduling logic
- Everything depends on these core features

---

## 📋 File Creation Checklist

### New API Routes (13 files)
```
app/api/admin/
├── staff/
│   ├── route.ts          [ ] GET, POST
│   └── [id]/route.ts     [ ] GET, PUT, DELETE
├── clients/
│   ├── route.ts          [ ] GET, POST
│   └── [id]/route.ts     [ ] GET, PUT, DELETE
├── client-users/
│   ├── route.ts          [ ] GET, POST
│   └── [id]/route.ts     [ ] GET, PUT, DELETE
├── assignments/
│   ├── route.ts          [ ] GET, POST (🔥 CRITICAL)
│   └── [id]/route.ts     [ ] GET, PUT, DELETE
├── reviews/
│   ├── route.ts          [ ] GET
│   ├── send/route.ts     [ ] POST (🔥 CRITICAL)
│   └── [id]/route.ts     [ ] GET
└── stats/
    └── route.ts          [ ] GET

app/api/client/
└── reviews/
    └── route.ts          [ ] POST (🔥 CRITICAL)
```

### New Pages (1 file)
```
app/client/reviews/submit/[assignmentId]/
└── page.tsx              [ ] Client review form (🔥 CRITICAL)
```

### New Libraries (1 file)
```
lib/
└── review-schedule.ts    [ ] Review logic (🔥 CRITICAL)
```

### Pages to Update (17 files)
```
app/admin/
├── page.tsx              [ ] Replace mock stats
├── staff/page.tsx        [ ] Connect to API + CRUD
├── clients/page.tsx      [ ] Connect to API + CRUD
├── client-users/page.tsx [ ] Connect to API + CRUD
├── assignments/page.tsx  [ ] Connect to API + CRUD (🔥 CRITICAL)
├── reviews/page.tsx      [ ] Connect to API + CRUD (🔥 CRITICAL)
├── tasks/page.tsx        [ ] Connect to API
├── tickets/page.tsx      [ ] Connect to API
├── documents/page.tsx    [ ] Connect to API
├── time-tracking/page.tsx [ ] Connect to API
├── gamification/page.tsx [ ] Connect to API
├── analytics/page.tsx    [ ] Connect to API
├── activity/page.tsx     [ ] Connect to API
└── settings/page.tsx     [ ] System config

app/login/page.tsx        [ ] Add role-based redirect

components/
├── dashboard-sidebar.tsx [ ] Add admin link
└── client-sidebar.tsx    [ ] Add admin link
```

---

## 🔥 Start Here - First 3 Steps

### Step 1: Review Scheduling Logic (1 hour)

**Create:** `/lib/review-schedule.ts`

```bash
# Key functions:
- getNextReviewDue(startDate, completedReviews)
- getReviewSchedule(startDate)
- formatReviewType(type)
- getReviewStatus(milestone)

# Logic:
- Month 1: startDate + 30 days
- Month 3: startDate + 90 days
- Month 5: startDate + 150 days
- Recurring 6M: lastReview + 180 days
```

**Test:**
```typescript
const startDate = new Date('2024-12-01')
const reviews = [] // No reviews yet
const next = getNextReviewDue(startDate, reviews)
// Should return: Month 1, due 2024-12-31
```

---

### Step 2: Assignments API (4 hours)

**Create:** 
- `/app/api/admin/assignments/route.ts`
- `/app/api/admin/assignments/[id]/route.ts`

```typescript
// Key features:
- GET: List assignments with filters
- POST: Create assignment, validate uniqueness
- PUT: Update assignment
- DELETE: Soft delete (isActive = false)
- Include: user, profile, client, manager, reviews
- Calculate: nextReviewDue for each assignment
```

**Test:**
```bash
curl http://localhost:3000/api/admin/assignments
# Should return: Empty array (no assignments yet)

# After creating staff/client:
curl -X POST http://localhost:3000/api/admin/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "staff-uuid",
    "clientId": "client-uuid",
    "managerId": "manager-uuid",
    "role": "Customer Support",
    "startDate": "2024-12-01",
    "rate": 8.50
  }'
# Should return: New assignment with review schedule
```

---

### Step 3: Reviews API (3 hours)

**Create:**
- `/app/api/admin/reviews/route.ts`
- `/app/api/admin/reviews/send/route.ts`
- `/app/api/admin/reviews/[id]/route.ts`

```typescript
// Key features:
- GET: List reviews + calculate overdue
- POST send: Trigger review request email
- GET [id]: View full review with answers
- Combine: Submitted reviews + virtual overdue reviews
```

**Test:**
```bash
curl http://localhost:3000/api/admin/reviews
# Should return: List of reviews + calculated overdue

curl -X POST http://localhost:3000/api/admin/reviews/send \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "assignment-uuid",
    "reviewType": "MONTH_1"
  }'
# Should return: Success + log email sent
```

---

## 🛠️ Development Tips

### Database Queries
```typescript
// Always include relations you need
const assignments = await prisma.staffAssignment.findMany({
  include: {
    user: { include: { profile: true, reviewsReceived: true } },
    client: true,
    manager: true,
  }
})

// Use where filters for performance
where: { isActive: true }
where: { role: { in: ['STAFF', 'TEAM_LEAD', 'MANAGER'] } }
```

### Authentication
```typescript
// Server components
import { auth } from "@/lib/auth"
const session = await auth()
if (session.user.role !== "ADMIN") {
  return new Response("Unauthorized", { status: 403 })
}

// Client components
"use client"
import { useSession } from "next-auth/react"
const { data: session } = useSession()
```

### Error Handling
```typescript
try {
  const result = await prisma.staffAssignment.create({ data })
  return Response.json(result)
} catch (error) {
  console.error("Error creating assignment:", error)
  return Response.json(
    { error: "Failed to create assignment" }, 
    { status: 500 }
  )
}
```

---

## 📚 Key Database Models

```typescript
// StaffAssignment (MOST IMPORTANT)
{
  id: string
  userId: string              // Staff member
  clientId: string            // Client organization
  managerId: string           // Client user (manager)
  role: string                // "Customer Support Specialist"
  startDate: DateTime         // 🔥 CRITICAL for review scheduling
  endDate: DateTime?
  rate: Decimal
  isActive: boolean
}

// Review
{
  id: string
  userId: string              // Staff being reviewed
  type: ReviewType            // MONTH_1, MONTH_3, MONTH_5, RECURRING_6M
  status: ReviewStatus        // PENDING, ACKNOWLEDGED, ARCHIVED
  client: string              // Client company name
  reviewer: string            // Client user name
  reviewerTitle: string
  submittedDate: DateTime
  evaluationPeriod: string    // "December 2024"
  overallScore: Decimal       // Calculated from answers
  previousScore: Decimal?
  answers: JSON               // Question/answer pairs
  acknowledgedDate: DateTime?
}
```

---

## ⚡ Quick Commands

```bash
# Start dev server
cd "gamified-dashboard (1)"
pnpm dev

# Check database
pnpm prisma studio

# Run migrations (if schema changes)
pnpm prisma migrate dev

# Generate Prisma client (after schema changes)
pnpm prisma generate

# Check TypeScript errors
pnpm tsc --noEmit
```

---

## 🎯 Success Milestones

**Milestone 1: Critical Path Works** (Day 1-2)
- ✓ Review scheduling logic functional
- ✓ Can create assignments via API
- ✓ Review due dates calculate correctly
- ✓ Assignments page shows real data

**Milestone 2: Full Admin CRUD** (Day 3)
- ✓ Can manage staff, clients, client users
- ✓ Dashboard shows real statistics
- ✓ All core pages connected to database

**Milestone 3: Review System Complete** (Day 4)
- ✓ Can send review requests
- ✓ Clients can submit reviews
- ✓ Reviews visible in admin + staff portals

**Milestone 4: Production Ready** (Day 5-6)
- ✓ All tests passing
- ✓ Navigation seamless
- ✓ Documentation updated

---

## 🚨 Common Issues & Solutions

### Issue: "Prisma Client not found"
```bash
pnpm prisma generate
```

### Issue: "Cannot connect to database"
```bash
# Check .env file has DATABASE_URL
cat .env | grep DATABASE_URL
```

### Issue: "Type errors in API routes"
```bash
# Make sure Prisma client is generated
pnpm prisma generate

# Restart TypeScript server in IDE
```

### Issue: "Review due dates wrong"
```typescript
// Check timezone issues
const startDate = new Date(assignment.startDate)
// Always use consistent timezone calculations
```

---

## 📞 Need Help?

- Check `ADMIN-PORTAL-IMPLEMENTATION-ROADMAP.md` for detailed specs
- Check `ADMIN-PORTAL-INTEGRATION-PLAN.md` for original design
- Check `lib/review-templates.ts` for review questions
- Check `prisma/schema.prisma` for database structure

---

**Ready to start? Begin with Step 1!** 🚀

**Next Action:** Create `/lib/review-schedule.ts`

---

**Last Updated:** October 13, 2025

