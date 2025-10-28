# Analytics Metrics Reference - Staff Portal

## Data Sources for Performance Metrics

### 🔍 How Data is Tracked

All metrics are tracked by the **Electron App** running on the staff member's computer using:
- **uiohook-napi** - For keyboard and mouse input tracking
- **active-win** - For application and browser tracking
- **clipboardy** - For clipboard/screenshot tracking
- **@paulcbetts/system-idle-time** - For idle detection
- **Electron Power Monitor API** - For screen state tracking

---

## Metrics Breakdown

### 1. **Mouse Movements** (`mouseMovements`)
- **Source:** uiohook `mousemove` events from `electron/activity-tracker.js`
- **Throttling:** Every 100ms to prevent overwhelming the system
- **Referenced in:** `app/api/analytics/route.ts` (lines 73, 96)
- **Computation:** Incremented by 1 each time the mouse moves (throttled)
- **Tracking:** Real-time via Activity Tracker → Performance Tracker → API

### 2. **Mouse Clicks** (`mouseClicks`)
- **Source:** uiohook `click` events from `electron/activity-tracker.js`
- **Referenced in:** `app/api/analytics/route.ts` (lines 74, 97)
- **Computation:** Incremented by 1 on click events (mousedown/mouseup don't count to avoid double-counting)
- **Tracking:** Real-time via Activity Tracker → Performance Tracker → API

### 3. **Keystrokes** (`keystrokes`)
- **Source:** uiohook `keydown` events from `electron/activity-tracker.js`
- **Referenced in:** `app/api/analytics/route.ts` (lines 75, 98)
- **Computation:** Incremented by 1 on keyboard key presses
- **Tracking:** Real-time via Activity Tracker → Performance Tracker → API

### 4. **Active Time** (`activeTime`)
- **Source:** Calculated in `electron/services/performanceTracker.js` (line 202)
- **Referenced in:** `app/api/analytics/route.ts` (lines 76, 99)
- **Computation:** 
  - Time accumulated when user is NOT idle
  - Updated every `TRACKING_INTERVAL` (typically 5-10 seconds)
  - Formula: `activeTime += timeSinceLastUpdate` (if not idle)
- **Units:** Stored in **minutes** in database, converted to **seconds** in API response
- **Tracking:** Periodically accumulated time when system idle time < IDLE_THRESHOLD

### 5. **Idle Time** (`idleTime`)
- **Source:** Added when inactivity dialog appears (30+ seconds no activity)
- **Referenced in:** `app/api/analytics/route.ts` (lines 77, 100)
- **Computation:**
  - Tracked via Activity Tracker when inactivity detected (line 217-227 in `activity-tracker.js`)
  - Added when user triggers inactivity dialog (30 seconds threshold)
- **Units:** Stored in **minutes** in database, converted to **seconds** in API response
- **Tracking:** Idle duration recorded when Activity Tracker detects inactivity

### 6. **Screen Time** (`screenTime`)
- **Source:** Total time tracked regardless of active/idle state
- **Referenced in:** `app/api/analytics/route.ts` (lines 78, 101)
- **Computation:** Incremented every tracking interval (typically 5-10 seconds)
- **Formula:** `screenTime += timeSinceLastUpdate`
- **Tracking:** Accumulated continuously during tracking session

### 7. **Screenshots** (`clipboardActions`)
- **Source:** Screenshot uploads via `electron/services/screenshotService.js` → `/api/screenshots`
- **Referenced in:** 
  - `app/api/analytics/route.ts` (lines 82, 105)
  - `app/api/screenshots/route.ts` (line 122)
- **Computation:** Incremented by 1 each time a screenshot is uploaded
- **Database:** Stored in `clipboardActions` field, also stores screenshot URLs in `screenshoturls` JSON field
- **Tracking:** Screenshot service captures screens periodically → uploads to API → increments counter

### 8. **Active Applications** (`applicationsUsed`)
- **Source:** `active-win` package via `electron/services/performanceTracker.js`
- **Referenced in:** `app/api/analytics/route.ts` (lines 88, 111)
- **Computation:** 
  - Array of unique application names that have been used
  - Tracked every 2 seconds (line 337 in `performanceTracker.js`)
  - Added to set when application switches (line 314)
- **Database:** Stored as JSON array in `applicationsused` field
- **Tracking:** Monitors active window owner name changes

### 9. **Browser Activity** (`visitedUrls` and `urlsVisited`)
- **Source:** Extracted from browser window titles via `active-win`
- **Referenced in:** `app/api/analytics/route.ts` (lines 89, 112)
- **Computation:**
  - **Count (`urlsVisited`):** Total number of unique URLs visited
  - **Details (`visitedUrls`):** Array of actual URLs visited
  - Tracked when browser is active (Chrome, Edge, Firefox, Brave)
  - Extracts URL from window title (line 345-450 in `performanceTracker.js`)
- **Database:** 
  - `urlsVisited` stores the count (Int)
  - `visitedurls` stores the array (JSON)
- **Tracking:** Detects browser windows → extracts URL from title → stores unique URLs

### 10. **Tabs Switched** (`tabsSwitched`)
- **Source:** Application tracking via `active-win`
- **Referenced in:** `app/api/analytics/route.ts` (lines 85, 108)
- **Computation:** Incremented when application switches (line 312 in `performanceTracker.js`)
- **Tracking:** Every 2 seconds checks if active app changed

### 11. **Productivity Score** (`productivityScore`)
- **Source:** Calculated dynamically
- **Referenced in:** 
  - `app/api/analytics/route.ts` (lines 86, 109)
  - `components/performance-dashboard.tsx` (lines 38, 58-68)
- **Computation:** 
  - **If provided:** Uses the value from database
  - **If not provided:** Calculates as `(activeTime / (activeTime + idleTime)) * 100`
- **Formula:** `activePercent = (activeTime / totalTime) * 100`
- **Tracking:** Calculated in real-time or retrieved from database

---

## Data Flow

```
Electron App
├── Activity Tracker (uiohook)
│   ├── Mouse Events → mouseMovements, mouseClicks
│   ├── Keyboard Events → keystrokes
│   └── Inactivity Detection → idleTime
│
├── Performance Tracker
│   ├── Active Time Calculation → activeTime
│   ├── Screen Time → screenTime
│   ├── Clipboard Monitoring → clipboardActions
│   └── Application Tracking → applicationsUsed, tabsSwitched
│
├── Screenshot Service
│   └── Screenshot Uploads → clipboardActions
│
└── Browser Detection (active-win)
    └── URL Extraction → urlsVisited, visitedUrls

API Route: /api/analytics
└── Returns: All metrics stored in performance_metrics table

Dashboard Component: /app/analytics/page.tsx
└── Displays: Productivity score, active time, idle time, status
```

---

## Key Files

- **Tracking:** `electron/activity-tracker.js`, `electron/services/performanceTracker.js`
- **Screenshots:** `electron/services/screenshotService.js`, `app/api/screenshots/route.ts`
- **API:** `app/api/analytics/route.ts`
- **Dashboard:** `components/performance-dashboard.tsx`
- **Schema:** `prisma/schema.prisma` (line 309-333)

---

## Unit Conversions

⚠️ **Important:** The API converts time values:
- **Stored in DB:** Minutes (whole numbers)
- **Returned by API:** Seconds (multiplied by 60)
- **Displayed on Dashboard:** Minutes (divided by 60 for display)

Example: 60 minutes in DB → 3600 seconds in API → displayed as "60m" on dashboard

