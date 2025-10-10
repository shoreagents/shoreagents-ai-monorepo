const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  // Add any Electron APIs you want to expose to the renderer here
  platform: process.platform,
})

