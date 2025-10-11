/**
 * Break Handler Service
 * 
 * Manages break mode and integrates with performance tracking
 */

const { BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const config = require('../config/trackerConfig')

class BreakHandler {
  constructor() {
    this.breakWindow = null
    this.isOnBreak = false
    this.breakStartTime = null
    this.performanceTracker = null
  }

  /**
   * Initialize break handler
   */
  initialize(performanceTracker) {
    this.performanceTracker = performanceTracker
    this.setupIPC()
    this.log('Break handler initialized')
  }

  /**
   * Setup IPC handlers for break events
   */
  setupIPC() {
    // Listen for break start events from renderer
    ipcMain.on('break-started', (event, breakData) => {
      this.handleBreakStart(breakData)
    })

    // Listen for break end events from renderer
    ipcMain.on('break-ended', (event, breakData) => {
      this.handleBreakEnd(breakData)
    })
  }

  /**
   * Handle break start
   */
  handleBreakStart(breakData) {
    if (this.isOnBreak) {
      this.log('Already on break')
      return
    }

    this.log(`Break started: ${breakData?.type || 'unknown'}`)
    this.isOnBreak = true
    this.breakStartTime = Date.now()

    // Pause performance tracking during breaks
    if (this.performanceTracker) {
      this.performanceTracker.pause()
      this.log('Performance tracking paused for break')
    }

    // Optionally create a full-screen break window
    if (breakData?.fullscreen) {
      this.createBreakWindow(breakData)
    }
  }

  /**
   * Handle break end
   */
  handleBreakEnd(breakData) {
    if (!this.isOnBreak) {
      this.log('No active break to end')
      return
    }

    const breakDuration = Math.floor((Date.now() - this.breakStartTime) / 1000)
    this.log(`Break ended after ${breakDuration} seconds`)
    
    this.isOnBreak = false
    this.breakStartTime = null

    // Resume performance tracking after break
    if (this.performanceTracker) {
      this.performanceTracker.resume()
      this.log('Performance tracking resumed after break')
    }

    // Close break window if it exists
    if (this.breakWindow) {
      this.breakWindow.close()
      this.breakWindow = null
    }
  }

  /**
   * Create a full-screen break window
   */
  createBreakWindow(breakData) {
    if (this.breakWindow) {
      this.breakWindow.focus()
      return
    }

    this.log('Creating full-screen break window')

    this.breakWindow = new BrowserWindow({
      fullscreen: true,
      alwaysOnTop: true,
      frame: false,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    // Load the break page
    const breakUrl = process.env.NODE_ENV === 'development'
      ? `http://localhost:3000/breaks?fullscreen=true`
      : path.join(__dirname, '../../out/breaks.html')

    if (process.env.NODE_ENV === 'development') {
      this.breakWindow.loadURL(breakUrl)
    } else {
      this.breakWindow.loadFile(breakUrl)
    }

    // Handle window close
    this.breakWindow.on('closed', () => {
      this.breakWindow = null
      if (this.isOnBreak) {
        this.handleBreakEnd({})
      }
    })

    this.log('Break window created')
  }

  /**
   * Check if currently on break
   */
  isBreakActive() {
    return this.isOnBreak
  }

  /**
   * Get break status
   */
  getStatus() {
    return {
      isOnBreak: this.isOnBreak,
      breakStartTime: this.breakStartTime,
      breakDuration: this.breakStartTime 
        ? Math.floor((Date.now() - this.breakStartTime) / 1000)
        : 0,
      hasBreakWindow: !!this.breakWindow,
    }
  }

  /**
   * Force end break (for emergency/testing)
   */
  forceEndBreak() {
    this.log('Force ending break')
    this.handleBreakEnd({})
  }

  log(message) {
    if (config.DEBUG) {
      console.log(`[BreakHandler] ${message}`)
    }
  }
}

module.exports = new BreakHandler()

