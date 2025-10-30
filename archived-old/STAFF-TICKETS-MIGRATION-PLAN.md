# 🎯 STAFF TICKETS MIGRATION PLAN

**Date:** October 29, 2025  
**Goal:** Separate staff tickets into `staff_tickets` table, remove all client/admin shit, make it clean & simple

---

## 📋 **CURRENT MESS:**

One `tickets` table trying to do 3 things:
- Staff support tickets (PC broke, need nurse)
- Client relationship tickets (billing, staff performance)
- Admin internal tickets (???)

**Result:** Clusterfuck. Hard to read. Probably broken.

---

## 🎯 **NEW DESIGN:**

### **`staff_tickets` Table (SIMPLE!)**

```prisma
model staff_tickets {
  id              String   @id @default(uuid())
  ticketId        String   @unique  // TKT-0001
  
  // WHO
  staffUserId     String
  staff_users     staff_users @relation(fields: [staffUserId], references: [id])
  
  // WHAT
  title           String
  description     String
  category        StaffTicketCategory
  priority        TicketPriority @default(MEDIUM)
  
  // WHERE (Auto-assigned to department)
  assignedTo      String?  // managementUserId
  department      Department?  // Auto-calculated from category
  management_users management_users? @relation(fields: [assignedTo], references: [id])
  
  // STATUS
  status          TicketStatus @default(OPEN)
  resolvedDate    DateTime?
  
  // ATTACHMENTS & META
  attachments     String[] @default([])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // RESPONSES (thread)
  responses       staff_ticket_responses[]
}

model staff_ticket_responses {
  id              String @id @default(uuid())
  ticketId        String
  ticket          staff_tickets @relation(fields: [ticketId], references: [id])
  
  // WHO responded (staff OR management)
  staffUserId     String?
  managementUserId String?
  staff_users     staff_users? @relation(fields: [staffUserId], references: [id])
  management_users management_users? @relation(fields: [managementUserId], references: [id])
  
  // MESSAGE
  message         String
  attachments     String[] @default([])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum StaffTicketCategory {
  IT
  HR
  EQUIPMENT
  CLINIC
  MEETING_ROOM
  MANAGEMENT
  OTHER
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

---

## 🗂️ **FILE STRUCTURE (CLEAN!)**

### **KEEP & CLEAN (Staff Only):**
```
app/tickets/
├── page.tsx (Staff portal - CLEAN THIS!)

app/api/staff-tickets/
├── route.ts (GET staff tickets, POST new ticket)
├── attachments/
│   └── route.ts (Upload images)
└── [ticketId]/
    ├── responses/
    │   └── route.ts (Add response to ticket)
    └── status/
        └── route.ts (Admin updates status)

components/staff-tickets/
├── ticket-card.tsx (Single ticket card)
├── ticket-kanban.tsx (Board view)
├── ticket-list.tsx (List view)
├── ticket-detail-modal.tsx (Full ticket + responses)
├── create-ticket-modal.tsx (NEW: Clean create form)
└── ticket-skeleton.tsx (Loading states)

lib/
├── staff-ticket-categories.ts (7 categories)
└── category-department-map.ts (IT → IT_DEPARTMENT, etc.)
```

### **ARCHIVE (Move to `_old/` folder):**
```
_old/tickets/
├── app/
│   ├── client/tickets/
│   └── admin/tickets/
├── api/
│   ├── client/tickets/
│   └── admin/tickets/
└── components/
    ├── tickets/client-ticket-card.tsx
    ├── tickets/ticket-kanban-light.tsx
    └── tickets/ticket-list-light.tsx
```

---

## 🔧 **MIGRATION STEPS:**

### **Step 1: Backup Old Code** ✅
```bash
mkdir -p _old/tickets/{app,api,components}
mv app/client/tickets _old/tickets/app/
mv app/admin/tickets _old/tickets/app/
mv app/api/client/tickets _old/tickets/api/
mv app/api/admin/tickets _old/tickets/api/
mv components/tickets/*light* _old/tickets/components/
mv components/tickets/client-* _old/tickets/components/
```

### **Step 2: Update Prisma Schema** ✅
```prisma
// RENAME tickets → staff_tickets
// REMOVE clientUserId, createdByType
// SIMPLIFY to staff-only fields
// ADD department field (auto-calculated)
```

### **Step 3: Update API Routes** ✅
```
/api/tickets → /api/staff-tickets
- Remove all client logic
- Simplify to staff-only
- Keep auto-assignment to department managers
```

### **Step 4: Update Components** ✅
```
components/tickets/ → components/staff-tickets/
- Remove createdByType badges
- Remove client-related UI
- Simplify to staff use case only
```

### **Step 5: Update Staff Portal** ✅
```
app/tickets/page.tsx
- Use staff-only categories (7)
- Use /api/staff-tickets
- Clean UI (no client stuff)
```

### **Step 6: Test Everything** ✅
```
1. Staff can create ticket (IT category)
2. Auto-assigns to IT Manager
3. Staff can add response
4. Manager can see ticket at /admin/staff-tickets
5. Manager can change status
6. Manager can respond
7. Staff sees updates in real-time
```

---

## 📊 **WHAT WE'RE REMOVING:**

### From Schema:
- ❌ `clientUserId` field
- ❌ `createdByType` field
- ❌ `client_users` relation
- ❌ Client ticket categories (8)
- ❌ Management ticket categories (16)

### From UI:
- ❌ Creator type badges (Staff/Client/Mgmt)
- ❌ Client category dropdowns
- ❌ Account manager assignment
- ❌ Tab navigation (All/Staff/Client/Internal)

### From API:
- ❌ `/api/client/tickets`
- ❌ `/api/admin/tickets`
- ❌ Client ticket logic
- ❌ Multi-tenant filtering

---

## ✅ **WHAT WE'RE KEEPING:**

### Core Features:
- ✅ Auto-assignment to department managers
- ✅ Category → Department mapping
- ✅ Kanban board + List view
- ✅ Image attachments (up to 5)
- ✅ Threaded responses
- ✅ Status changes (OPEN → IN_PROGRESS → RESOLVED)
- ✅ Priority levels (LOW, MEDIUM, HIGH, URGENT)
- ✅ Search & filter
- ✅ Real-time updates (WebSocket)

---

## 🎯 **RESULT:**

**BEFORE:**
- 1 table, 3 systems, 29 categories, 3 user types, messy AF

**AFTER:**
- 1 table (`staff_tickets`), 1 system, 7 categories, 2 user types (staff + management), CLEAN! ✨

---

## 📝 **NOTES:**

- Keep old code in `_old/` for reference
- Client tickets will be rebuilt separately later as `client_tickets`
- Admin tickets will be rebuilt separately as `admin_tickets`
- Tasks will be rebuilt separately as `staff_tasks`
- **ONE SYSTEM AT A TIME!**

---

**Status:** 🟡 READY TO EXECUTE

**Estimated Time:** 2-3 hours

**Risk:** Low (keeping old code as backup)

---

**Next:** Execute Step 1 (backup old code) when approved! 🚀

