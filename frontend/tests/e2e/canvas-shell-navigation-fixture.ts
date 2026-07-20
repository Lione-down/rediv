import { expect, type Page, type Route } from '@playwright/test'
const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-13T10:00:00Z'
export const visualViewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'compact-desktop', width: 1366, height: 768 },
  { name: 'narrow-workspace', width: 920, height: 900 },
  { name: 'mobile-review', width: 375, height: 812 },
] as const
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
export interface ShellState {
  canvases: CanvasRecord[]
  documents: Record<string, { nodes: Array<Record<string, unknown>>; connections: Array<Record<string, unknown>> }>
  orderRevision: number
  rejectNextReorder: boolean
  requests: Array<{ method: string; path: string; body?: unknown }>
}
function canvasDocument(canvasId: string) {
  return {
    nodes: [
      {
        id: `node-review-${canvasId}`, project_id: 'project-shell', canvas_id: canvasId, node_type: 'image',
        content: { title: '主视觉', prompt: '夜景电影海报' }, position_x: 180, position_y: 140,
        width: 240, height: 140, status: 'running', created_at: NOW, updated_at: NOW,
      },
      {
        id: `node-result-${canvasId}`, project_id: 'project-shell', canvas_id: canvasId, node_type: 'result',
        content: { title: '成片结果' }, position_x: 540, position_y: 140,
        width: 240, height: 140, status: 'idle', created_at: NOW, updated_at: NOW,
      },
    ],
    connections: [{
      id: `connection-${canvasId}`, project_id: 'project-shell', canvas_id: canvasId,
      source_node_id: `node-review-${canvasId}`, source_port: 'out',
      target_node_id: `node-result-${canvasId}`, target_port: 'in',
      status: 'active', metadata: {}, created_at: NOW, updated_at: NOW,
    }],
  }
}
export function getCanvasDocument(state: ShellState, canvasId: string) {
  state.documents[canvasId] ??= canvasDocument(canvasId)
  return state.documents[canvasId]
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
export function canvas(id: string, name: string, sortOrder: number): CanvasRecord {
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
    const documentMatch = path.match(/^\/api\/projects\/project-shell\/canvases\/([^/]+)\/document$/)
    if (method === 'GET' && documentMatch) {
      const canvasId = decodeURIComponent(documentMatch[1])
      const activeCanvas = state.canvases.find((item) => item.id === canvasId)
      if (!activeCanvas) return fulfillJson(route, { detail: 'Canvas not found' }, 404)
      const document = getCanvasDocument(state, canvasId)
      return fulfillJson(route, {
        canvas: activeCanvas,
        nodes: document.nodes,
        connections: document.connections,
        revision: activeCanvas.graph_revision,
      })
    }
    if (method === 'PATCH' && documentMatch) {
      const canvasId = decodeURIComponent(documentMatch[1])
      const activeCanvas = state.canvases.find((item) => item.id === canvasId)
      if (!activeCanvas) return fulfillJson(route, { detail: 'Canvas not found' }, 404)
      const payload = body as Record<string, unknown>
      const document = getCanvasDocument(state, canvasId)
      const nodeUpserts = payload.node_upserts as Array<Record<string, unknown>>
      const nodeDeletes = payload.node_deletes as string[]
      const connectionUpserts = payload.connection_upserts as Array<Record<string, unknown>>
      const connectionDeletes = payload.connection_deletes as string[]
      const nodes = new Map(document.nodes.map((item) => [String(item.id), item]))
      for (const id of nodeDeletes) nodes.delete(id)
      for (const item of nodeUpserts) nodes.set(String(item.id), { ...item, project_id: 'project-shell', canvas_id: canvasId })
      const connections = new Map(document.connections.map((item) => [String(item.id), item]))
      for (const id of connectionDeletes) connections.delete(id)
      for (const item of connectionUpserts) connections.set(String(item.id), { ...item, project_id: 'project-shell', canvas_id: canvasId })
      document.nodes = [...nodes.values()]
      document.connections = [...connections.values()]
      activeCanvas.graph_revision += 1
      return fulfillJson(route, {
        revision: activeCanvas.graph_revision,
        node_upserts: nodeUpserts,
        node_deletes: nodeDeletes,
        connection_upserts: connectionUpserts,
        connection_deletes: connectionDeletes,
        server_timestamp: NOW,
        save_state: 'saved',
      })
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

export async function openShell(page: Page, state: ShellState, viewport = { width: 1440, height: 900 }) {
  await page.setViewportSize(viewport)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await installShellApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'shell-token'))
  await page.goto('/app/projects/project-shell/canvases/canvas-first')
  await expect(page.getByRole('region', { name: '项目与画布导航' })).toBeVisible()
}

export function createState(): ShellState {
  return {
    canvases: [canvas('canvas-first', '画布 1', 0), canvas('canvas-second', '分镜', 1)],
    documents: {},
    orderRevision: 0,
    rejectNextReorder: false,
    requests: [],
  }
}
