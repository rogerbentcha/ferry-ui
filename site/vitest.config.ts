/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Smoke test of the demos (`npm run site:test`): every file of src/demos renders without an error.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      // Before `ferry-ui`: an alias also matches the paths under its name.
      'ferry-ui/charts': fileURLToPath(new URL('../src/charts.ts', import.meta.url)),
      'ferry-ui': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
