import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  outputDir: '../output/playwright/test-results-contract',
  use: {
    baseURL: 'http://127.0.0.1:9099',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})
