const { contextBridge, ipcRenderer } = require('electron')

// Expose Electron APIs to renderer process
contextBridge.exposeInMainWorld('electron', {
  // Platform info
  platform: process.platform,
  
  // Performance Tracking API
  performance: {
    // Get current metrics
    getCurrentMetrics: () => ipcRenderer.invoke('get-current-metrics'),
    
    // Get tracking status
    getStatus: () => ipcRenderer.invoke('get-tracking-status'),
    
    // Pause tracking
    pause: () => ipcRenderer.invoke('pause-tracking'),
    
    // Resume tracking
    resume: () => ipcRenderer.invoke('resume-tracking'),
    
    // Listen for metrics updates
    onMetricsUpdate: (callback) => {
      const subscription = (event, data) => callback(data)
      ipcRenderer.on('metrics-update', subscription)
      
      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener('metrics-update', subscription)
      }
    },
    
    // Listen for tracking status changes
    onStatusChange: (callback) => {
      const subscription = (event, status) => callback(status)
      ipcRenderer.on('tracking-status', subscription)
      
      return () => {
        ipcRenderer.removeListener('tracking-status', subscription)
      }
    },
  },
  
  // Sync Service API
  sync: {
    // Get sync status
    getStatus: () => ipcRenderer.invoke('get-sync-status'),
    
    // Force immediate sync
    forceSync: () => ipcRenderer.invoke('force-sync'),
    
    // Start sync service with session token
    start: (sessionToken) => ipcRenderer.invoke('start-sync-service', sessionToken),
    
    // Stop sync service
    stop: () => ipcRenderer.invoke('stop-sync-service'),
  },
  
  // Break Handler API
  breaks: {
    // Get break status
    getStatus: () => ipcRenderer.invoke('get-break-status'),
    
    // Start break with kiosk mode
    start: (breakData) => ipcRenderer.invoke('start-break', breakData),
    
    // End break and exit kiosk mode
    end: () => ipcRenderer.invoke('end-break'),
    
    // Notify main process of break start (legacy)
    notifyBreakStart: (breakData) => {
      ipcRenderer.send('break-started', breakData)
    },
    
    // Notify main process of break end (legacy)
    notifyBreakEnd: (breakData) => {
      ipcRenderer.send('break-ended', breakData)
    },
    
    // Listen for break selector requests
    onShowBreakSelector: (callback) => {
      const subscription = () => callback()
      ipcRenderer.on('show-break-selector', subscription)
      
      return () => {
        ipcRenderer.removeListener('show-break-selector', subscription)
      }
    },
  },
  
  // Navigation API
  navigation: {
    // Listen for navigation requests
    onNavigateTo: (callback) => {
      const subscription = (event, path) => callback(path)
      ipcRenderer.on('navigate-to', subscription)
      
      return () => {
        ipcRenderer.removeListener('navigate-to', subscription)
      }
    },
  },
  
  // Permissions API
  permissions: {
    // Listen for permission requests
    onPermissionsNeeded: (callback) => {
      const subscription = (event, instructions) => callback(instructions)
      ipcRenderer.on('permissions-needed', subscription)
      
      return () => {
        ipcRenderer.removeListener('permissions-needed', subscription)
      }
    },
  },
  
  // Utility to check if running in Electron
  isElectron: true,
})

console.log('[Preload] Electron APIs exposed to renderer')
