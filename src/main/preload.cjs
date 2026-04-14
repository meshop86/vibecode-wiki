'use strict'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Data
  searchTerms: (query) => ipcRenderer.invoke('search-terms', query),
  getTerm: (id) => ipcRenderer.invoke('get-term', id),
  getAllTerms: () => ipcRenderer.invoke('get-all-terms'),
  lookupText: (text) => ipcRenderer.invoke('lookup-text', text),

  // Popup actions
  closePopup: () => ipcRenderer.send('close-popup'),
  openInMain: (termId) => ipcRenderer.send('open-in-main', termId),

  // Search window actions
  closeSearch: () => ipcRenderer.send('close-search'),
  openSearchInMain: (termId) => ipcRenderer.send('search-open-in-main', termId),
  showPopupFromSearch: (termData) => ipcRenderer.send('search-show-popup', termData),
  resizeSearch: (height) => ipcRenderer.send('search-resize', height),

  // File import
  importTermsFile: () => ipcRenderer.invoke('import-terms-file'),

  // Event listeners
  onShowTerm: (callback) => {
    ipcRenderer.on('show-term', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('show-term')
  },
  onNavigateToTerm: (callback) => {
    ipcRenderer.on('navigate-to-term', (_, termId) => callback(termId))
    return () => ipcRenderer.removeAllListeners('navigate-to-term')
  },
  onSearchOpen: (callback) => {
    ipcRenderer.on('search-open', () => callback())
    return () => ipcRenderer.removeAllListeners('search-open')
  },
})
