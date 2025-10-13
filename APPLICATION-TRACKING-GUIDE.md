# Application Tracking Guide

## How Active Application Detection Works

The system uses the **`active-win`** npm package to detect which application/window is currently active (focused) on your system.

---

## 🔍 **Detection Process:**

### **1. Polling Every 2 Seconds**
```javascript
setInterval(async () => {
  const window = await this.activeWin()
  // Process window info...
}, 2000) // Check every 2 seconds
```

### **2. Gets Window Information**
When you switch to an application, `active-win` returns:
```javascript
{
  title: "My Document.docx - Microsoft Word",
  owner: {
    name: "Microsoft Word",  // ← This is tracked!
    processId: 12345,
    bundleId: "com.microsoft.Word",
    path: "/Applications/Microsoft Word.app"
  },
  bounds: { x: 0, y: 0, width: 1920, height: 1080 }
}
```

### **3. Tracks Application Switches**
```javascript
if (appName !== this.currentApp) {
  this.currentApp = appName           // Update current app
  this.metrics.tabsSwitched++         // Increment switch counter
  this.activeApps.add(appName)        // Add to set of used apps
  this.metrics.applicationsUsed = Array.from(this.activeApps)
}
```

---

## 📊 **What Gets Tracked:**

### **Metrics Collected:**

1. **Current Active Application**
   - Which app you're currently using
   - Example: "Google Chrome", "Visual Studio Code", "Microsoft Word"

2. **Application Switch Count** (`tabsSwitched`)
   - How many times you switch between apps
   - Each time you click a different window = +1

3. **Applications Used** (`applicationsUsed`)
   - List of all unique apps used in the session
   - Example: `["Chrome", "VSCode", "Slack", "Word"]`

---

## 🖥️ **Platform Support:**

### **Windows:**
- ✅ **Fully Supported**
- Detects: Application name, process ID, window title
- Example: `"Google Chrome"`, `"Visual Studio Code"`, `"cmd.exe"`

### **macOS:**
- ✅ **Fully Supported**
- Detects: Application name, bundle ID, window title
- Example: `"Safari"`, `"com.apple.Safari"`, `"Terminal"`

### **Linux:**
- ⚠️ **Partial Support**
- Depends on display server (X11 vs Wayland)
- May require additional permissions

---

## 🔒 **Privacy & Permissions:**

### **What's Tracked:**
- ✅ Application name (e.g., "Chrome")
- ✅ Number of switches
- ✅ List of apps used

### **What's NOT Tracked:**
- ❌ Window content/text
- ❌ URLs or document names
- ❌ Screenshots
- ❌ Passwords or sensitive data
- ❌ Keystroke content (only counts)

### **Required Permissions:**

**Windows:**
- No special permissions needed

**macOS:**
- ⚠️ **Accessibility permissions required**
- Go to: System Preferences → Security & Privacy → Privacy → Accessibility
- Add and enable your Electron app

**Linux:**
- May need X11 window manager access

---

## 🎯 **Example Tracking Session:**

### **Timeline:**
```
10:00 AM - Open Chrome
         → Applications: ["Chrome"]
         → Tab Switches: 0

10:05 AM - Switch to VSCode
         → Applications: ["Chrome", "VSCode"]
         → Tab Switches: 1

10:10 AM - Switch back to Chrome
         → Applications: ["Chrome", "VSCode"]
         → Tab Switches: 2

10:15 AM - Open Slack
         → Applications: ["Chrome", "VSCode", "Slack"]
         → Tab Switches: 3

10:20 AM - Switch to Word
         → Applications: ["Chrome", "VSCode", "Slack", "Word"]
         → Tab Switches: 4
```

### **Final Metrics:**
```javascript
{
  applicationsUsed: [
    "Google Chrome",
    "Visual Studio Code", 
    "Slack",
    "Microsoft Word"
  ],
  tabsSwitched: 4
}
```

---

## 🛠️ **How to Check if It's Working:**

### **1. Check Console Logs:**
Open Electron console (F12) and look for:
```bash
[PerformanceTracker] Performance Tracker initialized
[PerformanceTracker] Optional dependency active-win not available: ...
# OR
[PerformanceTracker] Starting performance tracking...
```

If you see "not available", the package might not be installed properly.

### **2. Check Status:**
In Electron console, run:
```javascript
window.electron.performance.getStatus()
```

Look for:
```javascript
{
  hasActiveWin: true  // ← Should be true!
}
```

### **3. Test Application Switching:**
1. Open the app
2. Switch to another application (Chrome, Word, etc.)
3. Wait 2 seconds
4. Switch back
5. Check metrics - `tabsSwitched` should increment

---

## 📦 **Technical Details:**

### **Package Used:**
- **Name:** `active-win`
- **Version:** `^8.2.0`
- **Repository:** https://github.com/sindresorhus/active-win
- **Platform:** Cross-platform (Windows, macOS, Linux)

### **Implementation:**
```javascript
// File: electron/services/performanceTracker.js

// Load package (optional dependency)
this.activeWin = this.loadOptionalDependency('active-win')

// Start tracking if available
if (this.activeWin && config.TRACK_APPLICATIONS) {
  this.startApplicationTracking()
}

// Poll every 2 seconds
startApplicationTracking() {
  setInterval(async () => {
    if (this.isPaused) return

    try {
      const window = await this.activeWin()
      if (window && window.owner && window.owner.name) {
        const appName = window.owner.name
        
        if (appName !== this.currentApp) {
          this.currentApp = appName
          this.metrics.tabsSwitched++
          this.activeApps.add(appName)
          this.metrics.applicationsUsed = Array.from(this.activeApps)
        }
      }
    } catch (error) {
      // Silently ignore errors
    }
  }, 2000)
}
```

---

## ⚙️ **Configuration:**

### **Enable/Disable Application Tracking:**
Edit `electron/config/trackerConfig.js`:
```javascript
module.exports = {
  // ...
  TRACK_APPLICATIONS: true,  // Set to false to disable
  // ...
}
```

### **Change Polling Interval:**
In `performanceTracker.js`, line 271:
```javascript
}, 2000) // Change this value (milliseconds)
```

---

## 🐛 **Troubleshooting:**

### **Issue 1: "Optional dependency active-win not available"**

**Cause:** Package not installed or failed to load

**Solution:**
```bash
npm install active-win
# or
npm install
```

### **Issue 2: No applications being tracked (macOS)**

**Cause:** Missing Accessibility permissions

**Solution:**
1. Open **System Preferences**
2. Go to **Security & Privacy** → **Privacy** → **Accessibility**
3. Click the lock to make changes
4. Add your Electron app and check the box

### **Issue 3: tabsSwitched always 0**

**Possible causes:**
- App not switching focus
- Package not loaded
- Tracking disabled in config

**Debug:**
```javascript
// In Electron console
window.electron.performance.getStatus()
// Check: hasActiveWin should be true
```

---

## 📈 **Use Cases:**

### **Productivity Analysis:**
- See which apps you use most
- Track how often you switch contexts
- Identify distractions

### **Time Tracking:**
- Know which apps consume your time
- Measure focus vs. distraction

### **Work Patterns:**
- Understand your workflow
- Optimize app switching
- Reduce context switching

---

## 🔐 **Security Notes:**

- ✅ Only app names are collected
- ✅ No content is captured
- ✅ Data stays local until synced to your own database
- ✅ No third-party tracking
- ✅ You control the data

---

## 🎯 **Summary:**

| Feature | Status | Frequency | Privacy |
|---------|--------|-----------|---------|
| Active app detection | ✅ Enabled | Every 2s | App name only |
| App switch counting | ✅ Enabled | Real-time | Just a number |
| Apps used list | ✅ Enabled | Real-time | Names only |
| Window content | ❌ Never | N/A | Not tracked |
| Screenshots | ❌ Never | N/A | Not tracked |

**The system tracks WHICH apps you use, not WHAT you do in them.** 🔒


