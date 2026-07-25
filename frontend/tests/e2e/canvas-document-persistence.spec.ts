import { expect, test, type Page, type Route } from '@playwright/test'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-13T14:00:00Z'

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

interface RequestRecord {
  method: string
  path: string
  body?: Record<string, unknown>
}

interface DocumentState {
  canvases: CanvasRecord[]
  nodes: Record<string, Array<Record<string, unknown>>>
  requests: RequestRecord[]
}

const user = {
  id: 'user-document',
  username: 'document-owner',
  email: 'document@example.com',
  nickname: '文档创作者',
  avatar_url: '',
  role: 'user',
  status: 'active',
  generation_status: 'enabled',
  created_at: NOW,
  updated_at: NOW,
  last_login_at: NOW,
}

function canvas(id: string, name: string, sortOrder: number, zoom: number): CanvasRecord {
  return {
    id,
    project_id: 'project-document',
    name,
    sort_order: sortOrder,
    status: 'active',
    viewport_x: id === 'canvas-first' ? 120 : -80,
    viewport_y: id === 'canvas-first' ? -40 : 60,
    viewport_zoom: zoom,
    graph_revision: sortOrder + 7,
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  }
}

function node(canvasId: string, id: string, title: string, x: number) {
  return {
    id,
    project_id: 'project-document',
    canvas_id: canvasId,
    node_type: 'text',
    content: { title, text: title },
    position_x: x,
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

function createState(): DocumentState {
  return {
    canvases: [
      canvas('canvas-first', '画布 1', 0, 2),
      canvas('canvas-second', '分镜', 1, 0.5),
    ],
    nodes: {
      'canvas-first': [node('canvas-first', 'node-first', '第一画布节点', 100)],
      'canvas-second': [node('canvas-second', 'node-second', '第二画布节点', -220)],
    },
    requests: [],
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

async function installDocumentApi(page: Page, state: DocumentState) {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const method = request.method()
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() })
    const body = request.postData() ? request.postDataJSON() as Record<string, unknown> : undefined
    state.requests.push({ method, path, body })

    if (method === 'GET' && path === '/me') {
      return fulfillJson(route, { user, quotas: { text: 5, image: 3, video: 2 } })
    }
    if (method === 'GET' && path === '/projects') {
      return fulfillJson(route, {
        items: [{ id: 'project-document', user_id: user.id, name: '文档边界项目', created_at: NOW }],
        total: 1,
      })
    }
    if (method === 'GET' && path === '/api/projects/project-document/canvases') {
      return fulfillJson(route, { items: state.canvases, order_revision: 1 })
    }

    const resourceMatch = path.match(
      /^\/api\/projects\/project-document\/canvases\/([^/]+)\/(document|viewport|nodes)(?:\/([^/]+))?$/,
    )
    if (resourceMatch) {
      const canvasId = decodeURIComponent(resourceMatch[1])
      const resource = resourceMatch[2]
      const activeCanvas = state.canvases.find((item) => item.id === canvasId)
      if (!activeCanvas) return fulfillJson(route, { detail: 'Canvas not found' }, 404)

      if (method === 'GET' && resource === 'document') {
        return fulfillJson(route, {
          canvas: activeCanvas,
          nodes: state.nodes[canvasId] ?? [],
          connections: [],
          revision: activeCanvas.graph_revision,
        })
      }
      if (method === 'PATCH' && resource === 'viewport' && body) {
        activeCanvas.viewport_x = Number(body.x)
        activeCanvas.viewport_y = Number(body.y)
        activeCanvas.viewport_zoom = Number(body.zoom)
        activeCanvas.updated_at = NOW
        return fulfillJson(route, activeCanvas)
      }
      if (method === 'PATCH' && resource === 'document' && body) {
        const nodeUpserts = body.node_upserts as Array<Record<string, unknown>>
        const nodeDeletes = body.node_deletes as string[]
        const nodesById = new Map((state.nodes[canvasId] ?? []).map((item) => [String(item.id), item]))
        for (const nodeId of nodeDeletes) nodesById.delete(nodeId)
        for (const item of nodeUpserts) {
          nodesById.set(String(item.id), {
            ...item,
            project_id: 'project-document',
            canvas_id: canvasId,
            status: 'idle',
            created_at: NOW,
            updated_at: NOW,
          })
        }
        state.nodes[canvasId] = [...nodesById.values()]
        activeCanvas.graph_revision += 1
        return fulfillJson(route, {
          revision: activeCanvas.graph_revision,
          node_upserts: nodeUpserts.map((item) => nodesById.get(String(item.id))),
          node_deletes: nodeDeletes,
          connection_upserts: [],
          connection_deletes: body.connection_deletes,
          server_timestamp: NOW,
          save_state: 'saved',
        })
      }
      if (method === 'POST' && resource === 'nodes' && body) {
        const created = {
          ...node(canvasId, `node-created-${canvasId}`, '文本节点 2', Number(body.position_x)),
          node_type: body.node_type,
          content: body.content,
          position_y: body.position_y,
          width: body.width,
          height: body.height,
        }
        state.nodes[canvasId] = [...(state.nodes[canvasId] ?? []), created]
        return fulfillJson(route, created, 201)
      }
      if (method === 'DELETE' && resource === 'nodes' && resourceMatch[3]) {
        const nodeId = decodeURIComponent(resourceMatch[3])
        state.nodes[canvasId] = (state.nodes[canvasId] ?? []).filter((item) => item.id !== nodeId)
        return route.fulfill({ status: 204, headers: corsHeaders() })
      }
    }

    return fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 501)
  })
}

async function openDocument(page: Page, state: DocumentState) {
  await page.setViewportSize({ width: 1366, height: 768 })
  await installDocumentApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'document-token'))
  await page.goto('/app/projects/project-document/canvases/canvas-first?canvas_runtime=legacy')
  await expect(page.getByRole('button', { name: '定位到 第一画布节点' })).toBeVisible()
}

test('canonical graph load and node mutation use exact Canvas-scoped paths', async ({ page }) => {
  const state = createState()
  await openDocument(page, state)

  expect(state.requests.some((request) => request.path === '/projects/project-document/nodes')).toBe(false)
  expect(state.requests.some((request) => request.path === '/projects/project-document/connections')).toBe(false)
  expect(state.requests).toContainEqual(expect.objectContaining({
    method: 'GET',
    path: '/api/projects/project-document/canvases/canvas-first/document',
  }))

  await page.locator('.canvas-surface').dblclick({ position: { x: 900, y: 520 } })
  await expect.poll(() => state.nodes['canvas-first'].length).toBe(2)
  const createRequest = state.requests.find((request) => (
    request.method === 'PATCH' && request.path.endsWith('/canvas-first/document')
  ))
  const createdNode = (createRequest?.body?.node_upserts as Array<Record<string, unknown>>)[0]
  expect(createRequest?.path).toBe('/api/projects/project-document/canvases/canvas-first/document')
  expect(Number(createdNode.position_x)).toBeLessThan(900)

  await page.keyboard.press('Delete')
  await expect.poll(() => state.nodes['canvas-first'].length).toBe(1)
  const documentPatches = state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith('/canvas-first/document')
  ))
  expect(documentPatches).toHaveLength(2)
  expect(documentPatches[1].body?.node_deletes).toEqual([createdNode.id])
})

test('viewport writes are debounced, flushed before switch, and restored per Canvas', async ({ page }) => {
  const state = createState()
  await openDocument(page, state)
  const surface = page.locator('.canvas-surface')
  await surface.hover({ position: { x: 680, y: 380 } })
  await page.mouse.wheel(0, -80)
  await page.mouse.wheel(0, -80)
  await page.mouse.wheel(0, -80)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-second\?canvas_runtime=legacy$/)
  await expect(page.getByRole('button', { name: '定位到 第二画布节点' })).toBeVisible()

  const firstViewportPath = '/api/projects/project-document/canvases/canvas-first/viewport'
  const firstViewportWrites = state.requests.filter((request) => request.method === 'PATCH' && request.path === firstViewportPath)
  expect(firstViewportWrites).toHaveLength(1)
  expect(Number(firstViewportWrites[0].body?.zoom)).toBeGreaterThan(2)
  const viewportIndex = state.requests.findIndex((request) => request.path === firstViewportPath)
  const secondLoadIndex = state.requests.findIndex((request) => request.path.endsWith('/canvas-second/document'))
  expect(viewportIndex).toBeGreaterThan(-1)
  expect(secondLoadIndex).toBeGreaterThan(viewportIndex)

  await surface.hover({ position: { x: 680, y: 380 } })
  await page.mouse.wheel(0, -80)
  await expect.poll(() => state.requests.filter((request) => request.path.endsWith('/canvas-second/viewport')).length).toBe(1)
  const secondViewportWrite = state.requests.find((request) => request.path.endsWith('/canvas-second/viewport'))
  expect(Number(secondViewportWrite?.body?.zoom)).toBeGreaterThan(0.5)
  expect(Number(secondViewportWrite?.body?.zoom)).toBeLessThan(1)

  await page.reload()
  await expect(page.getByRole('button', { name: '定位到 第二画布节点' })).toBeVisible()
  await surface.hover({ position: { x: 680, y: 380 } })
  await page.mouse.wheel(0, -80)
  await expect.poll(() => state.requests.filter((request) => request.path.endsWith('/canvas-second/viewport')).length).toBe(2)
  const latestWrite = state.requests.filter((request) => request.path.endsWith('/canvas-second/viewport')).at(-1)
  expect(Number(latestWrite?.body?.zoom)).toBeGreaterThan(Number(secondViewportWrite?.body?.zoom))
})
