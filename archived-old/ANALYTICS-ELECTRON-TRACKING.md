# 🎯 ANALYTICS & ELECTRON TRACKING - COMPLETE BREAKDOWN

## 📊 **WHAT WE'RE TRACKING (October 29, 2025)**

### **The Goal:**
Track staff productivity in real-time through desktop activity monitoring. Proves to clients that staff is working. Provides data for payroll, performance reviews, and gamification.

---

## 🗄️ **DATABASE SCHEMA: `performance_metrics` TABLE**

```sql
model performance_metrics {
  id                String      @id
  staffUserId       String
  date              DateTime    @default(now())
  
  -- INPUT TRACKING (Electron uiohook-napi)
  mouseMovements    Int         @default(0)  -- # of mouse moves
  mouseClicks       Int         @default(0)  -- # of clicks
  keystrokes        Int         @default(0)  -- # of keys pressed
  
  -- TIME TRACKING (Electron)
  activeTime        Int         @default(0)  -- Minutes (converted to seconds in API)
  idleTime          Int         @default(0)  -- Minutes (converted to seconds in API)
  screenTime        Int         @default(0)  -- Total minutes on screen
  
  -- ACTIVITY TRACKING (Electron)
  applicationsused  Json?       @default("[]")  -- Array of app names
  urlsVisited       Int         @default(0)  -- Count of URLs
  visitedurls       Json?       @default("[]")  -- Array of URLs
  tabsSwitched      Int         @default(0)  -- Browser tab switches
  
  -- FILE & NETWORK (Currently unused - future features)
  downloads         Int         @default(0)
  uploads           Int         @default(0)
  bandwidth         Int         @default(0)
  filesAccessed     Int         @default(0)
  clipboardActions  Int         @default(0)
  
  -- SCREENSHOTS (Managed separately, NOT by Electron sync)
  screenshoturls    Json?       @default("[]")  -- Screenshot URLs from service
  
  -- SCORE
  productivityScore Int         @default(0)  -- Calculated score
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime
  staff_users       staff_users @relation(fields: [staffUserId], references: [id], onDelete: Cascade)
}
```

---

## 🖥️ **UI DISPLAY (http://localhost:3000/analytics)**

### **What the UI Expects:**

#### **1. Real-Time Input Tracking (Top Row):**
```typescript
interface PerformanceMetric {
  mouseMovements: number     // Display: "1,234" (with commas)
  mouseClicks: number        // Display: "567" (with commas)
  keystrokes: number         // Display: "3,456" (with commas)
  idleTime: number          // Display: "0h 5m 30s" (formatted time)
}
```

**UI Cards:**
- 🔵 **Mouse Movements** - Blue gradient card
- 🟣 **Mouse Clicks** - Purple gradient card
- 🟢 **Keystrokes** - Green gradient card
- 🟡 **Idle Time** - Amber gradient card

---

#### **2. Activity Summary (Second Row):**
```typescript
interface PerformanceMetric {
  activeTime: number         // Display: "7h 45m 12s" (formatted)
  applicationsUsed: string[] // Display: Count (e.g., "5")
  urlsVisited: number        // Display: "12" (with commas)
  screenshotCount: number    // Display: "8" (from clipboardActions)
}
```

**UI Cards:**
- 🟢 **Active Time** - Shows productive time
- 🔵 **Apps Used** - Count of unique applications
- 🟣 **URLs Visited** - Count of visited URLs
- 🟡 **Screenshots Today** - Total screenshots captured

---

#### **3. Detailed Panels (Bottom):**

**Active Applications Panel:**
- Shows list of applications used (from `applicationsused` JSON)
- Example: "Google Chrome", "Visual Studio Code", "Slack"

**Browser Activity Panel:**
- Shows list of visited URLs (from `visitedurls` JSON)
- Example: "https://github.com", "http://localhost:3000"

**Weekly Performance:**
- Last 7 days of metrics
- Shows date, active time, keystrokes, and productivity score per day

---

## ⚡ **ELECTRON TRACKING (Real-Time)**

### **What Electron SHOULD Track:**

#### **1. Input Events (uiohook-napi):**
```typescript
// TRACKED EVENTS:
- KEYDOWN       → Increments keystrokes
- CLICK         → Increments mouseClicks  
- MOUSEMOVE     → Increments mouseMovements (throttled)

// FILTERED OUT (not counted):
- KEYUP         → Redundant
- MOUSEUP       → Redundant
- MOUSEDOWN     → Redundant
- WHEEL         → Redundant
```

**How It Works:**
- Electron runs `uiohook-napi` to capture ALL system input events
- Events are filtered to avoid double-counting
- Counters increment in real-time
- Data is stored in-memory and synced to database periodically

---

#### **2. Time Tracking:**
```typescript
activeTime: number    // Time with mouse/keyboard activity
idleTime: number      // Time with no activity (threshold: 60 seconds)
screenTime: number    // Total time application is running
```

**How It Works:**
- Tracks last activity timestamp
- If no activity for 60 seconds → Start idle timer
- When activity resumes → Stop idle timer, start active timer
- All times stored in **minutes** in database, converted to **seconds** in API

---

#### **3. Application Tracking:**
```typescript
applicationsUsed: string[]  // Array of unique app names

// Example:
[
  "Google Chrome",
  "Visual Studio Code",
  "Slack Desktop",
  "Microsoft Excel"
]
```

**How It Works:**
- Electron detects active window title/process name
- Adds unique applications to array
- Deduplicates (same app not added twice)

---

#### **4. URL Tracking (Browser URLs):**
```typescript
urlsVisited: number        // Count of URLs
visitedUrls: string[]      // Array of URLs

// Example visitedUrls:
[
  "page:https://github.com/user/repo",
  "page:http://localhost:3000/analytics",
  "page:https://mail.google.com"
]
```

**How It Works:**
- Electron tracks browser window titles
- Extracts URLs from Chrome/Firefox/Edge titles
- Stores with "page:" prefix
- UI strips prefix for display

---

## 🔄 **DATA FLOW**

### **1. Electron → Database Sync:**
```
Electron App (Desktop)
    ↓
Captures events via uiohook-napi
    ↓
Stores in-memory counters
    ↓
Syncs to API every X minutes
    ↓
POST /api/analytics
    ↓
Creates or Updates `performance_metrics` record
    ↓
Emits WebSocket event (real-time updates)
```

---

### **2. UI → Display Flow:**
```
http://localhost:3000/analytics
    ↓
Fetches: GET /api/analytics
    ↓
Returns: { metrics: [], today: {...}, totalScreenshots: N }
    ↓
UI displays real-time or cached data
    ↓
If Electron running:
    → Shows "Live Tracking" badge
    → Uses live data from Electron IPC
    → Falls back to API data if Electron unavailable
```

---

## 🎯 **PRODUCTIVITY SCORE CALCULATION**

```typescript
calculateProductivityScore(metric: PerformanceMetric) {
  // 1. Active Time Percentage
  const totalTime = metric.activeTime + metric.idleTime
  const activePercent = totalTime > 0 ? (metric.activeTime / totalTime) * 100 : 0
  
  // 2. Keystroke Score (max 100%)
  const keystrokesScore = Math.min((metric.keystrokes / 5000) * 100, 100)
  
  // 3. Click Score (max 100%)
  const clicksScore = Math.min((metric.mouseClicks / 1000) * 100, 100)
  
  // 4. Average of all three
  return Math.round((activePercent + keystrokesScore + clicksScore) / 3)
}
```

**Score Breakdown:**
- **0-30%**: Low productivity (mostly idle, low activity)
- **31-60%**: Moderate productivity (some activity, some idle)
- **61-80%**: Good productivity (consistent activity)
- **81-100%**: Excellent productivity (high activity, minimal idle)

---

## 🛠️ **API ENDPOINTS**

### **GET /api/analytics**
**Returns:**
```json
{
  "metrics": [
    {
      "id": "...",
      "date": "2025-10-29T00:00:00.000Z",
      "mouseMovements": 1234,
      "mouseClicks": 567,
      "keystrokes": 3456,
      "activeTime": 27000,  // Seconds (was 450 minutes in DB)
      "idleTime": 1800,     // Seconds (was 30 minutes in DB)
      "screenshotCount": 8,
      "applicationsUsed": ["Chrome", "VS Code"],
      "visitedUrls": ["page:https://github.com"],
      "urlsVisited": 12,
      "productivityScore": 75
    }
  ],
  "today": { /* Same structure as metrics[0] */ },
  "totalScreenshots": 24
}
```

---

### **POST /api/analytics**
**Accepts:**
```json
{
  "mouseMovements": 1234,
  "mouseClicks": 567,
  "keystrokes": 3456,
  "activeTime": 450,        // MINUTES (API converts to seconds)
  "idleTime": 30,           // MINUTES (API converts to seconds)
  "screenTime": 480,        // MINUTES
  "downloads": 0,
  "uploads": 0,
  "bandwidth": 0,
  "clipboardActions": 0,    // PROTECTED - never overwritten by sync
  "filesAccessed": 0,
  "urlsVisited": 12,
  "tabsSwitched": 5,
  "productivityScore": 75,
  "applicationsUsed": ["Chrome", "VS Code"],
  "visitedUrls": ["page:https://github.com"]
}
```

**Behavior:**
- If today's metric exists → **UPDATES** the record
- If today's metric doesn't exist → **CREATES** new record
- `clipboardActions` is **NEVER** overwritten (managed by screenshot service)

---

## 🐛 **DEBUG FEATURES (UI)**

### **Debug Panel (Electron Only):**
- Shows live event stream from `uiohook-napi`
- Filters out redundant events (KEYUP, MOUSEUP, etc.)
- Color-coded:
  - 🟢 Green: Keyboard events
  - 🟣 Purple: Click events
  - 🔵 Blue: Mouse move events

**How to Enable:**
- Click "Show Debug" button (only visible in Electron)
- Monitors: `window.electron.activityTracker.onActivityDebug()`
- Shows last 50 events with timestamps

---

## 🚨 **WHAT WE NEED TO TEST**

### **1. ✅ Schema is Correct:**
- Table exists: `performance_metrics` ✅
- All fields match UI expectations ✅

### **2. ⏭️ Electron is Tracking (NEED TO TEST):**
- [ ] **Mouse movements** are being captured
- [ ] **Mouse clicks** are being captured
- [ ] **Keystrokes** are being captured
- [ ] **Active time** is being calculated
- [ ] **Idle time** is being calculated
- [ ] **Applications** are being detected
- [ ] **URLs** are being tracked from browser windows

### **3. ⏭️ Data is Syncing (NEED TO TEST):**
- [ ] Electron calls `POST /api/analytics` periodically
- [ ] Today's metric is created/updated correctly
- [ ] Data persists in database
- [ ] UI shows real-time updates

### **4. ⏭️ UI is Displaying Correctly (NEED TO TEST):**
- [ ] All cards show correct data
- [ ] Productivity score calculates correctly
- [ ] Applications list displays
- [ ] URLs list displays
- [ ] Weekly performance shows historical data

---

## 📋 **CURRENT UNKNOWNS (Need Research)**

1. **Is Electron app running?**
   - User is testing on Mac
   - Need to verify Electron app is built and running

2. **Is uiohook-napi working?**
   - Native addon for input tracking
   - May have issues on Mac (permissions, Accessibility)

3. **Is sync service running?**
   - Need to check if periodic sync to API is working
   - Check console logs for sync errors

4. **Are there test records?**
   - Check database for any `performance_metrics` records for Vanessa
   - If none exist, Electron hasn't synced yet

---

## 🎯 **NEXT STEPS**

1. **Check if Electron app is running**
2. **Open Debug panel on `/analytics`** (click "Show Debug")
3. **Generate activity** (type, click, move mouse)
4. **Watch for events** in debug panel
5. **Check database** for `performance_metrics` records
6. **Verify sync** is working (Force Sync button)

---

**Status:** ✅ Schema documented, ⏭️ Need to test Electron tracking

