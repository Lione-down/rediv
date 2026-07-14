import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import type { AxiosAdapter, AxiosResponse } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { request } from '../../src/api/request'

const originalAdapter = request.defaults.adapter

function response(config: Parameters<AxiosAdapter>[0], data: unknown): AxiosResponse {
  return {
    config,
    data,
    headers: {},
    status: 200,
    statusText: 'OK',
  }
}

function asset(id: string, projectId: string) {
  return {
    id,
    user_id: 'user-resource',
    project_id: projectId,
    origin_canvas_id: 'canvas-origin',
    canvas_node_id: null,
    type: 'image',
    url: `https://media.revid.test/${id}.png`,
    content_text: null,
    source: 'upload',
    source_model: null,
    source_task_id: null,
    status: 'active',
    created_at: '2026-07-14T08:00:00Z',
    updated_at: '2026-07-14T08:00:00Z',
  }
}

function generationTask(id: string, projectId: string) {
  return {
    id,
    user_id: 'user-resource',
    project_id: projectId,
    origin_canvas_id: 'canvas-origin',
    canvas_node_id: null,
    media_type: 'image',
    provider: 'mock',
    model: 'mock-image-v1',
    provider_request_id: `request-${id}`,
    status: 'succeeded',
    duration_ms: 40,
    result_asset_id: `asset-${id}`,
    error_code: null,
    error_message: null,
    created_at: '2026-07-14T08:00:00Z',
    updated_at: '2026-07-14T08:00:00Z',
  }
}

function template(id = 'template-one') {
  return {
    id,
    name: 'Storyboard',
    user_id: 'user-resource',
    node_count: 0,
    created_at: '2026-07-14T08:00:00Z',
    node_data: [],
    schema_version: 1,
    graph_data: { schema_version: 1, nodes: [], connections: [] },
  }
}

test.afterEach(() => {
  request.defaults.adapter = originalAdapter
  Reflect.deleteProperty(globalThis, 'localStorage')
})

test.beforeEach(() => {
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
  setActivePinia(createPinia())
})

test('project resource list APIs require project identity without a Canvas filter', async () => {
  const calls: Array<{ params: unknown; url?: string }> = []
  request.defaults.adapter = async (config) => {
    calls.push({ params: config.params, url: config.url })
    if (config.url === '/assets') {
      return response(config, { items: [], total: 0, page: 1, page_size: 100 })
    }
    return response(config, { items: [], total: 0, page: 1, page_size: 100 })
  }

  const { fetchProjectAssets, fetchProjectGenerationTasks } = await import(
    '../../src/modules/canvas/project-resource-api'
  )
  await fetchProjectAssets(' project-resource ')
  await fetchProjectGenerationTasks(' project-resource ')

  expect(calls).toEqual([
    {
      url: '/assets',
      params: { project_id: 'project-resource', page: 1, page_size: 100 },
    },
    {
      url: '/api/generation-tasks',
      params: { project_id: 'project-resource', page: 1, page_size: 100 },
    },
  ])
})

test('project asset upload sends multipart project and Canvas attribution', async () => {
  let capturedData: unknown
  request.defaults.adapter = async (config) => {
    capturedData = config.data
    return response(config, {
      id: 'asset-uploaded',
      user_id: 'user-resource',
      project_id: 'project-resource',
      origin_canvas_id: 'canvas-active',
      canvas_node_id: null,
      type: 'image',
      url: '/uploads/file.png',
      content_text: null,
      source: 'upload',
      source_model: null,
      source_task_id: null,
      status: 'active',
      created_at: '2026-07-14T08:00:00Z',
      updated_at: '2026-07-14T08:00:00Z',
    })
  }
  const file = new Blob(['image-bytes'], { type: 'image/png' }) as File

  const { uploadProjectAsset } = await import(
    '../../src/modules/canvas/project-resource-api'
  )
  const result = await uploadProjectAsset(
    'project-resource',
    'canvas-active',
    file,
    'image',
  )

  expect(result.data.id).toBe('asset-uploaded')
  expect(capturedData).toBeInstanceOf(FormData)
  const form = capturedData as FormData
  expect(form.get('project_id')).toBe('project-resource')
  expect(form.get('origin_canvas_id')).toBe('canvas-active')
  expect(form.get('type')).toBe('image')
  expect(form.get('file')).toBeTruthy()
})

test('Canvas template APIs preserve versioned capture and instantiate contracts', async () => {
  const calls: Array<{ data: unknown; url?: string }> = []
  request.defaults.adapter = async (config) => {
    calls.push({
      data: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
      url: config.url,
    })
    return response(config, {
      id: 'template-one',
      name: 'Storyboard',
      user_id: 'user-resource',
      node_count: 0,
      created_at: '2026-07-14T08:00:00Z',
      node_data: [],
      schema_version: 1,
      graph_data: { schema_version: 1, nodes: [], connections: [] },
    })
  }
  const {
    captureCanvasTemplate,
    instantiateCanvasTemplate,
  } = await import('../../src/modules/template/api')

  await captureCanvasTemplate('project one', 'canvas/one', { name: 'Storyboard' })
  await instantiateCanvasTemplate('project one', 'canvas/one', 'template one', {
    base_revision: 8,
    client_mutation_id: 'template-mutation-one',
    anchor_x: 120,
    anchor_y: -40,
  })

  expect(calls).toEqual([
    {
      url: '/api/projects/project%20one/canvases/canvas%2Fone/templates',
      data: { name: 'Storyboard' },
    },
    {
      url: '/api/projects/project%20one/canvases/canvas%2Fone/templates/template%20one/instantiate',
      data: {
        base_revision: 8,
        client_mutation_id: 'template-mutation-one',
        anchor_x: 120,
        anchor_y: -40,
      },
    },
  ])
})

test('project resource store ignores stale project responses and caches by project only', async () => {
  let releaseProjectOne!: () => void
  const projectOneGate = new Promise<void>((resolvePromise) => {
    releaseProjectOne = resolvePromise
  })
  const calls: Array<{ projectId?: string; url?: string }> = []
  request.defaults.adapter = async (config) => {
    const projectId = config.params?.project_id as string | undefined
    calls.push({ projectId, url: config.url })
    if (config.url === '/assets') {
      if (projectId === 'project-one') await projectOneGate
      return response(config, {
        items: [asset(`asset-${projectId}`, projectId!)], total: 1, page: 1, page_size: 100,
      })
    }
    if (config.url === '/api/generation-tasks') {
      return response(config, {
        items: [generationTask(`task-${projectId}`, projectId!)], total: 1, page: 1, page_size: 100,
      })
    }
    return response(config, { items: [template()], total: 1 })
  }
  const { useProjectResourceStore } = await import(
    '../../src/modules/canvas/project-resource-store'
  )
  const store = useProjectResourceStore()

  const staleLoad = store.loadProject('project-one')
  await expect.poll(() => calls.some((call) => call.projectId === 'project-one')).toBe(true)
  await store.loadProject('project-two')
  releaseProjectOne()
  await staleLoad

  expect(store.projectId).toBe('project-two')
  expect(store.assets.map((item) => item.id)).toEqual(['asset-project-two'])
  expect(store.tasks.map((item) => item.id)).toEqual(['task-project-two'])
  expect(store.templates.map((item) => item.id)).toEqual(['template-one'])
  expect(store.isLoading).toBe(false)
  expect(store.error).toBe('')

  const callsBeforeCachedLoad = calls.length
  await store.loadProject('project-two')
  expect(calls).toHaveLength(callsBeforeCachedLoad)
  await store.refresh()
  expect(calls).toHaveLength(callsBeforeCachedLoad + 3)
})

test('an in-flight refresh cannot overwrite newer asset and task upserts', async () => {
  let releaseAssets!: () => void
  const assetGate = new Promise<void>((resolvePromise) => {
    releaseAssets = resolvePromise
  })
  let assetRequestStarted = false
  request.defaults.adapter = async (config) => {
    if (config.url === '/assets') {
      assetRequestStarted = true
      await assetGate
      return response(config, { items: [], total: 0, page: 1, page_size: 100 })
    }
    if (config.url === '/templates') {
      return response(config, { items: [], total: 0 })
    }
    return response(config, { items: [], total: 0, page: 1, page_size: 100 })
  }
  const { useProjectResourceStore } = await import(
    '../../src/modules/canvas/project-resource-store'
  )
  const store = useProjectResourceStore()

  const load = store.loadProject('project-resource')
  await expect.poll(() => assetRequestStarted).toBe(true)
  store.upsertAsset(asset('asset-newer', 'project-resource'))
  store.upsertTask(generationTask('task-newer', 'project-resource'))
  releaseAssets()
  await load

  expect(store.assets.map((item) => item.id)).toEqual(['asset-newer'])
  expect(store.tasks.map((item) => item.id)).toEqual(['task-newer'])
})

test('project resource store aggregates every bounded asset and task page from server totals', async () => {
  const allAssets = Array.from({ length: 205 }, (_, index) => (
    asset(`asset-${String(index + 1).padStart(3, '0')}`, 'project-resource')
  ))
  const allTasks = Array.from({ length: 151 }, (_, index) => (
    generationTask(`task-${String(index + 1).padStart(3, '0')}`, 'project-resource')
  ))
  const pageCalls = { assets: [] as number[], tasks: [] as number[] }
  request.defaults.adapter = async (config) => {
    const page = Number(config.params?.page ?? 1)
    const pageSize = Number(config.params?.page_size ?? 100)
    if (config.url === '/assets') {
      pageCalls.assets.push(page)
      return response(config, {
        items: allAssets.slice((page - 1) * pageSize, page * pageSize),
        total: allAssets.length,
        page,
        page_size: pageSize,
      })
    }
    if (config.url === '/api/generation-tasks') {
      pageCalls.tasks.push(page)
      return response(config, {
        items: allTasks.slice((page - 1) * pageSize, page * pageSize),
        total: allTasks.length,
        page,
        page_size: pageSize,
      })
    }
    return response(config, { items: [template()], total: 1 })
  }
  const { useProjectResourceStore } = await import(
    '../../src/modules/canvas/project-resource-store'
  )
  const store = useProjectResourceStore()

  await store.loadProject('project-resource')

  expect(store.assets).toHaveLength(205)
  expect(store.tasks).toHaveLength(151)
  expect(pageCalls.assets).toEqual([1, 2, 3, 1])
  expect(pageCalls.tasks).toEqual([1, 2, 1])
})

test('project resource store upserts scoped mutations without changing project identity', async () => {
  const uploadedAsset = asset('asset-uploaded', 'project-resource')
  const capturedTemplate = template('template-captured')
  request.defaults.adapter = async (config) => {
    if (config.method === 'post' && config.url === '/assets/upload') {
      return response(config, uploadedAsset)
    }
    if (config.method === 'post' && config.url?.endsWith('/templates')) {
      return response(config, capturedTemplate)
    }
    if (config.url === '/templates') {
      return response(config, { items: [], total: 0 })
    }
    return response(config, { items: [], total: 0, page: 1, page_size: 100 })
  }
  const { useProjectResourceStore } = await import(
    '../../src/modules/canvas/project-resource-store'
  )
  const store = useProjectResourceStore()
  await store.loadProject('project-resource')

  expect(store.upsertAsset(asset('asset-local', 'project-resource'))).toBe(true)
  expect(store.upsertAsset(asset('asset-foreign', 'project-foreign'))).toBe(false)
  expect(store.upsertAsset({
    ...asset('asset-local', 'project-resource'), content_text: 'updated',
  })).toBe(true)
  expect(store.assets).toHaveLength(1)
  expect(store.assets[0].content_text).toBe('updated')

  expect(store.upsertTask(generationTask('task-local', 'project-resource'))).toBe(true)
  expect(store.upsertTask(generationTask('task-foreign', 'project-foreign'))).toBe(false)
  expect(store.tasks.map((item) => item.id)).toEqual(['task-local'])

  const file = new Blob(['image-bytes'], { type: 'image/png' }) as File
  await store.uploadAsset('project-resource', 'canvas-active', file, 'image')
  await store.captureTemplate('project-resource', 'canvas-active', 'Captured')

  expect(store.projectId).toBe('project-resource')
  expect(store.assets.map((item) => item.id)).toEqual(['asset-uploaded', 'asset-local'])
  expect(store.templates.map((item) => item.id)).toEqual(['template-captured'])
})

test('template instantiation retains one bounded mutation ID until local adoption is confirmed', async () => {
  const instantiatePayloads: Array<Record<string, unknown>> = []
  let shouldFail = true
  request.defaults.adapter = async (config) => {
    if (config.url === '/templates') {
      return response(config, { items: [template()], total: 1 })
    }
    if (config.method === 'post' && config.url?.endsWith('/instantiate')) {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
      instantiatePayloads.push(payload)
      if (shouldFail) {
        shouldFail = false
        throw new Error('connection reset after commit')
      }
      return response(config, {
        template_id: 'template-one',
        project_id: 'project-resource',
        canvas_id: 'canvas-active',
        nodes_created: 0,
        connections_created: 0,
        node_id_map: {},
        connection_id_map: {},
        mutation: {
          revision: 2,
          node_upserts: [],
          node_deletes: [],
          connection_upserts: [],
          connection_deletes: [],
          server_timestamp: '2026-07-14T08:00:00Z',
          save_state: 'saved',
        },
      })
    }
    return response(config, { items: [], total: 0, page: 1, page_size: 100 })
  }
  const {
    createStableMutationIdPool,
    useProjectResourceStore,
  } = await import('../../src/modules/canvas/project-resource-store')
  const store = useProjectResourceStore()
  await store.loadProject('project-resource')
  const options = {
    baseRevision: 1,
    anchorX: 120,
    anchorY: -40,
    retryKey: 'insert-storyboard',
  }

  await expect(store.instantiateTemplate(
    'project-resource', 'canvas-active', 'template-one', options,
  )).rejects.toThrow('connection reset after commit')
  const result = await store.instantiateTemplate(
    'project-resource', 'canvas-active', 'template-one', options,
  )
  await store.loadProject('project-other')
  await store.loadProject('project-resource')
  await store.instantiateTemplate(
    'project-resource', 'canvas-active', 'template-one', options,
  )
  ;(store as unknown as { confirmTemplateInstantiation: (retryKey: string) => void })
    .confirmTemplateInstantiation(options.retryKey)
  await store.instantiateTemplate(
    'project-resource', 'canvas-active', 'template-one', options,
  )

  const mutationIds = instantiatePayloads.map((payload) => String(payload.client_mutation_id))
  expect(mutationIds[0]).toBe(mutationIds[1])
  expect(mutationIds[0].length).toBeGreaterThan(0)
  expect(mutationIds[0].length).toBeLessThanOrEqual(64)
  expect(mutationIds[2]).toBe(mutationIds[1])
  expect(mutationIds[3]).not.toBe(mutationIds[2])
  expect(instantiatePayloads[1]).toEqual({
    base_revision: 1,
    client_mutation_id: mutationIds[1],
    anchor_x: 120,
    anchor_y: -40,
  })
  expect(result.mutation.revision).toBe(2)
  expect(store.assets).toEqual([])
  expect(store.tasks).toEqual([])

  let sequence = 0
  const pool = createStableMutationIdPool(2, () => `mutation-${++sequence}`)
  pool.acquire('one', 'fingerprint-one')
  pool.acquire('two', 'fingerprint-two')
  pool.acquire('three', 'fingerprint-three')
  expect(pool.size).toBe(2)
  expect(pool.acquire('one', 'fingerprint-one')).toBe('mutation-4')

  const invalidCapacityPool = createStableMutationIdPool(Number.NaN)
  for (let index = 0; index < 40; index += 1) {
    invalidCapacityPool.acquire(`key-${index}`, `fingerprint-${index}`)
  }
  expect(invalidCapacityPool.size).toBeLessThanOrEqual(32)
})

test('Canvas generation response exposes the durable task through its strict type', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/modules/canvas/generation-service.ts'),
    'utf8',
  )

  expect(source).toContain("import type { GenerationTask } from './project-resource-types'")
  expect(source).toMatch(/generation_task:\s*GenerationTask/)
  expect(source).not.toMatch(/generation_task\??:\s*Record<string, unknown>/)
})
