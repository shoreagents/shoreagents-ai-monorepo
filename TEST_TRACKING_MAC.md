# 🧪 Mac Tracking Verification Tests

## ✅ Test 1: Active Time Tracking

### Steps:
1. **Open Electron app** (if not already open)
2. **Note current Active Time** on `/performance` page
3. **Use the app actively** for exactly 2 minutes:
   - Click through different pages
   - Type in search boxes
   - Move windows around
4. **Refresh the page** (`Cmd + R`)
5. **Check Active Time again**

### Expected Result:
- ✅ Active Time should increase by ~2 minutes
- Example: If it was `0h 5m`, it should now be `0h 7m`

### Actual Result:
- [ ] Pass / [ ] Fail
- Notes: ___________________

---

## ✅ Test 2: Idle Time Tracking

### Steps:
1. **Note current Idle Time** on `/performance` page
2. **Leave computer completely untouched** for 6 minutes:
   - Don't touch mouse
   - Don't touch keyboard
   - Let it sit idle
3. **After 6 minutes, wake it up**
4. **Refresh `/performance` page**
5. **Check Idle Time**

### Expected Result:
- ✅ Idle Time should increase by ~6 minutes
- Note: First 5 minutes are the threshold, so only time AFTER 5 min counts as idle

### Actual Result:
- [ ] Pass / [ ] Fail
- Notes: ___________________

---

## ✅ Test 3: Screen Time Tracking

### Steps:
1. **Note current Screen Time** on `/performance` page
2. **Keep app open** for 5 minutes (do anything)
3. **Refresh the page**
4. **Check Screen Time**

### Expected Result:
- ✅ Screen Time should increase by ~5 minutes
- This tracks total time computer is on

### Actual Result:
- [ ] Pass / [ ] Fail
- Notes: ___________________

---

## ✅ Test 4: Break Tracking Integration

### Steps:
1. **Go to `/breaks` page**
2. **Note tracking status widget** (bottom-right):
   - Should show "Active" and green indicator
3. **Start any break** (Morning/Lunch/Afternoon)
4. **Check tracking status widget**:
   - Should now show "Paused" and amber indicator
5. **Note the Active Time** on performance page
6. **Wait 2 minutes** (during break)
7. **End the break**
8. **Check tracking status** - should show "Active" again
9. **Check Active Time** - should NOT have increased during break

### Expected Result:
- ✅ Tracking pauses when break starts
- ✅ Active Time doesn't increase during break
- ✅ Tracking resumes when break ends
- ✅ Status widget shows correct states

### Actual Result:
- [ ] Pass / [ ] Fail
- Notes: ___________________

---

## ✅ Test 5: API Sync

### Steps:
1. **Open Electron DevTools** (`Cmd + Option + I`)
2. **Go to Console tab**
3. **Use app for 3 minutes**
4. **Wait for sync** (happens every 5 minutes)
5. **Look for sync messages** in console:
   - `[SyncService] Starting sync...`
   - `[SyncService] Metrics sent successfully`
6. **Refresh `/performance` page**
7. **Verify data persisted**

### Expected Result:
- ✅ Console shows sync messages
- ✅ Data appears on performance page after refresh
- ✅ Tracking status widget shows "Synced" after sync completes

### Actual Result:
- [ ] Pass / [ ] Fail
- Notes: ___________________

---

## ✅ Test 6: Data Persistence

### Steps:
1. **Use app for 5+ minutes** to accumulate some metrics
2. **Wait for sync** (5 min interval) OR click "Sync Now" button
3. **Note your Active Time** (e.g., 0h 10m)
4. **Completely quit Electron** (not just close window - actually quit)
5. **Restart Electron**
6. **Login again**
7. **Go to `/performance` page**
8. **Check Active Time**

### Expected Result:
- ✅ Active Time should still show your previous value
- ✅ Data persists across app restarts
- ✅ Database has the records

### Actual Result:
- [ ] Pass / [ ] Fail
- Notes: ___________________

---

## 🔍 Debugging: Check Electron Console

### To see what's actually happening:

1. **Open DevTools** (`Cmd + Option + I`)
2. **Go to Console tab**
3. **Look for these messages:**

```
[PerformanceTracker] Performance tracking started
[PerformanceTracker] iohook not available, using fallback tracking
[Main] Performance tracking started
[Main] Sync service will start after authentication
```

4. **Filter for tracking messages:**
   - Type `[PerformanceTracker]` in the console filter
   - Type `[SyncService]` in the console filter

### What to Check:

- ✅ Is tracking actually running? (should see periodic updates)
- ✅ Is sync service running? (should see sync attempts every 5 min)
- ❌ Are there any errors? (red messages)

---

## 🔍 Debugging: Check Database Directly

### To verify data is actually saving:

1. **Open a new terminal**
2. **Run Prisma Studio:**
   ```bash
   cd "/Users/stephenatcheler/Desktop/Electron - Staff/gamified-dashboard (1)"
   pnpm prisma studio
   ```
3. **Open** http://localhost:5555
4. **Click** `performance_metrics` table
5. **Look for today's records** for your user
6. **Check the values:**
   - `activeTime` (should be > 0)
   - `idleTime` (may be 0 or > 0)
   - `screenTime` (should be > 0)
   - `mouseMovements` (will be 0 on Mac)
   - `mouseClicks` (will be 0 on Mac)
   - `keystrokes` (will be 0 on Mac)

---

## 📊 Expected Mac Results Summary

| Metric | Expected on Mac | Why |
|--------|----------------|-----|
| **Active Time** | ✅ Numbers increase | Fallback time calculation works |
| **Idle Time** | ✅ Numbers increase when idle | System idle detection works |
| **Screen Time** | ✅ Numbers increase | Power monitoring works |
| **Mouse Movements** | ❌ Always 0 | Needs iohook (Windows only) |
| **Mouse Clicks** | ❌ Always 0 | Needs iohook (Windows only) |
| **Keystrokes** | ❌ Always 0 | Needs iohook (Windows only) |
| **Apps Used** | ❌ Always 0 | Needs active-win (Windows only) |
| **Clipboard** | ❌ Always 0 | Needs clipboardy (Windows only) |

---

## ✅ All Tests Complete?

### If ALL tests pass:
- ✅ Mac tracking is working perfectly (within limitations)
- ✅ Ready for Windows testing
- ✅ Architecture is sound

### If ANY test fails:
- Document which test failed
- Check Electron console for errors
- Check database for data
- Report findings for debugging

---

## 🎯 Next: Windows Testing

Once you've verified Mac tracking works for time-based metrics, test on Windows to verify:
- ✅ Mouse movements populate
- ✅ Mouse clicks populate
- ✅ Keystrokes populate
- ✅ Apps used populate
- ✅ All other tracking continues to work

---

**Date Tested:** __________  
**Tester:** __________  
**Overall Result:** [ ] All Time-Based Tracking Works on Mac

