/**
 * Preload script for Inactivity Dialog
 * Exposes safe APIs for the dialog window
 */

const { contextBridge, ipcRenderer } = require('electron')

// Expose secure APIs to the dialog window
contextBridge.exposeInMainWorld('electronAPI', {
  // Listen for counter updates
  onUpdateCounter: (callback) => {
    ipcRenderer.on('update-counter', (event, seconds) => {
      callback(seconds)
    })
  },
  
})

console.log('[Inactivity Dialog Preload] APIs exposed')
