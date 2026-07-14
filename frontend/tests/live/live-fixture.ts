import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  expect,
  test as base,
  type APIRequestContext,
  type Page,
} from '@playwright/test'

export type LivePhase = 'pre-restart' | 'post-restart'

export interface LiveManifest {
  run: string
  project: string
  canvas: string
  checksum: string
  revision: number
  count: {
    canvases: number
    nodes: number
    connections: number
  }
}

interface LiveEnvironment {
  appOrigin: string
  apiOrigin: string
  phase: LivePhase
  manifestPath: string
  runId: string
}

interface LiveSession {
  getJson: <T>(pathname: string) => Promise<T>
  postJson: <T>(pathname: string, data: unknown) => Promise<T>
  requestJson: <T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', pathname: string, data?: unknown) => Promise<{ status: number; data: T }>
}

export interface LiveBoundary extends LiveEnvironment {
  login: (request: APIRequestContext, page: Page) => Promise<LiveSession>
  readManifest: () => Promise<LiveManifest>
  writeManifest: (manifest: LiveManifest) => Promise<void>
  readState: <T>() => Promise<T>
  writeState: (value: unknown) => Promise<void>
}

function requiredEnvironment(name: string, trim = true) {
  const value = process.env[name]
  if (!value || (trim && !value.trim())) {
    throw new Error(`${name} is required for live acceptance`)
  }
  return trim ? value.trim() : value
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

function loadLiveEnvironment(): LiveEnvironment {
  const appOrigin = requiredLoopbackOrigin('REVID_LIVE_APP_ORIGIN')
  const apiOrigin = requiredLoopbackOrigin('REVID_LIVE_API_ORIGIN')
  if (appOrigin === apiOrigin) {
    throw new Error('Live app and API origins must use distinct owned ports')
  }

  const phaseValue = requiredEnvironment('REVID_LIVE_PHASE')
  if (phaseValue !== 'pre-restart' && phaseValue !== 'post-restart') {
    throw new Error('REVID_LIVE_PHASE must be pre-restart or post-restart')
  }

  const rawManifestPath = requiredEnvironment('REVID_LIVE_MANIFEST_PATH')
  const manifestPath = path.resolve(rawManifestPath)
  const liveTestsRoot = fileURLToPath(new URL('.', import.meta.url))
  const runtimeRoot = path.resolve(liveTestsRoot, '../../../output/runtime')
  const relativePath = path.relative(runtimeRoot, manifestPath)
  const parts = relativePath.split(path.sep).filter(Boolean)
  if (
    !path.isAbsolute(rawManifestPath)
    || !relativePath
    || relativePath.startsWith('..')
    || path.isAbsolute(relativePath)
    || parts.length < 2
    || path.extname(manifestPath).toLowerCase() !== '.json'
  ) {
    throw new Error('REVID_LIVE_MANIFEST_PATH must be an absolute JSON path under output/runtime/<run>/')
  }

  return {
    appOrigin,
    apiOrigin,
    phase: phaseValue,
    manifestPath,
    runId: parts[0],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requiredString(record: Record<string, unknown>, key: string) {
  const value = record[key]
  if (typeof value !== 'string' || !value) {
    throw new Error(`Live API response is missing ${key}`)
  }
  return value
}

function assertManifest(value: unknown): asserts value is LiveManifest {
  if (!isRecord(value)) throw new Error('Live manifest must be a JSON object')
  const allowedKeys = ['canvas', 'checksum', 'count', 'project', 'revision', 'run']
  if (Object.keys(value).sort().join(',') !== allowedKeys.join(',')) {
    throw new Error('Live manifest contains unsupported fields')
  }
  const count = value.count
  if (!isRecord(count)) throw new Error('Live manifest count must be an object')
  const countKeys = ['canvases', 'connections', 'nodes']
  if (Object.keys(count).sort().join(',') !== countKeys.join(',')) {
    throw new Error('Live manifest count contains unsupported fields')
  }
  for (const key of ['run', 'project', 'canvas'] as const) {
    if (typeof value[key] !== 'string' || !value[key]) {
      throw new Error(`Live manifest ${key} is invalid`)
    }
  }
  if (typeof value.checksum !== 'string' || !/^[a-f0-9]{64}$/.test(value.checksum)) {
    throw new Error('Live manifest checksum is invalid')
  }
  if (
    typeof value.revision !== 'number'
    || !Number.isSafeInteger(value.revision)
    || value.revision < 0
  ) {
    throw new Error('Live manifest revision is invalid')
  }
  for (const key of countKeys) {
    const item = count[key]
    if (typeof item !== 'number' || !Number.isSafeInteger(item) || item < 0) {
      throw new Error(`Live manifest count.${key} is invalid`)
    }
  }
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
  )
}

export function canvasDocumentChecksum(document: unknown) {
  if (!isRecord(document)) throw new Error('Canvas document must be an object')
  const nodes = Array.isArray(document.nodes) ? [...document.nodes] : []
  const connections = Array.isArray(document.connections) ? [...document.connections] : []
  const byId = (left: unknown, right: unknown) => {
    const leftId = isRecord(left) && typeof left.id === 'string' ? left.id : ''
    const rightId = isRecord(right) && typeof right.id === 'string' ? right.id : ''
    return leftId.localeCompare(rightId)
  }
  const canonical = stableValue({
    ...document,
    nodes: nodes.sort(byId),
    connections: connections.sort(byId),
  })
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
}

async function login(
  environment: LiveEnvironment,
  request: APIRequestContext,
  page: Page,
): Promise<LiveSession> {
  const identifier = requiredEnvironment('REVID_LIVE_USERNAME')
  const password = requiredEnvironment('REVID_LIVE_PASSWORD', false)
  let response
  try {
    response = await request.post(`${environment.apiOrigin}/auth/login`, {
      data: { identifier, password },
    })
  } catch {
    throw new Error('Live production login could not reach the owned API')
  }
  if (!response.ok()) {
    throw new Error(`Live production login failed with HTTP ${response.status()}`)
  }
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error('Live production login returned invalid JSON')
  }
  if (!isRecord(payload)) throw new Error('Live production login returned invalid JSON')
  const token = requiredString(payload, 'token')

  try {
    await page.addInitScript((sessionToken) => {
      window.localStorage.setItem('revid_token', sessionToken)
    }, token)
  } catch {
    throw new Error('Live browser session could not be initialized')
  }

  async function requestJson<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', pathname: string, data?: unknown) {
    if (!pathname.startsWith('/') || pathname.startsWith('//')) {
      throw new Error('Live API pathname must be root-relative')
    }
    const url = `${environment.apiOrigin}${pathname}`
    let apiResponse
    try {
      apiResponse = await request.fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        data,
      })
    } catch {
      throw new Error(`Live API ${method} ${pathname} was unreachable`)
    }
    const status = apiResponse.status()
    try {
      return { status, data: await apiResponse.json() as T }
    } catch {
      throw new Error(`Live API ${method} ${pathname} returned invalid JSON`)
    }
  }

  return {
    getJson: async <T>(pathname: string) => {
      const response = await requestJson<T>('GET', pathname)
      if (response.status < 200 || response.status >= 300) throw new Error(`Live API GET ${pathname} failed with HTTP ${response.status}`)
      return response.data
    },
    postJson: async <T>(pathname: string, data: unknown) => {
      const response = await requestJson<T>('POST', pathname, data)
      if (response.status < 200 || response.status >= 300) throw new Error(`Live API POST ${pathname} failed with HTTP ${response.status}`)
      return response.data
    },
    requestJson,
  }
}

const environment = loadLiveEnvironment()

export const test = base.extend<{ live: LiveBoundary }>({
  live: async ({}, use) => {
    await use({
      ...environment,
      login: (apiRequest, browserPage) => login(environment, apiRequest, browserPage),
      readManifest: async () => {
        const value: unknown = JSON.parse(await readFile(environment.manifestPath, 'utf8'))
        assertManifest(value)
        if (value.run !== environment.runId) {
          throw new Error('Live manifest run does not match its owned runtime directory')
        }
        return value
      },
      writeManifest: async (manifest) => {
        assertManifest(manifest)
        if (manifest.run !== environment.runId) {
          throw new Error('Live manifest run does not match its owned runtime directory')
        }
        await mkdir(path.dirname(environment.manifestPath), { recursive: true })
        await writeFile(
          environment.manifestPath,
          `${JSON.stringify(manifest, null, 2)}\n`,
          { encoding: 'utf8', flag: 'wx', mode: 0o600 },
        )
      },
      readState: async <T>() => JSON.parse(await readFile(path.join(path.dirname(environment.manifestPath), 'acceptance-state.json'), 'utf8')) as T,
      writeState: async (value) => {
        await writeFile(
          path.join(path.dirname(environment.manifestPath), 'acceptance-state.json'),
          `${JSON.stringify(value, null, 2)}\n`,
          { encoding: 'utf8', flag: 'wx', mode: 0o600 },
        )
      },
    })
  },
})

export { expect }
