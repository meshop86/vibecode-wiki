import { contextBridge, ipcRenderer } from 'electron'

// Expose safe API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Data
  searchTerms: (query) => ipcRenderer.invoke('search-terms', query),
  getTerm: (id) => ipcRenderer.invoke('get-term', id),
  getAllTerms: () => ipcRenderer.invoke('get-all-terms'),
  lookupText: (text) => ipcRenderer.invoke('lookup-text', text),

  // Popup actions
  closePopup: () => ipcRenderer.send('close-popup'),
  openInMain: (termId) => ipcRenderer.send('open-in-main', termId),

  // Event listeners
  onShowTerm: (callback) => {
    ipcRenderer.on('show-term', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('show-term')
  },
  onNavigateToTerm: (callback) => {
    ipcRenderer.on('navigate-to-term', (_, termId) => callback(termId))
    return () => ipcRenderer.removeAllListeners('navigate-to-term')
  },
})
