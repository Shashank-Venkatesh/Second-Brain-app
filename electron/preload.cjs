const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  authenticateGmail: () => ipcRenderer.invoke('authenticate-gmail'),
  syncGmailDomain: (domain, folderPath) => ipcRenderer.invoke('sync-gmail-domain', { domain, folderPath }),
})
