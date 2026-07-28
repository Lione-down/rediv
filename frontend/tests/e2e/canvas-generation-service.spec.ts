import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { createPinia, setActivePinia } from 'pinia'
import { CanvasGenerationError, requestCanvasGeneration } from '../../src/modules/canvas/generation-service'
import type { QuotaBalance } from '../../src/types/auth'

function createQuotaStore(quotas: QuotaBalance, quotaRevision = -1) {
  return {
    quotas,
    quotaRevision,
    applyQuotaSnapshot(nextQuotas: QuotaBalance, nextRevision: number) {
      if (nextRevision < this.quotaRevision) return false
      this.quotas = nextQuotas
      this.quotaRevision = nextRevision
      return true
    },
  }
}

function scopedTask(mediaType: 'text' | 'image' | 'video', id: string) {
  const requestParameters = mediaType === 'text'
    ? null
    : mediaType === 'image'
      ? { contract_version: 1, media_type: 'image', aspect_ratio: '4:3', image_ids: [] }
      : {
          contract_version: 1,
          media_type: 'video',
          aspect_ratio: '16:9',
          reference_mode: 'text-to-video',
          duration_seconds: 5,
          image_ids: [],
        }
  return {
    id, user_id: 'user-service', project_id: 'project-service',
    origin_canvas_id: 'canvas-service', canvas_node_id: 'node-service', media_type: mediaType,
    provider: 'mock', model: `mock-${mediaType}-v1`, provider_request_id: `request-${id}`,
    client_request_id: `00000000-0000-4000-8000-00000000000${id.slice(-1)}`,
    request_fingerprint: 'a'.repeat(64),
    request_parameters: requestParameters,
    status: 'succeeded' as const, duration_ms: 12, result_asset_id: `asset-${id}`,
    error_code: null, error_message: null, created_at: '2026-07-14T08:00:00Z',
    updated_at: '2026-07-14T08:00:00Z',
  }
}

test('generation service serializes structured video roles without legacy deduplication', async () => {
  const calls: Array<{ path: string; payload: Record<string, unknown> }> = []
  const videoReferences = [
    { node_id: 'source-a', asset_id: 'asset-a', role: 'first-frame' as const, order: 0 },
    { node_id: 'source-a', asset_id: 'asset-a', role: 'reference' as const, order: 1 },
  ]
  const transport = {
    async post(path: string, payload: unknown) {
      calls.push({ path, payload: payload as Record<string, unknown> })
      const task = {
        ...scopedTask('video', 'task-structured-video'),
        request_parameters: {
          contract_version: 1,
          media_type: 'video',
          aspect_ratio: '16:9',
          reference_mode: 'keyframes',
          duration_seconds: 5,
          image_ids: ['asset-a', 'asset-a'],
          video_references: videoReferences,
        },
      }
      return {
        data: {
          asset: scopedAsset('video', 'task-structured-video'),
          generation_task: task,
          quotas: { text: 1, image: 1, video: 0 },
          quota_revision: 1,
        },
      }
    },
  }

  await requestCanvasGeneration({
    mediaType: 'video',
    projectId: 'project-service',
    originCanvasId: 'canvas-service',
    canvasNodeId: 'node-service',
    prompt: 'structured roles',
    aspectRatio: '16:9',
    durationSeconds: 5,
    videoReferences,
  }, createQuotaStore({ text: 1, image: 1, video: 1 }), transport)

  expect(calls).toEqual([{
    path: '/api/video-generate',
    payload: {
      project_id: 'project-service',
      origin_canvas_id: 'canvas-service',
      canvas_node_id: 'node-service',
      prompt: 'structured roles',
      aspect_ratio: '16:9',
      duration_seconds: 5,
      video_references: videoReferences,
    },
  }])
})

function scopedAsset(mediaType: 'text' | 'image' | 'video', id: string) {
  return {
    id: `asset-${id}`, user_id: 'user-service', project_id: 'project-service',
    origin_canvas_id: 'canvas-service', canvas_node_id: 'node-service',
    type: mediaType === 'text' ? 'prompt' : mediaType,
    url: mediaType === 'text' ? null : `https://media.revid.test/${id}`,
    content_text: mediaType === 'text' ? 'generated text' : null,
    source: 'generation', source_model: `mock-${mediaType}-v1`, source_task_id: id,
    status: 'active', created_at: '2026-07-14T08:00:00Z', updated_at: '2026-07-14T08:00:00Z',
  }
}

test('generation service posts complete Canvas context and replaces quotas for every media route', async () => {
  const calls: Array<{ path: string; payload: unknown }> = []
  const authoritativeQuotas: QuotaBalance = { text: 3, image: 3, video: 1 }
  const transport = {
    async post(path: string, payload: unknown) {
      calls.push({ path, payload })
      const mediaType = path.includes('text') ? 'text' : path.includes('video') ? 'video' : 'image'
      const taskId = `task-${calls.length}`
      return {
        data: {
          asset: scopedAsset(mediaType, taskId),
          generation_task: scopedTask(mediaType, taskId),
          quotas: authoritativeQuotas,
          quota_revision: calls.length,
        },
      }
    },
  }

  const quotaStore = createQuotaStore({ text: 9, image: 9, video: 9 })
  for (const mediaType of ['text', 'image', 'video'] as const) {
    const clientRequestId = `00000000-0000-4000-8000-00000000000${calls.length + 1}`
    const response = await requestCanvasGeneration({
      mediaType,
      clientRequestId,
      projectId: 'project-service',
      originCanvasId: 'canvas-service',
      canvasNodeId: 'node-service',
      prompt: `${mediaType} prompt`,
      ...(mediaType === 'image' ? { aspectRatio: '4:3' } : {}),
      ...(mediaType === 'video'
        ? { aspectRatio: '16:9', referenceMode: 'text-to-video' as const, durationSeconds: 5 }
        : {}),
    }, quotaStore, transport)

    expect(response.asset?.id).toBe(`asset-task-${calls.length}`)
    expect(quotaStore.quotas).toBe(authoritativeQuotas)
  }

  expect(calls).toEqual([
    {
      path: '/api/text-generate',
      payload: {
        client_request_id: '00000000-0000-4000-8000-000000000001',
        project_id: 'project-service', origin_canvas_id: 'canvas-service',
        canvas_node_id: 'node-service', prompt: 'text prompt',
      },
    },
    {
      path: '/api/image-generate',
      payload: {
        client_request_id: '00000000-0000-4000-8000-000000000002',
        project_id: 'project-service', origin_canvas_id: 'canvas-service',
        canvas_node_id: 'node-service', prompt: 'image prompt', aspect_ratio: '4:3',
      },
    },
    {
      path: '/api/video-generate',
      payload: {
        client_request_id: '00000000-0000-4000-8000-000000000003',
        project_id: 'project-service', origin_canvas_id: 'canvas-service',
        canvas_node_id: 'node-service', prompt: 'video prompt',
        aspect_ratio: '16:9', reference_mode: 'text-to-video', duration_seconds: 5,
      },
    },
  ])
})

test('generation requests opt out of the shared fifteen-second transport timeout', async () => {
  let timeout: number | undefined
  const transport = {
    async post(_path: string, _payload: unknown, config?: { timeout?: number }) {
      timeout = config?.timeout
      return {
        data: {
          asset: scopedAsset('image', 'task-timeout'),
          generation_task: scopedTask('image', 'task-timeout'),
          quotas: { text: 1, image: 1, video: 1 },
          quota_revision: 1,
        },
      }
    },
  }
  await requestCanvasGeneration({ mediaType: 'image', projectId: 'project-service', originCanvasId: 'canvas-service', canvasNodeId: 'node-service', prompt: 'slow prompt', aspectRatio: '4:3' }, createQuotaStore({ text: 2, image: 2, video: 2 }), transport)
  expect(timeout).toBe(0)
})

test('generation service leaves the current quotas untouched when the request fails', async () => {
  const transport = { post: async () => { throw new Error('provider unavailable') } }
  const currentQuotas: QuotaBalance = { text: 9, image: 8, video: 7 }
  const quotaStore = createQuotaStore(currentQuotas)

  await expect(requestCanvasGeneration({
    mediaType: 'image',
    projectId: 'project-service',
    originCanvasId: 'canvas-service',
    prompt: 'failing prompt',
  }, quotaStore, transport)).rejects.toThrow('provider unavailable')

  expect(quotaStore.quotas).toBe(currentQuotas)
})

test('generation service classifies deterministic provider rejection as input-change required', async () => {
  const transport = {
    post: async () => {
      throw {
        response: {
          data: {
            detail: {
              code: 'unsupported_parameter',
              message: 'ratio is unsupported',
              provider_request_id: 'request-image-400',
              retryable: false,
            },
          },
        },
      }
    },
  }

  const generation = requestCanvasGeneration({
    mediaType: 'image', projectId: 'project-service', originCanvasId: 'canvas-service',
    canvasNodeId: 'node-service', prompt: 'rejected prompt', aspectRatio: '4:3',
  }, createQuotaStore({ text: 2, image: 2, video: 2 }), transport)

  await expect(generation).rejects.toMatchObject({
    name: 'CanvasGenerationError',
    code: 'unsupported_parameter',
    providerRequestId: 'request-image-400',
    retryable: false,
    message: expect.stringContaining('请修改参数后重试'),
  } satisfies Partial<CanvasGenerationError>)
})

test('generation service turns story-director 422 details into an actionable Canvas error', async () => {
  const transport = {
    post: async () => {
      throw {
        response: {
          status: 422,
          data: {
            detail: {
              code: 'story_source_required',
              message: 'Connect usable Prompt/Text content before generating storyboard',
            },
          },
        },
      }
    },
  }

  const generation = requestCanvasGeneration({
    mediaType: 'text',
    projectId: 'project-service',
    originCanvasId: 'canvas-service',
    canvasNodeId: 'node-service',
    scriptAuthoring: {
      intent: 'script_draft',
      locale: 'zh-CN',
      canvasRevision: 3,
      instruction: '补全当前分镜。',
      storyDirector: {
        contractVersion: 1,
        sourceNodeIds: [],
      },
    },
  }, createQuotaStore({ text: 2, image: 2, video: 2 }), transport)

  await expect(generation).rejects.toMatchObject({
    name: 'CanvasGenerationError',
    code: 'invalid_request',
    retryable: false,
    message: expect.stringContaining('填写当前脚本'),
  } satisfies Partial<CanvasGenerationError>)
  await expect(generation).rejects.not.toThrow('Request failed with status code 422')
})

test('generation service exposes manual retry only for transient provider failures', async () => {
  const transport = {
    post: async () => {
      throw {
        response: {
          data: {
            detail: {
              code: 'provider_unavailable',
              message: 'provider is busy',
              provider_request_id: 'request-video-503',
              retryable: true,
            },
          },
        },
      }
    },
  }

  const generation = requestCanvasGeneration({
    mediaType: 'video', projectId: 'project-service', originCanvasId: 'canvas-service',
    canvasNodeId: 'node-service', prompt: 'transient prompt', referenceMode: 'text-to-video', durationSeconds: 5,
  }, createQuotaStore({ text: 2, image: 2, video: 2 }), transport)

  await expect(generation).rejects.toMatchObject({
    code: 'provider_unavailable',
    providerRequestId: 'request-video-503',
    retryable: true,
    message: expect.stringContaining('请稍后手动重试'),
  } satisfies Partial<CanvasGenerationError>)
})

test('generation service ignores an older authoritative quota response that arrives last', async () => {
  const quotaStore = createQuotaStore({ text: 5, image: 2, video: 1 })
  let releaseOlderResponse!: () => void
  const olderResponse = new Promise<void>((resolvePromise) => {
    releaseOlderResponse = resolvePromise
  })
  let requestCount = 0
  const transport = {
    async post() {
      requestCount += 1
      if (requestCount === 1) {
        await olderResponse
        return {
          data: {
            asset: scopedAsset('image', 'task-older'),
            generation_task: scopedTask('image', 'task-older'),
            quotas: { text: 5, image: 1, video: 1 }, quota_revision: 10,
          },
        }
      }
      return {
        data: {
          asset: scopedAsset('image', 'task-newer'),
          generation_task: scopedTask('image', 'task-newer'),
          quotas: { text: 5, image: 0, video: 1 }, quota_revision: 11,
        },
      }
    },
  }
  const context = {
    mediaType: 'image' as const,
    projectId: 'project-service',
    originCanvasId: 'canvas-service',
    canvasNodeId: 'node-service',
    prompt: 'concurrent prompt',
    aspectRatio: '4:3',
  }

  const olderRequest = requestCanvasGeneration(context, quotaStore, transport)
  await requestCanvasGeneration(context, quotaStore, transport)
  releaseOlderResponse()
  await olderRequest

  expect(quotaStore.quotas).toEqual({ text: 5, image: 0, video: 1 })
})

test('generation response from an old auth session cannot update the next user quota', async () => {
  let releaseResponse!: () => void
  const gate = new Promise<void>((resolvePromise) => {
    releaseResponse = resolvePromise
  })
  const quotaStore = {
    ...createQuotaStore({ text: 5, image: 4, video: 2 }, 7),
    token: 'session-a',
  }
  const transport = {
    async post() {
      await gate
      return {
        data: {
          asset: scopedAsset('image', 'task-old-session'),
          generation_task: scopedTask('image', 'task-old-session'),
          quotas: { text: 5, image: 3, video: 2 },
          quota_revision: 8,
        },
      }
    },
  }
  const generation = requestCanvasGeneration({
    mediaType: 'image', projectId: 'project-service', originCanvasId: 'canvas-service',
    canvasNodeId: 'node-service', prompt: 'old session',
  }, quotaStore, transport)

  quotaStore.token = 'session-b'
  quotaStore.quotas = { text: 2, image: 1, video: 0 }
  quotaStore.quotaRevision = 2
  releaseResponse()
  await expect(generation).rejects.toThrow('Generation auth session changed')

  expect(quotaStore.quotas).toEqual({ text: 2, image: 1, video: 0 })
  expect(quotaStore.quotaRevision).toBe(2)
})

test('generation service rejects a foreign project asset before quota or Canvas adoption', async () => {
  const currentQuotas: QuotaBalance = { text: 5, image: 4, video: 2 }
  const quotaStore = createQuotaStore(currentQuotas, 7)
  const transport = {
    async post() {
      return {
        data: {
          asset: {
            id: 'asset-foreign', user_id: 'user-service', project_id: 'project-foreign',
            origin_canvas_id: 'canvas-service', canvas_node_id: 'node-service', type: 'image',
            url: 'https://media.revid.test/foreign.png', content_text: null,
            source: 'generation', source_model: 'mock-image-v1', source_task_id: 'task-service',
            status: 'active', created_at: '2026-07-14T08:00:00Z', updated_at: '2026-07-14T08:00:00Z',
          },
          generation_task: {
            id: 'task-service', user_id: 'user-service', project_id: 'project-service',
            origin_canvas_id: 'canvas-service', canvas_node_id: 'node-service', media_type: 'image',
            provider: 'mock', model: 'mock-image-v1', provider_request_id: 'request-service',
            status: 'succeeded', duration_ms: 12, result_asset_id: 'asset-foreign',
            error_code: null, error_message: null, created_at: '2026-07-14T08:00:00Z',
            updated_at: '2026-07-14T08:00:00Z',
          },
          quotas: { text: 5, image: 3, video: 2 },
          quota_revision: 8,
        },
      }
    },
  }

  await expect(requestCanvasGeneration({
    mediaType: 'image',
    projectId: 'project-service',
    originCanvasId: 'canvas-service',
    canvasNodeId: 'node-service',
    prompt: 'foreign response',
  }, quotaStore, transport)).rejects.toThrow('Generation response scope mismatch')

  expect(quotaStore.quotas).toBe(currentQuotas)
  expect(quotaStore.quotaRevision).toBe(7)
})

test('generation service rejects malformed success linkage before applying quotas', async () => {
  const task = scopedTask('image', 'task-malformed')
  const asset = scopedAsset('image', 'task-malformed')
  const malformedResponses = [
    { generation_task: { ...task, status: 'failed' }, asset },
    { generation_task: task, asset: { ...asset, source: 'upload' } },
    { generation_task: task, asset: { ...asset, user_id: 'user-foreign' } },
  ]

  for (const malformed of malformedResponses) {
    const currentQuotas: QuotaBalance = { text: 5, image: 4, video: 2 }
    const quotaStore = createQuotaStore(currentQuotas, 7)
    const transport = {
      async post() {
        return {
          data: {
            ...malformed,
            quotas: { text: 5, image: 3, video: 2 },
            quota_revision: 8,
          },
        }
      },
    }

    await expect(requestCanvasGeneration({
      mediaType: 'image',
      projectId: 'project-service',
      originCanvasId: 'canvas-service',
      canvasNodeId: 'node-service',
      prompt: 'malformed response',
    }, quotaStore, transport)).rejects.toThrow('Generation response scope mismatch')

    expect(quotaStore.quotas).toBe(currentQuotas)
    expect(quotaStore.quotaRevision).toBe(7)
  }
})

test('auth session reset allows a lower revision from the next user', async () => {
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
  const { useAuthStore } = await import('../../src/store/auth')
  const authStore = useAuthStore()
  authStore.applyQuotaSnapshot({ text: 1, image: 0, video: 0 }, 100)

  authStore.clearSession()
  const wasApplied = authStore.applyQuotaSnapshot({ text: 5, image: 4, video: 3 }, 4)

  expect(wasApplied).toBe(true)
  expect(authStore.quotaRevision).toBe(4)
  expect(authStore.quotas).toEqual({ text: 5, image: 4, video: 3 })
  Reflect.deleteProperty(globalThis, 'localStorage')
})

test('both workspace views delegate provider requests and quota updates to the Canvas service', async () => {
  const sourceRoot = resolve(process.cwd(), 'src')
  const [canvasWorkspace, resourceExperience, generationActions, legacyWorkspace] = await Promise.all([
    readFile(resolve(sourceRoot, 'views/app/CanvasWorkspace.vue'), 'utf8'),
    readFile(resolve(sourceRoot, 'components/canvas/composables/use-canvas-resource-experience.ts'), 'utf8'),
    readFile(resolve(sourceRoot, 'components/canvas/composables/use-canvas-generation-actions.ts'), 'utf8'),
    readFile(resolve(sourceRoot, 'views/app/Workspace.vue'), 'utf8'),
  ])

  expect(canvasWorkspace).toContain("from '../../components/canvas/composables/use-canvas-resource-experience'")
  expect(resourceExperience).toContain("from './use-canvas-generation-actions'")
  for (const source of [generationActions, legacyWorkspace]) {
    expect(source).toMatch(/from ['"](?:\.\.\/)+modules\/canvas\/generation-service['"]/)
  }
  for (const source of [canvasWorkspace, resourceExperience, generationActions, legacyWorkspace]) {
    expect(source).not.toMatch(/request\.post\(['"]\/api\/(?:text|image|video)-generate/)
    expect(source).not.toMatch(/authStore\.quotas\s*=\s*\{[\s\S]*?authStore\.quotas\[[^\]]+\]\s*-\s*1/)
  }
  expect(legacyWorkspace).toContain("if (node.type === 'text')")
  expect(legacyWorkspace).toContain('文本节点暂不能直连 Agnes 文本生成接口')
})
