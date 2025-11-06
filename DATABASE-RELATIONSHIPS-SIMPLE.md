# 🗺️ Database Relationships - Simple Guide

## The Big Picture

Think of it like this: **Work Schedule is the KING** → Everything follows its rules.

---

## 📅 The Main Players

### 1. **WORK_SCHEDULES** (The Boss)
**What it stores:**
- What day Kevin works (Monday, Tuesday, etc.)
- What time his shift starts (2:00 PM)
- What time his shift ends (1:00 AM)
- His timezone (Asia/Manila)

**Example:**
```
dayOfWeek: "Wednesday"
startTime: "2:00 PM"
endTime: "1:00 AM"
timezone: "Asia/Manila"
```

---

### 2. **TIME_ENTRIES** (The Clock-In Record)
**What it stores:**
- The SHIFT DATE (which day this shift belongs to)
- When Kevin actually clocked in
- Was he late? How late?
- When he clocks out

**Example:**
```
date: 2025-11-06 00:00:00  ← SHIFT DATE (midnight)
clockIn: 2025-11-06 14:26:00  ← ACTUAL TIME (2:26 PM)
clockOut: null
wasLate: true
lateBy: 26 minutes
```

**🔥 The `date` field is THE KING field!**

---

### 3. **PERFORMANCE_METRICS** (Kevin's Activity)
**What it stores:**
- Keystrokes
- Mouse clicks
- Active time
- Idle time
- The SHIFT DATE it belongs to

**Example:**
```
date: 2025-11-06 00:00:00  ← MUST MATCH time_entries.date
keystrokes: 1250
mouseClicks: 340
activeTime: 45 minutes
idleTime: 12 minutes
```

---

### 4. **BREAKS** (Coffee, Lunch, etc.)
**What it stores:**
- What time entry (shift) it belongs to
- Type of break (LUNCH, COFFEE, AWAY)
- When it started
- When it ended

**Example:**
```
timeEntryId: "xyz789..."  ← Links to today's time_entry
type: "LUNCH"
actualStart: 2025-11-06 17:00:00
actualEnd: 2025-11-06 17:30:00
```

---

## 🔗 How They Connect

```
        STAFF_PROFILES
             |
             | timezone: "Asia/Manila"
             |
             ↓
      WORK_SCHEDULES
      (Wednesday, 2:00 PM - 1:00 AM)
             |
             | Kevin clicks "Clock In" at 2:26 PM
             |
             ↓
       TIME_ENTRIES
       (date: 2025-11-06 00:00:00)
       (clockIn: 2025-11-06 14:26:00)
             |
             |
        ┌────┴────┐
        ↓         ↓
     BREAKS   PERFORMANCE_METRICS
   (linked)  (date: 2025-11-06 00:00:00)
```

---

## 📊 Visual Example - Kevin's Wednesday Shift

### The Setup
```
┌─────────────────────────────────┐
│     WORK_SCHEDULES              │
│  dayOfWeek: Wednesday           │
│  startTime: 2:00 PM             │
│  endTime: 1:00 AM               │
│  timezone: Asia/Manila          │
└─────────────────────────────────┘
```

### Kevin Clocks In Late (2:26 PM)
```
┌─────────────────────────────────┐
│      TIME_ENTRIES               │
│  date: Nov 6, 2025 00:00:00     │ ← Midnight of shift day
│  clockIn: Nov 6, 2025 14:26:00  │ ← Actual time (2:26 PM)
│  wasLate: true                  │
│  lateBy: 26 minutes             │
│  clockOut: null                 │ ← Still working
└─────────────────────────────────┘
```

### Kevin Types & Clicks (Electron Tracks)
```
┌─────────────────────────────────┐
│   PERFORMANCE_METRICS           │
│  date: Nov 6, 2025 00:00:00     │ ← SAME as time_entries.date
│  keystrokes: 1250               │
│  mouseClicks: 340               │
│  activeTime: 45 min             │
│  idleTime: 12 min               │
└─────────────────────────────────┘
```

### Kevin Takes Lunch Break
```
┌─────────────────────────────────┐
│         BREAKS                  │
│  timeEntryId: "xyz789..."       │ ← Links to time_entries
│  type: LUNCH                    │
│  actualStart: 5:00 PM           │
│  actualEnd: 5:30 PM             │
└─────────────────────────────────┘
```

---

## 🎯 The Magic Field: `date`

### In `time_entries`:
- `date` = **The day the shift was scheduled for** (at midnight)
- This is calculated using the work schedule + timezone

### In `performance_metrics`:
- `date` = **MUST MATCH `time_entries.date`**
- This ensures all activity for the shift goes to ONE record

---

## 🔍 How to Check It's Working

Run this SQL in Supabase:

```sql
SELECT 
  te.date as shift_date,
  te."clockIn" as actual_clock_in_time,
  pm.date as metrics_date,
  pm.keystrokes,
  pm."mouseClicks",
  COUNT(b.id) as total_breaks,
  CASE 
    WHEN te.date = pm.date THEN '✅ CORRECT' 
    ELSE '❌ BROKEN' 
  END as status
FROM time_entries te
LEFT JOIN performance_metrics pm 
  ON pm."staffUserId" = te."staffUserId" 
  AND pm.date = te.date
LEFT JOIN breaks b 
  ON b."timeEntryId" = te.id
WHERE te."staffUserId" = (
  SELECT id FROM staff_users WHERE email = 'kevinlmacabanti@gmail.com'
)
AND te.date >= CURRENT_DATE
GROUP BY te.date, te."clockIn", pm.date, pm.keystrokes, pm."mouseClicks";
```

### ✅ Good Result:
```
shift_date:       2025-11-06 00:00:00
actual_clock_in:  2025-11-06 14:26:00
metrics_date:     2025-11-06 00:00:00
status:           ✅ CORRECT
```

### ❌ Bad Result:
```
shift_date:       2025-11-06 00:00:00
metrics_date:     2025-11-06 06:00:00  ← Different!
status:           ❌ BROKEN
```

---

## 💡 Why This Matters

### Without Shift Date Logic (OLD WAY - BROKEN):
```
Kevin works 2 PM - 1 AM (crosses midnight)

11:00 PM → Creates record for Nov 6
12:01 AM → Creates NEW record for Nov 7  ← WRONG!

Result: 2 records for 1 shift! ❌
```

### With Shift Date Logic (NEW WAY - CORRECT):
```
Kevin works 2 PM - 1 AM (crosses midnight)

2:00 PM  → Creates record for Nov 6 (shift date)
11:00 PM → Updates Nov 6 record
12:01 AM → Updates Nov 6 record (still same shift!)

Result: 1 record for 1 shift! ✅
```

---

## 🚀 The Flow (Step by Step)

### Step 1: Kevin Clicks "Clock In"
- Time: 2:26 PM Manila time
- Server looks up work_schedules
- Finds: Wednesday schedule starts at 2:00 PM

### Step 2: Calculate Shift Date
- Today (Manila): Wednesday Nov 6, 2025
- Shift date: **Nov 6, 2025 00:00:00** (midnight)
- Kevin is **26 minutes late**

### Step 3: Create `time_entries`
```
date: 2025-11-06 00:00:00  ← SHIFT DATE
clockIn: 2025-11-06 14:26:00
wasLate: true
lateBy: 26
```

### Step 4: Kevin Types & Clicks
- Electron tracks: keystrokes, clicks, active time

### Step 5: Electron Syncs (Every 10 Seconds)
- Sends data to `/api/analytics`
- API finds active `time_entries` record
- Gets `date: 2025-11-06 00:00:00`

### Step 6: Create or Update `performance_metrics`
- **First sync**: Creates record with `date: 2025-11-06 00:00:00`
- **Later syncs**: Updates SAME record
- **Result**: ONE record per shift! ✅

---

## 🎓 Simple Rules

1. **Work Schedule = KING** → It defines the shift date
2. **Shift Date = Midnight** → Always 00:00:00 of the scheduled day
3. **ONE `time_entries` per shift** → Identified by `date`
4. **ONE `performance_metrics` per shift** → Matches `time_entries.date`
5. **ALL `breaks` link to that shift** → Via `timeEntryId`

---

## 🆘 Troubleshooting

### Problem: Multiple `performance_metrics` records for same day
**Cause:** API not finding existing record (date mismatch)
**Fix:** Check `time_entries.date` matches `performance_metrics.date`

### Problem: Late modal showing repeatedly
**Cause:** Not marking as acknowledged in localStorage
**Fix:** Click "Acknowledge" → Should save to localStorage

### Problem: Wrong shift date
**Cause:** Staff timezone not being used
**Fix:** Check `staff_profiles.timezone` is set to "Asia/Manila"

---

## 📝 Summary

```
WORK_SCHEDULES (defines the shift)
    ↓
TIME_ENTRIES (records clock-in with shift date)
    ↓
    ├─→ BREAKS (links to time entry)
    └─→ PERFORMANCE_METRICS (matches shift date)
```

**The `date` field is the magic glue that holds it all together!**

