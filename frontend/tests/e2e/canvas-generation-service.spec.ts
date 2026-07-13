import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { createPinia, setActivePinia } from 'pinia'
import { requestCanvasGeneration } from '../../src/modules/canvas/generation-service'
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

test('generation service posts complete Canvas context and replaces quotas for every media route', async () => {
  const calls: Array<{ path: string; payload: unknown }> = []
  const authoritativeQuotas: QuotaBalance = { text: 3, image: 3, video: 1 }
  const transport = {
    async post(path: string, payload: unknown) {
      calls.push({ path, payload })
      return {
        data: {
          asset: { id: `asset-${calls.length}` },
          quotas: authoritativeQuotas,
          quota_revision: calls.length,
        },
      }
    },
  }

  const quotaStore = createQuotaStore({ text: 9, image: 9, video: 9 })
  for (const mediaType of ['text', 'image', 'video'] as const) {
    const response = await requestCanvasGeneration({
      mediaType,
      projectId: 'project-service',
      originCanvasId: 'canvas-service',
      canvasNodeId: 'node-service',
      prompt: `${mediaType} prompt`,
    }, quotaStore, transport)

    expect(response.asset?.id).toBe(`asset-${calls.length}`)
    expect(quotaStore.quotas).toBe(authoritativeQuotas)
  }

  expect(calls).toEqual([
    {
      path: '/api/text-generate',
      payload: {
        project_id: 'project-service', origin_canvas_id: 'canvas-service',
        canvas_node_id: 'node-service', prompt: 'text prompt',
      },
    },
    {
      path: '/api/image-generate',
      payload: {
        project_id: 'project-service', origin_canvas_id: 'canvas-service',
        canvas_node_id: 'node-service', prompt: 'image prompt',
      },
    },
    {
      path: '/api/video-generate',
      payload: {
        project_id: 'project-service', origin_canvas_id: 'canvas-service',
        canvas_node_id: 'node-service', prompt: 'video prompt',
      },
    },
  ])
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
        return { data: { quotas: { text: 5, image: 1, video: 1 }, quota_revision: 10 } }
      }
      return { data: { quotas: { text: 5, image: 0, video: 1 }, quota_revision: 11 } }
    },
  }
  const context = {
    mediaType: 'image' as const,
    projectId: 'project-service',
    originCanvasId: 'canvas-service',
    prompt: 'concurrent prompt',
  }

  const olderRequest = requestCanvasGeneration(context, quotaStore, transport)
  await requestCanvasGeneration(context, quotaStore, transport)
  releaseOlderResponse()
  await olderRequest

  expect(quotaStore.quotas).toEqual({ text: 5, image: 0, video: 1 })
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
  const [canvasWorkspace, legacyWorkspace] = await Promise.all([
    readFile(resolve(sourceRoot, 'views/app/CanvasWorkspace.vue'), 'utf8'),
    readFile(resolve(sourceRoot, 'views/app/Workspace.vue'), 'utf8'),
  ])

  for (const source of [canvasWorkspace, legacyWorkspace]) {
    expect(source).toContain("from '../../modules/canvas/generation-service'")
    expect(source).not.toMatch(/request\.post\(['"]\/api\/(?:text|image|video)-generate/)
    expect(source).not.toMatch(/authStore\.quotas\s*=\s*\{[\s\S]*?authStore\.quotas\[[^\]]+\]\s*-\s*1/)
  }
  expect(legacyWorkspace).toContain("if (node.type === 'text')")
  expect(legacyWorkspace).toContain('文本节点暂不能直连 Agnes 文本生成接口')
})
