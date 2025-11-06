# 🔍 DEBUG KEVIN'S KEYSTROKE TRACKING - STEP BY STEP

## ✅ SERVER RESTARTED WITH LOGGING!

**Status:** Server is now running with comprehensive error logging!

---

## 🎯 KEVIN - DO THIS NOW:

### **Step 1: Pull Latest Code**

```bash
cd /path/to/project
git pull origin stephen-branch-old-project
```

### **Step 2: Rebuild Electron**

```bash
npm run electron:build
```

### **Step 3: Close Old Electron Completely**

- Close the current Electron app
- Make sure it's not running in system tray

### **Step 4: Open NEW Electron**

- Open the newly built Electron app
- Login as Kevin (kevinlmacabanti@gmail.com)

### **Step 5: Open DevTools Console**

- Press **F12** in Electron
- Click **"Console"** tab at the top
- Keep this console visible!

---

## 📊 **NOW TEST - TYPE 10 KEYS!**

Type 10 keys on your keyboard (any keys).

---

## 🔍 **WHAT YOU SHOULD SEE IN CONSOLE:**

### **✅ IF TRACKING WORKS:**

You should see logs like this:

```
[PerformanceTracker] 🚀 STARTING Performance Tracker...
[PerformanceTracker] ✅ Performance tracking STARTED!
[PerformanceTracker] 📊 Initial metrics: { keystrokes: 2551, ... }

[ActivityTracker] ✅ Keystroke #2552
[ActivityTracker] ✅ Keystroke #2553
[ActivityTracker] ✅ Keystroke #2554
...

[SyncService] 🔄 Starting sync...
[SyncService] 📊 Metrics to sync: { keystrokes: 2561, mouseClicks: 145, ... }
[SyncService] ✅ API Response: 200
[SyncService] ✅ Sync successful!
```

### **❌ IF TRACKING FAILS:**

You might see:

```
[PerformanceTracker] 🚫 Performance tracking disabled - non-staff portal detected
```

OR

```
[ActivityTracker] Performance tracker not available
```

OR

```
[SyncService] 🚨 API ERROR: 401
[SyncService] 🚨 Sync FAILED!
```

OR

```
[SyncService] 🚨 NETWORK ERROR: connect ECONNREFUSED
```

---

## 📸 **TAKE SCREENSHOTS:**

1. **After typing 10 keys**, take a screenshot of the Electron console
2. **Send the screenshot** showing ALL the log messages

---

## 🔍 **WHAT TO LOOK FOR:**

### **Question 1: Are keystrokes being tracked?**

Look for: `[ActivityTracker] ✅ Keystroke #XXX`

- ✅ **YES** = Tracking works, problem is with sync
- ❌ **NO** = Tracking not working, activity-tracker not running

### **Question 2: Is sync running?**

Look for: `[SyncService] 🔄 Starting sync...`

- ✅ **YES** = Sync service is running
- ❌ **NO** = Sync service not started

### **Question 3: What's the API response?**

Look for: `[SyncService] ✅ API Response: XXX`

- ✅ **200** = API works!
- ❌ **401** = Not logged in / session expired
- ❌ **500** = Server error
- ❌ **Network error** = Can't reach server

---

## 🎯 **COMMON ISSUES & FIXES:**

### **Issue A: "Performance tracking disabled - non-staff portal"**

**Cause:** Electron thinks Kevin is on admin/client page, not staff page

**Fix:**
- Make sure Kevin is logged in as STAFF (not admin/client)
- URL should be staff portal, not /admin or /client

### **Issue B: "API ERROR: 401"**

**Cause:** Kevin not logged in or session expired

**Fix:**
- Close Electron
- Open again
- Login fresh
- Try again

### **Issue C: "NETWORK ERROR"**

**Cause:** Can't reach http://localhost:3000

**Fix:**
- Check if Next.js server is running on port 3000
- Check if Kevin's PC can access localhost:3000
- Maybe wrong API_BASE_URL in Electron config?

### **Issue D: "No logs at all"**

**Cause:** Electron still running OLD code

**Fix:**
- Make SURE you rebuilt Electron (`npm run electron:build`)
- Make SURE you closed OLD Electron completely
- Open NEW Electron build

---

## ✅ **AFTER TESTING:**

1. **Type 10 keys**
2. **Screenshot the console logs**
3. **Wait 15 seconds** (let sync happen)
4. **Check Supabase:**

```sql
SELECT 
  keystrokes,
  "mouseClicks",
  "updatedAt"
FROM performance_metrics
WHERE "staffUserId" = 'a88241ac-c9b7-4af7-b025-d8fd85d41c9e'
  AND date >= CURRENT_DATE
ORDER BY "updatedAt" DESC
LIMIT 1;
```

5. **Send screenshot of Supabase result too!**

---

## 🚀 **THIS WILL TELL US EXACTLY WHERE IT'S FAILING!**

With these logs, we'll see:
- ✅ Is activity tracking working?
- ✅ Is sync service running?
- ✅ Is API responding?
- ✅ What error is happening?

**NO MORE GUESSING!** 🔥

