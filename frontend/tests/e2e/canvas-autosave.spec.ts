import { expect, test, type Page, type Route } from '@playwright/test'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-13T18:00:00Z'
const PROJECT_ID = 'project-autosave'
const FIRST_CANVAS_ID = 'canvas-autosave-first'
const SECOND_CANVAS_ID = 'canvas-autosave-second'
const RECOVERY_KEY = `revid:canvas-recovery:v1:user-autosave:${PROJECT_ID}:${FIRST_CANVAS_ID}`
type FailureMode = 'none' | 'error-once' | 'error-always' | 'conflict' | 'response-loss-once'

interface CanvasRecord {
  id: string
  project_id: string
  name: string
  sort_order: number
  status: 'active'
  viewport_x: number
  viewport_y: number
  viewport_zoom: number
  graph_revision: number
  created_at: string
  updated_at: string
  deleted_at: null
}

interface PatchBody {
  base_revision: number
  client_mutation_id: string
  node_upserts: Array<Record<string, unknown>>
  node_deletes: string[]
  connection_upserts: Array<Record<string, unknown>>
  connection_deletes: string[]
}

interface AutosaveState {
  failureMode: FailureMode
  networkOffline: boolean
  requests: Array<{ method: string; path: string; body?: Record<string, unknown> }>
  patchAttempts: PatchBody[]
  committedMutations: Map<string, {
    payload: PatchBody
    response: Record<string, unknown>
  }>
  canvases: CanvasRecord[]
  nodes: Record<string, Array<Record<string, unknown>>>
  connections: Record<string, Array<Record<string, unknown>>>
}

const user = {
  id: 'user-autosave',
  username: 'autosave-owner',
  email: 'autosave@example.com',
  nickname: 'Autosave owner',
  avatar_url: '',
  role: 'user',
  status: 'active',
  generation_status: 'enabled',
  created_at: NOW,
  updated_at: NOW,
  last_login_at: NOW,
}

function canvas(id: string, name: string, sortOrder: number): CanvasRecord {
  return {
    id,
    project_id: PROJECT_ID,
    name,
    sort_order: sortOrder,
    status: 'active',
    viewport_x: 0,
    viewport_y: 0,
    viewport_zoom: 1,
    graph_revision: 7,
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  }
}

function node(canvasId: string, id: string, title: string) {
  return {
    id,
    project_id: PROJECT_ID,
    canvas_id: canvasId,
    node_type: 'text',
    content: { title, text: title },
    position_x: 120,
    position_y: 120,
    width: 240,
    height: 140,
    z_index: 0,
    parent_node_id: null,
    is_locked: false,
    is_collapsed: false,
    status: 'idle',
    created_at: NOW,
    updated_at: NOW,
  }
}

function createState(failureMode: FailureMode = 'none'): AutosaveState {
  return {
    failureMode,
    networkOffline: false,
    requests: [],
    patchAttempts: [],
    committedMutations: new Map(),
    canvases: [
      canvas(FIRST_CANVAS_ID, 'Primary canvas', 0),
      canvas(SECOND_CANVAS_ID, 'Second canvas', 1),
    ],
    nodes: {
      [FIRST_CANVAS_ID]: [node(FIRST_CANVAS_ID, 'node-existing', 'Existing node')],
      [SECOND_CANVAS_ID]: [node(SECOND_CANVAS_ID, 'node-second', 'Second node')],
    },
    connections: { [FIRST_CANVAS_ID]: [], [SECOND_CANVAS_ID]: [] },
  }
}

function corsHeaders() {
  return {
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'access-control-allow-origin': APP_ORIGIN,
    'content-type': 'application/json',
  }
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, headers: corsHeaders(), body: JSON.stringify(body) })
}

function asNodeResponse(canvasId: string, item: Record<string, unknown>) {
  return {
    ...item,
    project_id: PROJECT_ID,
    canvas_id: canvasId,
    status: 'idle',
    created_at: NOW,
    updated_at: NOW,
  }
}

function applyPatch(state: AutosaveState, canvasId: string, body: PatchBody) {
  const nodesById = new Map(state.nodes[canvasId].map((item) => [String(item.id), item]))
  for (const nodeId of body.node_deletes) nodesById.delete(nodeId)
  for (const item of body.node_upserts) nodesById.set(String(item.id), asNodeResponse(canvasId, item))
  state.nodes[canvasId] = [...nodesById.values()]

  const connectionsById = new Map(state.connections[canvasId].map((item) => [String(item.id), item]))
  for (const connectionId of body.connection_deletes) connectionsById.delete(connectionId)
  for (const item of body.connection_upserts) {
    connectionsById.set(String(item.id), {
      ...item,
      project_id: PROJECT_ID,
      canvas_id: canvasId,
      status: 'active',
      created_at: NOW,
      updated_at: NOW,
    })
  }
  state.connections[canvasId] = [...connectionsById.values()]
}

async function installApi(page: Page, state: AutosaveState) {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const method = request.method()
    const path = new URL(request.url()).pathname
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() })
    const body = request.postData() ? request.postDataJSON() as Record<string, unknown> : undefined
    state.requests.push({ method, path, body })

    if (method === 'GET' && path === '/me') {
      return fulfillJson(route, { user, quotas: { text: 5, image: 3, video: 2 } })
    }
    if (method === 'GET' && path === '/projects') {
      return fulfillJson(route, {
        items: [{ id: PROJECT_ID, user_id: user.id, name: 'Autosave project', created_at: NOW }],
        total: 1,
      })
    }
    if (method === 'GET' && path === `/api/projects/${PROJECT_ID}/canvases`) {
      return fulfillJson(route, { items: state.canvases, order_revision: 0 })
    }

    const resourceMatch = path.match(
      new RegExp(`^/api/projects/${PROJECT_ID}/canvases/([^/]+)/(document|viewport)$`),
    )
    if (!resourceMatch) return fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 501)
    const canvasId = decodeURIComponent(resourceMatch[1])
    const activeCanvas = state.canvases.find((item) => item.id === canvasId)
    if (!activeCanvas) return fulfillJson(route, { detail: 'Canvas not found' }, 404)

    if (method === 'GET' && resourceMatch[2] === 'document') {
      return fulfillJson(route, {
        canvas: activeCanvas,
        nodes: state.nodes[canvasId],
        connections: state.connections[canvasId],
        revision: activeCanvas.graph_revision,
      })
    }
    if (method === 'PATCH' && resourceMatch[2] === 'viewport' && body) {
      activeCanvas.viewport_x = Number(body.x)
      activeCanvas.viewport_y = Number(body.y)
      activeCanvas.viewport_zoom = Number(body.zoom)
      return fulfillJson(route, activeCanvas)
    }
    if (method === 'PATCH' && resourceMatch[2] === 'document' && body) {
      const patchBody = body as unknown as PatchBody
      state.patchAttempts.push(structuredClone(patchBody))
      if (state.networkOffline) return route.abort('internetdisconnected')
      const committed = state.committedMutations.get(patchBody.client_mutation_id)
      if (committed) {
        if (JSON.stringify(committed.payload) !== JSON.stringify(patchBody)) {
          return fulfillJson(route, {
            detail: {
              code: 'mutation_id_reused',
              current_revision: activeCanvas.graph_revision,
            },
          }, 409)
        }
        return fulfillJson(route, committed.response)
      }
      if (patchBody.base_revision !== activeCanvas.graph_revision) {
        return fulfillJson(route, { detail: { code: 'stale_graph_revision',
          current_revision: activeCanvas.graph_revision } }, 409)
      }
      if (
        state.failureMode === 'error-always' ||
        (state.failureMode === 'error-once' && state.patchAttempts.length === 1)
      ) {
        return fulfillJson(route, { detail: 'Temporary autosave failure' }, 503)
      }
      if (state.failureMode === 'conflict') {
        return fulfillJson(route, {
          detail: { code: 'stale_graph_revision', current_revision: 12 },
        }, 409)
      }
      const shouldLoseResponse = (
        state.failureMode === 'response-loss-once' && state.committedMutations.size === 0
      )
      applyPatch(state, canvasId, patchBody)
      activeCanvas.graph_revision += 1
      await new Promise((resolve) => setTimeout(resolve, 120))
      const response = {
        revision: activeCanvas.graph_revision,
        node_upserts: patchBody.node_upserts.map((item) => asNodeResponse(canvasId, item)),
        node_deletes: patchBody.node_deletes,
        connection_upserts: patchBody.connection_upserts,
        connection_deletes: patchBody.connection_deletes,
        server_timestamp: NOW,
        save_state: 'saved',
      }
      state.committedMutations.set(patchBody.client_mutation_id, {
        payload: structuredClone(patchBody), response,
      })
      if (shouldLoseResponse) return route.abort('connectionreset')
      return fulfillJson(route, response)
    }

    return fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 501)
  })
}

async function openCanvas(page: Page, state: AutosaveState, expectSaved = true) {
  await page.setViewportSize({ width: 1366, height: 768 })
  await installApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'autosave-token'))
  await page.goto(`/app/projects/${PROJECT_ID}/canvases/${FIRST_CANVAS_ID}?canvas_runtime=legacy`)
  await expect(page.locator('.canvas-surface')).toBeVisible()
  if (expectSaved) await expect(page.locator('.sync-status')).toContainText('r7')
}

async function createTextNode(page: Page, x: number) {
  const canvasSurface = page.locator('.canvas-surface')
  const bounds = await canvasSurface.boundingBox()
  if (!bounds) throw new Error('Canvas surface is not available for node creation')
  const maxX = Math.max(40, bounds.width - 80)
  const y = Math.min(280, Math.max(40, bounds.height - 80))
  const safeX = x > 900 ? 420 : Math.min(x, maxX)
  await canvasSurface.dblclick({ position: { x: safeX, y } })
}
test('compatible graph edits batch into one document PATCH and reach Saved within one second', async ({ page }) => {
  const state = createState()
  await openCanvas(page, state)
  await createTextNode(page, 680)
  await page.waitForTimeout(80)
  await createTextNode(page, 1_080)
  const syncStatus = page.locator('.sync-status')
  await expect(syncStatus).toHaveClass(/is-saving/)
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).not.toBeNull()
  await expect(syncStatus).toHaveClass(/is-saved/, { timeout: 1_000 })
  await expect(syncStatus).toContainText('r8')
  await expect(page.getByRole('dialog', { name: '修订历史与恢复' })).toBeHidden()
  expect(state.patchAttempts).toHaveLength(1)
  expect(state.patchAttempts[0].base_revision).toBe(7)
  expect(state.patchAttempts[0].client_mutation_id).toBeTruthy()
  expect(state.patchAttempts[0].node_upserts).toHaveLength(2)
  expect(state.requests.some(({ method, path }) => method === 'POST' && path.endsWith('/nodes'))).toBe(false)
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).toBeNull()
})
test('an edit made in flight is serialized into the next revision batch', async ({ page }) => {
  const state = createState()
  await openCanvas(page, state)

  await createTextNode(page, 800)
  await expect.poll(() => state.patchAttempts.length).toBe(1)
  await createTextNode(page, 420)
  await expect(page.locator('.sync-status')).toHaveClass(/is-saved/, { timeout: 1_500 })
  await expect(page.locator('.sync-status')).toContainText('r9')

  expect(state.patchAttempts).toHaveLength(2)
  expect(state.patchAttempts.map((attempt) => attempt.base_revision)).toEqual([7, 8])
  expect(state.patchAttempts[0].node_upserts).toHaveLength(1)
  expect(state.patchAttempts[1].node_upserts).toHaveLength(1)
})
test('server error retains recovery and explicit retry reuses the rejected mutation ID', async ({ page }) => {
  const state = createState('error-once')
  await openCanvas(page, state)
  await createTextNode(page, 820)
  const syncStatus = page.locator('.sync-status')
  await expect(syncStatus).toHaveClass(/is-error/)
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).not.toBeNull()
  await syncStatus.click()
  await expect(syncStatus).toHaveClass(/is-saved/, { timeout: 1_000 })
  expect(state.patchAttempts).toHaveLength(2)
  expect(state.patchAttempts[1].client_mutation_id).toBe(state.patchAttempts[0].client_mutation_id)
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).toBeNull()
})

test('offline work survives reload and retries the original mutation after reconnect', async ({
  context,
  page,
}) => {
  const state = createState()
  await openCanvas(page, state)
  state.networkOffline = true
  await context.setOffline(true)
  await createTextNode(page, 840)
  const syncStatus = page.locator('.sync-status')
  await expect(syncStatus).toHaveClass(/is-error/)
  await expect.poll(() => page.evaluate((key) => {
    const recovery = JSON.parse(localStorage.getItem(key) ?? 'null')
    return recovery?.payload?.client_mutation_id ?? null
  }, RECOVERY_KEY)).not.toBeNull()
  const recovery = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), RECOVERY_KEY)
  expect(recovery?.payload?.client_mutation_id).toBeTruthy()
  delete recovery.baseDocument
  delete recovery.batchDocument
  await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [RECOVERY_KEY, recovery] as const)
  state.networkOffline = false
  await context.setOffline(false)
  await page.reload()
  await expect(page.locator('.canvas-surface')).toBeVisible()
  await expect(syncStatus).toContainText('本地恢复')
  await syncStatus.click()
  await page.getByRole('button', { name: '恢复本地副本并重试' }).click()
  await expect(syncStatus).toHaveClass(/is-saved/, { timeout: 1_000 })
  expect(state.patchAttempts.length).toBeGreaterThanOrEqual(2)
  expect(state.patchAttempts.every((attempt) => (
    attempt.client_mutation_id === recovery.payload.client_mutation_id
  ))).toBe(true)
  expect(state.committedMutations.size).toBe(1)
  expect(state.nodes[FIRST_CANVAS_ID]).toHaveLength(2)
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).toBeNull()
})

test('response loss retries only the committed batch before saving later desired edits', async ({ page }) => {
  const state = createState('response-loss-once')
  await openCanvas(page, state)
  await createTextNode(page, 840)
  const syncStatus = page.locator('.sync-status')
  await expect(syncStatus).toHaveClass(/is-error/)
  expect(state.nodes[FIRST_CANVAS_ID]).toHaveLength(2)
  expect(state.committedMutations.size).toBe(1)
  await createTextNode(page, 500)
  await expect.poll(() => page.evaluate((key) => {
    const snapshot = JSON.parse(localStorage.getItem(key) ?? 'null')
    return snapshot?.document?.node_upserts?.length === 3 ? snapshot : null
  }, RECOVERY_KEY)).not.toBeNull()
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), RECOVERY_KEY)
  expect(stored.batchDocument.node_upserts).toHaveLength(2)
  expect(stored.document.node_upserts).toHaveLength(3)
  const originalMutationId = state.patchAttempts[0].client_mutation_id
  state.networkOffline = true
  await page.reload()
  await expect(page.locator('.canvas-surface')).toBeVisible()
  state.networkOffline = false
  await syncStatus.click()
  const panel = page.getByRole('dialog', { name: '修订历史与恢复' })
  await panel.getByRole('button', { name: '恢复本地副本并重试' }).click()
  await expect.poll(() => state.patchAttempts.some((attempt) => (
    attempt.client_mutation_id !== originalMutationId
  ))).toBe(true)
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).not.toBeNull()
  await expect(syncStatus).toHaveClass(/is-saved/, { timeout: 1_000 })
  const originalAttempts = state.patchAttempts.filter((attempt) => attempt.client_mutation_id === originalMutationId)
  expect(originalAttempts.every((attempt) => JSON.stringify(attempt) === JSON.stringify(state.patchAttempts[0]))).toBe(true)
  const remainingAttempt = state.patchAttempts.find((attempt) => attempt.client_mutation_id !== originalMutationId)
  expect(remainingAttempt?.base_revision).toBe(8)
  expect(remainingAttempt?.node_upserts).toHaveLength(1)
  expect(state.committedMutations.size).toBe(2)
  expect(state.nodes[FIRST_CANVAS_ID]).toHaveLength(3)
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).toBeNull()
  await expect(panel).toBeFocused()
  await expect(syncStatus).toBeDisabled()
  await panel.getByRole('button', { name: '关闭修订历史' }).click()
  await expect(page.getByRole('button', { name: '打开修订历史', exact: true })).toBeFocused()
})

test('revision conflict stops overwrite and exposes current revision while preserving recovery', async ({ page }) => {
  const state = createState('conflict')
  await openCanvas(page, state)

  await createTextNode(page, 860)
  const syncStatus = page.locator('.sync-status')
  await expect(syncStatus).toHaveClass(/is-conflict/)
  await expect(syncStatus).toContainText('r12')
  expect(state.patchAttempts).toHaveLength(1)
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).not.toBeNull()
  await page.waitForTimeout(650)
  expect(state.patchAttempts).toHaveLength(1)
})

test('Canvas switch flushes the graph batch before loading the next document', async ({ page }) => {
  const state = createState()
  await openCanvas(page, state)

  await createTextNode(page, 900)
  await page.locator('.canvas-switcher').click()
  await page.locator('.canvas-row').nth(1).click()
  await expect(page).toHaveURL(new RegExp(`/canvases/${SECOND_CANVAS_ID}\\?canvas_runtime=legacy$`))

  const patchIndex = state.requests.findIndex(({ method, path }) => (
    method === 'PATCH' && path.endsWith(`/${FIRST_CANVAS_ID}/document`)
  ))
  const secondLoadIndex = state.requests.findIndex(({ method, path }) => (
    method === 'GET' && path.endsWith(`/${SECOND_CANVAS_ID}/document`)
  ))
  expect(patchIndex).toBeGreaterThan(-1)
  expect(secondLoadIndex).toBeGreaterThan(patchIndex)
})

test('a recovery snapshot detected on load survives a clean Canvas switch', async ({ page }) => {
  const state = createState()
  await page.addInitScript(({ key, projectId, canvasId }) => {
    const invalidNode = { id: 'local-invalid', node_type: 'text', content: { title: 'Invalid local' },
      position_x: 10, position_y: 10, width: 240, height: 140, z_index: 0,
      parent_node_id: 'missing-parent', is_locked: false, is_collapsed: false }
    window.localStorage.setItem(key, JSON.stringify({ version: 1, projectId, canvasId,
      baseRevision: 7, clientMutationId: null, batchDocument: null,
      document: { node_upserts: [invalidNode], connection_upserts: [] }, payload: null }))
  }, { key: RECOVERY_KEY, projectId: PROJECT_ID, canvasId: FIRST_CANVAS_ID })
  await openCanvas(page, state, false)

  await expect(page.locator('.sync-status')).toHaveClass(/is-error/)
  await expect(page.locator('.sync-status')).toContainText('本地恢复')
  await page.locator('.sync-status').click()
  await page.getByRole('button', { name: '恢复本地副本并重试' }).click()
  await expect(page.locator('.sync-status')).toContainText('本地恢复副本包含无效的父子关系')
  await expect(page.locator('.revision-panel > .panel-error').first()).toContainText('本地副本已保留')
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).not.toBeNull()
  expect(state.patchAttempts).toHaveLength(0)
  await expect(page.getByRole('button', { name: '定位到 Existing node' })).toBeVisible()
  await expect(page.getByRole('button', { name: '定位到 Invalid local' })).toHaveCount(0)
  await page.getByRole('button', { name: '关闭修订历史' }).click()
  await expect(page.locator('.sync-status')).toBeFocused()
  await page.locator('.canvas-switcher').click()
  await page.locator('.canvas-row').nth(1).click()
  await expect(page).toHaveURL(new RegExp(`/canvases/${SECOND_CANVAS_ID}\\?canvas_runtime=legacy$`))
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).not.toBeNull()
})

test('page hide preserves unsent graph work before the asynchronous flush', async ({ page }) => {
  const state = createState()
  await openCanvas(page, state)
  await createTextNode(page, 880)
  await expect(page.locator('.sync-status')).toHaveClass(/is-saving/)

  const recovery = await page.evaluate((key) => {
    window.localStorage.removeItem(key)
    window.dispatchEvent(new PageTransitionEvent('pagehide'))
    return window.localStorage.getItem(key)
  }, RECOVERY_KEY)
  expect(recovery).not.toBeNull()
})

test('a failed switch flush blocks navigation and keeps the local recovery copy', async ({ page }) => {
  const state = createState('error-always')
  await openCanvas(page, state)
  await createTextNode(page, 920)
  await expect(page.locator('.sync-status')).toHaveClass(/is-error/)

  await page.locator('.canvas-switcher').click()
  await page.locator('.canvas-row').nth(1).click()
  await expect.poll(() => state.patchAttempts.length).toBe(2)
  await expect(page).toHaveURL(new RegExp(`/canvases/${FIRST_CANVAS_ID}\\?canvas_runtime=legacy$`))
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).not.toBeNull()
})
