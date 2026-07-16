import { expect, test } from '@playwright/test'
import type { AxiosAdapter, AxiosResponse } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import { request } from '../../src/api/request'
import { GENERATION_CAPABILITIES } from './canvas-generation-parameters-fixture'

const originalAdapter = request.defaults.adapter
const NOW = '2026-07-14T08:00:00Z'

function response(config: Parameters<AxiosAdapter>[0], data: unknown): AxiosResponse {
  return { config, data, headers: {}, status: 200, statusText: 'OK' }
}

function installStorage() {
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
}

function documentResponse(projectId: string, canvasId: string) {
  return {
    canvas: {
      id: canvasId, project_id: projectId, name: canvasId, sort_order: 0, status: 'active',
      viewport_x: 0, viewport_y: 0, viewport_zoom: 1, graph_revision: 0,
      created_at: NOW, updated_at: NOW, deleted_at: null,
    },
    nodes: [{
      id: `generation-${canvasId}`, project_id: projectId, canvas_id: canvasId,
      node_type: 'generation', content: {
        title: '图片生成', subtype: 'image', serialization_version: 1, text: '海边封面',
      },
      position_x: 120, position_y: 160, width: 340, height: 220, z_index: 0,
      parent_node_id: null, is_locked: false, is_collapsed: false, status: 'idle',
      created_at: NOW, updated_at: NOW,
    }],
    connections: [],
    revision: 0,
  }
}

async function prepareCanvasStore(adapter: AxiosAdapter) {
  request.defaults.adapter = adapter
  const { useAuthStore } = await import('../../src/store/auth')
  const { useCanvasStore } = await import('../../src/store/canvas')
  const authStore = useAuthStore()
  authStore.$patch({
    token: 'race-token',
    user: {
      id: 'user-race', username: 'race', email: 'race@example.com', nickname: '竞态测试',
      avatar_url: '', role: 'user', status: 'active', generation_status: 'enabled',
      created_at: NOW, updated_at: NOW, last_login_at: NOW,
    },
    quotas: { text: 5, image: 4, video: 2 },
    quotaRevision: 7,
  })
  const canvasStore = useCanvasStore()
  await canvasStore.loadCanvas('project-one', 'canvas-one')
  canvasStore.selectNode('generation-canvas-one')
  return canvasStore
}

test.beforeEach(() => {
  installStorage()
  setActivePinia(createPinia())
})

test.afterEach(() => {
  request.defaults.adapter = originalAdapter
  Reflect.deleteProperty(globalThis, 'localStorage')
})

test('terminal generation task state independently enters the canonical Canvas autosave queue', async () => {
  const documentPatches: Array<Record<string, unknown>> = []
  const canvasStore = await prepareCanvasStore(async (config) => {
    if (config.method === 'patch' && config.url?.endsWith('/document')) {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>
      documentPatches.push(body)
      return response(config, {
        revision: 1,
        node_upserts: body.node_upserts ?? [], node_deletes: body.node_deletes ?? [],
        connection_upserts: body.connection_upserts ?? [],
        connection_deletes: body.connection_deletes ?? [],
        server_timestamp: NOW, save_state: 'saved',
      })
    }
    return response(config, documentResponse('project-one', 'canvas-one'))
  })

  ;(canvasStore as unknown as {
    setNodeGenerationState: (
      nodeId: string,
      status: 'failed',
      taskId: string,
    ) => Promise<void>
  }).setNodeGenerationState('generation-canvas-one', 'failed', 'task-failure')

  await expect.poll(() => documentPatches.length).toBe(1)
  expect(documentPatches[0].node_upserts).toEqual([
    expect.objectContaining({
      id: 'generation-canvas-one',
      content: expect.objectContaining({
        generation_status: 'failed',
        generation_task_id: 'task-failure',
      }),
    }),
  ])
})

test('late generation failure cannot restore an old project resource scope or leak its error', async () => {
  let rejectGeneration!: () => void
  let generationStarted = false
  const adapter: AxiosAdapter = async (config) => {
    if (config.method === 'get' && config.url === '/api/generation-capabilities') {
      return response(config, GENERATION_CAPABILITIES)
    }
    if (config.method === 'post' && config.url === '/api/image-generate') {
      generationStarted = true
      return new Promise<AxiosResponse>((_resolve, reject) => {
        rejectGeneration = () => reject(new Error('late provider failure'))
      })
    }
    if (config.url?.endsWith('/document')) {
      const match = config.url.match(/projects\/([^/]+)\/canvases\/([^/]+)\/document$/)
      return response(config, documentResponse(match?.[1] ?? 'project-one', match?.[2] ?? 'canvas-one'))
    }
    if (config.url === '/templates') return response(config, { items: [], total: 0 })
    if (config.url === '/assets' || config.url === '/api/generation-tasks') {
      return response(config, { items: [], total: 0, page: 1, page_size: 100 })
    }
    return response(config, {})
  }
  const canvasStore = await prepareCanvasStore(adapter)
  const { useCanvasResourceExperience } = await import(
    '../../src/components/canvas/composables/use-canvas-resource-experience'
  )
  const projectId = ref('project-one')
  const canvasId = ref('canvas-one')
  const experience = useCanvasResourceExperience({
    projectId: computed(() => projectId.value),
    canvasId: computed(() => canvasId.value),
    isCompact: ref(false),
    isReviewOnly: ref(false),
  })
  await experience.resourceStore.loadProject('project-one')

  const generation = experience.generate('海边封面')
  await expect.poll(() => generationStarted).toBe(true)
  projectId.value = 'project-two'
  canvasId.value = 'canvas-two'
  const switchCanvas = canvasStore.loadCanvas('project-two', 'canvas-two')
  await expect.poll(() => experience.resourceStore.projectId).toBe('project-two')
  rejectGeneration()
  await generation
  await switchCanvas

  expect(experience.resourceStore.projectId).toBe('project-two')
  expect(experience.resourceStore.tasks).toEqual([])
  expect(experience.generationError.value).toBe('')
  expect(canvasStore.activeProjectId).toBe('project-two')
  expect(canvasStore.activeCanvasId).toBe('canvas-two')
})

test('template capture serializes its snapshot before later edits and route changes', async () => {
  let releaseCapture!: () => void
  const captureGate = new Promise<void>((resolvePromise) => {
    releaseCapture = resolvePromise
  })
  const events: string[] = []
  const documentPatches: Array<Record<string, unknown>> = []
  const adapter: AxiosAdapter = async (config) => {
    if (config.method === 'post' && config.url?.endsWith('/templates')) {
      events.push('capture-start')
      await captureGate
      events.push('capture-finish')
      return response(config, {
        id: 'template-captured', name: '竞态快照', user_id: 'user-race', node_count: 1,
        created_at: NOW, node_data: [], schema_version: 1,
        graph_data: { schema_version: 1, nodes: [], connections: [] },
      })
    }
    if (config.method === 'patch' && config.url?.endsWith('/document')) {
      events.push('edit-flush')
      const body = JSON.parse(String(config.data)) as Record<string, unknown>
      documentPatches.push(body)
      return response(config, {
        revision: 1,
        node_upserts: body.node_upserts ?? [], node_deletes: body.node_deletes ?? [],
        connection_upserts: body.connection_upserts ?? [],
        connection_deletes: body.connection_deletes ?? [],
        server_timestamp: NOW, save_state: 'saved',
      })
    }
    if (config.url?.endsWith('/document')) {
      const match = config.url.match(/projects\/([^/]+)\/canvases\/([^/]+)\/document$/)
      const projectId = match?.[1] ?? 'project-one'
      const canvasId = match?.[2] ?? 'canvas-one'
      if (canvasId === 'canvas-two') events.push('route-load')
      return response(config, documentResponse(projectId, canvasId))
    }
    if (config.url === '/templates') return response(config, { items: [], total: 0 })
    if (config.url === '/assets' || config.url === '/api/generation-tasks') {
      return response(config, { items: [], total: 0, page: 1, page_size: 100 })
    }
    return response(config, {})
  }
  const canvasStore = await prepareCanvasStore(adapter)
  const { useCanvasResourceExperience } = await import(
    '../../src/components/canvas/composables/use-canvas-resource-experience'
  )
  const experience = useCanvasResourceExperience({
    projectId: ref('project-one'),
    canvasId: ref('canvas-one'),
    isCompact: ref(false),
    isReviewOnly: ref(false),
  })
  await experience.resourceStore.loadProject('project-one')

  const capture = experience.captureTemplate('竞态快照')
  await expect.poll(() => events).toEqual(['capture-start'])
  const edit = canvasStore.setNodeContent('generation-canvas-one', '点击后的编辑')
  const routeChange = canvasStore.loadCanvas('project-two', 'canvas-two')
  await Promise.resolve()
  expect(events).toEqual(['capture-start'])
  expect(canvasStore.activeCanvasId).toBe('canvas-one')

  releaseCapture()
  await Promise.all([capture, edit, routeChange])

  expect(events).toEqual(['capture-start', 'capture-finish', 'edit-flush', 'route-load'])
  expect(documentPatches).toHaveLength(1)
  expect(documentPatches[0].node_upserts).toEqual([
    expect.objectContaining({
      id: 'generation-canvas-one',
      content: expect.objectContaining({ text: '点击后的编辑' }),
    }),
  ])
  expect(canvasStore.activeProjectId).toBe('project-two')
  expect(canvasStore.activeCanvasId).toBe('canvas-two')
})

test('ordinary server reload flushes pending graph work before replacing the document', async () => {
  const events: string[] = []
  let revision = 0
  const canvasStore = await prepareCanvasStore(async (config) => {
    if (config.method === 'patch' && config.url?.endsWith('/document')) {
      events.push('patch-pending-edit')
      const body = JSON.parse(String(config.data)) as Record<string, unknown>
      revision += 1
      return response(config, {
        revision,
        node_upserts: body.node_upserts ?? [], node_deletes: body.node_deletes ?? [],
        connection_upserts: body.connection_upserts ?? [],
        connection_deletes: body.connection_deletes ?? [],
        server_timestamp: NOW, save_state: 'saved',
      })
    }
    if (config.url?.endsWith('/document')) {
      events.push(`get-document-${events.filter((event) => event.startsWith('get-document')).length + 1}`)
      return response(config, { ...documentResponse('project-one', 'canvas-one'), revision })
    }
    return response(config, {})
  })

  await canvasStore.setNodeContent('generation-canvas-one', 'reload 前必须保存')
  await canvasStore.reloadActiveDocument()

  expect(events).toEqual(['get-document-1', 'patch-pending-edit', 'get-document-2'])
})
