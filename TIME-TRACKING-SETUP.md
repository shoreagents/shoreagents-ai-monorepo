# ⏰ Time Tracking Setup Guide

## 📋 Overview
The Time Tracking system allows staff to clock in/out to track their actual work hours, separate from scheduled shift times and break tracking.

---

## 🗄️ Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Create time_entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
  id TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "clockIn" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "clockOut" TIMESTAMP WITHOUT TIME ZONE NULL,
  "totalHours" DECIMAL(5, 2) NULL,
  notes TEXT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  
  CONSTRAINT time_entries_userId_fkey 
    FOREIGN KEY ("userId") 
    REFERENCES public.users (id) 
    ON UPDATE CASCADE 
    ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS time_entries_userId_idx ON public.time_entries ("userId");
CREATE INDEX IF NOT EXISTS time_entries_clockIn_idx ON public.time_entries ("clockIn");
CREATE INDEX IF NOT EXISTS time_entries_clockOut_idx ON public.time_entries ("clockOut");

-- Row Level Security (optional, but recommended)
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own time entries
CREATE POLICY "Users can view own time entries" ON public.time_entries
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- Policy: Users can only insert their own time entries
CREATE POLICY "Users can insert own time entries" ON public.time_entries
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- Policy: Users can only update their own time entries
CREATE POLICY "Users can update own time entries" ON public.time_entries
  FOR UPDATE
  USING (auth.uid()::text = "userId");
```

**Note:** If you're using NextAuth (not Supabase Auth), the RLS policies won't apply since `auth.uid()` won't be available. The API routes handle user authentication via NextAuth sessions, so RLS is optional but provides an extra layer of security.

---

## 🎯 Features

### Clock In/Out
- **Big Button UI** - Easy to use, clearly shows current status
- **Prevents Double Clock-in** - Can't clock in if already clocked in
- **Validates Clock Out** - Can't clock out if not clocked in
- **Auto-calculates Hours** - Total hours calculated when clocking out

### Current Session Timer
- **Real-time Display** - Shows HH:MM:SS while clocked in
- **Updates Every Second** - Live counter
- **Shows Start Time** - Displays when you clocked in

### Statistics
- **Today's Hours** - Total hours worked today
- **This Week** - Last 7 days total
- **This Month** - Last 30 days total
- **Auto-updates** - Recalculates after each clock in/out

### History
- **Complete Log** - All past time entries
- **Detailed View** - Clock in/out times, total hours
- **Active Indicator** - Shows if currently clocked in
- **Date Grouping** - Today, Yesterday, specific dates

---

## 📊 How It Works

### Clock In Flow
1. User clicks "Clock In" button
2. API checks if already clocked in
3. Creates new `TimeEntry` with current timestamp
4. Status updates to "Clocked In"
5. Timer starts counting

### Clock Out Flow
1. User clicks "Clock Out" button
2. API finds active time entry
3. Records clock out time
4. Calculates total hours (rounded to 2 decimals)
5. Updates the entry
6. Timer resets
7. Statistics refresh

### Calculation
```typescript
totalHours = (clockOut - clockIn) / (1000 * 60 * 60)
// Rounded to 2 decimal places
```

---

## 🎨 UI Components

### Main Button
- **Green** - Clock In (with LogIn icon)
- **Red** - Clock Out (with LogOut icon)
- **Size** - Large (h-20) for easy tapping
- **Status Indicator** - Pulsing green dot when clocked in

### Statistics Cards
- Today (Calendar icon, Indigo)
- This Week (TrendingUp icon, Emerald)
- This Month (Clock icon, Purple)

### History List
- Date displayed (Today, Yesterday, or specific date)
- Time range (start - end)
- Total hours in bold
- Active entries show pulsing indicator

---

## 🔌 API Endpoints

### GET `/api/time-tracking`
Fetch all time entries for logged-in user.

**Response:**
```json
{
  "timeEntries": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "clockIn": "2025-10-11T09:00:00Z",
      "clockOut": "2025-10-11T17:30:00Z",
      "totalHours": 8.5,
      "createdAt": "2025-10-11T09:00:00Z"
    }
  ]
}
```

### POST `/api/time-tracking/clock-in`
Clock in the user.

**Response:**
```json
{
  "success": true,
  "timeEntry": {
    "id": "uuid",
    "userId": "user-uuid",
    "clockIn": "2025-10-11T09:00:00Z",
    "clockOut": null,
    "totalHours": null
  }
}
```

**Errors:**
- 400: "You are already clocked in"
- 401: "Unauthorized"

### POST `/api/time-tracking/clock-out`
Clock out the user.

**Response:**
```json
{
  "success": true,
  "timeEntry": {
    "id": "uuid",
    "userId": "user-uuid",
    "clockIn": "2025-10-11T09:00:00Z",
    "clockOut": "2025-10-11T17:30:00Z",
    "totalHours": 8.5
  }
}
```

**Errors:**
- 400: "You are not currently clocked in"
- 401: "Unauthorized"

### GET `/api/time-tracking/status`
Check if user is currently clocked in.

**Response:**
```json
{
  "isClockedIn": true,
  "activeEntry": {
    "id": "uuid",
    "clockIn": "2025-10-11T09:00:00Z",
    "clockOut": null
  }
}
```

---

## 📍 Navigation

Time Tracking is accessible from the sidebar under **My Profile**:

```
Dashboard
My Profile
→ Time Tracking ⏰  <-- NEW
Tasks
Breaks
...
```

---

## 🚀 Usage

### For Staff
1. **Start Your Day:** Click "Clock In" when you start work
2. **Monitor Time:** Watch the live timer
3. **Take Breaks:** Breaks are tracked separately
4. **End Your Day:** Click "Clock Out" when you finish
5. **Review History:** Check your time entries anytime

### Stats Update
- **Today** - Resets at midnight
- **This Week** - Rolling 7-day window
- **This Month** - Rolling 30-day window

---

## 🔮 Future Enhancements

### Phase 2
- **Comparison with Scheduled Hours** - See if you're over/under
- **Weekly Reports** - Email summaries
- **Overtime Tracking** - Highlight extra hours
- **Notes Field** - Add notes to entries (UI pending)

### Phase 3
- **Geofencing** - Only clock in from office
- **Face Verification** - Photo on clock in
- **Integration with Payroll** - Auto-export for accounting
- **Manager Dashboard** - View team clock in/out times
- **Calendar View** - Visual timeline of work hours

---

## 🔐 Security

### Authentication
- NextAuth session required
- Users can only see/modify their own entries
- Session validation on every API call

### Data Integrity
- Foreign key constraint to User table
- Prevents orphaned entries
- Cascade delete if user is removed

### Validation
- Can't clock in twice
- Can't clock out without clocking in
- Total hours calculated server-side (tamper-proof)

---

## 📦 Files Created/Modified

### New Files
- `prisma/schema.prisma` - Added `TimeEntry` model
- `app/api/time-tracking/route.ts` - Main API
- `app/api/time-tracking/clock-in/route.ts` - Clock in endpoint
- `app/api/time-tracking/clock-out/route.ts` - Clock out endpoint
- `app/api/time-tracking/status/route.ts` - Status check endpoint
- `components/time-tracking.tsx` - Main UI component
- `app/time-tracking/page.tsx` - Page route

### Modified Files
- `components/sidebar.tsx` - Added Time Tracking nav item

---

## 🧪 Testing Checklist

- [ ] Clock in successfully
- [ ] Can't clock in twice
- [ ] Timer shows correct elapsed time
- [ ] Clock out successfully
- [ ] Total hours calculated correctly
- [ ] Can't clock out without clocking in
- [ ] Statistics update after clock in/out
- [ ] History shows all entries
- [ ] Active entry shows pulsing indicator
- [ ] Mobile responsive
- [ ] Sidebar navigation works

---

## 🎉 Ready to Use!

After running the SQL commands above, restart your dev server and you're good to go!

**Navigation:** Sidebar → Time Tracking

---

**Last Updated:** October 11, 2025  
**Status:** Ready for Testing  
**Next:** Management analytics and reporting

