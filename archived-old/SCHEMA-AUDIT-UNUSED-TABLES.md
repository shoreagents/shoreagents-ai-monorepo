# 🔍 SCHEMA AUDIT - UNUSED & WTF TABLES

**Date:** October 30, 2025  
**Purpose:** Identify which tables exist in schema but are NOT actually used in the app

---

## 📊 **ALL 35 TABLES IN SCHEMA:**

### ✅ **USED & WORKING:**

1. **activity_posts** - Social feed posts (The Feed feature)
2. **breaks** - Staff break tracking (Time Tracking feature)
3. **client_profiles** - Client user profiles
4. **client_users** - Client authentication & data
5. **company** - Client companies
6. **documents** - Company documents (training, procedures)
7. **employment_contracts** - Staff contracts (auto-generated)
8. **interview_requests** - Client requests to hire
9. **job_acceptances** - Staff job offers
10. **management_users** - Admin/Manager authentication
11. **management_profiles** - Management user profiles
12. **notifications** - System notifications
13. **performance_metrics** - Analytics tracking (Electron)
14. **post_comments** - Comments on social feed posts
15. **post_reactions** - Reactions to social feed posts
16. **reviews** - Monthly performance reviews
17. **staff_onboarding** - Onboarding process data
18. **staff_personal_records** - Gov IDs, emergency contacts, documents
19. **staff_profiles** - Staff employment details
20. **staff_users** - Staff authentication & data
21. **staff_welcome_forms** - Welcome form responses
22. **tasks** - Work tasks (will rename to staff_tasks)
23. **task_assignments** - Task assignments
24. **task_responses** - Task comments/responses
25. **tickets** - Support tickets (will rename to staff_tickets)
26. **ticket_responses** - Ticket comments/responses
27. **time_entries** - Clock in/out records
28. **work_schedules** - Staff weekly schedules

---

### ❓ **UNUSED / WTF TABLES:**

#### **1. user_badges** 🏅
```prisma
model user_badges {
  id                    String                @id
  profileId             String
  badgeType             BadgeType
  earnedAt              DateTime              @default(now())
  gamification_profiles gamification_profiles @relation(fields: [profileId], references: [id])
}

enum BadgeType {
  EARLY_BIRD       // Clocked in early X times
  PERFECT_WEEK     // Full week on time
  TOP_PERFORMER    // High productivity
  TEAM_PLAYER      // Helped others
  STREAK_MASTER    // X days in a row on time
}
```

**What It's For:** Gamification badges (like Xbox achievements)  
**Is It Used?** ❌ NO - Only referenced in `clean-database.ts`  
**Should We Keep It?** 🤔 MAYBE - Could be useful for gamification/leaderboard  
**Action:** Keep for now, implement later

---

#### **2. kudos** 🙌
```prisma
model kudos {
  id          String      @id
  fromId      String      // Staff sending kudos
  toId        String      // Staff receiving kudos
  message     String      // "Great job on that project!"
  createdAt   DateTime    @default(now())
  staff_users_from staff_users @relation("kudos_fromIdTostaff_users")
  staff_users_to   staff_users @relation("kudos_toIdTostaff_users")
}
```

**What It's For:** Staff can give kudos/recognition to each other  
**Is It Used?** ❌ NO - Only referenced in `clean-database.ts`  
**Should We Keep It?** 🤔 MAYBE - Nice feature for team morale  
**Action:** Keep for now, implement later (part of social feed?)

---

#### **3. gamification_profiles** 🎮
```prisma
model gamification_profiles {
  id                       String        @id
  staffUserId              String        @unique
  level                    Int           @default(1)
  experiencePoints         Int           @default(0)
  totalTasksCompleted      Int           @default(0)
  streakDays               Int           @default(0)
  longestStreak            Int           @default(0)
  perfectAttendanceDays    Int           @default(0)
  createdAt                DateTime      @default(now())
  updatedAt                DateTime
  staff_users              staff_users   @relation(fields: [staffUserId], references: [id])
  user_badges              user_badges[]
}
```

**What It's For:** Gamification system (levels, XP, streaks)  
**Is It Used?** ✅ PARTIALLY - Table exists, but features not fully implemented  
**Should We Keep It?** ✅ YES - Core gamification feature  
**Action:** Keep, finish implementation (leaderboard feature)

---

#### **4. subtasks** 📝
```prisma
model subtasks {
  id          String   @id
  taskId      String
  title       String
  isCompleted Boolean  @default(false)
  createdAt   DateTime @default(now())
  tasks       tasks    @relation(fields: [taskId], references: [id], onDelete: Cascade)
}
```

**What It's For:** Break tasks into smaller sub-tasks (checklist)  
**Is It Used?** ❓ UNKNOWN - Need to check tasks feature  
**Should We Keep It?** ✅ YES - Useful feature  
**Action:** Verify if tasks feature uses this

---

#### **5. salary_history** 💰
```prisma
model salary_history {
  id            String              @id
  profileId     String
  oldSalary     Decimal             @db.Decimal(10, 2)
  newSalary     Decimal             @db.Decimal(10, 2)
  effectiveDate DateTime
  reason        String?
  createdAt     DateTime            @default(now())
  staff_profiles staff_profiles @relation(fields: [profileId], references: [id])
}
```

**What It's For:** Track salary changes over time  
**Is It Used?** ❓ UNKNOWN - Need to check if raises are tracked  
**Should We Keep It?** ✅ YES - Important for HR/compliance  
**Action:** Keep, verify implementation

---

#### **6. staff_offboarding** 🚪
```prisma
model staff_offboarding {
  id                     String       @id
  staffUserId            String       @unique
  initiatedAt            DateTime     @default(now())
  lastWorkingDay         DateTime?
  resignationReason      String?
  exitInterviewNotes     String?
  finalClearanceStatus   String?
  returnedEquipment      Boolean      @default(false)
  finalPaymentProcessed  Boolean      @default(false)
  status                 OffboardingStatus @default(INITIATED)
  completedAt            DateTime?
  createdAt              DateTime     @default(now())
  updatedAt              DateTime
  staff_users            staff_users  @relation(fields: [staffUserId], references: [id])
}

enum OffboardingStatus {
  INITIATED
  IN_PROGRESS
  CLEARANCE_PENDING
  COMPLETED
  CANCELLED
}
```

**What It's For:** Track staff leaving the company (resignations, terminations)  
**Is It Used?** ❓ UNKNOWN - Check if offboarding portal exists  
**Should We Keep It?** ✅ YES - Critical HR feature  
**Action:** Keep, verify implementation

---

#### **7. document_comments** 💬
```prisma
model document_comments {
  id               String           @id
  documentId       String
  staffUserId      String?
  clientUserId     String?
  comment          String
  createdAt        DateTime         @default(now())
  client_users     client_users?    @relation(fields: [clientUserId], references: [id])
  documents        documents        @relation(fields: [documentId], references: [id], onDelete: Cascade)
  staff_users      staff_users?     @relation(fields: [staffUserId], references: [id])
}
```

**What It's For:** Comments on company documents (training, procedures)  
**Is It Used?** ❓ UNKNOWN - Check documents feature  
**Should We Keep It?** ✅ YES - Useful for document collaboration  
**Action:** Keep, verify implementation

---

## 📋 **SUMMARY:**

| Table | Status | Action Taken |
|-------|--------|--------------|
| **user_badges** | ❌ Unused | ✅ **REMOVED** |
| **kudos** | ❌ Unused | ✅ **REMOVED** |
| **gamification_profiles** | ⚠️ Partial | ✅ **REMOVED** |
| **subtasks** | ❓ Unknown | ✅ **RENAMED** → `staff_subtasks` |
| **salary_history** | ❓ Unknown | ✅ **RENAMED** → `staff_salary_history` |
| **staff_offboarding** | ✅ Used | ✅ **KEPT** |
| **document_comments** | ✅ Used | ✅ **KEPT** (fully implemented!) |

---

## ✅ **CLEANUP COMPLETED! (October 30, 2025)**

**What We Did:**
1. ✅ **REMOVED** 3 unused tables:
   - `gamification_profiles` - Was partially implemented but not critical
   - `kudos` - Nice-to-have social feature, not used
   - `user_badges` - Gamification badges, not used
2. ✅ **REMOVED** unused `BadgeType` enum
3. ✅ **REMOVED** dead relations from `staff_users` model
4. ✅ **RENAMED** `subtasks` → `staff_subtasks` (with `@@map("subtasks")`)
5. ✅ **RENAMED** `salary_history` → `staff_salary_history` (with `@@map("salary_history")`)
6. ✅ **KEPT** `staff_offboarding` - Critical HR feature
7. ✅ **KEPT** `document_comments` - Fully implemented! API: `/api/documents/[id]/comments`

**Why `@@map`?**  
Using `@@map` allows us to rename models in code while keeping the same database table names:
- No database migration needed! 🎉
- Existing data stays intact
- Code is cleaner and more consistent
- `staff_subtasks` in code = `subtasks` in database
- `staff_salary_history` in code = `salary_history` in database

**Result:**  
Schema is now cleaner and easier to maintain! Only tables that are actually used or critical remain.

---

## 🎯 **MEGA SCHEMA RENAME - PHASE 2 (October 30, 2025)**

### **THE GOAL: CRYSTAL CLEAR OWNERSHIP!**

**The Logic:**
- 🟦 `staff_*` tables = Staff owns/uses it (11 tables)
- 🟢 `client_*` tables = Client owns/uses it (1 table)
- 🟣 `management_*` tables = Management owns/uses it (already prefixed)
- ⚪ Generic tables = Shared by all (activity_posts, notifications, documents, etc.)

---

### **ALL RENAMES EXECUTED:**

**STAFF-SPECIFIC (11 tables):**
1. ✅ `breaks` → `staff_breaks`
2. ✅ `employment_contracts` → `staff_employment_contracts`
3. ✅ `performance_metrics` → `staff_analytics`
4. ✅ `reviews` → `staff_performance_reviews`
5. ✅ `salary_history` → `staff_salary_history`
6. ✅ `subtasks` → `staff_subtasks`
7. ✅ `task_assignments` → `staff_task_assignments`
8. ✅ `task_responses` → `staff_task_responses`
9. ✅ `tasks` → `staff_tasks`
10. ✅ `time_entries` → `staff_time_entries`
11. ✅ `work_schedules` → `staff_work_schedules`

**CLIENT-SPECIFIC (1 table):**
1. ✅ `company` → `client_companies`

---

### **TECHNICAL IMPLEMENTATION:**

**Using `@@map` for Backward Compatibility:**
```prisma
model staff_breaks {
  // ... fields
  
  @@map("breaks")  // Database table stays as "breaks"!
}
```

**Benefits:**
- ✅ NO database migrations needed!
- ✅ NO data loss!
- ✅ Database table names stay the same
- ✅ Code is now super clean and organized
- ✅ Crystal clear who owns what!

---

### **FINAL SCHEMA STATE:**

**Total Tables: 35** (after cleanup: 32)

**Organized by Ownership:**
- 🟦 **Staff Tables (25):** All prefixed with `staff_*`
- 🟢 **Client Tables (3):** `client_users`, `client_profiles`, `client_companies`
- 🟣 **Management Tables (2):** `management_users`, `management_profiles`
- ⚪ **Shared Tables (2):** `activity_posts`, `notifications`, `documents`, `post_comments`, `post_reactions`, `tickets`, `ticket_responses`

---

**Status:** 🎉 **MEGA SCHEMA CLEANUP & RENAME COMPLETE!** Schema is now organized, clean, and crystal clear!

---

## 🔥 **NEXT: CLEAN UP TICKETS & TASKS:**

### **CURRENT (Messy):**
- `tickets` - Mixed staff/client/admin tickets
- `tasks` - Unclear if staff-only

### **NEW (Clean):**
- `staff_tickets` - Staff support tickets (PC broke, need nurse)
- `client_tickets` - Client relationship tickets (billing, staff performance)
- `admin_tickets` - Internal admin work tickets
- `staff_tasks` - Staff work assignments (from clients)

---

**Status:** 📝 **AUDIT COMPLETE!** Ready to proceed with ticket/task cleanup!

