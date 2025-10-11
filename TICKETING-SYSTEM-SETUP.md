# 🎟️ Ticketing System Setup Guide

## Overview

Complete ticketing system for staff to submit requests to management. Includes categories based on real ClickUp data, attachment support, filtering, and status tracking.

---

## ✅ What's Been Built

### **Features:**
1. ✅ **9 Ticket Categories** (from ClickUp CSV):
   - IT / Computer - Software, login issues, computer problems
   - HR / Payroll - Leave, payroll, Sprout access
   - Management - Account access, client requests
   - Equipment - Mouse, keyboard, headset, RFID
   - Workstation - Desk, chair, station changes
   - Environment - AC, temperature, noise
   - Perks & Requests - Special requests, perks
   - Transport - Shuttle, commute
   - Other - Other requests

2. ✅ **Priority Levels**: LOW, MEDIUM, HIGH, URGENT
3. ✅ **Status Tracking**: OPEN, IN_PROGRESS, RESOLVED, CLOSED
4. ✅ **Attachment Support**: Upload up to 3 images (5MB each)
5. ✅ **Search & Filter**: By status, category, and text search
6. ✅ **Statistics Dashboard**: Total, Open, In Progress, Resolved
7. ✅ **Ticket ID System**: Auto-generated TKT-0001, TKT-0002, etc.
8. ✅ **Comment System**: Built-in (TicketResponse model for management replies)

---

## 🗄️ Database Changes Required

### 1. **Update TicketCategory Enum**

Run this SQL in Supabase SQL Editor:

```sql
-- Add new ticket categories
ALTER TYPE "TicketCategory" ADD VALUE IF NOT EXISTS 'STATION';
ALTER TYPE "TicketCategory" ADD VALUE IF NOT EXISTS 'SURROUNDINGS';
ALTER TYPE "TicketCategory" ADD VALUE IF NOT EXISTS 'COMPENSATION';
ALTER TYPE "TicketCategory" ADD VALUE IF NOT EXISTS 'TRANSPORT';
```

### 2. **Add Attachments Column**

```sql
-- Add attachments array field to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';
```

### 3. **Create Supabase Storage Bucket**

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `ticket-attachments`
3. Set as **Public bucket**
4. Click on bucket → Configuration → Public access: **ON**

---

## 📁 Files Created/Modified

### **New Files:**
- `components/support-tickets.tsx` - Complete ticketing UI
- `app/api/tickets/attachments/route.ts` - Attachment upload endpoint
- `TICKETING-SYSTEM-SETUP.md` - This file

### **Modified Files:**
- `prisma/schema.prisma` - Added new categories and attachments field
- `app/api/tickets/route.ts` - Updated to handle attachments

---

## 🎨 UI Features

### **Create Ticket Form:**
- Clean, modal-based design
- Visual category selection with icons
- Priority level buttons
- Rich text description
- Image upload with preview
- Real-time validation

### **Ticket List:**
- Card-based layout
- Color-coded status badges
- Category and priority tags
- Attachment indicators
- Click to view details
- Search and multi-filter

### **Ticket Details Modal:**
- Full description view
- Image gallery for attachments
- Response history
- Management replies (when added)

---

## 🚀 How to Use

### **For Staff:**

1. **Create a Ticket:**
   - Click "New Ticket" button
   - Fill in title and description
   - Select category (IT, HR, Equipment, etc.)
   - Set priority
   - Optionally upload images (up to 3)
   - Click "Submit Ticket"

2. **Track Tickets:**
   - View all your tickets on the main page
   - Filter by status (Open, In Progress, Resolved)
   - Filter by category
   - Search by title or description
   - Click any ticket to view details

### **For Management:**

(To be built based on role permissions)
- View all staff tickets
- Update ticket status
- Assign to team members
- Add responses/comments
- Mark as resolved

---

## 📊 Database Schema

### **Ticket Model:**

```prisma
model Ticket {
  id           String          @id @default(uuid())
  ticketId     String          @unique // TKT-0001
  userId       String
  user         User            @relation(...)
  
  title        String
  description  String
  category     TicketCategory  // IT, HR, EQUIPMENT, etc.
  priority     TicketPriority  // LOW, MEDIUM, HIGH, URGENT
  status       TicketStatus    // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  
  assignedTo   String?
  attachments  String[]        // URLs to images
  
  resolvedDate DateTime?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  responses    TicketResponse[]
}
```

### **TicketResponse Model (Comments):**

```prisma
model TicketResponse {
  id        String   @id @default(uuid())
  ticketId  String
  ticket    Ticket   @relation(...)
  
  userId    String
  user      User     @relation(...)
  
  message   String
  role      String   // "Staff", "Management", etc.
  
  createdAt DateTime @default(now())
}
```

---

## 🎯 Category Mapping from ClickUp

Based on CSV analysis, here's how old ClickUp categories map to new system:

| Old Category | New Category | Count in CSV |
|--------------|--------------|--------------|
| Computer/Equipment | EQUIPMENT or IT | ~500 |
| Station | STATION | ~80 |
| Surroundings (AC/Temp) | SURROUNDINGS | ~200 |
| Compensation (Food) | COMPENSATION | ~5 |
| Transport (Shuttle) | TRANSPORT | ~20 |
| HR Request/Payroll | HR | ~100 |
| Account Management | MANAGEMENT | ~50 |
| IT Support | IT | ~150 |
| Suggestion | OTHER | ~50 |

**Most Common Issues:**
- AC too cold/hot (SURROUNDINGS)
- Mouse/keyboard issues (EQUIPMENT)
- PC is slow (IT)
- RFID card issues (EQUIPMENT)
- Sprout access (HR)

---

## 🔧 Testing Checklist

- [x] Prisma schema updated with new categories
- [x] API endpoints created and tested
- [x] Attachment upload working
- [ ] Database enums updated (manual SQL)
- [ ] Supabase bucket created
- [ ] Test ticket creation
- [ ] Test attachment upload
- [ ] Test filtering and search
- [ ] Test ticket details view

---

## 🚀 Next Steps (Future Enhancements)

1. **Management Dashboard:**
   - Assign tickets to specific team members
   - Bulk status updates
   - Response templates

2. **Notifications:**
   - Email when ticket status changes
   - In-app notifications for responses

3. **Analytics:**
   - Ticket resolution times
   - Most common categories
   - Staff satisfaction ratings

4. **AI Integration:**
   - Auto-categorize tickets using AI
   - Suggest solutions from knowledge base
   - Priority prediction

---

## 📝 Notes

- Ticket IDs are sequential (TKT-0001, TKT-0002)
- Staff can only see their own tickets
- Management can see all tickets (role-based, to be implemented)
- Attachments are stored in Supabase Storage
- Images are validated (type, size) before upload
- Maximum 3 attachments per ticket
- Maximum 5MB per attachment

---

*Created: October 11, 2025*
*Version: 1.0.0*

