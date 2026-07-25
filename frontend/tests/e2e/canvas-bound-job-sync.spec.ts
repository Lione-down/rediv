import { expect, test } from '@playwright/test'
import { createPinia, setActivePinia } from 'pinia'
import { request } from '../../src/api/request'
import { useProjectResourceStore } from '../../src/modules/canvas/project-resource-store'
import { response } from './canvas-project-resource-store-fixture'

const originalAdapter = request.defaults.adapter

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

test.afterEach(() => {
  request.defaults.adapter = originalAdapter
  Reflect.deleteProperty(globalThis, 'localStorage')
})

test('ordinary Canvas resource load does not request project-wide generation task history', async () => {
  const calls: string[] = []
  request.defaults.adapter = async (config) => {
    calls.push(String(config.url))
    if (config.url === '/assets') {
      return response(config, { items: [], total: 0, page: 1, page_size: 100 })
    }
    if (config.url === '/templates') {
      return response(config, { items: [], total: 0 })
    }
    return response(config, { items: [], total: 0, page: 1, page_size: 100 })
  }

  const store = useProjectResourceStore()
  await (store.loadProject as unknown as (
    projectId: string,
    options: { includeTaskHistory: boolean },
  ) => Promise<unknown>)('project-runtime', { includeTaskHistory: false })

  expect(calls).toEqual(['/assets', '/templates'])
  expect(calls).not.toContain('/api/generation-tasks')
})

test('legacy task history remains an explicit history-only request', async () => {
  const calls: string[] = []
  request.defaults.adapter = async (config) => {
    calls.push(String(config.url))
    if (config.url === '/assets') {
      return response(config, { items: [], total: 0, page: 1, page_size: 100 })
    }
    if (config.url === '/templates') {
      return response(config, { items: [], total: 0 })
    }
    return response(config, { items: [], total: 0, page: 1, page_size: 100 })
  }

  const store = useProjectResourceStore()
  await (store.loadProject as unknown as (
    projectId: string,
    options: { includeTaskHistory: boolean },
  ) => Promise<unknown>)('project-runtime', { includeTaskHistory: false })
  await (store.loadTaskHistory as unknown as (projectId: string) => Promise<unknown>)('project-runtime')

  expect(calls).toEqual(['/assets', '/templates', '/api/generation-tasks'])
})
