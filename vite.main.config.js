import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer/main-window',
  base: './',
  server: { port: 5173 },
  build: {
    outDir: resolve(__dirname, 'dist/main-window'),
    emptyOutDir: true,
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src/renderer/main-window/src') }
  }
})
