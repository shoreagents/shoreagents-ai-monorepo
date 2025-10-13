# Sync Service Debugging Guide

## How the Sync System Works

### 1. **Data Collection**
- `performanceTracker` collects metrics every 5 seconds:
  - Mouse movements
  - Mouse clicks  
  - Keystrokes
  - Active/idle time
  - Screen time
  - Clipboard actions
  - Applications used

### 2. **Data Syncing**
- `syncService` syncs to database every **5 minutes** (300,000ms)
- Sends POST request to `/api/performance`
- Uses session cookie from Electron's cookie store for authentication

### 3. **Database Storage**
- API endpoint: `POST /api/performance`
- Creates or updates `PerformanceMetric` record for today
- One record per user per day

## Common Issues & Solutions

### Issue 1: No Session Cookie
**Symptom:** Console shows "No session cookie found"

**Solution:**
1. Make sure you're logged in to the app
2. Electron needs to have the same session as the browser
3. Check console for: `[SyncService] Found session cookie`

### Issue 2: Sync Hasn't Run Yet
**Symptom:** No data in database but metrics are collecting

**Reason:** Sync interval is 10 seconds

**Solution:**
- Force sync manually: Click "Sync Now" button on Performance page
- Or wait 10 seconds for automatic sync (real-time!)

### Issue 3: 401 Unauthorized
**Symptom:** API returns 401 error

**Solution:**
- Log out and log back in
- Session cookie might be expired
- Check if you can access other authenticated pages

### Issue 4: Metrics Not Incrementing
**Symptom:** Counters stuck at 0

**Solution:**
- Check if Activity Tracker is initialized
- Look for: `[ActivityTracker] uIOhook started successfully`
- Check for: `[ActivityTracker] Keystroke detected, total: X`

## How to Check Sync Status

### In Electron Console (F12):
```bash
# Look for these logs:
[SyncService] Starting sync service...
[SyncService] Starting sync...
[SyncService] Sending metrics to http://localhost:3000/api/performance
[SyncService] Found session cookie: authjs.session-token
[SyncService] Metrics sent successfully: 201
[SyncService] Sync successful
```

### Force Sync:
1. Go to Performance page
2. Click "Sync Now" button
3. Watch console for sync logs

### Check Database:
```sql
SELECT * FROM PerformanceMetric 
WHERE userId = 'your-user-id' 
ORDER BY date DESC 
LIMIT 1;
```

## Debug Checklist

- [ ] Activity Tracker is running (`[ActivityTracker] uIOhook started successfully`)
- [ ] Performance Tracker is running (`[Main] Performance tracking started`)
- [ ] Sync Service is running (`[Main] Sync service started`)
- [ ] Metrics are incrementing in console (`Keystroke detected, total: X`)
- [ ] Session cookie exists (`Found session cookie: authjs.session-token`)
- [ ] Sync is sending data (`Sending metrics to...`)
- [ ] API returns success (`Metrics sent successfully: 201`)
- [ ] 10 seconds have passed OR manual sync was triggered

## Current Sync Settings

- **Tracking Interval:** 5 seconds (updates local metrics)
- **Sync Interval:** 10 seconds (REAL-TIME) - sends to database
- **API Endpoint:** `http://localhost:3000/api/performance`
- **Auth Method:** Session cookie from Electron cookie store
- **Retry Attempts:** 3 times on failure
- **Retry Delay:** 5 seconds (exponential backoff)

## Quick Test

1. Open Electron app (F12 for console)
2. Type some keys, click mouse
3. Check console: "Keystroke detected, total: X"
4. Go to Performance page
5. Click "Sync Now"
6. Watch for: "Sync successful" in console
7. Check database for new/updated record

## Force Sync Command (in Electron Console)

```javascript
// Check sync status
window.electron.sync.getStatus()

// Force immediate sync
window.electron.sync.forceSync()
```

