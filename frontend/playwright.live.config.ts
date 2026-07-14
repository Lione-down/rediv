import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

type LivePhase = 'pre-restart' | 'post-restart'

function requiredEnvironment(name: string) {
  const value = process.env[name]
  if (!value?.trim()) {
    throw new Error(`${name} is required for live acceptance`)
  }
  return value.trim()
}

function requiredLoopbackOrigin(name: string) {
  const rawValue = requiredEnvironment(name)
  let url: URL
  try {
    url = new URL(rawValue)
  } catch {
    throw new Error(`${name} must be an absolute URL`)
  }

  if (
    url.protocol !== 'http:'
    || url.hostname !== '127.0.0.1'
    || url.username
    || url.password
    || url.pathname !== '/'
    || url.search
    || url.hash
  ) {
    throw new Error(`${name} must be a credential-free http://127.0.0.1 origin`)
  }
  return url.origin
}

function requiredPhase(): LivePhase {
  const phase = requiredEnvironment('REVID_LIVE_PHASE')
  if (phase !== 'pre-restart' && phase !== 'post-restart') {
    throw new Error('REVID_LIVE_PHASE must be pre-restart or post-restart')
  }
  return phase
}

function requiredManifestPath() {
  const manifestPath = path.resolve(requiredEnvironment('REVID_LIVE_MANIFEST_PATH'))
  const frontendRoot = fileURLToPath(new URL('.', import.meta.url))
  const runtimeRoot = path.resolve(frontendRoot, '../output/runtime')
  const relativePath = path.relative(runtimeRoot, manifestPath)
  const parts = relativePath.split(path.sep).filter(Boolean)

  if (
    !path.isAbsolute(requiredEnvironment('REVID_LIVE_MANIFEST_PATH'))
    || !relativePath
    || relativePath.startsWith('..')
    || path.isAbsolute(relativePath)
    || parts.length !== 2
    || path.extname(manifestPath).toLowerCase() !== '.json'
  ) {
    throw new Error('REVID_LIVE_MANIFEST_PATH must be an absolute JSON path under output/runtime/<run>/')
  }
  return manifestPath
}

const appOrigin = requiredLoopbackOrigin('REVID_LIVE_APP_ORIGIN')
const apiOrigin = requiredLoopbackOrigin('REVID_LIVE_API_ORIGIN')
const phase = requiredPhase()
const manifestPath = requiredManifestPath()
const runId = path.basename(path.dirname(manifestPath))

if (appOrigin === apiOrigin) {
  throw new Error('Live app and API origins must use distinct owned ports')
}

export default defineConfig({
  testDir: './tests/live',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: 'line',
  outputDir: `../output/playwright/t5-008-live/${runId}/${phase}/test-results`,
  use: {
    baseURL: appOrigin,
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
