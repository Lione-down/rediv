import { expect, test, type Page, type Route } from '@playwright/test'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-13T10:00:00Z'

interface CanvasRecord {
  id: string
  project_id: string
  name: string
  sort_order: number
  status: 'active' | 'archived'
  viewport_x: number
  viewport_y: number
  viewport_zoom: number
  graph_revision: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface ShellState {
  canvases: CanvasRecord[]
  orderRevision: number
  rejectNextReorder: boolean
  requests: Array<{ method: string; path: string; body?: unknown }>
}

const user = {
  id: 'user-shell',
  username: 'creator',
  email: 'creator@example.com',
  nickname: '画布创作者',
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
    project_id: 'project-shell',
    name,
    sort_order: sortOrder,
    status: 'active',
    viewport_x: 0,
    viewport_y: 0,
    viewport_zoom: 1,
    graph_revision: 0,
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
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

function normalizeOrder(state: ShellState) {
  state.canvases = state.canvases
    .filter((item) => item.status === 'active')
    .map((item, index) => ({ ...item, sort_order: index }))
}

async function installShellApi(page: Page, state: ShellState) {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const path = url.pathname
    const body = request.postData() ? request.postDataJSON() : undefined
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() })
    state.requests.push({ method, path, body })

    if (method === 'GET' && path === '/me') {
      return fulfillJson(route, { user, quotas: { text: 5, image: 4, video: 2 } })
    }
    if (method === 'GET' && path === '/projects') {
      return fulfillJson(route, {
        items: [{ id: 'project-shell', user_id: user.id, name: '短片工作室', created_at: NOW }],
        total: 1,
      })
    }
    if (method === 'GET' && path === '/api/projects/project-shell/canvases') {
      return fulfillJson(route, { items: state.canvases, order_revision: state.orderRevision })
    }
    if (method === 'GET' && path === '/projects/project-shell/nodes') {
      return fulfillJson(route, {
        items: [{
          id: 'node-review', project_id: 'project-shell', node_type: 'image',
          content: { title: '主视觉', prompt: '夜景电影海报' }, position_x: 180, position_y: 140,
          width: 240, height: 140, status: 'idle', created_at: NOW,
        }],
        total: 1,
      })
    }
    if (method === 'GET' && path === '/projects/project-shell/connections') {
      return fulfillJson(route, { items: [], total: 0 })
    }

    if (method === 'POST' && path === '/api/projects/project-shell/canvases') {
      state.orderRevision += 1
      const created = canvas('canvas-created', String((body as { name: string }).name), state.canvases.length)
      state.canvases.push(created)
      return fulfillJson(route, { item: created, order_revision: state.orderRevision }, 201)
    }

    const itemMatch = path.match(/^\/api\/projects\/project-shell\/canvases\/([^/]+)$/)
    if (method === 'PATCH' && itemMatch && !path.endsWith('/canvases/order')) {
      const canvasId = decodeURIComponent(itemMatch[1])
      const index = state.canvases.findIndex((item) => item.id === canvasId)
      const payload = body as { name?: string; status?: 'archived' }
      if (index < 0) return fulfillJson(route, { detail: 'Canvas not found' }, 404)
      if (payload.status === 'archived') {
        state.canvases[index] = { ...state.canvases[index], status: 'archived', deleted_at: NOW }
      } else if (payload.name) {
        state.canvases[index] = { ...state.canvases[index], name: payload.name }
      }
      state.orderRevision += 1
      const updated = state.canvases[index]
      normalizeOrder(state)
      return fulfillJson(route, { item: updated, order_revision: state.orderRevision })
    }

    if (method === 'PATCH' && path === '/api/projects/project-shell/canvases/order') {
      if (state.rejectNextReorder) {
        state.rejectNextReorder = false
        state.orderRevision += 1
        return fulfillJson(route, {
          detail: { code: 'stale_order_revision', current_order_revision: state.orderRevision },
        }, 409)
      }
      const ids = (body as { ordered_canvas_ids: string[] }).ordered_canvas_ids
      state.canvases = ids.map((id, index) => ({ ...state.canvases.find((item) => item.id === id)!, sort_order: index }))
      state.orderRevision += 1
      return fulfillJson(route, { items: state.canvases, order_revision: state.orderRevision })
    }

    const duplicateMatch = path.match(/^\/api\/projects\/project-shell\/canvases\/([^/]+)\/duplicate$/)
    if (method === 'POST' && duplicateMatch) {
      const payload = body as { name?: string }
      state.orderRevision += 1
      const duplicated = canvas('canvas-copy', payload.name || '画布副本', state.canvases.length)
      state.canvases.push(duplicated)
      return fulfillJson(route, { item: duplicated, order_revision: state.orderRevision }, 201)
    }

    return fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 501)
  })
}

async function openShell(page: Page, state: ShellState, viewport = { width: 1440, height: 900 }) {
  await page.setViewportSize(viewport)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await installShellApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'shell-token'))
  await page.goto('/app/projects/project-shell/canvases/canvas-first')
  await expect(page.getByRole('region', { name: '项目与画布导航' })).toBeVisible()
}

function createState(): ShellState {
  return {
    canvases: [canvas('canvas-first', '画布 1', 0), canvas('canvas-second', '分镜', 1)],
    orderRevision: 0,
    rejectNextReorder: false,
    requests: [],
  }
}

test('Canvas shell completes metadata navigation through server-confirmed items', async ({ page }) => {
  const state = createState()
  await openShell(page, state)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('button', { name: '新建画布' }).click()
  await page.getByLabel('画布名称').fill('视觉设计')
  await page.getByRole('button', { name: '创建并打开' }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-created$/)

  await page.getByRole('button', { name: '视觉设计' }).click()
  await page.getByRole('button', { name: '重命名当前画布' }).click()
  await page.getByLabel('画布名称').fill('视觉锁定')
  await page.getByRole('button', { name: '保存名称' }).click()
  await expect(page.getByRole('button', { name: '视觉锁定' })).toBeVisible()

  await page.getByRole('button', { name: '视觉锁定' }).click()
  await page.getByRole('button', { name: '向前移动当前画布' }).click()
  await expect.poll(() => state.canvases.map((item) => item.id)).toEqual([
    'canvas-first', 'canvas-created', 'canvas-second',
  ])

  await page.getByRole('button', { name: '复制当前画布' }).click()
  await page.getByLabel('画布名称').fill('视觉备份')
  await page.getByRole('button', { name: '复制并打开' }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-copy$/)

  await page.getByRole('button', { name: '视觉备份' }).click()
  await page.getByRole('button', { name: '归档当前画布' }).click()
  await page.getByRole('button', { name: '确认归档' }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-first$/)
  expect(state.canvases.some((item) => item.id === 'canvas-copy')).toBe(false)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-second$/)
})

test('stale reorder reloads recovery state and succeeds on explicit retry', async ({ page }) => {
  const state = createState()
  state.rejectNextReorder = true
  await openShell(page, state)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('button', { name: '向后移动当前画布' }).click()
  await expect(page.getByRole('alert')).toContainText('画布排序保存失败，请重试。')
  expect(state.requests.filter((request) => request.path.endsWith('/canvases')).length).toBeGreaterThan(1)

  await page.getByRole('button', { name: '向后移动当前画布' }).click()
  await expect.poll(() => state.canvases.map((item) => item.id)).toEqual(['canvas-second', 'canvas-first'])
})

test('the last active Canvas cannot expose an enabled archive action', async ({ page }) => {
  const state = createState()
  state.canvases = [canvas('canvas-first', '画布 1', 0)]
  await openShell(page, state)

  await page.getByRole('button', { name: '画布 1' }).click()
  await expect(page.getByRole('button', { name: '归档当前画布' })).toBeDisabled()
})

test('mobile shell is rendered read-only and keeps accessible route controls', async ({ page }) => {
  const state = createState()
  await openShell(page, state, { width: 375, height: 812 })

  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await expect(stage).toHaveAttribute('aria-readonly', 'true')
  await expect(page.getByText('浏览审阅模式', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '画布 1' }).click()
  await expect(page.getByRole('button', { name: '新建画布' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '归档当前画布' })).toHaveCount(0)

  const backButton = page.getByRole('link', { name: '返回项目首页' })
  const accountButton = page.getByRole('link', { name: '打开画布创作者' })
  for (const control of [backButton, accountButton]) {
    const box = await control.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(40)
    expect(box?.height).toBeGreaterThanOrEqual(40)
  }

  await page.keyboard.press('Escape')
  await page.locator('.skip-link').focus()
  await expect(page.locator('.skip-link')).toBeVisible()
  await expect(page.locator('.canvas-workspace')).toHaveCSS('--v2-press-scale', '1')
  expect(state.requests.some((request) => ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method))).toBe(false)
})
