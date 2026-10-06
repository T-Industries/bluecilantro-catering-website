import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@shared': path.resolve(__dirname, '../shared') },
  },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    // API runs on :4000 in development; proxying keeps admin cookies same-origin.
    proxy: { '/api': 'http://localhost:4000' },
  },
})
