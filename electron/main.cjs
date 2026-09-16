const { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } = require('electron')
const path = require('node:path')
const { authenticateGmail, syncGmailDomain } = require('./gmail-oauth.cjs')

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 980,
    minHeight: 700,
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
  })

  return result.canceled ? null : result.filePaths[0] ?? null
})

ipcMain.handle('authenticate-gmail', async () => authenticateGmail({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  safeStorage,
  shell,
  userDataPath: app.getPath('userData'),
}))

ipcMain.handle('sync-gmail-domain', async (_event, { domain, folderPath }) => syncGmailDomain({
  domain,
  folderPath,
  safeStorage,
  userDataPath: app.getPath('userData'),
}))

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
