import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer/popup-window',
  base: './',
  server: {
    port: 5174,
    // Serve both index.html (popup) and search.html from popup-window root
  },
  build: {
    outDir: resolve(__dirname, 'dist/popup-window'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/renderer/popup-window/index.html'),
        search: resolve(__dirname, 'src/renderer/popup-window/search.html'),
      }
    }
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src/renderer/popup-window/src') }
  }
})
