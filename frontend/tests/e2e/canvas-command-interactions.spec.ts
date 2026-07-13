import { expect, test, type Page, type Route } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-13T16:00:00Z'

interface RequestRecord {
  method: string
  path: string
  body?: Record<string, unknown>
}

interface CommandState {
  nodes: Array<Record<string, unknown>>
  connections: Array<Record<string, unknown>>
  requests: RequestRecord[]
  nextNode: number
  nextConnection: number
}

const canvas = {
  id: 'canvas-command', project_id: 'project-command', name: '交互画布', sort_order: 0,
  status: 'active', viewport_x: 0, viewport_y: 0, viewport_zoom: 1, graph_revision: 0,
  created_at: NOW, updated_at: NOW, deleted_at: null,
}

const user = {
  id: 'user-command', username: 'command-owner', email: 'command@example.com', nickname: '交互创作者',
  avatar_url: '', role: 'user', status: 'active', generation_status: 'enabled',
  created_at: NOW, updated_at: NOW, last_login_at: NOW,
}

function node(id: string, title: string, x: number) {
  return {
    id, project_id: 'project-command', canvas_id: 'canvas-command', node_type: 'text',
    content: { title, text: `${title} 内容` }, position_x: x, position_y: 260,
    width: 240, height: 140, z_index: 0, parent_node_id: null, is_locked: false,
    is_collapsed: false, status: 'idle', created_at: NOW, updated_at: NOW,
  }
}

function connection(id: string, from: string, to: string) {
  return {
    id, project_id: 'project-command', canvas_id: 'canvas-command', source_node_id: from,
    source_port: 'out', target_node_id: to, target_port: 'in', status: 'active', metadata: {},
    created_at: NOW, updated_at: NOW,
  }
}

function createState(): CommandState {
  return {
    nodes: [node('node-a', '镜头 A', 180), node('node-b', '镜头 B', 520), node('node-c', '镜头 C', 860)],
    connections: [connection('connection-ab', 'node-a', 'node-b'), connection('connection-bc', 'node-b', 'node-c')],
    requests: [],
    nextNode: 1,
    nextConnection: 1,
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

async function installCommandApi(page: Page, state: CommandState) {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const method = request.method()
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() })
    const body = request.postData() ? request.postDataJSON() as Record<string, unknown> : undefined
    state.requests.push({ method, path, body })

    if (method === 'GET' && path === '/me') return fulfillJson(route, { user, quotas: { text: 5, image: 3, video: 2 } })
    if (method === 'GET' && path === '/projects') {
      return fulfillJson(route, { items: [{ id: 'project-command', user_id: user.id, name: '交互项目', created_at: NOW }], total: 1 })
    }
    if (method === 'GET' && path === '/api/projects/project-command/canvases') {
      return fulfillJson(route, { items: [canvas], order_revision: 0 })
    }
    if (method === 'GET' && path.endsWith('/document')) {
      return fulfillJson(route, { canvas, nodes: state.nodes, connections: state.connections, revision: 0 })
    }

    const nodePath = path.match(/\/nodes(?:\/([^/]+))?$/)
    if (nodePath && method === 'POST' && body) {
      const created = {
        ...node(`node-copy-${state.nextNode++}`, String((body.content as Record<string, unknown>).title), Number(body.position_x)),
        node_type: body.node_type,
        content: body.content,
        position_y: body.position_y,
        width: body.width,
        height: body.height,
        z_index: body.z_index ?? 0,
        parent_node_id: body.parent_node_id ?? null,
        is_locked: body.is_locked ?? false,
        is_collapsed: body.is_collapsed ?? false,
      }
      state.nodes.push(created)
      return fulfillJson(route, created, 201)
    }
    if (nodePath?.[1] && method === 'PUT' && body) {
      const nodeId = decodeURIComponent(nodePath[1])
      const target = state.nodes.find((item) => item.id === nodeId)
      if (!target) return fulfillJson(route, { detail: 'Node not found' }, 404)
      Object.assign(target, body)
      return fulfillJson(route, target)
    }
    if (nodePath?.[1] && method === 'DELETE') {
      const nodeId = decodeURIComponent(nodePath[1])
      state.nodes = state.nodes.filter((item) => item.id !== nodeId)
      state.connections = state.connections.filter((item) => item.source_node_id !== nodeId && item.target_node_id !== nodeId)
      return route.fulfill({ status: 204, headers: corsHeaders() })
    }

    const connectionPath = path.match(/\/connections(?:\/([^/]+))?$/)
    if (connectionPath && method === 'POST' && body) {
      const created = {
        ...connection(`connection-copy-${state.nextConnection++}`, String(body.source_node_id), String(body.target_node_id)),
        source_port: body.source_port,
        target_port: body.target_port,
        metadata: body.metadata,
      }
      state.connections.push(created)
      return fulfillJson(route, created, 201)
    }
    if (connectionPath?.[1] && method === 'DELETE') {
      const connectionId = decodeURIComponent(connectionPath[1])
      state.connections = state.connections.filter((item) => item.id !== connectionId)
      return route.fulfill({ status: 204, headers: corsHeaders() })
    }
    return fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 501)
  })
}

async function openCommandCanvas(page: Page, state: CommandState, width = 1366) {
  await page.setViewportSize({ width, height: 768 })
  await installCommandApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'command-token'))
  await page.goto('/app/projects/project-command/canvases/canvas-command')
  await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toBeVisible()
  if (width >= 768) await expect(page.getByRole('button', { name: '定位到 镜头 A' })).toBeVisible()
  else await expect(page.getByText('浏览审阅模式', { exact: true })).toBeVisible()
}

async function clickNode(page: Page, x: number, modifiers: Array<'Control' | 'Meta' | 'Shift'> = []) {
  await page.locator('.canvas-surface').click({ position: { x: x + 80, y: 320 }, modifiers })
}

async function captureCommandEvidence(page: Page, name: string) {
  const directory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-005-unit-c')
  await mkdir(directory, { recursive: true })
  return resolve(directory, `${name}.png`)
}

test('modifier selection stays deterministic and dragging one selected node moves the full selection', async ({ page }, testInfo) => {
  const state = createState()
  await openCommandCanvas(page, state)

  const surfaceBox = await page.locator('.canvas-surface').boundingBox()
  if (!surfaceBox) throw new Error('Canvas surface is unavailable')
  await page.mouse.move(surfaceBox.x + 120, surfaceBox.y + 210)
  await page.mouse.down()
  await page.mouse.move(surfaceBox.x + 800, surfaceBox.y + 430, { steps: 4 })
  await page.mouse.up()
  await expect(page.getByRole('toolbar', { name: '2 个已选节点的操作' })).toBeVisible()
  await expect(page.getByRole('button', { name: '定位到 镜头 A' })).toHaveClass(/selected/)
  await expect(page.getByRole('button', { name: '定位到 镜头 B' })).toHaveClass(/selected/)
  await clickNode(page, 520, ['Control'])
  await expect(page.getByRole('toolbar', { name: '1 个已选节点的操作' })).toBeVisible()
  await clickNode(page, 520, ['Control'])

  await page.mouse.move(surfaceBox.x + 260, surfaceBox.y + 320)
  await page.mouse.down()
  await page.mouse.move(surfaceBox.x + 180, surfaceBox.y + 380, { steps: 4 })
  expect(state.requests.filter((request) => request.method === 'PUT')).toHaveLength(0)
  await page.mouse.up()

  await expect.poll(() => state.requests.filter((request) => request.method === 'PUT').length).toBe(2)
  const moves = state.requests.filter((request) => request.method === 'PUT').map((request) => request.body)
  expect(moves).toEqual(expect.arrayContaining([
    expect.objectContaining({ position_x: 100, position_y: 320 }),
    expect.objectContaining({ position_x: 440, position_y: 320 }),
  ]))
  await expect(page.getByRole('toolbar', { name: '2 个已选节点的操作' })).toBeVisible()
  const desktopEvidence = await captureCommandEvidence(page, 'desktop-multi-selection-toolbar')
  await page.screenshot({ path: desktopEvidence })
  await testInfo.attach('desktop-multi-selection-toolbar', { path: desktopEvidence, contentType: 'image/png' })
})

test('keyboard duplicate and toolbar delete share one selected-subgraph command boundary', async ({ page }) => {
  const state = createState()
  await openCommandCanvas(page, state)
  await clickNode(page, 180)
  await clickNode(page, 520, ['Control'])

  await page.keyboard.press('Control+d')
  await expect.poll(() => state.nodes.length).toBe(5)
  await expect.poll(() => state.connections.length).toBe(3)
  expect(state.connections.at(-1)).toEqual(expect.objectContaining({
    source_node_id: 'node-copy-1',
    target_node_id: 'node-copy-2',
  }))
  await expect(page.getByRole('button', { name: '定位到 镜头 A 副本' })).toHaveClass(/selected/)
  await expect(page.getByRole('button', { name: '定位到 镜头 B 副本' })).toHaveClass(/selected/)

  await page.getByRole('button', { name: '删除所选节点' }).click()
  await expect.poll(() => state.nodes.length).toBe(3)
  await expect.poll(() => state.requests.filter((request) => request.method === 'DELETE').length).toBe(2)
  expect(state.nodes.map((item) => item.id)).toEqual(['node-a', 'node-b', 'node-c'])
  expect(state.connections.map((item) => item.id)).toEqual(['connection-ab', 'connection-bc'])
})

test('mobile review mode never exposes or dispatches selection mutation commands', async ({ page }, testInfo) => {
  const state = createState()
  await openCommandCanvas(page, state, 375)
  await clickNode(page, 180)
  await expect(page.getByRole('toolbar', { name: /已选节点的操作/ })).toHaveCount(0)
  await page.keyboard.press('Control+d')
  await page.keyboard.press('Delete')
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toBeVisible()
  await expect(page.getByRole('button', { name: /删除节点/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /删除连线/ })).toHaveCount(0)
  expect(state.requests.some((request) => ['POST', 'PUT', 'DELETE'].includes(request.method))).toBe(false)
  const mobileEvidence = await captureCommandEvidence(page, 'mobile-graph-access-panel')
  await page.screenshot({ path: mobileEvidence })
  await testInfo.attach('mobile-graph-access-panel', { path: mobileEvidence, contentType: 'image/png' })
})

test('Canvas-focus shortcuts group, ungroup, connect, and expose synchronized DOM graph access', async ({ page }, testInfo) => {
  const state = createState()
  await openCommandCanvas(page, state)
  await clickNode(page, 180)
  await clickNode(page, 520, ['Control'])

  await page.getByRole('link', { name: '返回项目首页' }).focus()
  await page.keyboard.press('Control+g')
  expect(state.requests.filter((request) => request.method === 'POST' && request.path.endsWith('/nodes'))).toHaveLength(0)

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+g')
  await expect.poll(() => state.nodes.filter((item) => item.node_type === 'group').length).toBe(1)
  await expect.poll(() => state.nodes.filter((item) => item.parent_node_id).length).toBe(2)
  await expect(page.getByRole('toolbar', { name: '1 个已选节点的操作' })).toBeVisible()
  const groupEvidence = await captureCommandEvidence(page, 'desktop-group-selection')
  await page.screenshot({ path: groupEvidence })
  await testInfo.attach('desktop-group-selection', { path: groupEvidence, contentType: 'image/png' })

  await page.keyboard.press('Control+Shift+g')
  await expect.poll(() => state.nodes.filter((item) => item.node_type === 'group').length).toBe(0)
  await expect.poll(() => state.nodes.filter((item) => item.parent_node_id).length).toBe(0)

  await clickNode(page, 860)
  await clickNode(page, 180, ['Control'])
  await page.keyboard.press('Control+Enter')
  await expect.poll(() => state.connections.some((item) => item.source_node_id === 'node-a' && item.target_node_id === 'node-c')).toBe(true)

  await page.keyboard.press('?')
  const dialog = page.getByRole('dialog', { name: '画布内容与快捷键' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Ctrl+G')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '选择并定位 镜头 A' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '查看连线 镜头 A 到 镜头 C' })).toBeVisible()
  const desktopEvidence = await captureCommandEvidence(page, 'desktop-graph-access-panel')
  await page.screenshot({ path: desktopEvidence })
  await testInfo.attach('desktop-graph-access-panel', { path: desktopEvidence, contentType: 'image/png' })
  await dialog.getByRole('button', { name: '选择并定位 镜头 B' }).click()
  await expect(page.getByRole('button', { name: '定位到 镜头 B' })).toHaveClass(/selected/)
})
