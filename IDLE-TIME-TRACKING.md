# Idle Time Tracking Integration

## Overview
This document describes the integration between the Activity Tracker and Performance Tracker for accurate idle time tracking.

## Problem Statement
Previously, the inactivity dialog would detect when a user was inactive for 30+ seconds, but this idle time wasn't being properly recorded in the performance metrics. Additionally, there was a risk of double-counting idle time between the two tracking systems.

## Solution
The Activity Tracker now properly records idle time when inactivity is detected, and the Performance Tracker has been updated to avoid double-counting.

## Changes Made

### 1. Activity Tracker (`electron/activity-tracker.js`)

#### Added Inactivity Start Time Tracking
- Added `inactivityStartTime` property to track when user becomes inactive
- When the inactivity dialog is shown (after 30 seconds of no activity), the start time is recorded
- When activity resumes, the idle duration is calculated and added to performance metrics

#### Updated `onActivity()` Method
- Now checks if `inactivityStartTime` is set
- If set, calculates idle duration and adds it to performance tracker
- Resets `inactivityStartTime` to null after recording

#### Updated `showInactivityDialog()` Method
- Sets `inactivityStartTime` when dialog is first shown
- Logs when idle time tracking starts for debugging

#### Updated `closeInactivityDialog()` Method
- Defensive code: if dialog closes without activity being detected, still records idle time
- Prevents idle time from being lost in edge cases

### 2. Performance Tracker (`electron/services/performanceTracker.js`)

#### Modified `updateMetrics()` Method
- Changed idle time tracking logic to avoid double-counting
- Now only adds time to `activeTime` when user is NOT idle
- When user is idle, waits for Activity Tracker to record the idle time
- Added comments explaining the coordination with Activity Tracker

#### Added `addIdleTime()` Method
- New public method for Activity Tracker to add idle time
- Takes seconds as parameter and adds to `idleTime` metric
- Includes validation (only adds if > 0) and logging

### 3. Configuration (`electron/config/trackerConfig.js`)

#### Updated IDLE_THRESHOLD
- Changed from 300 seconds (5 minutes) to 30 seconds
- Now matches the Activity Tracker's inactivity timeout
- Ensures both systems use the same threshold for consistency

## How It Works

### Flow When User Becomes Inactive

1. User stops mouse/keyboard activity
2. After 30 seconds, Activity Tracker detects inactivity
3. `inactivityStartTime` is set to the time of last activity
4. Inactivity dialog is shown
5. During this time:
   - Performance Tracker's periodic check sees user is idle (>30s)
   - It does NOT add time to either active or idle counters
   - Waits for Activity Tracker to handle it

### Flow When User Resumes Activity

**Scenario A: Natural Activity (mouse/keyboard)**
1. Activity is detected (mouse movement or keypress)
2. `onActivity()` is called
3. Idle duration is calculated: `now - inactivityStartTime`
4. Duration is added to Performance Tracker's `idleTime` using `addIdleTime()`
5. `inactivityStartTime` is reset to null
6. Dialog is closed
7. Normal activity tracking resumes

**Scenario B: User Clicks "I'm Here" Button**
1. IPC handler receives button click
2. Calls `onActivity()` (same flow as Scenario A)
3. Then calls `closeInactivityDialog()` explicitly
4. Since `inactivityStartTime` was already reset in `onActivity()`, no double-counting occurs

## Benefits

1. **Accurate Idle Time Tracking**: All periods of inactivity >30 seconds are properly recorded
2. **No Double-Counting**: Coordination between trackers prevents adding idle time twice
3. **Consistent Thresholds**: Both systems use 30-second threshold
4. **Defensive Coding**: Edge cases are handled (dialog closing unexpectedly, etc.)
5. **Better Logging**: Detailed console logs for debugging idle time tracking

## Example Scenario

User is inactive for 45 seconds:
- t=0s: Last activity
- t=30s: Inactivity dialog appears, `inactivityStartTime` set
- t=45s: User moves mouse
- Result: 45 seconds added to `idleTime`

During those 45 seconds:
- Performance Tracker runs `updateMetrics()` ~9 times (every 5 seconds)
- Each time it checks: system idle time = 30-45s, which is >= IDLE_THRESHOLD (30s)
- It does NOT add time to any counter, waits for Activity Tracker
- Activity Tracker adds the full 45 seconds when user resumes

## Testing

To verify the implementation works:
1. Start the application
2. Let it sit idle for 40+ seconds
3. When dialog appears, check console logs for "Started tracking idle time"
4. Resume activity (move mouse)
5. Check console logs for "Recording idle time: X seconds"
6. Verify the idle time is reflected in performance metrics

## Notes

- The Activity Tracker handles short-term inactivity detection (30+ seconds)
- The Performance Tracker handles overall metric aggregation
- Both systems work together through the shared `lastActivityTime` and the new `addIdleTime()` method
- The 30-second threshold can be adjusted in `trackerConfig.js` and `activity-tracker.js` (line 75)

