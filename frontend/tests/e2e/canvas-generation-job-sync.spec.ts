import { expect, test } from '@playwright/test'
import * as generationJobApi from '../../src/modules/canvas/generation-job-api'
import * as generationJobStore from '../../src/modules/canvas/generation-job-store'
import * as generationJobRuntime from '../../src/modules/canvas/generation-job-runtime'
import type { CanvasNode } from '../../src/types/canvas'

type FetchGenerationJobDelta = (
  input: { projectId: string; canvasId: string; after?: string | null; limit?: number },
  transport: {
    get: (
      path: string,
      config: { params: Record<string, unknown> },
    ) => Promise<{ data: Record<string, unknown> }>
  },
) => Promise<Record<string, unknown>>

type ParseGenerationJobStatus = (value: unknown) => Record<string, unknown>
type CreateGenerationJobStore = () => {
  applyDelta: (
    scope: { projectId: string; canvasId: string },
    page: { items: Array<Record<string, unknown>>; next_cursor: string | null },
  ) => void
  snapshot: (scope: { projectId: string; canvasId: string }) => {
    cursor: string | null
    results?: Map<string, Record<string, unknown>>
    statuses: Map<string, Record<string, unknown>>
  }
}
type SyncGenerationJobs = (input: {
  projectId: string
  canvasId: string
  nodes: readonly CanvasNode[]
  store: ReturnType<CreateGenerationJobStore>
  transport: {
    get: (
      path: string,
      config?: { params?: Record<string, unknown> },
    ) => Promise<{ data: Record<string, unknown> }>
  }
}) => Promise<{
  cursor: string | null
  results: Map<string, Record<string, unknown>>
  statuses: Map<string, Record<string, unknown>>
}>
type HasGenerationJobPollingWork = (
  nodes: readonly CanvasNode[],
  statuses: ReadonlyMap<string, Record<string, unknown>>,
) => boolean

function requireContractFunction<T extends (...args: never[]) => unknown>(
  source: object,
  name: string,
  fingerprint: string,
): T {
  const candidate = (source as Record<string, unknown>)[name]
  expect(typeof candidate, fingerprint).toBe('function')
  return candidate as T
}

function compactStatus(overrides: Record<string, unknown> = {}) {
  return {
    job_id: 'job-one',
    node_id: 'node-one',
    media_type: 'image',
    status: 'running',
    stage: 'provider',
    progress: 42,
    error: null,
    result_asset_id: null,
    version: 3,
    updated_at: '2026-07-23T12:00:00Z',
    ...overrides,
  }
}

test('compact delta client scopes each request to current project Canvas and cursor', async () => {
  const fetchGenerationJobDelta = requireContractFunction<FetchGenerationJobDelta>(
    generationJobApi,
    'fetchGenerationJobDelta',
    'T6-009 RED [compact-canvas-delta-client-absent]: current-Canvas cursor delta client is not implemented',
  )
  const calls: Array<{ path: string; params: Record<string, unknown> }> = []
  const page = await fetchGenerationJobDelta({
    projectId: ' project-one ',
    canvasId: ' canvas-one ',
    after: 'cursor-one',
    limit: 25,
  }, {
    async get(path, config) {
      calls.push({ path, params: config.params })
      return { data: { items: [compactStatus()], next_cursor: 'cursor-two' } }
    },
  })

  expect(calls).toEqual([{
    path: '/api/v2/projects/project-one/generation-jobs',
    params: { canvas_id: 'canvas-one', after: 'cursor-one', limit: 25 },
  }])
  expect(page).toMatchObject({
    items: [{ job_id: 'job-one', version: 3 }],
    next_cursor: 'cursor-two',
  })
})

test('compact status parser rejects legacy full-task payload fields', () => {
  const parseGenerationJobStatus = requireContractFunction<ParseGenerationJobStatus>(
    generationJobApi,
    'parseGenerationJobStatus',
    'T6-009 RED [compact-status-parser-absent]: strict compact status parser is not implemented',
  )

  expect(() => parseGenerationJobStatus({
    ...compactStatus(),
    request_parameters: { prompt: 'must stay backend-owned' },
  })).toThrow(/unexpected field/i)
})

test('compact submit rejects a receipt from another Canvas scope', async () => {
  await expect(generationJobApi.submitGenerationJobRequest({
    clientRequestId: '00000000-0000-4000-8000-000000000001',
    projectId: 'project-one',
    canvasId: 'canvas-one',
    nodeId: 'node-one',
    mediaType: 'image',
    modelId: 'allowed-model',
    input: { prompt: 'image prompt' },
  }, {
    async post() {
      return {
        data: {
          job_id: 'job-one',
          project_id: 'project-one',
          canvas_id: 'canvas-other',
          node_id: 'node-one',
          media_type: 'image',
          status: 'queued',
          model_id: 'allowed-model',
          version: 1,
        },
      }
    },
  })).rejects.toThrow(/scope mismatch/i)
})

test('job state advances one Canvas cursor while ignoring stale job versions', () => {
  const createGenerationJobStore = requireContractFunction<CreateGenerationJobStore>(
    generationJobStore,
    'createGenerationJobStore',
    'T6-009 RED [generation-job-version-store-absent]: versioned Canvas job state is not implemented',
  )
  const store = createGenerationJobStore()
  const firstCanvas = { projectId: 'project-one', canvasId: 'canvas-one' }
  const secondCanvas = { projectId: 'project-one', canvasId: 'canvas-two' }

  store.applyDelta(firstCanvas, {
    items: [compactStatus({ version: 4, progress: 70 })],
    next_cursor: 'cursor-one',
  })
  store.applyDelta(firstCanvas, {
    items: [compactStatus({ version: 3, progress: 30 })],
    next_cursor: 'cursor-two',
  })

  expect(store.snapshot(firstCanvas).cursor).toBe('cursor-two')
  expect(store.snapshot(firstCanvas).statuses.get('job-one')).toMatchObject({
    version: 4,
    progress: 70,
  })
  expect(store.snapshot(secondCanvas)).toMatchObject({
    cursor: null,
    statuses: new Map(),
  })
})

test('reload sync restores a persisted job then fetches its successful result once', async () => {
  const createGenerationJobStore = requireContractFunction<CreateGenerationJobStore>(
    generationJobStore,
    'createGenerationJobStore',
    'T6-009 RED [generation-job-version-store-absent]: versioned Canvas job state is not implemented',
  )
  const syncGenerationJobs = requireContractFunction<SyncGenerationJobs>(
    generationJobRuntime,
    'syncGenerationJobs',
    'T6-009 RED [generation-job-reload-sync-absent]: persisted-job reload sync is not implemented',
  )
  const node: CanvasNode = {
    id: 'node-one',
    type: 'generation',
    title: 'Image card',
    x: 0,
    y: 0,
    width: 320,
    height: 200,
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      active_generation_job_id: 'job-one',
    },
  }
  const calls: Array<{ path: string; params?: Record<string, unknown> }> = []
  const transport = {
    async get(path: string, config?: { params?: Record<string, unknown> }) {
      calls.push({ path, params: config?.params })
      if (path.endsWith('/result')) {
        return {
          data: {
            job_id: 'job-one',
            node_id: 'node-one',
            result: {
              asset_id: 'asset-one',
              media_type: 'image',
              url: 'https://media.revid.test/asset-one.png',
            },
            version: 5,
          },
        }
      }
      if (path === '/api/v2/generation-jobs/job-one') {
        return { data: compactStatus({
          status: 'succeeded',
          stage: 'persisting',
          progress: 100,
          result_asset_id: 'asset-one',
          version: 5,
        }) }
      }
      return {
        data: {
          items: calls.filter((call) => call.path.includes('/projects/')).length === 1
            ? [compactStatus({
                status: 'succeeded',
                stage: 'persisting',
                progress: 100,
                result_asset_id: 'asset-one',
                version: 5,
              })]
            : [],
          next_cursor: 'cursor-one',
        },
      }
    },
  }
  const store = createGenerationJobStore()

  const first = await syncGenerationJobs({
    projectId: 'project-one',
    canvasId: 'canvas-one',
    nodes: [node],
    store,
    transport,
  })
  const second = await syncGenerationJobs({
    projectId: 'project-one',
    canvasId: 'canvas-one',
    nodes: [node],
    store,
    transport,
  })

  expect(first.statuses.get('job-one')).toMatchObject({ status: 'succeeded', version: 5 })
  expect(first.results.get('job-one')).toMatchObject({
    result: { asset_id: 'asset-one', media_type: 'image' },
    version: 5,
  })
  expect(second.results.get('job-one')).toMatchObject({ version: 5 })
  expect(calls).toEqual([
    { path: '/api/v2/generation-jobs/job-one', params: undefined },
    {
      path: '/api/v2/projects/project-one/generation-jobs',
      params: { canvas_id: 'canvas-one', limit: 25 },
    },
    { path: '/api/v2/generation-jobs/job-one/result', params: undefined },
    {
      path: '/api/v2/projects/project-one/generation-jobs',
      params: { canvas_id: 'canvas-one', after: 'cursor-one', limit: 25 },
    },
  ])
})

test('polling stops when current Canvas persisted jobs are terminal or their cards are gone', () => {
  const hasGenerationJobPollingWork = requireContractFunction<HasGenerationJobPollingWork>(
    generationJobRuntime,
    'hasGenerationJobPollingWork',
    'T6-009 RED [generation-job-poll-stop-absent]: current-Canvas terminal stop rule is not implemented',
  )
  const node: CanvasNode = {
    id: 'node-one',
    type: 'generation',
    title: 'Image card',
    x: 0,
    y: 0,
    width: 320,
    height: 200,
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      active_generation_job_id: 'job-one',
    },
  }

  expect(hasGenerationJobPollingWork([node], new Map())).toBe(true)
  expect(hasGenerationJobPollingWork([node], new Map([
    ['job-one', compactStatus({ status: 'running' })],
  ]))).toBe(true)
  expect(hasGenerationJobPollingWork([node], new Map([
    ['job-one', compactStatus({ status: 'cancel_requested' })],
  ]))).toBe(true)
  expect(hasGenerationJobPollingWork([node], new Map([
    ['job-one', compactStatus({ status: 'succeeded', result_asset_id: 'asset-one' })],
  ]))).toBe(false)
  expect(hasGenerationJobPollingWork([], new Map([
    ['job-one', compactStatus({ status: 'running' })],
  ]))).toBe(false)
})
