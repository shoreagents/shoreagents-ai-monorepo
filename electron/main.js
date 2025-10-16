const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron')
const path = require('path')

// Import services
const performanceTracker = require('./services/performanceTracker')
const syncService = require('./services/syncService')
const breakHandler = require('./services/breakHandler')
const activityTracker = require('./activity-tracker')
const screenshotService = require('./services/screenshotService')
const permissions = require('./utils/permissions')
const config = require('./config/trackerConfig')

let mainWindow = null
let tray = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Detect development mode: Check if we're not packaged (app.isPackaged is false)
  const isDev = !app.isPackaged
  
  // Load the app
  if (isDev) {
    console.log('[Main] Loading from dev server: http://localhost:3000')
    mainWindow.loadURL("http://localhost:3000") // Next.js dev server
    mainWindow.webContents.openDevTools()
  } else {
    console.log('[Main] Loading from production build')
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"))
  }

  // Prevent window from closing, hide instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  // Window ready
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Window loaded successfully')
    
    // Send tracking status to renderer
    mainWindow.webContents.send('tracking-status', performanceTracker.getStatus())
  })
}

function createTray() {
  // Create a simple icon (1x1 transparent pixel as fallback)
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: 'Start Break',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('show-break-selector')
        }
      }
    },
    {
      label: 'View Performance',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('navigate-to', '/performance')
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Tracking: Active',
      id: 'tracking-status',
      enabled: false
    },
    {
      label: 'Pause Tracking',
      id: 'pause-tracking',
      click: () => {
        const isPaused = performanceTracker.getStatus().isPaused
        if (isPaused) {
          performanceTracker.resume()
          updateTrayMenu()
        } else {
          performanceTracker.pause()
          updateTrayMenu()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Staff Monitor')
  tray.setContextMenu(contextMenu)
  
  // Click to show window
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })

  console.log('[Main] System tray created')
}

function updateTrayMenu() {
  if (!tray) return
  
  const status = performanceTracker.getStatus()
  
  // Recreate the menu with updated labels
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: 'Start Break',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('show-break-selector')
        }
      }
    },
    {
      label: 'View Performance',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('navigate-to', '/performance')
        }
      }
    },
    { type: 'separator' },
    {
      label: status.isPaused ? 'Tracking: Paused' : 'Tracking: Active',
      enabled: false
    },
    {
      label: status.isPaused ? 'Resume Tracking' : 'Pause Tracking',
      click: () => {
        if (status.isPaused) {
          performanceTracker.resume()
        } else {
          performanceTracker.pause()
        }
        updateTrayMenu()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
}

// Kiosk mode functions removed - breaks now use regular UI

async function initializeTracking() {
  console.log('[Main] Initializing tracking services...')
  
  // Check permissions
  const permissionStatus = await permissions.checkAllPermissions()
  console.log('[Main] Permission status:', permissionStatus)
  
  if (!permissionStatus.ready) {
    console.warn('[Main] Some permissions are missing')
    const instructions = permissions.getPermissionInstructions()
    console.log('[Main] Permission instructions:', instructions)
    
    // Send to renderer to show dialog
    if (mainWindow) {
      mainWindow.webContents.send('permissions-needed', instructions)
    }
  }
  
  // Initialize break handler
  breakHandler.initialize(performanceTracker)
  
  // Start performance tracking
  performanceTracker.start()
  console.log('[Main] Performance tracking started')
  
  // Initialize activity tracker with performance tracker and screenshot service integration
  activityTracker.initialize(mainWindow, performanceTracker, screenshotService)
  console.log('[Main] Activity tracking started (integrated with performance tracker and screenshot service)')
  
  // Start sync service (it will automatically get session cookie from Electron's cookie store)
  syncService.start()
  console.log('[Main] Sync service started')
  
  // Initialize screenshot service (detection mode)
  await screenshotService.initialize({
    apiUrl: 'http://localhost:3000'
  })
  console.log('[Main] Screenshot service initialized (detection mode)')
  
  // Start screenshot capture (will try to get session token from cookies)
  try {
    const cookies = await mainWindow.webContents.session.cookies.get({})
    const sessionCookie = cookies.find(c => 
      c.name === 'authjs.session-token' || 
      c.name === 'next-auth.session-token'
    )
    if (sessionCookie) {
      await screenshotService.start(sessionCookie.value)
      console.log('[Main] Screenshot service started')
    }
  } catch (err) {
    console.error('[Main] Error starting screenshot service:', err)
  }
  
  // Update tray menu with current status
  updateTrayMenu()
  
  // Send metrics to renderer every 5 seconds
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const metrics = performanceTracker.getMetrics()
      const status = performanceTracker.getStatus()
      mainWindow.webContents.send('metrics-update', { metrics, status })
    }
  }, 5000)
}

// Setup IPC handlers
function setupIPC() {
  // Get current metrics
  ipcMain.handle('get-current-metrics', () => {
    return performanceTracker.getMetrics()
  })
  
  // Get tracking status
  ipcMain.handle('get-tracking-status', () => {
    return performanceTracker.getStatus()
  })
  
  // Pause tracking
  ipcMain.handle('pause-tracking', () => {
    performanceTracker.pause()
    updateTrayMenu()
    return { success: true, isPaused: true }
  })
  
  // Resume tracking
  ipcMain.handle('resume-tracking', () => {
    performanceTracker.resume()
    updateTrayMenu()
    return { success: true, isPaused: false }
  })
  
  // Log visited URLs to console
  ipcMain.handle('log-visited-urls', () => {
    performanceTracker.logVisitedUrls()
    return { success: true }
  })
  
  // Get sync status
  ipcMain.handle('get-sync-status', () => {
    return syncService.getStatus()
  })
  
  // Force sync
  ipcMain.handle('force-sync', async () => {
    await syncService.forcSync()
    return syncService.getStatus()
  })
  
  // Start sync service with session token
  ipcMain.handle('start-sync-service', (event, sessionToken) => {
    console.log('[Main] Starting sync service with session token')
    syncService.start(sessionToken)
    return { success: true }
  })
  
  // Stop sync service
  ipcMain.handle('stop-sync-service', () => {
    syncService.stop()
    return { success: true }
  })
  
  // Get break status
  ipcMain.handle('get-break-status', () => {
    return breakHandler.getStatus()
  })
  
  // Start break (no kiosk mode)
  ipcMain.handle('start-break', (event, breakData) => {
    console.log('[Main] 🚀 BREAK START REQUESTED:', breakData)
    
    // Start break in break handler
    const breakInfo = breakHandler.startBreak(breakData)
    console.log('[Main] Break handler result:', breakInfo)
    
    // Pause performance tracking
    console.log('[Main] Pausing performance tracking...')
    performanceTracker.pause()
    console.log('[Main] Performance tracking paused')
    updateTrayMenu()
    
    return { success: true, break: breakInfo }
  })
  
  // End break (no kiosk mode)
  ipcMain.handle('end-break', () => {
    console.log('[Main] 🛑 BREAK END REQUESTED')
    
    // End break in break handler
    const breakInfo = breakHandler.endBreak()
    console.log('[Main] Break handler result:', breakInfo)
    
    // Resume performance tracking
    console.log('[Main] Resuming performance tracking...')
    performanceTracker.resume()
    console.log('[Main] Performance tracking resumed')
    updateTrayMenu()
    
    return { success: true, break: breakInfo }
  })
  
  // Activity tracker handlers
  ipcMain.handle('get-activity-status', () => {
    return activityTracker.getStatus()
  })
  
  ipcMain.handle('activity-tracker:start', () => {
    activityTracker.startTracking()
    return { success: true }
  })
  
  ipcMain.handle('activity-tracker:stop', () => {
    activityTracker.stopTracking()
    return { success: true }
  })
  
  ipcMain.handle('activity-tracker:set-timeout', (event, milliseconds) => {
    activityTracker.setInactivityTimeout(milliseconds)
    return { success: true }
  })
  
  // Screenshot service handlers
  ipcMain.handle('screenshot:get-status', () => {
    return screenshotService.getStatus()
  })
  
  ipcMain.handle('screenshot:capture-now', async () => {
    return await screenshotService.captureNow()
  })
  
  console.log('[Main] IPC handlers registered')
}

// App lifecycle
app.whenReady().then(async () => {
  console.log('[Main] App ready, initializing...')
  
  // Setup IPC first
  setupIPC()
  
  // Create window
  createWindow()
  
  // Create system tray
  createTray()
  
  // Initialize tracking services
  await initializeTracking()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (mainWindow) {
      mainWindow.show()
    }
  })
})

app.on('window-all-closed', function () {
  // Don't quit the app when all windows are closed
  // Keep running in background (system tray)
  if (process.platform !== 'darwin') {
    // On Windows/Linux, keep running in tray
    console.log('[Main] All windows closed, running in background')
  }
})

app.on('before-quit', () => {
  app.isQuitting = true
  
  // Stop tracking services
  console.log('[Main] Stopping tracking services...')
  performanceTracker.stop()
  syncService.stop()
  activityTracker.destroy()
  screenshotService.destroy()
})

// Handle crashes and errors
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled rejection at:', promise, 'reason:', reason)
})

console.log('[Main] Electron main process started')