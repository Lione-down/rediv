import { expect, type Page, type Route } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { GENERATION_CAPABILITIES } from './canvas-generation-parameters-fixture'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-13T16:00:00Z'

interface RequestRecord {
  method: string
  path: string
  body?: Record<string, unknown>
}

export interface CommandState {
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

export function node(id: string, title: string, x: number) {
  return {
    id, project_id: 'project-command', canvas_id: 'canvas-command', node_type: 'text',
    content: { title, text: `${title} 内容` }, position_x: x, position_y: 260,
    width: 240, height: 140, z_index: 0, parent_node_id: null, is_locked: false,
    is_collapsed: false, status: 'idle', created_at: NOW, updated_at: NOW,
  }
}

export function connection(id: string, from: string, to: string) {
  return {
    id, project_id: 'project-command', canvas_id: 'canvas-command', source_node_id: from,
    source_port: 'out', target_node_id: to, target_port: 'in', status: 'active', metadata: {},
    created_at: NOW, updated_at: NOW,
  }
}

export function createState(): CommandState {
  canvas.graph_revision = 0
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
    if (method === 'GET' && path === '/assets') return fulfillJson(route, { items: [], total: 0, page: 1, page_size: 100 })
    if (method === 'GET' && path === '/templates') return fulfillJson(route, { items: [], total: 0 })
    if (method === 'GET' && path === '/api/generation-tasks') return fulfillJson(route, { items: [], total: 0, page: 1, page_size: 100 })
    if (method === 'GET' && path === '/api/generation-capabilities') return fulfillJson(route, GENERATION_CAPABILITIES)
    if (method === 'GET' && path === '/api/projects/project-command/canvases') {
      return fulfillJson(route, { items: [canvas], order_revision: 0 })
    }
    if (method === 'GET' && path.endsWith('/document')) {
      return fulfillJson(route, {
        canvas,
        nodes: state.nodes,
        connections: state.connections,
        revision: canvas.graph_revision,
      })
    }
    if (method === 'PATCH' && path.endsWith('/viewport') && body) {
      return fulfillJson(route, {
        ...canvas,
        viewport_x: Number(body.x),
        viewport_y: Number(body.y),
        viewport_zoom: Number(body.zoom),
      })
    }
    if (method === 'PATCH' && path.endsWith('/document') && body) {
      const nodeUpserts = body.node_upserts as Array<Record<string, unknown>>
      const nodeDeletes = body.node_deletes as string[]
      const connectionUpserts = body.connection_upserts as Array<Record<string, unknown>>
      const connectionDeletes = body.connection_deletes as string[]
      const nodesById = new Map(state.nodes.map((item) => [String(item.id), item]))
      for (const nodeId of nodeDeletes) nodesById.delete(nodeId)
      for (const item of nodeUpserts) {
        nodesById.set(String(item.id), {
          ...item,
          project_id: 'project-command',
          canvas_id: 'canvas-command',
          status: 'idle',
          created_at: NOW,
          updated_at: NOW,
        })
      }
      state.nodes = [...nodesById.values()]
      const connectionsById = new Map(state.connections.map((item) => [String(item.id), item]))
      for (const connectionId of connectionDeletes) connectionsById.delete(connectionId)
      for (const item of connectionUpserts) {
        connectionsById.set(String(item.id), {
          ...item,
          project_id: 'project-command',
          canvas_id: 'canvas-command',
          status: 'active',
          created_at: NOW,
          updated_at: NOW,
        })
      }
      state.connections = [...connectionsById.values()]
      canvas.graph_revision += 1
      return fulfillJson(route, {
        revision: canvas.graph_revision,
        node_upserts: nodeUpserts.map((item) => nodesById.get(String(item.id))),
        node_deletes: nodeDeletes,
        connection_upserts: connectionUpserts.map((item) => connectionsById.get(String(item.id))),
        connection_deletes: connectionDeletes,
        server_timestamp: NOW,
        save_state: 'saved',
      })
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

export async function openCommandCanvas(page: Page, state: CommandState, width = 1366) {
  await page.setViewportSize({ width, height: 768 })
  await installCommandApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'command-token'))
  await page.goto('/app/projects/project-command/canvases/canvas-command')
  await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toBeVisible()
  if (width >= 768) await expect(page.getByRole('button', { name: '定位到 镜头 A' })).toBeVisible()
  else await expect(page.getByText('浏览审阅模式', { exact: true })).toBeVisible()
}

export async function clickNode(page: Page, x: number, modifiers: Array<'Control' | 'Meta' | 'Shift'> = []) {
  await page.locator('.canvas-surface').click({ position: { x: x + 80, y: 320 }, modifiers })
}

export async function captureCommandEvidence(page: Page, name: string) {
  const directory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-005-unit-c')
  await mkdir(directory, { recursive: true })
  return resolve(directory, `${name}.png`)
}

export async function captureUnitDEvidence(page: Page, name: string) {
  const directory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-005-unit-d')
  await mkdir(directory, { recursive: true })
  return resolve(directory, `${name}.png`)
}
