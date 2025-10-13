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
    this.iohook = this.loadOptionalDependency('iohook')
    
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

    // Setup keyboard and mouse tracking with iohook (if available)
    this.setupInputTracking()

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

    // Stop iohook if running
    if (this.iohook && this.iohook.stop) {
      try {
        this.iohook.stop()
      } catch (error) {
        this.log(`Error stopping iohook: ${error.message}`)
      }
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
   * Setup keyboard and mouse input tracking
   */
  setupInputTracking() {
    if (!this.iohook) {
      this.log('iohook not available, using fallback tracking')
      return
    }

    try {
      // Track mouse clicks
      this.iohook.on('mouseclick', () => {
        if (!this.isPaused && config.TRACK_MOUSE) {
          this.metrics.mouseClicks++
          this.lastActivityTime = Date.now()
        }
      })

      // Track mouse movements (throttled)
      let lastMouseTrack = 0
      this.iohook.on('mousemove', (event) => {
        const now = Date.now()
        if (!this.isPaused && config.TRACK_MOUSE && now - lastMouseTrack > config.MOUSE_MOVEMENT_THROTTLE) {
          this.metrics.mouseMovements++
          this.lastMousePosition = { x: event.x, y: event.y }
          this.lastActivityTime = now
          lastMouseTrack = now
        }
      })

      // Track keystrokes (count only, no content)
      this.iohook.on('keydown', () => {
        if (!this.isPaused && config.TRACK_KEYBOARD) {
          this.metrics.keystrokes++
          this.lastActivityTime = Date.now()
        }
      })

      // Start iohook
      this.iohook.start()
      this.log('Input tracking (iohook) started successfully')
    } catch (error) {
      this.log(`Error setting up input tracking: ${error.message}`)
    }
  }

  /**
   * Update metrics periodically
   */
  updateMetrics() {
    if (this.isPaused) {
      return
    }

    const now = Date.now()
    const timeSinceLastUpdate = (now - this.metrics.lastUpdated) / 1000 // seconds

    // Update screen time
    this.metrics.screenTime += timeSinceLastUpdate

    // Check for idle time
    const idleSeconds = this.getSystemIdleTime()
    const isIdle = idleSeconds >= config.IDLE_THRESHOLD

    if (isIdle) {
      this.metrics.idleTime += timeSinceLastUpdate
    } else {
      this.metrics.activeTime += timeSinceLastUpdate
    }

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
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      // Convert seconds to minutes for API
      activeTime: Math.round(this.metrics.activeTime / 60),
      idleTime: Math.round(this.metrics.idleTime / 60),
      screenTime: Math.round(this.metrics.screenTime / 60),
    }
  }

  /**
   * Get metrics for API (formatted)
   */
  getMetricsForAPI() {
    const metrics = this.getMetrics()
    
    return {
      mouseMovements: metrics.mouseMovements,
      mouseClicks: metrics.mouseClicks,
      keystrokes: metrics.keystrokes,
      activeTime: metrics.activeTime,
      idleTime: metrics.idleTime,
      screenTime: metrics.screenTime,
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
      hasIohook: !!this.iohook,
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



