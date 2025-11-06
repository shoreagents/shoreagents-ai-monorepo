# 🔍 DEBUG: Kevin's Keystrokes Not Tracking

**Issue:** After restarting Electron, Kevin's keystrokes are not showing up in Supabase.

---

## ✅ WHAT TO CHECK:

### **1. Check Database - Latest Record**

Run this in **Supabase SQL Editor:**

```sql
SELECT 
  id,
  "staffUserId",
  date,
  keystrokes,
  "mouseClicks",
  "activeTime",
  "idleTime",
  "updatedAt"
FROM performance_metrics
WHERE "staffUserId" = 'a88241ac-c9b7-4af7-b025-d8fd85d41c9e'
ORDER BY "updatedAt" DESC
LIMIT 3;
```

**What to look for:**
- ✅ Is `updatedAt` recent (within last 2 minutes)?
- ✅ Are keystrokes increasing?
- ❌ If `updatedAt` is old (5+ minutes), Electron is not syncing!

---

### **2. Kevin's Electron App Status**

**Ask Kevin to check:**

1. **Is Electron running the OLD or NEW version?**
   - After restart, did he run `npm run electron:build`?
   - Old Electron = wrong units (seconds instead of minutes)
   - New Electron = correct units (minutes)

2. **Is Kevin logged in?**
   - Check top-right corner of Electron app
   - Should show "Kevin Macabanti"

3. **Check Electron console logs:**
   - In Electron app, press `F12` (opens DevTools)
   - Go to "Console" tab
   - Look for:
     ```
     [SyncService] Sync successful
     [PerformanceTracker] Keystrokes: XXX
     ```

---

### **3. Common Issues & Fixes**

#### **Issue A: Electron Not Syncing (401 Unauthorized)**

**Symptom:**
```
[SyncService] API returned error: 401
[SyncService] Warning: No session cookie found
```

**Fix:**
```bash
# Kevin needs to:
1. Close Electron completely
2. Reopen Electron
3. Login again
4. Type some keys
5. Check console for "Sync successful"
```

---

#### **Issue B: Electron Running OLD Code**

**Symptom:**
- Database shows old timestamps
- activeTime/idleTime showing wrong values (seconds instead of minutes)

**Fix:**
```bash
# On Kevin's PC:
1. Close Electron
2. In project folder:
   npm run electron:build
3. Install new Electron build
4. Open and login
5. Type to test
```

---

#### **Issue C: Keystrokes Tracked But Not Syncing**

**Symptom:**
- Electron console shows keystrokes increasing
- But database not updating

**Check:**
```javascript
// In Electron console (F12), type:
window.electronAPI.getMetrics()

// Should show:
{
  keystrokes: 100,  // Increasing with each key press
  mouseClicks: 50,
  activeTime: 5,    // Minutes
  ...
}
```

If keystrokes are increasing locally but not in database:
- **Network issue:** Can Electron reach `http://localhost:3000`?
- **API issue:** Is Next.js server running?
- **Auth issue:** Is session cookie valid?

---

### **4. Quick Test**

**To verify tracking works:**

1. **Kevin opens Electron**
2. **Logs in**
3. **Types 20-30 keys rapidly**
4. **Waits 15 seconds** (Electron syncs every 10 seconds)
5. **Check Supabase:**
   ```sql
   SELECT keystrokes, "updatedAt"
   FROM performance_metrics
   WHERE "staffUserId" = 'a88241ac-c9b7-4af7-b025-d8fd85d41c9e'
   ORDER BY "updatedAt" DESC
   LIMIT 1;
   ```
6. **Expected:** keystrokes increased, `updatedAt` is recent

---

## 🔧 LIKELY FIX:

Based on "we closed Electron and restarted", the issue is probably:

### **Kevin is running OLD Electron build!**

**Solution:**

```bash
# On Kevin's PC:
cd /path/to/project

# Rebuild Electron with latest code
npm run electron:build

# Or if using dist:
npm run build:electron

# Then reinstall/reopen Electron
```

---

## 🚨 CRITICAL: Electron Sync Logic

Electron syncs every **10 seconds** to the API:

```javascript
// electron/config/trackerConfig.js
SYNC_INTERVAL: 10000  // 10 seconds
```

**So if Kevin types keys, you should see database update within 10-15 seconds!**

If not updating = Electron not syncing = one of the issues above.

---

## ✅ VERIFICATION STEPS:

1. ✅ Check database timestamp (must be recent)
2. ✅ Kevin opens Electron console (F12)
3. ✅ Look for sync logs every 10 seconds
4. ✅ Type keys and watch keystrokes increase
5. ✅ Wait 15 seconds, check database again
6. ✅ Keystrokes should match!

---

## 📞 NEED MORE HELP?

Run this and send output:

```sql
-- Check Kevin's activity in last 10 minutes
SELECT 
  "updatedAt",
  keystrokes,
  "mouseClicks",
  "activeTime",
  "idleTime"
FROM performance_metrics
WHERE "staffUserId" = 'a88241ac-c9b7-4af7-b025-d8fd85d41c9e'
  AND "updatedAt" > NOW() - INTERVAL '10 minutes'
ORDER BY "updatedAt" DESC;
```

This will show if ANY data is coming through.

