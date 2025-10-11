# 🖥️ Electron Performance Tracking - Implementation Guide

## 📊 Overview

This guide covers the complete Electron-based performance tracking system that monitors staff activity in real-time and syncs data to the backend.

---

## ✅ What's Been Implemented

### **1. Core Tracking Services**

#### **Performance Tracker** (`electron/services/performanceTracker.js`)
- ✅ Mouse movement and click tracking
- ✅ Keyboard keystroke counting (no content captured)
- ✅ Idle time detection (5 min threshold)
- ✅ Active time calculation
- ✅ Screen time tracking
- ✅ Clipboard action counting
- ✅ Application usage tracking
- ✅ Productivity score calculation
- ✅ System power state monitoring (sleep/wake/lock)

#### **Sync Service** (`electron/services/syncService.js`)
- ✅ Automatic sync to API every 5 minutes
- ✅ Authenticated requests with session token
- ✅ Retry logic with exponential backoff
- ✅ Offline queue management
- ✅ Force sync capability

#### **Break Handler** (`electron/services/breakHandler.js`)
- ✅ Pause tracking during breaks
- ✅ Resume tracking after breaks
- ✅ IPC communication with renderer
- ✅ Break status monitoring

### **2. Electron Main Process** (`electron/main.js`)
- ✅ System tray integration
- ✅ Background operation (hide to tray)
- ✅ IPC handlers for all tracking operations
- ✅ Real-time metrics updates (every 5 seconds)
- ✅ Service initialization and lifecycle management

### **3. Preload Script** (`electron/preload.js`)
- ✅ Secure IPC bridge between main and renderer
- ✅ Performance tracking APIs exposed
- ✅ Sync service APIs exposed
- ✅ Break notification APIs exposed
- ✅ Safe contextBridge implementation

### **4. Frontend Components**

#### **Tracking Consent** (`components/tracking-consent.tsx`)
- ✅ First-time consent dialog
- ✅ Privacy information display
- ✅ What data is tracked explanation
- ✅ Accept/Decline options
- ✅ LocalStorage persistence

#### **Tracking Status** (`components/tracking-status.tsx`)
- ✅ Live tracking indicator
- ✅ Sync status display
- ✅ Pause/Resume button
- ✅ Last sync time display
- ✅ Fixed bottom-right position

#### **Performance Dashboard** (`components/performance-dashboard.tsx`)
- ✅ Real-time metrics display
- ✅ Live updates from Electron (5 sec intervals)
- ✅ Force sync button
- ✅ Live tracking badge
- ✅ Fallback to API data (web mode)

#### **Breaks Tracking** (`components/breaks-tracking.tsx`)
- ✅ Electron break start notifications
- ✅ Electron break end notifications
- ✅ Automatic tracking pause/resume

#### **Electron Provider** (`components/electron-provider.tsx`)
- ✅ Electron detection
- ✅ Session token extraction
- ✅ Sync service initialization
- ✅ Consent management
- ✅ Global tracking status

### **5. Configuration & Utilities**

#### **Tracker Config** (`electron/config/trackerConfig.js`)
- ✅ Tracking intervals (5 sec)
- ✅ Sync intervals (5 min)
- ✅ Idle threshold (5 min)
- ✅ Privacy settings
- ✅ Retry configuration

#### **Permissions Manager** (`electron/utils/permissions.js`)
- ✅ macOS accessibility permission checks
- ✅ Platform-specific instructions
- ✅ Permission status reporting

---

## 🚀 Installation & Setup

### **Step 1: Install Dependencies**

```bash
cd "/Users/stephenatcheler/Desktop/Electron - Staff/gamified-dashboard (1)"

# Install all dependencies
pnpm install

# Note: Some optional dependencies may fail on certain platforms
# This is expected - the app will work with fallback methods
```

### **Step 2: Approve Build Scripts (pnpm security)**

```bash
# Approve electron and related packages
pnpm approve-builds electron electron-builder
```

### **Step 3: Start Development**

**Terminal 1** - Start Next.js dev server:
```bash
pnpm dev
```

**Terminal 2** - Start Electron app:
```bash
pnpm electron
```

---

## 🎯 How It Works

### **Data Flow**

```
User Activity
    ↓
Performance Tracker (every 5 sec)
    ↓
Local Metrics Buffer
    ↓
Sync Service (every 5 min)
    ↓
POST /api/performance
    ↓
Database (performance_metrics table)
    ↓
Frontend Dashboard (real-time display)
```

### **Metrics Tracked**

| Metric | Description | Privacy |
|--------|-------------|---------|
| **Mouse Movements** | Count of mouse position changes | No coordinates stored |
| **Mouse Clicks** | Total click count | No click targets stored |
| **Keystrokes** | Total key presses | No content captured |
| **Active Time** | Time when user is active | Minutes only |
| **Idle Time** | Time when user is idle (>5 min) | Minutes only |
| **Screen Time** | Total time computer is on | Minutes only |
| **Clipboard Actions** | Copy/paste count | No content captured |
| **Applications Used** | App names only | Array of strings |
| **Tabs Switched** | Window focus changes | Count only |
| **Productivity Score** | Calculated 0-100 score | Based on activity |

### **Productivity Score Calculation**

```javascript
Score = (Active Time % × 40) + (Keystrokes Score × 30) + (Mouse Score × 30)

Where:
- Active Time % = activeTime / (activeTime + idleTime)
- Keystrokes Score = min(keystrokes / 5000, 1) × 100
- Mouse Score = min(clicks / 1000, 1) × 100
```

---

## 🎨 User Interface

### **System Tray Menu**
- **Show Dashboard** - Opens main window
- **Start Break** - Triggers break selector
- **View Performance** - Opens performance page
- **Tracking Status** - Shows if active/paused
- **Pause/Resume Tracking** - Toggle tracking
- **Quit** - Exit application

### **Tracking Status Widget**
Fixed bottom-right corner shows:
- 🟢 Tracking indicator (pulsing when active)
- 🟡 Paused indicator (when paused)
- 📶 Sync status (syncing/synced/offline)
- ⏸️ Pause/Resume button
- 🕒 Last sync time

### **Performance Dashboard Enhancements**
- 🔴 "Live Tracking" badge (only in Electron)
- 🔄 "Sync Now" button (force immediate sync)
- 📊 Real-time metrics updates (every 5 sec)
- 📈 Live productivity score

### **Consent Dialog**
First-time setup shows:
- What data is tracked
- Privacy protections
- Accept/Decline options
- Can be revoked in settings

---

## 🔐 Privacy & Security

### **What We DON'T Track**
- ❌ Keystroke content (what you type)
- ❌ Mouse coordinates (where you click)
- ❌ Screenshots (no visual capture)
- ❌ File contents
- ❌ URLs visited (system-wide)
- ❌ Chat messages or passwords
- ❌ Personal data

### **What We DO Track**
- ✅ Activity counts (how much, not what)
- ✅ Time measurements
- ✅ Application names
- ✅ Productivity metrics

### **Security Features**
- 🔒 Context isolation enabled
- 🔒 Node integration disabled
- 🔒 Secure IPC communication
- 🔒 Session token encryption
- 🔒 User consent required
- 🔒 Can pause anytime

---

## 📱 System Requirements

### **Minimum Requirements**
- **OS**: macOS 10.14+, Windows 10+, or Linux
- **RAM**: 2GB minimum
- **Node**: 18+ or 20+
- **pnpm**: 8+

### **Recommended**
- **RAM**: 4GB+
- **Storage**: 500MB free space
- **Internet**: Stable connection for sync

### **Platform-Specific**

**macOS:**
- Accessibility permissions required
- Go to: System Preferences → Security & Privacy → Accessibility
- Add and enable the app

**Windows:**
- Run as Administrator (recommended)
- Windows Defender may prompt - allow access

**Linux:**
- X11 or Wayland display server
- May need to install libxtst-dev: `sudo apt install libxtst-dev`

---

## 🛠️ Configuration

### **Adjust Tracking Intervals**

Edit `electron/config/trackerConfig.js`:

```javascript
module.exports = {
  TRACKING_INTERVAL: 5000, // Collect metrics every 5 sec (default)
  SYNC_INTERVAL: 300000,   // Sync to API every 5 min (default)
  IDLE_THRESHOLD: 300,     // Idle after 5 min (default)
  
  // Change to your needs:
  // TRACKING_INTERVAL: 10000,  // 10 seconds
  // SYNC_INTERVAL: 600000,     // 10 minutes
  // IDLE_THRESHOLD: 600,       // 10 minutes
}
```

### **Disable Specific Tracking**

```javascript
module.exports = {
  TRACK_MOUSE: true,
  TRACK_KEYBOARD: true,
  TRACK_CLIPBOARD: false,  // Disable clipboard tracking
  TRACK_APPLICATIONS: true,
  TRACK_IDLE_TIME: true,
}
```

---

## 🐛 Troubleshooting

### **Issue: Dependencies Failed to Install**

**Solution:**
```bash
# Some optional dependencies may fail - this is OK
# The app uses fallback methods

# If electron fails specifically:
rm -rf node_modules
pnpm approve-builds electron electron-builder
pnpm install
```

### **Issue: No Metrics Being Tracked**

**Symptoms:**
- Dashboard shows 0 for all metrics
- Tracking status says "Inactive"

**Solutions:**
1. Check if tracking consent was given
2. Verify Electron is running: `ps aux | grep electron`
3. Check console for errors: Electron → View → Toggle Developer Tools
4. On macOS, check Accessibility permissions

### **Issue: Sync Not Working**

**Symptoms:**
- Last sync time not updating
- Sync status shows "Offline"

**Solutions:**
1. Check Next.js dev server is running (`pnpm dev`)
2. Verify API is accessible: `curl http://localhost:3000/api/performance`
3. Check if logged in (session token required)
4. Look for errors in Electron console

### **Issue: Break Tracking Not Pausing Performance**

**Solution:**
1. Ensure break was started through the app (not just closed window)
2. Check Electron console for IPC errors
3. Verify `breakHandler` is initialized in main.js

### **Issue: High CPU Usage**

**Solution:**
1. Increase tracking interval in config (from 5s to 10s)
2. Disable optional tracking features
3. Check for errors in console (may be in loop)

---

## 📊 API Integration

### **POST /api/performance**

Syncs metrics to database:

```javascript
// Request body
{
  mouseMovements: 1234,
  mouseClicks: 567,
  keystrokes: 8901,
  activeTime: 45, // minutes
  idleTime: 15,   // minutes
  screenTime: 60, // minutes
  downloads: 0,
  uploads: 0,
  bandwidth: 0,
  clipboardActions: 12,
  filesAccessed: 0,
  urlsVisited: 0,
  tabsSwitched: 23,
  productivityScore: 78
}

// Response
{
  success: true,
  metric: { id: "...", userId: "...", ...data }
}
```

### **GET /api/performance**

Fetches historical metrics:

```javascript
// Response
{
  metrics: [ ...last 7 days ],
  today: { ...today's metrics }
}
```

---

## 🎯 Next Steps

### **Immediate (Already Implemented)**
- ✅ Real-time tracking
- ✅ API sync
- ✅ System tray
- ✅ Break integration
- ✅ Consent dialog

### **Future Enhancements (Optional)**
- 📸 Screenshot capture (with explicit consent)
- 📱 Application time tracking (time spent per app)
- 🌐 URL tracking (in Electron window only)
- 📊 Advanced productivity reports
- 📧 Email notifications for milestones
- 🎮 Gamification achievements
- 📈 Manager dashboard views
- 🔔 Break reminders

---

## 🧪 Testing

### **Manual Testing Checklist**

```
□ Start Electron app
□ Accept tracking consent
□ Verify tracking status shows "Active"
□ Use computer normally for 5 minutes
□ Check performance dashboard shows live metrics
□ Verify metrics are increasing
□ Click "Sync Now" button
□ Check database for new record
□ Start a break
□ Verify tracking pauses
□ End break
□ Verify tracking resumes
□ Close window (should hide to tray)
□ Click tray icon → Show Dashboard
□ Click "Pause Tracking"
□ Verify metrics stop increasing
□ Click "Resume Tracking"
□ Quit app properly
```

### **Database Verification**

```sql
-- Check today's metrics
SELECT * FROM performance_metrics 
WHERE "userId" = 'YOUR_USER_ID' 
AND DATE(date) = CURRENT_DATE 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

---

## 📞 Support

### **Common Commands**

```bash
# Start dev environment
pnpm dev                 # Terminal 1: Next.js
pnpm electron           # Terminal 2: Electron

# View database
pnpm prisma studio

# Check logs
tail -f ~/.config/Electron/logs/main.log  # Linux/Mac
# Or check Electron console

# Reset tracking data
DELETE FROM performance_metrics WHERE "userId" = 'YOUR_USER_ID';
```

### **Environment Variables**

```env
NODE_ENV=development      # Use development mode
DEBUG=true               # Enable verbose logging
```

---

## 🎉 Success Criteria

The implementation is complete when:

1. ✅ Electron app starts without errors
2. ✅ System tray appears with menu
3. ✅ Tracking consent dialog appears (first time)
4. ✅ Performance tracking starts automatically
5. ✅ Metrics sync to API every 5 minutes
6. ✅ Performance dashboard shows live updates
7. ✅ Breaks pause/resume tracking correctly
8. ✅ Data persists to database
9. ✅ App runs in background (system tray)
10. ✅ No privacy violations

---

**✨ The Electron performance tracking system is now fully operational!**

For questions or issues, check the troubleshooting section or review the implementation files.

