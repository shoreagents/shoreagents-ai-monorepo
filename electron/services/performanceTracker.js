/**
 * Performance Tracker Service
 * 
 * Tracks user activity metrics including mouse, keyboard, idle time, etc.
 */

const { screen, powerMonitor } = require('electron')
const config = require('../config/trackerConfig')

class PerformanceTracker {
  constructor() {
    this.metrics = this.initializeMetrics()
    this.isTracking = false
    this.isPaused = false
    this.trackingInterval = null
    this.lastMousePosition = { x: 0, y: 0 }
    this.lastActivityTime = Date.now()
    this.sessionStartTime = Date.now()
    this.lastIdleCheck = Date.now()
    
    // Optional dependencies (may not be available on all platforms)
    this.systemIdleTime = this.loadOptionalDependency('@paulcbetts/system-idle-time')
    this.activeWin = this.loadOptionalDependency('active-win')
    this.clipboardy = this.loadOptionalDependency('clipboardy')
    // Note: iohook removed (deprecated) - Input tracking handled by Activity Tracker (uiohook-napi)
    
    // Activity tracking state
    this.currentApp = null
    this.lastClipboardContent = ''
    this.activeApps = new Set()
    
    this.log('Performance Tracker initialized')
  }

  loadOptionalDependency(name) {
    try {
      return require(name)
    } catch (error) {
      this.log(`Optional dependency ${name} not available: ${error.message}`)
      return null
    }
  }

  initializeMetrics() {
    return {
      mouseMovements: 0,
      mouseClicks: 0,
      keystrokes: 0,
      activeTime: 0, // in seconds
      idleTime: 0, // in seconds
      screenTime: 0, // in seconds
      downloads: 0,
      uploads: 0,
      bandwidth: 0,
      clipboardActions: 0,
      filesAccessed: 0,
      urlsVisited: 0,
      tabsSwitched: 0,
      productivityScore: 0,
      applicationsUsed: [],
      lastUpdated: Date.now()
    }
  }

  /**
   * Start tracking user activity
   * Note: Keyboard and mouse input tracking is handled by Activity Tracker (uiohook-napi)
   */
  start() {
    if (this.isTracking) {
      this.log('Tracker already running')
      return
    }

    this.isTracking = true
    this.sessionStartTime = Date.now()
    this.lastActivityTime = Date.now()
    this.log('Starting performance tracking...')
    this.log('Note: Input tracking is handled by Activity Tracker (uiohook-napi)')

    // Input tracking is now handled by Activity Tracker
    // this.setupInputTracking() - REMOVED (deprecated iohook)

    // Start main tracking loop
    this.trackingInterval = setInterval(() => {
      this.updateMetrics()
    }, config.TRACKING_INTERVAL)

    // Track screen time
    this.startScreenTimeTracking()

    // Monitor clipboard (if available)
    if (this.clipboardy && config.TRACK_CLIPBOARD) {
      this.startClipboardMonitoring()
    }

    // Track active window/application (if available)
    if (this.activeWin && config.TRACK_APPLICATIONS) {
      this.startApplicationTracking()
    }

    this.log('Performance tracking started')
  }

  /**
   * Stop tracking user activity
   */
  stop() {
    if (!this.isTracking) {
      return
    }

    this.isTracking = false
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval)
      this.trackingInterval = null
    }

    this.log('Performance tracking stopped')
  }

  /**
   * Pause tracking temporarily
   */
  pause() {
    this.isPaused = true
    this.log('Tracking paused')
  }

  /**
   * Resume tracking after pause
   */
  resume() {
    this.isPaused = false
    this.lastActivityTime = Date.now()
    this.log('Tracking resumed')
  }

  /**
   * Input tracking is now handled by Activity Tracker (uiohook-napi)
   * This method is kept for compatibility but does nothing
   * @deprecated - Use Activity Tracker for input tracking
   */
  setupInputTracking() {
    this.log('Input tracking is handled by Activity Tracker (uiohook-napi)')
  }

  /**
   * Update metrics periodically
   * Note: Idle time is now tracked by Activity Tracker when inactivity is detected
   */
  updateMetrics() {
    if (this.isPaused) {
      return
    }

    const now = Date.now()
    const timeSinceLastUpdate = (now - this.metrics.lastUpdated) / 1000 // seconds

    // Update screen time
    this.metrics.screenTime += timeSinceLastUpdate

    // Active time tracking
    // Note: Idle time is now tracked by Activity Tracker when inactivity dialog is shown
    // We only track active time here to avoid double-counting
    const idleSeconds = this.getSystemIdleTime()
    const isIdle = idleSeconds >= config.IDLE_THRESHOLD

    if (!isIdle) {
      // Only add to active time if user is not idle
      // Idle time will be added by Activity Tracker when inactivity is detected
      this.metrics.activeTime += timeSinceLastUpdate
    }
    // If idle, don't add time to either counter yet - wait for Activity Tracker to handle it

    // Calculate productivity score
    this.metrics.productivityScore = this.calculateProductivityScore()

    this.metrics.lastUpdated = now
  }

  /**
   * Get system idle time in seconds
   */
  getSystemIdleTime() {
    if (this.systemIdleTime) {
      try {
        return this.systemIdleTime.getIdleTime()
      } catch (error) {
        // Fallback: calculate based on last activity
        return Math.floor((Date.now() - this.lastActivityTime) / 1000)
      }
    }
    
    // Fallback: calculate based on last activity
    return Math.floor((Date.now() - this.lastActivityTime) / 1000)
  }

  /**
   * Start screen time tracking
   */
  startScreenTimeTracking() {
    // Track when display is turned off (system sleep/lock)
    powerMonitor.on('suspend', () => {
      this.log('System suspended')
      this.pause()
    })

    powerMonitor.on('resume', () => {
      this.log('System resumed')
      this.resume()
    })

    powerMonitor.on('lock-screen', () => {
      this.log('Screen locked')
      this.pause()
    })

    powerMonitor.on('unlock-screen', () => {
      this.log('Screen unlocked')
      this.resume()
    })
  }

  /**
   * Monitor clipboard activity
   */
  async startClipboardMonitoring() {
    try {
      // Get initial clipboard content
      this.lastClipboardContent = await this.clipboardy.read()

      // Check for clipboard changes periodically
      setInterval(async () => {
        if (this.isPaused) return

        try {
          const currentContent = await this.clipboardy.read()
          if (currentContent !== this.lastClipboardContent) {
            this.metrics.clipboardActions++
            this.lastClipboardContent = currentContent
          }
        } catch (error) {
          // Ignore clipboard read errors
        }
      }, 1000) // Check every second
    } catch (error) {
      this.log(`Clipboard monitoring error: ${error.message}`)
    }
  }

  /**
   * Track active applications
   */
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
        // Ignore active window errors
      }
    }, 2000) // Check every 2 seconds
  }

  /**
   * Calculate productivity score (0-100)
   */
  calculateProductivityScore() {
    const totalTime = this.metrics.activeTime + this.metrics.idleTime
    if (totalTime === 0) return 0

    // Active time percentage (40% weight)
    const activePercent = (this.metrics.activeTime / totalTime) * 40

    // Keystroke activity (30% weight) - normalized to 5000 keystrokes as 100%
    const keystrokeScore = Math.min((this.metrics.keystrokes / 5000) * 30, 30)

    // Mouse activity (30% weight) - normalized to 1000 clicks as 100%
    const mouseScore = Math.min((this.metrics.mouseClicks / 1000) * 30, 30)

    return Math.round(activePercent + keystrokeScore + mouseScore)
  }

  /**
   * Get current metrics (with raw seconds for real-time display)
   */
  getMetrics() {
    return {
      ...this.metrics,
      // Keep raw seconds for real-time display (frontend will format)
      activeTime: this.metrics.activeTime,
      idleTime: this.metrics.idleTime,
      screenTime: this.metrics.screenTime,
    }
  }

  /**
   * Get metrics for API (formatted - converts seconds to minutes)
   */
  getMetricsForAPI() {
    const metrics = this.metrics
    
    return {
      mouseMovements: metrics.mouseMovements,
      mouseClicks: metrics.mouseClicks,
      keystrokes: metrics.keystrokes,
      // Convert seconds to minutes for API/database storage
      activeTime: Math.round(metrics.activeTime / 60),
      idleTime: Math.round(metrics.idleTime / 60),
      screenTime: Math.round(metrics.screenTime / 60),
      downloads: metrics.downloads,
      uploads: metrics.uploads,
      bandwidth: metrics.bandwidth,
      clipboardActions: metrics.clipboardActions,
      filesAccessed: metrics.filesAccessed,
      urlsVisited: metrics.urlsVisited,
      tabsSwitched: metrics.tabsSwitched,
      productivityScore: metrics.productivityScore,
    }
  }

  /**
   * Add idle time manually (called by Activity Tracker)
   * @param {number} seconds - Idle time in seconds to add
   */
  addIdleTime(seconds) {
    if (seconds > 0) {
      this.metrics.idleTime += seconds
      this.log(`Added ${seconds.toFixed(2)}s to idle time. Total: ${this.metrics.idleTime.toFixed(2)}s`)
    }
  }

  /**
   * Reset metrics (usually at midnight)
   */
  resetMetrics() {
    this.log('Resetting daily metrics')
    this.metrics = this.initializeMetrics()
    this.activeApps.clear()
    this.sessionStartTime = Date.now()
  }

  /**
   * Check if it's time to reset (midnight)
   */
  shouldResetMetrics() {
    const now = new Date()
    const lastUpdate = new Date(this.metrics.lastUpdated)
    
    return now.getDate() !== lastUpdate.getDate()
  }

  /**
   * Get tracking status
   */
  getStatus() {
    return {
      isTracking: this.isTracking,
      isPaused: this.isPaused,
      sessionDuration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
      lastUpdate: this.metrics.lastUpdated,
      inputTrackingBy: 'Activity Tracker (uiohook-napi)',
      hasSystemIdleTime: !!this.systemIdleTime,
      hasActiveWin: !!this.activeWin,
      hasClipboardy: !!this.clipboardy,
    }
  }

  log(message) {
    if (config.DEBUG) {
      console.log(`[PerformanceTracker] ${message}`)
    }
  }
}

module.exports = new PerformanceTracker()


