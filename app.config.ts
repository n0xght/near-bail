import { defineConfig } from '@tanstack/react-start/config'

export default defineConfig({
  server: {
    preset: 'cloudflare-module',
    compatibilityDate: '2025-02-14',
  },
  tsr: {
    appDirectory: './app',
  },
})
