import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, clipboard, nativeImage, shell, screen } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { searchTerms, getTermById, terms, CATEGORIES, getCategoryStats } from '../data/terms.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// ─────────────────────────────────────────────────────────────
// Window & Tray references
// ─────────────────────────────────────────────────────────────
let mainWindow = null
let popupWindow = null
let tray = null

// ─────────────────────────────────────────────────────────────
// Create Main Dictionary Window
// ─────────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 550,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../public/icon.png'),
    title: 'Vibecode Wiki',
    backgroundColor: '#0f172a',
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/main-window/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Ẩn thay vì đóng (vẫn chạy ngầm)
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ─────────────────────────────────────────────────────────────
// Create Popup Window
// ─────────────────────────────────────────────────────────────
function createPopupWindow() {
  popupWindow = new BrowserWindow({
    width: 420,
    height: 320,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#00000000',
  })

  if (isDev) {
    popupWindow.loadURL('http://localhost:5174')
  } else {
    popupWindow.loadFile(path.join(__dirname, '../../dist/popup-window/index.html'))
  }

  // Ẩn khi click ra ngoài
  popupWindow.on('blur', () => {
    if (popupWindow && !popupWindow.isDestroyed()) {
      popupWindow.hide()
    }
  })

  popupWindow.on('closed', () => { popupWindow = null })
}

// ─────────────────────────────────────────────────────────────
// Show popup near mouse cursor
// ─────────────────────────────────────────────────────────────
function showPopup(termData, mousePos) {
  if (!popupWindow || popupWindow.isDestroyed()) {
    createPopupWindow()
  }

  const pos = mousePos || screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(pos)
  const { bounds } = display

  let x = pos.x + 15
  let y = pos.y + 15

  // Đảm bảo popup không ra ngoài màn hình
  if (x + 420 > bounds.x + bounds.width) x = pos.x - 435
  if (y + 320 > bounds.y + bounds.height) y = pos.y - 335

  popupWindow.setPosition(Math.round(x), Math.round(y))
  popupWindow.webContents.send('show-term', termData)
  popupWindow.show()
  popupWindow.focus()
}

// ─────────────────────────────────────────────────────────────
// Lookup word from clipboard
// ─────────────────────────────────────────────────────────────
function lookupClipboard() {
  const text = clipboard.readText().trim()
  if (!text) return

  const word = text.split(/\s+/).slice(0, 4).join(' ') // max 4 words
  const results = searchTerms(word)

  if (results.length > 0) {
    showPopup(results[0])
  } else {
    showPopup({ notFound: true, query: word })
  }
}

// ─────────────────────────────────────────────────────────────
// System Tray Icon & Menu
// ─────────────────────────────────────────────────────────────
function createTray() {
  // Tạo icon tray inline (16x16 data URL)
  const iconDataURL = createTrayIconDataURL()
  const icon = nativeImage.createFromDataURL(iconDataURL)
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📖 Mở Vibecode Wiki',
      click: () => {
        if (!mainWindow) createMainWindow()
        else {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: '🔍 Tra từ trong clipboard (⌘+Shift+V)',
      click: () => lookupClipboard()
    },
    { type: 'separator' },
    {
      label: '🌐 GitHub',
      click: () => shell.openExternal('https://github.com/vibecode/wiki')
    },
    { type: 'separator' },
    {
      label: '❌ Thoát',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('Vibecode Wiki - Từ điển lập trình')

  // Double click → mở main window
  tray.on('double-click', () => {
    if (!mainWindow) createMainWindow()
    else {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // macOS: click icon → toggle main window
  if (process.platform === 'darwin') {
    tray.on('click', () => {
      if (mainWindow?.isVisible()) mainWindow.hide()
      else {
        if (!mainWindow) createMainWindow()
        else { mainWindow.show(); mainWindow.focus() }
      }
    })
  }
}

// ─────────────────────────────────────────────────────────────
// Tray icon (SVG → base64)
// ─────────────────────────────────────────────────────────────
function createTrayIconDataURL() {
  // 16x16 SVG book icon
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
    <rect width="16" height="16" rx="3" fill="#6366f1"/>
    <text x="8" y="12" text-anchor="middle" font-size="10" font-family="serif" fill="white">W</text>
  </svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

// ─────────────────────────────────────────────────────────────
// IPC Handlers
// ─────────────────────────────────────────────────────────────
function setupIPC() {
  // Search terms
  ipcMain.handle('search-terms', (_, query) => {
    return searchTerms(query)
  })

  // Get term by ID
  ipcMain.handle('get-term', (_, id) => {
    return getTermById(id)
  })

  // Get all terms
  ipcMain.handle('get-all-terms', () => {
    return { terms, categories: CATEGORIES, stats: getCategoryStats() }
  })

  // Close popup
  ipcMain.on('close-popup', () => {
    popupWindow?.hide()
  })

  // Open term in main window
  ipcMain.on('open-in-main', (_, termId) => {
    popupWindow?.hide()
    if (!mainWindow) createMainWindow()
    else {
      mainWindow.show()
      mainWindow.focus()
    }
    mainWindow?.webContents.send('navigate-to-term', termId)
  })

  // Lookup text
  ipcMain.handle('lookup-text', (_, text) => {
    const results = searchTerms(text)
    return results.slice(0, 5)
  })
}

// ─────────────────────────────────────────────────────────────
// Global Shortcuts
// ─────────────────────────────────────────────────────────────
function registerShortcuts() {
  // Tra từ trong clipboard
  const lookupShortcut = process.platform === 'darwin' ? 'CommandOrControl+Shift+V' : 'CommandOrControl+Shift+V'
  globalShortcut.register(lookupShortcut, () => {
    lookupClipboard()
  })

  // Toggle main window
  globalShortcut.register('CommandOrControl+Shift+W', () => {
    if (!mainWindow) {
      createMainWindow()
    } else if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

// ─────────────────────────────────────────────────────────────
// App Lifecycle
// ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // macOS dock icon
  if (process.platform === 'darwin') {
    app.dock.hide() // ẩn dock icon khi tray mode
  }

  setupIPC()
  createTray()
  createMainWindow()
  createPopupWindow()
  registerShortcuts()

  app.on('activate', () => {
    if (!mainWindow) createMainWindow()
    else { mainWindow.show(); mainWindow.focus() }
  })
})

app.on('window-all-closed', (e) => {
  // Không quit khi đóng hết window - vẫn chạy ngầm qua tray
  e.preventDefault()
})

app.on('before-quit', () => {
  app.isQuitting = true
  globalShortcut.unregisterAll()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
