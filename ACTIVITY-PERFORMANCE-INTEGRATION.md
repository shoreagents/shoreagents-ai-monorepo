# Activity Tracker & Performance Tracker Integration

## 🔗 Overview

The **Activity Tracker** (`uiohook-napi`) is now fully integrated with the **Performance Tracker** to provide comprehensive mouse and keyboard event tracking with persistent storage.

---

## 🎯 What This Achieves

### Before Integration:
- ❌ Activity Tracker tracked events only for inactivity detection
- ❌ No persistent storage of keyboard/mouse events
- ❌ Data not available in performance metrics/dashboard

### After Integration:
- ✅ All keyboard and mouse events are stored in performance metrics
- ✅ Real-time counters for mouse movements, clicks, and keystrokes
- ✅ Data synced to backend via Sync Service
- ✅ Available in performance dashboard and analytics
- ✅ Still triggers inactivity dialog after 30 seconds

---

## 📊 How It Works

```
User Activity (Keyboard/Mouse)
         ↓
   uiohook-napi (Activity Tracker)
         ↓
   Activity Detection
         ↓
   ┌─────────────────────────┐
   │  1. Reset inactivity    │
   │     timer               │
   │                         │
   │  2. Update Performance  │
   │     Tracker metrics:    │
   │     - mouseMovements++  │
   │     - mouseClicks++     │
   │     - keystrokes++      │
   └─────────────────────────┘
         ↓
   Performance Tracker Storage
         ↓
   Sync Service → Backend API
         ↓
   Database Storage
         ↓
   Performance Dashboard
```

---

## 🔧 Technical Implementation

### Activity Tracker Updates

**File:** `electron/activity-tracker.js`

```javascript
class ActivityTracker {
  constructor() {
    // ...
    this.performanceTracker = null
    this.lastMouseTrack = 0
    this.mouseMovementThrottle = 100 // milliseconds
  }

  initialize(mainWindow, performanceTracker = null) {
    this.mainWindow = mainWindow
    this.performanceTracker = performanceTracker // Reference to performance tracker
    
    if (this.performanceTracker) {
      console.log('[ActivityTracker] Integrated with performance tracker')
    }
    
    this.startTracking()
  }

  onActivity(eventType = 'generic', eventData = null) {
    this.lastActivityTime = Date.now()
    
    // Update performance tracker metrics
    if (this.performanceTracker && !this.performanceTracker.isPaused) {
      this.updatePerformanceMetrics(eventType, eventData)
    }
    
    // Close inactivity dialog if shown
    if (this.dialogShown) {
      this.closeInactivityDialog()
    }
  }

  updatePerformanceMetrics(eventType, eventData) {
    const metrics = this.performanceTracker.metrics

    switch (eventType) {
      case 'mousemove':
        metrics.mouseMovements++
        break
      
      case 'click':
      case 'mousedown':
        metrics.mouseClicks++
        break
      
      case 'keydown':
        metrics.keystrokes++
        break
    }

    // Update last activity time in performance tracker
    this.performanceTracker.lastActivityTime = Date.now()
  }
}
```

### Event Handling

```javascript
// Mouse movement (throttled)
uIOhook.on('mousemove', (event) => {
  const now = Date.now()
  if (now - this.lastMouseTrack > this.mouseMovementThrottle) {
    this.onActivity('mousemove', event)
    this.lastMouseTrack = now
  }
})

// Mouse clicks
uIOhook.on('mousedown', (event) => this.onActivity('mousedown', event))
uIOhook.on('click', (event) => this.onActivity('click', event))

// Keyboard events
uIOhook.on('keydown', (event) => this.onActivity('keydown', event))
```

### Main Process Integration

**File:** `electron/main.js`

```javascript
async function initializeTracking() {
  // Start performance tracking first
  performanceTracker.start()
  
  // Initialize activity tracker WITH performance tracker reference
  activityTracker.initialize(mainWindow, performanceTracker)
  //                                      ^^^^^^^^^^^^^^^^^^^
  //                                      Integration point!
  
  // Start sync service
  syncService.start()
}
```

---

## 📈 Performance Metrics Updated

### Real-Time Metrics:

| Metric | Source | Description |
|--------|--------|-------------|
| **Mouse Movements** | `uiohook-napi` | Throttled (100ms) mouse position changes |
| **Mouse Clicks** | `uiohook-napi` | `mousedown` and `click` events |
| **Keystrokes** | `uiohook-napi` | `keydown` events (count only, no content) |
| **Last Activity Time** | `uiohook-napi` | Timestamp of last activity |
| **Active Time** | Performance Tracker | Calculated from activity |
| **Idle Time** | Performance Tracker | Calculated from inactivity |
| **Productivity Score** | Performance Tracker | Weighted calculation |

---

## 🔄 Data Flow

### 1. Event Capture
```javascript
User presses key
  ↓
uiohook-napi captures 'keydown'
  ↓
activityTracker.onActivity('keydown', event)
```

### 2. Metric Update
```javascript
activityTracker.onActivity('keydown')
  ↓
activityTracker.updatePerformanceMetrics('keydown')
  ↓
performanceTracker.metrics.keystrokes++
performanceTracker.lastActivityTime = Date.now()
```

### 3. Sync to Backend
```javascript
Every 5 minutes:
  ↓
syncService checks metrics
  ↓
POST /api/performance/metrics
  ↓
Database storage
```

### 4. Dashboard Display
```javascript
React Dashboard
  ↓
Fetches /api/performance/metrics
  ↓
Displays charts and stats
```

---

## 🎛️ Throttling & Optimization

### Mouse Movement Throttling
- **Threshold:** 100 milliseconds
- **Purpose:** Prevent overwhelming the system with too many events
- **Result:** ~10 mouse movement events per second maximum

```javascript
uIOhook.on('mousemove', (event) => {
  const now = Date.now()
  if (now - this.lastMouseTrack > this.mouseMovementThrottle) {
    this.onActivity('mousemove', event)
    this.lastMouseTrack = now
  }
})
```

### Event Categories
- **Counted Events:** `mousemove`, `mousedown`, `click`, `keydown`
- **Activity-Only Events:** `mouseup`, `keyup`, `wheel` (reset timer but don't increment counters)

---

## 📊 Productivity Score Calculation

The performance tracker calculates a productivity score (0-100) based on:

```javascript
// Active time percentage (40% weight)
activePercent = (activeTime / totalTime) * 40

// Keystroke activity (30% weight)
// Normalized: 5000 keystrokes = 100%
keystrokeScore = min((keystrokes / 5000) * 30, 30)

// Mouse activity (30% weight)
// Normalized: 1000 clicks = 100%
mouseScore = min((mouseClicks / 1000) * 30, 30)

// Total score
productivityScore = activePercent + keystrokeScore + mouseScore
```

---

## 🔍 Monitoring & Debugging

### Check Integration Status

```javascript
// In React component
const checkIntegration = async () => {
  const activityStatus = await window.electron.activityTracker.getStatus()
  const perfStatus = await window.electron.performance.getStatus()
  
  console.log('Activity Tracker:', activityStatus)
  console.log('Performance Tracker:', perfStatus)
}
```

### Console Logs
```bash
[ActivityTracker] Initializing...
[ActivityTracker] Integrated with performance tracker
[ActivityTracker] uIOhook started successfully
[PerformanceTracker] Starting performance tracking...
[ActivityTracker] Activity tracking started (integrated with performance tracker)
```

### View Metrics
```javascript
// Get current metrics via IPC
const metrics = await window.electron.performance.getCurrentMetrics()
console.log('Current Metrics:', metrics)
// {
//   mouseMovements: 1523,
//   mouseClicks: 87,
//   keystrokes: 2456,
//   activeTime: 42, // minutes
//   idleTime: 3,    // minutes
//   productivityScore: 78
// }
```

---

## 🚀 Benefits

### 1. **Comprehensive Tracking**
- All user activity is now captured and stored
- Single source of truth for activity metrics

### 2. **Persistent Storage**
- Metrics synced to backend every 5 minutes
- Historical data available for analytics

### 3. **Real-Time Updates**
- Instant metric updates on every activity
- No polling or manual refresh needed

### 4. **Dual Purpose**
- Inactivity detection (dialog after 30s)
- Performance tracking (continuous metrics)

### 5. **Accurate Productivity Scoring**
- Based on actual keyboard and mouse activity
- Weighted algorithm for fair assessment

---

## 🔐 Privacy & Security

### What is Tracked:
- ✅ **Count of keystrokes** (not the actual keys pressed)
- ✅ **Count of mouse movements** (throttled)
- ✅ **Count of mouse clicks**
- ✅ **Timestamps** of activity

### What is NOT Tracked:
- ❌ **Actual key content** (no keylogging)
- ❌ **Mouse coordinates** (no screen recording)
- ❌ **Clipboard content** (optional, can be disabled)
- ❌ **Screenshots**

---

## 📋 Configuration

### Activity Tracker Settings
```javascript
// Change inactivity timeout
await window.electron.activityTracker.setTimeout(60000) // 60 seconds

// Mouse movement throttle (edit activity-tracker.js)
this.mouseMovementThrottle = 200 // milliseconds
```

### Performance Tracker Settings
**File:** `electron/config/trackerConfig.js`

```javascript
module.exports = {
  TRACKING_INTERVAL: 10000,         // Update metrics every 10s
  IDLE_THRESHOLD: 60,               // 60 seconds idle threshold
  MOUSE_MOVEMENT_THROTTLE: 100,     // 100ms throttle
  TRACK_MOUSE: true,
  TRACK_KEYBOARD: true,
  TRACK_CLIPBOARD: false,           // Disable clipboard tracking
  TRACK_APPLICATIONS: true,
  DEBUG: true
}
```

---

## 📊 API Integration

### Metrics Endpoint

**POST** `/api/performance/metrics`

```json
{
  "mouseMovements": 1523,
  "mouseClicks": 87,
  "keystrokes": 2456,
  "activeTime": 42,
  "idleTime": 3,
  "screenTime": 45,
  "productivityScore": 78,
  "timestamp": "2025-10-13T12:34:56.789Z"
}
```

### Dashboard Display

```typescript
// React component
import { useEffect, useState } from 'react'

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    // Listen for real-time updates from Electron
    if (window.electron?.performance) {
      const unsubscribe = window.electron.performance.onMetricsUpdate((data) => {
        setMetrics(data.metrics)
      })

      return unsubscribe
    }
  }, [])

  return (
    <div>
      <h2>Today's Activity</h2>
      <p>Keystrokes: {metrics?.keystrokes || 0}</p>
      <p>Mouse Clicks: {metrics?.mouseClicks || 0}</p>
      <p>Mouse Movements: {metrics?.mouseMovements || 0}</p>
      <p>Productivity Score: {metrics?.productivityScore || 0}/100</p>
    </div>
  )
}
```

---

## 🎯 Use Cases

### 1. **Productivity Analytics**
- Track daily activity patterns
- Identify peak productivity hours
- Monitor workload distribution

### 2. **Time Tracking**
- Accurate active vs idle time
- Billable hours calculation
- Break time monitoring

### 3. **Performance Reviews**
- Objective productivity metrics
- Trend analysis over time
- Goal setting and tracking

### 4. **Idle Detection**
- Automatic break reminders
- Session management
- Security (auto-lock after inactivity)

---

## ✅ Status: FULLY INTEGRATED

All keyboard and mouse events from `uiohook-napi` are now:
- ✅ Stored in Performance Tracker metrics
- ✅ Synced to backend database
- ✅ Available in performance dashboard
- ✅ Used for inactivity detection
- ✅ Included in productivity scoring

**Ready for production use!**

---

## 📚 Related Documentation

- `ACTIVITY-TRACKER-GUIDE.md` - Activity tracker usage
- `ACTIVITY-TRACKER-SUMMARY.md` - Activity tracker features
- `electron/services/performanceTracker.js` - Performance tracker code
- `electron/activity-tracker.js` - Activity tracker code

---

**Last Updated:** October 13, 2025

