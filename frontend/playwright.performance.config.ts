import { defineConfig, devices } from '@playwright/test'
import baseConfig from './playwright.config'

export default defineConfig(baseConfig, {
  projects: [
    {
      name: 'chromium-performance',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
    },
  ],
})
