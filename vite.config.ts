import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  // Native WebViews load the app from file://, while web deployments need
  // root-relative assets so nested routes such as /purchase/new can load.
  base: mode === 'client' ? './' : '/',
  // Keep large generated artifacts out of Vite's watcher. Desktop/APK
  // builds write into these folders and can otherwise trigger EBUSY watcher
  // errors that stop the local dev server while the app is being tested.
  server: {
    watch: {
      ignored: [
        '**/dist/**',
        '**/release/**',
        '**/android/.gradle/**',
        '**/android/app/build/**',
      ],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
  ],
}))
