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

function asset(id: string) {
  return {
    id,
    user_id: 'user-pagination',
    project_id: 'project-pagination',
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

test.afterEach(() => {
  request.defaults.adapter = originalAdapter
  Reflect.deleteProperty(globalThis, 'localStorage')
})

test.beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => undefined,
    },
  })
  setActivePinia(createPinia())
})

test('project resource pagination does not silently truncate beyond ten pages', async () => {
  const allAssets = Array.from({ length: 1005 }, (_, index) => asset(`asset-${index + 1}`))
  const pageCalls: number[] = []
  request.defaults.adapter = async (config) => {
    const page = Number(config.params?.page ?? 1)
    const pageSize = Number(config.params?.page_size ?? 100)
    pageCalls.push(page)
    return response(config, {
      items: allAssets.slice((page - 1) * pageSize, page * pageSize),
      page,
      page_size: pageSize,
      total: allAssets.length,
    })
  }
  const { fetchProjectAssets } = await import('../../src/modules/canvas/project-resource-api')

  const result = await fetchProjectAssets('project-pagination')

  expect(result.data.items).toHaveLength(1005)
  expect(new Set(result.data.items.map((item) => item.id)).size).toBe(1005)
  expect(pageCalls).toContain(11)
  expect(pageCalls.filter((page) => page === 1)).toHaveLength(2)
})

test('project resource pagination retries when offset pages drift during collection', async () => {
  const allAssets = Array.from({ length: 205 }, (_, index) => asset(`asset-${index + 1}`))
  const pageCalls: number[] = []
  let didInsert = false
  request.defaults.adapter = async (config) => {
    const page = Number(config.params?.page ?? 1)
    const pageSize = Number(config.params?.page_size ?? 100)
    pageCalls.push(page)
    if (page === 2 && !didInsert) {
      didInsert = true
      allAssets.unshift(asset('asset-inserted-during-pagination'))
    }
    return response(config, {
      items: allAssets.slice((page - 1) * pageSize, page * pageSize),
      page,
      page_size: pageSize,
      total: allAssets.length,
    })
  }
  const { fetchProjectAssets } = await import('../../src/modules/canvas/project-resource-api')

  const result = await fetchProjectAssets('project-pagination')

  expect(result.data.items).toHaveLength(206)
  expect(new Set(result.data.items.map((item) => item.id)).size).toBe(206)
  expect(result.data.items.map((item) => item.id)).toContain('asset-inserted-during-pagination')
  expect(pageCalls).toEqual([1, 2, 1, 2, 3, 1])
})
