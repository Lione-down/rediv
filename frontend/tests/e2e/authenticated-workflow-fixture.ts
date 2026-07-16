import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, type Page, type Route, type TestInfo } from '@playwright/test'
import { GENERATION_CAPABILITIES } from './canvas-generation-parameters-fixture'

const API_ORIGIN = 'http://localhost:8000'
export const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-12T08:00:00Z'

export interface MockState {
  projects: Array<Record<string, unknown>>
  canvases: Array<Record<string, unknown>>
  canvasOrderRevision: number
  canvasNodes: Array<Record<string, unknown>>
  canvasConnections: Array<Record<string, unknown>>
  assets: Array<Record<string, unknown>>
  templates: Array<Record<string, unknown>>
  generationTasks: Array<Record<string, unknown>>
  imageQuota: number
  quotaRevision: number
  generationAttempts: number
  generationBodies: unknown[]
  authenticatedRequests: string[]
}

const user = {
  id: 'user-e2e',
  username: 'creator',
  email: 'creator@example.com',
  nickname: 'E2E Creator',
  avatar_url: '',
  role: 'user',
  status: 'active',
  generation_status: 'enabled',
  created_at: NOW,
  updated_at: NOW,
  last_login_at: NOW,
}

export function canvasMetadata(id: string, name: string, sortOrder: number) {
  return {
    id,
    project_id: 'project-e2e',
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

function generationTask(overrides: Record<string, unknown>) {
  return {
    id: 'task-generated',
    user_id: user.id,
    project_id: 'project-e2e',
    origin_canvas_id: 'canvas-first',
    canvas_node_id: 'node-image',
    media_type: 'image',
    provider: 'mock',
    model: 'mock-image-model',
    provider_request_id: 'request-generated',
    status: 'succeeded',
    duration_ms: 10,
    result_asset_id: 'asset-generated',
    error_code: null,
    error_message: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

export const canvasNodes = [
  {
    id: 'node-image',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'generation',
    content: {
      title: '生成封面',
      subtype: 'image',
      serialization_version: 1,
      text: '夏日海边电影海报',
    },
    position_x: 180,
    position_y: 140,
    width: 340,
    height: 220,
    status: 'idle',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'node-result',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'result',
    content: {
      title: '成片结果',
      subtype: 'image',
      serialization_version: 1,
      text: '等待生成结果',
    },
    position_x: 560,
    position_y: 140,
    width: 240,
    height: 140,
    status: 'idle',
    created_at: NOW,
    updated_at: NOW,
  },
]

export const canvasConnections = [
  {
    id: 'connection-e2e',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    source_node_id: 'node-image',
    source_port: 'out',
    target_node_id: 'node-result',
    target_port: 'in',
    status: 'active',
    metadata: {},
    created_at: NOW,
    updated_at: NOW,
  },
]

export const visualViewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'compact-desktop', width: 1366, height: 768 },
  { name: 'tablet', width: 920, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
] as const

function corsHeaders() {
  return {
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'access-control-allow-origin': APP_ORIGIN,
    'content-type': 'application/json',
  }
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  })
}

export async function installMockApi(page: Page, state: MockState) {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const { pathname } = url

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders() })
      return
    }

    if (request.headers().authorization === 'Bearer mock-session-token') {
      state.authenticatedRequests.push(`${request.method()} ${pathname}`)
    }

    if (request.method() === 'GET' && pathname === '/auth/registration-settings') {
      await fulfillJson(route, { registration_mode: 'open', wechat_login_enabled: false })
      return
    }

    if (request.method() === 'POST' && pathname === '/auth/login') {
      await fulfillJson(route, {
        token: 'mock-session-token',
        user,
        quotas: { text: 5, image: state.imageQuota, video: 2 },
        quota_revision: state.quotaRevision,
      })
      return
    }

    if (request.method() === 'GET' && pathname === '/me') {
      await fulfillJson(route, {
        user,
        quotas: { text: 5, image: state.imageQuota, video: 2 },
        quota_revision: state.quotaRevision,
      })
      return
    }

    if (request.method() === 'GET' && pathname === '/projects') {
      await fulfillJson(route, { items: state.projects, total: state.projects.length })
      return
    }

    if (request.method() === 'POST' && pathname === '/projects') {
      const payload = request.postDataJSON() as { name: string }
      const project = {
        id: 'project-e2e',
        user_id: user.id,
        name: payload.name,
        created_at: NOW,
      }
      state.projects.unshift(project)
      state.canvases = [canvasMetadata('canvas-first', '画布 1', 0)]
      await fulfillJson(route, project, 201)
      return
    }

    if (request.method() === 'GET' && pathname === '/api/projects/project-e2e/canvases') {
      await fulfillJson(route, {
        items: state.canvases,
        order_revision: state.canvasOrderRevision,
      })
      return
    }

    if (request.method() === 'GET' && pathname === '/assets') {
      await fulfillJson(route, {
        items: state.assets,
        total: state.assets.length,
        page: Number(url.searchParams.get('page') || 1),
        page_size: Number(url.searchParams.get('page_size') || 20),
      })
      return
    }

    if (request.method() === 'GET' && pathname === '/templates') {
      await fulfillJson(route, { items: state.templates, total: state.templates.length })
      return
    }

    if (request.method() === 'GET' && pathname === '/api/generation-tasks') {
      await fulfillJson(route, {
        items: state.generationTasks,
        total: state.generationTasks.length,
        page: Number(url.searchParams.get('page') || 1),
        page_size: Number(url.searchParams.get('page_size') || 100),
      })
      return
    }

    if (request.method() === 'GET' && pathname === '/api/generation-capabilities') {
      await fulfillJson(route, GENERATION_CAPABILITIES)
      return
    }

    if (request.method() === 'GET' && pathname === '/api/projects/project-e2e/canvases/canvas-first/document') {
      const activeCanvas = state.canvases.find((canvas) => canvas.id === 'canvas-first')
      await fulfillJson(route, {
        canvas: activeCanvas,
        nodes: state.canvasNodes,
        connections: state.canvasConnections,
        revision: activeCanvas?.graph_revision ?? 0,
      })
      return
    }

    if (request.method() === 'PATCH' && pathname === '/api/projects/project-e2e/canvases/canvas-first/document') {
      const payload = request.postDataJSON() as Record<string, unknown>
      const nodes = new Map(state.canvasNodes.map((node) => [String(node.id), node]))
      const connections = new Map(state.canvasConnections.map((connection) => [String(connection.id), connection]))
      for (const id of (payload.node_deletes ?? []) as string[]) nodes.delete(id)
      for (const node of (payload.node_upserts ?? []) as Array<Record<string, unknown>>) nodes.set(String(node.id), node)
      for (const id of (payload.connection_deletes ?? []) as string[]) connections.delete(id)
      for (const connection of (payload.connection_upserts ?? []) as Array<Record<string, unknown>>) connections.set(String(connection.id), connection)
      state.canvasNodes = [...nodes.values()]
      state.canvasConnections = [...connections.values()]
      const activeCanvas = state.canvases.find((canvas) => canvas.id === 'canvas-first')
      const revision = Number(activeCanvas?.graph_revision ?? 0) + 1
      if (activeCanvas) activeCanvas.graph_revision = revision
      await fulfillJson(route, {
        revision,
        node_upserts: payload.node_upserts ?? [],
        node_deletes: payload.node_deletes ?? [],
        connection_upserts: payload.connection_upserts ?? [],
        connection_deletes: payload.connection_deletes ?? [],
        server_timestamp: NOW,
        save_state: 'saved',
      })
      return
    }

    if (request.method() === 'POST' && pathname === '/api/image-generate') {
      state.generationAttempts += 1
      state.generationBodies.push(request.postDataJSON())

      if (state.generationAttempts === 2) {
        const failedTask = generationTask({
          id: 'task-failed',
          provider_request_id: null,
          status: 'failed',
          duration_ms: null,
          result_asset_id: null,
          error_code: 'provider_error',
          error_message: 'mock provider unavailable',
        })
        state.generationTasks = [
          failedTask,
          ...state.generationTasks.filter((task) => task.id !== failedTask.id),
        ]
        await fulfillJson(route, { detail: 'mock provider unavailable' }, 503)
        return
      }

      const task = generationTask({})
      const asset = {
        id: 'asset-generated',
        user_id: user.id,
        project_id: 'project-e2e',
        origin_canvas_id: 'canvas-first',
        canvas_node_id: 'node-image',
        type: 'image',
        url: 'https://example.invalid/generated.webp',
        content_text: null,
        source: 'generation',
        source_model: 'mock-image-model',
        source_task_id: 'task-generated',
        status: 'ready',
        created_at: NOW,
        updated_at: NOW,
      }
      state.assets.unshift(asset)
      state.generationTasks = [
        task,
        ...state.generationTasks.filter((item) => item.id !== task.id),
      ]
      state.imageQuota = 3
      state.quotaRevision += 1
      await fulfillJson(route, {
        asset,
        generation_task: task,
        quotas: { text: 5, image: state.imageQuota, video: 2 },
        quota_revision: state.quotaRevision,
      })
      return
    }

    await fulfillJson(route, { detail: `Unhandled mock route: ${request.method()} ${pathname}` }, 501)
  })
}

export async function captureVisualEvidence(page: Page, testInfo: TestInfo, name: string) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1)

  const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't4-013-responsive')
  const screenshotPath = resolve(evidenceDirectory, `${name}.png`)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach(name, { path: screenshotPath, contentType: 'image/png' })
}

export function createVisualState(): MockState {
  return {
    projects: [
      {
        id: 'project-e2e',
        user_id: user.id,
        name: 'E2E 夏日短片',
        created_at: NOW,
      },
    ],
    canvases: [canvasMetadata('canvas-first', '画布 1', 0)],
    canvasOrderRevision: 0,
    canvasNodes: structuredClone(canvasNodes),
    canvasConnections: structuredClone(canvasConnections),
    assets: [
      {
        id: 'asset-prompt',
        user_id: user.id,
        project_id: 'project-e2e',
        origin_canvas_id: 'canvas-first',
        canvas_node_id: 'node-image',
        type: 'prompt',
        url: null,
        content_text: '夏日海边电影海报，柔和日落与清晰标题留白。',
        source: 'generation',
        source_model: 'mock-text-model',
        source_task_id: 'task-prompt',
        status: 'ready',
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    templates: [
      {
        id: 'template-e2e',
        name: '短片封面流程',
        user_id: user.id,
        node_count: 2,
        created_at: NOW,
        node_data: null,
      },
    ],
    generationTasks: [],
    imageQuota: 3,
    quotaRevision: 0,
    generationAttempts: 0,
    generationBodies: [],
    authenticatedRequests: [],
  }
}
