'use strict'

const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, clipboard, nativeImage, shell, screen, dialog } = require('electron')
const path = require('path')
const { exec } = require('child_process')
const fs = require('fs')
const { pathToFileURL } = require('url')

let termsModule = null
async function getTermsModule() {
  if (!termsModule) {
    const termsPath = path.join(__dirname, '../data/terms.js')
    termsModule = await import(pathToFileURL(termsPath).href)
  }
  return termsModule
}

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow = null
let popupWindow = null
let searchWindow = null
let tray = null
let popupShownAt = 0
let searchShownAt = 0

// ─── Main Dictionary Window ───────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100, height: 750, minWidth: 800, minHeight: 550,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../public/icon.png'),
    title: 'Vibecode Wiki',
    backgroundColor: '#0f172a',
  })
  if (isDev) mainWindow.loadURL('http://localhost:5173')
  else mainWindow.loadFile(path.join(__dirname, '../../dist/main-window/index.html'))
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('close', (e) => { if (!app.isQuitting) { e.preventDefault(); mainWindow.hide() } })
  mainWindow.on('closed', () => { mainWindow = null })

  // ── Right-click context menu ──
  mainWindow.webContents.on('context-menu', async (e, params) => {
    const items = []
    const sel = params.selectionText?.trim()
    if (sel) {
      const label = sel.length > 28 ? sel.slice(0, 28) + '…' : sel
      items.push({
        label: `🔍 Tìm định nghĩa: "${label}"`,
        click: async () => {
          const { searchTerms } = await getTermsModule()
          const results = searchTerms(sel)
          const pos = screen.getCursorScreenPoint()
          showPopup(results.length > 0 ? results[0] : { notFound: true, query: sel }, pos)
        }
      })
      items.push({ type: 'separator' })
    }
    if (params.isEditable) {
      if (params.editFlags.canUndo) items.push({ role: 'undo' })
      if (params.editFlags.canRedo) items.push({ role: 'redo' })
      if (sel || params.isEditable) items.push({ type: 'separator' })
    }
    if (sel) items.push({ role: 'copy' })
    if (params.isEditable) items.push({ role: 'paste' })
    if (items.length > 0) Menu.buildFromTemplate(items).popup({ window: mainWindow })
  })
}

// ─── Popup Window (term detail, near cursor) ──────────────────
function createPopupWindow() {
  popupWindow = new BrowserWindow({
    width: 440, height: 330, show: false,
    frame: false, transparent: true, alwaysOnTop: true,
    resizable: false, skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false,
    },
    backgroundColor: '#00000000',
  })
  if (isDev) popupWindow.loadURL('http://localhost:5174')
  else popupWindow.loadFile(path.join(__dirname, '../../dist/popup-window/index.html'))
  popupWindow.on('blur', () => {
    if (Date.now() - popupShownAt < 500) return
    if (popupWindow && !popupWindow.isDestroyed()) popupWindow.hide()
  })
  popupWindow.on('closed', () => { popupWindow = null })
}

// ─── Search Window (spotlight-style, centered) ────────────────
function createSearchWindow() {
  searchWindow = new BrowserWindow({
    width: 580, height: 420, show: false,
    frame: false, transparent: true, alwaysOnTop: true,
    resizable: false, skipTaskbar: true, hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false,
    },
    backgroundColor: '#00000000',
  })
  if (isDev) {
    searchWindow.loadURL('http://localhost:5174/search.html')
    // Uncomment to debug search window:
    // searchWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    searchWindow.loadFile(path.join(__dirname, '../../dist/popup-window/search.html'))
  }
  searchWindow.on('blur', () => {
    if (Date.now() - searchShownAt < 500) return
    if (searchWindow && !searchWindow.isDestroyed()) searchWindow.hide()
  })
  searchWindow.on('closed', () => { searchWindow = null })
}

// ─── Show popup near cursor ───────────────────────────────────
function showPopup(termData, mousePos) {
  if (!popupWindow || popupWindow.isDestroyed()) createPopupWindow()
  const pos = mousePos || screen.getCursorScreenPoint()
  const { bounds } = screen.getDisplayNearestPoint(pos)
  let x = pos.x + 15, y = pos.y + 15
  if (x + 440 > bounds.x + bounds.width) x = pos.x - 455
  if (y + 330 > bounds.y + bounds.height) y = pos.y - 345
  x = Math.max(bounds.x + 8, Math.min(x, bounds.x + bounds.width - 448))
  y = Math.max(bounds.y + 8, Math.min(y, bounds.y + bounds.height - 338))
  popupShownAt = Date.now()
  popupWindow.setPosition(Math.round(x), Math.round(y))
  popupWindow.setAlwaysOnTop(true, 'floating')
  popupWindow.webContents.send('show-term', termData)
  popupWindow.show()
  popupWindow.focus()
}

// ─── Show search window centered ─────────────────────────────
function showSearchWindow() {
  if (!searchWindow || searchWindow.isDestroyed()) createSearchWindow()
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const { bounds } = display
  const w = 580
  const x = Math.round(bounds.x + (bounds.width - w) / 2)
  const y = Math.round(bounds.y + bounds.height * 0.22)
  searchWindow.setSize(580, 420)
  searchWindow.setPosition(x, y)
  searchShownAt = Date.now()
  searchWindow.setAlwaysOnTop(true, 'floating')
  searchWindow.show()
  searchWindow.focus()
  searchWindow.webContents.focus()
  // Send after show so renderer can focus input properly
  setTimeout(() => searchWindow?.webContents.send('search-open'), 80)
}

// ─── Lookup from selected text (auto-copy) ───────────────────
async function lookupSelectedText() {
  const oldClip = clipboard.readText()
  if (process.platform === 'darwin') {
    await new Promise((resolve) => {
      exec(`osascript -e 'tell application "System Events" to keystroke "c" using command down'`, () => resolve())
    })
    await new Promise(r => setTimeout(r, 180))
  } else if (process.platform === 'win32') {
    await new Promise((resolve) => {
      exec(`powershell -command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('^c')"`, () => resolve())
    })
    await new Promise(r => setTimeout(r, 200))
  }
  const newText = clipboard.readText().trim()
  if (newText && newText !== oldClip) {
    const word = newText.split(/\s+/).slice(0, 5).join(' ')
    const { searchTerms } = await getTermsModule()
    const results = searchTerms(word)
    showPopup(results.length > 0 ? results[0] : { notFound: true, query: word })
    if (oldClip !== undefined) setTimeout(() => clipboard.writeText(oldClip), 2500)
  } else if (oldClip.trim()) {
    const word = oldClip.trim().split(/\s+/).slice(0, 5).join(' ')
    const { searchTerms } = await getTermsModule()
    const results = searchTerms(word)
    showPopup(results.length > 0 ? results[0] : { notFound: true, query: word })
  } else {
    showSearchWindow()
  }
}

// ─── System Tray ─────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, '../../public/tray-icon.png')
  let icon
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath)
    if (process.platform === 'darwin') {
      icon = icon.resize({ width: 16, height: 16 })
      icon.setTemplateImage(true)
    }
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M10.5 1L4 9h5.5L7 15 14 7H8.5L10.5 1z" fill="black"/></svg>`
    icon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`)
    if (process.platform === 'darwin') icon.setTemplateImage(true)
  }
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: '📖 Mở Vibecode Wiki', click: () => { if (!mainWindow) createMainWindow(); else { mainWindow.show(); mainWindow.focus() } } },
    { label: '🔍 Tìm kiếm nhanh  ⌘⇧F', click: () => showSearchWindow() },
    { label: '📋 Tra từ đang chọn  ⌘⇧V', click: () => lookupSelectedText() },
    { type: 'separator' },
    { label: '❌ Thoát', click: () => { app.isQuitting = true; app.quit() } }
  ])
  tray.setContextMenu(contextMenu)
  tray.setToolTip('Vibecode Wiki — ⌘⇧F: Tìm kiếm | ⌘⇧V: Tra từ')
  if (process.platform === 'darwin') {
    tray.on('click', () => {
      if (mainWindow?.isVisible()) mainWindow.hide()
      else { if (!mainWindow) createMainWindow(); else { mainWindow.show(); mainWindow.focus() } }
    })
  }
  tray.on('double-click', () => { if (!mainWindow) createMainWindow(); else { mainWindow.show(); mainWindow.focus() } })
}

// ─── IPC Handlers ─────────────────────────────────────────────
function setupIPC() {
  ipcMain.handle('search-terms', async (_, query) => { const { searchTerms } = await getTermsModule(); return searchTerms(query) })
  ipcMain.handle('get-term', async (_, id) => { const { getTermById } = await getTermsModule(); return getTermById(id) })
  ipcMain.handle('get-all-terms', async () => { const { terms, CATEGORIES, getCategoryStats } = await getTermsModule(); return { terms, categories: CATEGORIES, stats: getCategoryStats() } })
  ipcMain.handle('lookup-text', async (_, text) => { const { searchTerms } = await getTermsModule(); return searchTerms(text).slice(0, 8) })
  // Popup
  ipcMain.on('close-popup', () => popupWindow?.hide())
  ipcMain.on('open-in-main', (_, termId) => {
    popupWindow?.hide()
    if (!mainWindow) createMainWindow(); else { mainWindow.show(); mainWindow.focus() }
    setTimeout(() => mainWindow?.webContents.send('navigate-to-term', termId), 150)
  })
  // Search window
  ipcMain.on('close-search', () => searchWindow?.hide())
  ipcMain.on('search-open-in-main', (_, termId) => {
    searchWindow?.hide()
    if (!mainWindow) createMainWindow(); else { mainWindow.show(); mainWindow.focus() }
    setTimeout(() => mainWindow?.webContents.send('navigate-to-term', termId), 150)
  })
  ipcMain.on('search-show-popup', (_, termData) => {
    searchWindow?.hide()
    const pos = screen.getCursorScreenPoint()
    const { bounds } = screen.getDisplayNearestPoint(pos)
    showPopup(termData, { x: Math.round(bounds.x + bounds.width / 2 - 220), y: Math.round(bounds.y + bounds.height * 0.22 + 80) })
  })
  ipcMain.on('search-resize', (_, height) => {
    if (searchWindow && !searchWindow.isDestroyed()) {
      searchWindow.setSize(580, Math.min(500, Math.max(64, Math.round(height))))
    }
  })

  // ── Import terms from file ──────────────────────────────────
  ipcMain.handle('import-terms-file', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow || BrowserWindow.getFocusedWindow(), {
      title: 'Chọn file thuật ngữ',
      buttonLabel: 'Thêm vào thư viện',
      filters: [
        { name: 'JavaScript / JSON', extensions: ['js', 'json'] },
        { name: 'Tất cả file', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
    if (canceled || !filePaths.length) return { cancelled: true }

    try {
      const filePath = filePaths[0]
      const ext = path.extname(filePath).toLowerCase()
      const raw = fs.readFileSync(filePath, 'utf-8')
      let newTerms = []

      if (ext === '.json') {
        const parsed = JSON.parse(raw)
        newTerms = Array.isArray(parsed) ? parsed : parsed.terms || []
      } else {
        // .js file: extract array literals or export default [...]
        const arrayMatch = raw.match(/(?:export\s+default\s*|(?:const|let|var)\s+\w+\s*=\s*)\[(\s*\{[\s\S]*?\}\s*(?:,\s*\{[\s\S]*?\}\s*)*)\]/)
        if (!arrayMatch) {
          // Try to eval safely by extracting JSON-like object array
          return { success: false, error: 'Không tìm thấy mảng thuật ngữ trong file. File phải chứa array [{id,term,...}]' }
        }
        try {
          newTerms = JSON.parse('[' + arrayMatch[1] + ']')
        } catch {
          return { success: false, error: 'File JS có cú pháp không hợp lệ để parse' }
        }
      }

      // Validate schema
      const valid = newTerms.filter(t => t && typeof t.id === 'string' && typeof t.term === 'string' && typeof t.definition === 'string')
      if (!valid.length) return { success: false, error: 'Không có thuật ngữ hợp lệ (cần có id, term, definition)' }

      // Load current terms
      const { terms: existingTerms } = await getTermsModule()
      const existingIds = new Set(existingTerms.map(t => t.id))
      const toAdd = valid.filter(t => !existingIds.has(t.id))
      if (!toAdd.length) return { success: false, error: `Tất cả ${valid.length} thuật ngữ đã tồn tại trong thư viện` }

      // Append to terms.js
      const termsFilePath = path.join(__dirname, '../data/terms.js')
      const termsRaw = fs.readFileSync(termsFilePath, 'utf-8')
      const appendStr = toAdd.map(t => {
        // Sanitize and stringify each term
        const clean = {
          id: t.id,
          term: t.term,
          category: t.category || 'javascript',
          definition: t.definition,
          ...(t.usage ? { usage: t.usage } : {}),
          ...(t.example ? { example: t.example } : {}),
          ...(t.tags ? { tags: t.tags } : {}),
        }
        return '  ' + JSON.stringify(clean, null, 2).replace(/\n/g, '\n  ')
      }).join(',\n')
      const newRaw = termsRaw.replace(/\n\];/, `\n,\n${appendStr}\n];`)
      fs.writeFileSync(termsFilePath, newRaw, 'utf-8')

      // Bust module cache so next import reload
      termsModule = null
      const { terms: updated } = await getTermsModule()
      return { success: true, added: toAdd.length, totalCount: updated.length, skipped: valid.length - toAdd.length }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })
}

// ─── Global Shortcuts ─────────────────────────────────────────
function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+V', () => lookupSelectedText())
  globalShortcut.register('CommandOrControl+Shift+F', () => {
    if (searchWindow?.isVisible()) searchWindow.hide(); else showSearchWindow()
  })
  globalShortcut.register('CommandOrControl+Shift+W', () => {
    if (!mainWindow) createMainWindow()
    else if (mainWindow.isVisible()) mainWindow.hide()
    else { mainWindow.show(); mainWindow.focus() }
  })
}

// ─── App Lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock.hide()
  setupIPC()
  createTray()
  createMainWindow()
  createPopupWindow()
  createSearchWindow()
  registerShortcuts()
  app.on('activate', () => { if (!mainWindow) createMainWindow(); else { mainWindow.show(); mainWindow.focus() } })
})

app.on('window-all-closed', (e) => e.preventDefault())
app.on('before-quit', () => { app.isQuitting = true; globalShortcut.unregisterAll() })
