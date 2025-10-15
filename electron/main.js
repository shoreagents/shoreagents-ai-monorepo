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
let kioskWindows = [] // Array to hold kiosk mode windows during breaks

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

// Kiosk mode functions for break enforcement
function enterKioskMode(breakType, breakData) {
  console.log('[Main] Entering kiosk mode for break:', breakType)
  
  // Get all displays
  const { screen } = require('electron')
  const displays = screen.getAllDisplays()
  const primaryDisplay = screen.getPrimaryDisplay()
  
  console.log('[Main] Found displays:', displays.length)
  console.log('[Main] Primary display ID:', primaryDisplay.id)
  
  // Close any existing kiosk windows
  exitKioskMode()
  
  displays.forEach((display, index) => {
    const isPrimary = display.id === primaryDisplay.id
    
    console.log(`[Main] Creating window on display ${index} (ID: ${display.id}, Primary: ${isPrimary})`)
    
    const kioskWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      show: false, // Don't show until loaded
      fullscreen: false, // We'll set this after window loads
      kiosk: false, // We'll set this after window loads
      alwaysOnTop: true,
      frame: false,
      transparent: false,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      closable: false,
      autoHideMenuBar: true,
      backgroundColor: '#000000',
      hasShadow: false,
      titleBarStyle: 'hidden',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        devTools: false,
      },
    })
    
    // Load different content based on whether it's primary or secondary
    const isDev = !app.isPackaged
    
    if (isPrimary) {
      // Primary monitor shows the break page
      const breakUrl = `http://localhost:3000/breaks?kiosk=true&type=${breakType}&display=primary`
      console.log('[Main] Loading break page on primary display:', breakUrl)
      
      kioskWindow.loadURL(breakUrl).then(() => {
        console.log('[Main] Primary display loaded successfully')
      }).catch((err) => {
        console.error('[Main] Error loading primary display:', err)
      })
      
      // Show window when ready
      kioskWindow.webContents.once('did-finish-load', () => {
        console.log('[Main] Primary display finished loading, showing window')
        
        // Force fullscreen and kiosk mode on Windows BEFORE showing
        if (process.platform === 'win32') {
          console.log('[Main] Applying Windows-specific kiosk settings')
          // Set bounds to cover entire screen including taskbar area
          kioskWindow.setBounds({
            x: display.bounds.x,
            y: display.bounds.y,
            width: display.bounds.width,
            height: display.bounds.height
          })
          // Set kiosk mode (this should hide taskbar on Windows)
          kioskWindow.setKiosk(true)
          console.log('[Main] Kiosk mode set')
        }
        
        kioskWindow.show()
        kioskWindow.focus()
        
        // Additional settings after show
        if (process.platform === 'win32') {
          kioskWindow.setAlwaysOnTop(true, 'screen-saver', 1)
          kioskWindow.maximize()
          // Force focus multiple times
          setTimeout(() => {
            kioskWindow.focus()
            kioskWindow.moveTop()
          }, 50)
          setTimeout(() => {
            kioskWindow.focus()
          }, 200)
        } else {
          kioskWindow.setFullScreen(true)
        }
      })
      
      // Log any load failures
      kioskWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('[Main] Primary display failed to load:', errorCode, errorDescription)
      })
    } else {
      // Secondary monitors show black screen
      console.log('[Main] Loading black screen on secondary display', index)
      kioskWindow.loadURL(`data:text/html,<!DOCTYPE html><html><head><style>body{margin:0;padding:0;background:#000;overflow:hidden;}</style></head><body></body></html>`)
      
      kioskWindow.webContents.once('did-finish-load', () => {
        console.log('[Main] Secondary display finished loading, showing window')
        
        // Force fullscreen and kiosk mode on Windows BEFORE showing
        if (process.platform === 'win32') {
          kioskWindow.setBounds({
            x: display.bounds.x,
            y: display.bounds.y,
            width: display.bounds.width,
            height: display.bounds.height
          })
          kioskWindow.setKiosk(true)
        }
        
        kioskWindow.show()
        
        // Additional settings after show
        if (process.platform === 'win32') {
          kioskWindow.setAlwaysOnTop(true, 'screen-saver', 1)
          kioskWindow.maximize()
        } else {
          kioskWindow.setFullScreen(true)
        }
      })
    }
    
    // Prevent closing
    kioskWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault()
        console.log('[Main] Prevented kiosk window close attempt')
      }
    })
    
    // Disable keyboard shortcuts that might exit fullscreen
    kioskWindow.webContents.on('before-input-event', (event, input) => {
      // Block Alt+F4, Alt+Tab, Windows key, etc.
      if (
        (input.key === 'F4' && input.alt) ||
        (input.key === 'Tab' && input.alt) ||
        input.key === 'Meta' ||
        input.key === 'F11' ||
        input.key === 'Escape' ||
        (input.key === 'w' && input.control) ||
        (input.key === 'q' && input.control)
      ) {
        event.preventDefault()
        console.log('[Main] Blocked keyboard shortcut:', input.key)
      }
    })
    
    kioskWindows.push(kioskWindow)
  })
  
  // Hide the main window
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide()
  }
  
  console.log('[Main] Kiosk mode activated on', kioskWindows.length, 'displays')
}

function exitKioskMode() {
  console.log('[Main] Exiting kiosk mode')
  
  // Close all kiosk windows
  kioskWindows.forEach(window => {
    if (window && !window.isDestroyed()) {
      window.destroy()
    }
  })
  
  kioskWindows = []
  
  // Show the main window and navigate to home
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Navigate main window to home page (not the break page)
    const isDev = !app.isPackaged
    const homeUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../out/index.html')}`
    
    console.log('[Main] Navigating main window to:', homeUrl)
    mainWindow.loadURL(homeUrl).then(() => {
      console.log('[Main] Main window navigated successfully')
      mainWindow.show()
      mainWindow.focus()
    }).catch((err) => {
      console.error('[Main] Error navigating main window:', err)
      // Still show the window even if navigation fails
      mainWindow.show()
      mainWindow.focus()
    })
  }
  
  console.log('[Main] Kiosk mode deactivated')
}

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
  
  // Start break (with kiosk mode)
  ipcMain.handle('start-break', (event, breakData) => {
    console.log('[Main] Starting break:', breakData)
    
    // Start break in break handler
    const breakInfo = breakHandler.startBreak(breakData)
    
    // Enter kiosk mode
    enterKioskMode(breakData.type, breakData)
    
    // Pause performance tracking
    performanceTracker.pause()
    updateTrayMenu()
    
    return { success: true, break: breakInfo }
  })
  
  // End break (exit kiosk mode)
  ipcMain.handle('end-break', () => {
    console.log('[Main] Ending break')
    
    // End break in break handler
    const breakInfo = breakHandler.endBreak()
    
    // Exit kiosk mode
    exitKioskMode()
    
    // Resume performance tracking
    performanceTracker.resume()
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