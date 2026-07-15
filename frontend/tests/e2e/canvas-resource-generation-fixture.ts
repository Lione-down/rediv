import { Buffer } from 'node:buffer'
import { expect, type Page, type Route } from '@playwright/test'

export const API_ORIGIN = 'http://localhost:8000'
export const APP_ORIGIN = 'http://127.0.0.1:9099'
export const PROJECT_ID = 'project-resources'
export const FIRST_CANVAS_ID = 'canvas-first'
export const SECOND_CANVAS_ID = 'canvas-second'
const NOW = '2026-07-14T08:00:00Z'
const GENERATED_VIDEO_BASE64 = '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'

export interface MockRequest {
  method: string
  path: string
  query: string
  body?: Record<string, unknown>
}

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

interface CanvasDocument {
  nodes: Array<Record<string, unknown>>
  connections: Array<Record<string, unknown>>
}

export interface ResourceMockState {
  assets: Array<Record<string, unknown>>
  canvases: CanvasRecord[]
  documents: Record<string, CanvasDocument>
  events: string[]
  generationGate: Promise<void> | null
  generationCount: number
  generationOutcome: 'success' | 'failure'
  requests: MockRequest[]
  tasks: Array<Record<string, unknown>>
  templateInstantiationGate: Promise<void> | null
  templates: Array<Record<string, unknown>>
  quotas: { text: number; image: number; video: number }
  quotaRevision: number
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
    graph_revision: 0,
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  }
}

function node(id: string, type: string, title: string, content: Record<string, unknown>, x: number) {
  return {
    id,
    project_id: PROJECT_ID,
    canvas_id: FIRST_CANVAS_ID,
    node_type: type,
    content: { title, ...content },
    position_x: x,
    position_y: 160,
    width: type === 'generation' ? 340 : 320,
    height: type === 'generation' ? 220 : 200,
    z_index: 0,
    parent_node_id: null,
    is_locked: false,
    is_collapsed: false,
    status: 'idle',
    created_at: NOW,
    updated_at: NOW,
  }
}

function generationTask(overrides: Record<string, unknown>) {
  return {
    id: 'task-existing-success',
    user_id: 'user-resource',
    project_id: PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID,
    canvas_node_id: 'generation-cover',
    media_type: 'image',
    provider: 'mock',
    model: 'mock-image-v1',
    provider_request_id: 'request-existing',
    status: 'succeeded',
    duration_ms: 120,
    result_asset_id: 'asset-generated',
    error_code: null,
    error_message: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

export function createResourceMockState(): ResourceMockState {
  const firstDocument = {
    nodes: [
      node('generation-cover', 'generation', '封面生成', {
        subtype: 'image', serialization_version: 1, text: '电影感海边封面',
        generation_status: 'succeeded', generation_task_id: 'task-existing-success',
        result_materialized_task_id: 'task-existing-success',
      }, 180),
      node('script-source', 'script', '镜头脚本', {
        subtype: 'script', serialization_version: 1, text: '黄昏海岸，人物入画。',
      }, 580),
      node('result-existing', 'result', '历史图片生成结果', {
        subtype: 'image', serialization_version: 1, asset_id: 'asset-generated',
        source_task_id: 'task-existing-success', url: 'https://media.revid.test/generated.png', width: 320, height: 180,
      }, 980),
    ],
    connections: [{
      id: 'connection-existing-result', project_id: PROJECT_ID, canvas_id: FIRST_CANVAS_ID,
      source_node_id: 'generation-cover', source_port: 'out', target_node_id: 'result-existing',
      target_port: 'in', status: 'active', metadata: {}, created_at: NOW, updated_at: NOW,
    }],
  }
  const secondDocument = {
    nodes: [{
      ...node('note-second', 'note', '分镜备注', {
        subtype: 'annotation', serialization_version: 1, text: '保持低饱和。',
      }, 220),
      canvas_id: SECOND_CANVAS_ID,
    }],
    connections: [],
  }
  const graphData = {
    schema_version: 1,
    nodes: [
      { id: 'template-script', node_type: 'script', content: { title: '模板脚本', subtype: 'script', serialization_version: 1 }, position_x: 0, position_y: 0, width: 320, height: 200, z_index: 0, parent_node_id: null, is_locked: false, is_collapsed: false },
      { id: 'template-generation', node_type: 'generation', content: { title: '模板生成', subtype: 'image', serialization_version: 1 }, position_x: 420, position_y: 0, width: 340, height: 220, z_index: 0, parent_node_id: null, is_locked: false, is_collapsed: false },
    ],
    connections: [{ id: 'template-edge', source_node_id: 'template-script', target_node_id: 'template-generation', source_port: 'out', target_port: 'prompt', status: 'active', metadata: {} }],
  }
  return {
    assets: [
      { id: 'asset-reference', user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID, canvas_node_id: null, type: 'image', url: 'https://media.revid.test/reference.png', content_text: '海边参考图', source: 'upload', source_model: null, source_task_id: null, status: 'active', created_at: NOW, updated_at: NOW },
      { id: 'asset-video', user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: SECOND_CANVAS_ID, canvas_node_id: null, type: 'video', url: null, content_text: '片场走位', source: 'upload', source_model: null, source_task_id: null, status: 'active', created_at: NOW, updated_at: NOW },
      { id: 'asset-audio', user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID, canvas_node_id: null, type: 'audio', url: null, content_text: '海浪环境声', source: 'upload', source_model: null, source_task_id: null, status: 'active', created_at: NOW, updated_at: NOW },
      { id: 'asset-generated', user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID, canvas_node_id: 'generation-cover', type: 'image', url: 'https://media.revid.test/generated.png', content_text: null, source: 'generation', source_model: 'mock-image-v1', source_task_id: 'task-existing-success', status: 'active', created_at: NOW, updated_at: NOW },
    ],
    canvases: [canvas(FIRST_CANVAS_ID, '画布 1', 0), canvas(SECOND_CANVAS_ID, '分镜', 1)],
    documents: { [FIRST_CANVAS_ID]: firstDocument, [SECOND_CANVAS_ID]: secondDocument },
    events: [],
    generationGate: null,
    generationCount: 0,
    generationOutcome: 'success',
    requests: [],
    tasks: [
      generationTask({}),
      generationTask({ id: 'task-existing-failure', status: 'failed', result_asset_id: null, error_code: 'provider_error', error_message: '历史 mock provider unavailable', provider_request_id: null }),
    ],
    templateInstantiationGate: null,
    templates: [{ id: 'template-storyboard', name: '分镜起步流程', user_id: 'user-resource', node_count: 2, created_at: NOW, node_data: graphData.nodes, schema_version: 1, graph_data: graphData }],
    quotas: { text: 5, image: 4, video: 2 },
    quotaRevision: 7,
  }
}

function corsHeaders(contentType = 'application/json') {
  return {
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'access-control-allow-origin': APP_ORIGIN,
    'content-type': contentType,
  }
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, headers: corsHeaders(), body: JSON.stringify(body) })
}

function documentResponse(state: ResourceMockState, canvasId: string) {
  const activeCanvas = state.canvases.find((item) => item.id === canvasId)!
  return { canvas: activeCanvas, ...state.documents[canvasId], revision: activeCanvas.graph_revision }
}

function applyDocumentPatch(state: ResourceMockState, canvasId: string, payload: Record<string, unknown>) {
  const document = state.documents[canvasId]
  const nodes = new Map(document.nodes.map((item) => [String(item.id), item]))
  const connections = new Map(document.connections.map((item) => [String(item.id), item]))
  for (const id of (payload.node_deletes ?? []) as string[]) nodes.delete(id)
  for (const item of (payload.node_upserts ?? []) as Array<Record<string, unknown>>) nodes.set(String(item.id), item)
  for (const id of (payload.connection_deletes ?? []) as string[]) connections.delete(id)
  for (const item of (payload.connection_upserts ?? []) as Array<Record<string, unknown>>) connections.set(String(item.id), item)
  document.nodes = [...nodes.values()]
  document.connections = [...connections.values()]
  const activeCanvas = state.canvases.find((item) => item.id === canvasId)!
  activeCanvas.graph_revision += 1
  return {
    revision: activeCanvas.graph_revision,
    node_upserts: payload.node_upserts ?? [],
    node_deletes: payload.node_deletes ?? [],
    connection_upserts: payload.connection_upserts ?? [],
    connection_deletes: payload.connection_deletes ?? [],
    server_timestamp: NOW,
    save_state: 'saved',
  }
}

function instantiateTemplate(state: ResourceMockState, canvasId: string) {
  const document = state.documents[canvasId]
  const suffix = canvasId === FIRST_CANVAS_ID ? 'first' : 'second'
  const nodeUpserts = [
    node(`template-script-${suffix}`, 'script', '模板脚本', { subtype: 'script', serialization_version: 1 }, 240),
    node(`template-generation-${suffix}`, 'generation', '模板生成', { subtype: 'image', serialization_version: 1 }, 660),
  ].map((item) => ({ ...item, canvas_id: canvasId }))
  const connectionUpserts = [{ id: `template-edge-${suffix}`, project_id: PROJECT_ID, canvas_id: canvasId, source_node_id: nodeUpserts[0].id, target_node_id: nodeUpserts[1].id, source_port: 'out', target_port: 'prompt', status: 'active', metadata: {}, created_at: NOW, updated_at: NOW }]
  document.nodes.push(...nodeUpserts)
  document.connections.push(...connectionUpserts)
  const activeCanvas = state.canvases.find((item) => item.id === canvasId)!
  activeCanvas.graph_revision += 1
  return {
    template_id: 'template-storyboard', project_id: PROJECT_ID, canvas_id: canvasId,
    nodes_created: 2, connections_created: 1,
    node_id_map: { 'template-script': nodeUpserts[0].id, 'template-generation': nodeUpserts[1].id },
    connection_id_map: { 'template-edge': connectionUpserts[0].id },
    mutation: { revision: activeCanvas.graph_revision, node_upserts: nodeUpserts, node_deletes: [], connection_upserts: connectionUpserts, connection_deletes: [], server_timestamp: NOW, save_state: 'saved' },
  }
}

function generationResponse(state: ResourceMockState, canvasId: string, nodeId: string, mediaType: 'image' | 'video') {
  state.generationCount += 1
  const suffix = state.generationCount === 1 ? '' : `-${state.generationCount}`
  const taskId = `task-success${suffix}`
  const assetId = `asset-success${suffix}`
  const model = `mock-${mediaType}-v1`
  const task = generationTask({ id: taskId, origin_canvas_id: canvasId, canvas_node_id: nodeId, media_type: mediaType, model, status: 'succeeded', result_asset_id: assetId, provider_request_id: `request-success${suffix}` })
  const asset = { id: assetId, user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: canvasId, canvas_node_id: nodeId, type: mediaType, url: `https://media.revid.test/success${suffix}.${mediaType === 'video' ? 'mp4' : 'png'}`, content_text: null, source: 'generation', source_model: model, source_task_id: taskId, status: 'active', created_at: NOW, updated_at: NOW }
  state.tasks = [task, ...state.tasks.filter((item) => item.id !== task.id)]
  state.assets = [asset, ...state.assets.filter((item) => item.id !== asset.id)]
  state.quotas = { ...state.quotas, [mediaType]: state.quotas[mediaType] - 1 }
  state.quotaRevision += 1
  return { asset, generation_task: task, quotas: state.quotas, quota_revision: state.quotaRevision }
}

export async function installResourceMockApi(page: Page, state: ResourceMockState) {
  await page.route('https://media.revid.test/**', (route) => {
    const pathname = new URL(route.request().url()).pathname
    const isBroken = pathname.includes('broken')
    const isVideo = pathname.endsWith('.mp4')
    const dimensions = pathname.includes('square')
      ? { width: 240, height: 240, label: 'SQUARE 1:1' }
      : pathname.includes('portrait')
        ? { width: 180, height: 320, label: 'PORTRAIT 9:16' }
        : { width: 320, height: 180, label: 'LANDSCAPE 16:9' }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}"><rect width="100%" height="100%" rx="12" fill="#6242df"/><path d="M0 0h32v32H0zM${dimensions.width - 32} 0h32v32h-32zM0 ${dimensions.height - 32}h32v32H0zM${dimensions.width - 32} ${dimensions.height - 32}h32v32h-32z" fill="#d8ccff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16">${dimensions.label}</text></svg>`
    return route.fulfill({
    status: isBroken ? 404 : 200,
    headers: { 'content-type': isBroken ? 'image/png' : isVideo ? 'video/mp4' : 'image/svg+xml', 'access-control-allow-origin': '*' },
    body: isBroken ? Buffer.from('not-an-image') : isVideo ? Buffer.from(GENERATED_VIDEO_BASE64, 'base64') : Buffer.from(svg),
  })})
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const path = url.pathname
    const body = request.postData() && !request.headers()['content-type']?.includes('multipart/form-data')
      ? request.postDataJSON() as Record<string, unknown>
      : undefined
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() })
    state.requests.push({ method, path, query: url.search, body })

    if (method === 'GET' && path === '/me') return fulfillJson(route, { user: { id: 'user-resource', username: 'creator', email: 'creator@example.com', nickname: '创作者', avatar_url: '', role: 'user', status: 'active', generation_status: 'enabled', created_at: NOW, updated_at: NOW, last_login_at: NOW }, quotas: state.quotas, quota_revision: state.quotaRevision })
    if (method === 'GET' && path === '/projects') return fulfillJson(route, { items: [{ id: PROJECT_ID, user_id: 'user-resource', name: '短片工作室', created_at: NOW }], total: 1 })
    if (method === 'GET' && path === `/api/projects/${PROJECT_ID}/canvases`) return fulfillJson(route, { items: state.canvases, order_revision: 0 })
    const documentMatch = path.match(new RegExp(`^/api/projects/${PROJECT_ID}/canvases/([^/]+)/document$`))
    if (method === 'GET' && documentMatch) {
      state.events.push(`document-loaded:${documentMatch[1]}`)
      return fulfillJson(route, documentResponse(state, documentMatch[1]))
    }
    if (method === 'PATCH' && documentMatch && body) {
      state.events.push(`document-patched:${documentMatch[1]}`)
      return fulfillJson(route, applyDocumentPatch(state, documentMatch[1], body))
    }
    const viewportMatch = path.match(new RegExp(`^/api/projects/${PROJECT_ID}/canvases/([^/]+)/viewport$`))
    if (method === 'PATCH' && viewportMatch) {
      const activeCanvas = state.canvases.find((item) => item.id === viewportMatch[1])!
      Object.assign(activeCanvas, {
        viewport_x: body?.x ?? body?.viewport_x ?? 0,
        viewport_y: body?.y ?? body?.viewport_y ?? 0,
        viewport_zoom: body?.zoom ?? body?.viewport_zoom ?? 1,
      })
      return fulfillJson(route, activeCanvas)
    }
    if (method === 'GET' && path === '/assets') {
      if (url.searchParams.get('project_id') !== PROJECT_ID) return fulfillJson(route, { detail: 'project_id required' }, 400)
      return fulfillJson(route, { items: state.assets, total: state.assets.length, page: 1, page_size: 100 })
    }
    if (method === 'GET' && path === '/templates') return fulfillJson(route, { items: state.templates, total: state.templates.length })
    if (method === 'GET' && path === '/api/generation-tasks') {
      if (url.searchParams.get('project_id') !== PROJECT_ID) return fulfillJson(route, { detail: 'project_id required' }, 400)
      return fulfillJson(route, { items: state.tasks, total: state.tasks.length, page: 1, page_size: 100 })
    }
    const instantiateMatch = path.match(new RegExp(`^/api/projects/${PROJECT_ID}/canvases/([^/]+)/templates/template-storyboard/instantiate$`))
    if (method === 'POST' && instantiateMatch) {
      await state.templateInstantiationGate
      const result = instantiateTemplate(state, instantiateMatch[1])
      state.events.push(`template-committed:${instantiateMatch[1]}`)
      return fulfillJson(route, result, 201)
    }
    if (method === 'POST' && (path === '/api/image-generate' || path === '/api/video-generate')) {
      const canvasId = String(body?.origin_canvas_id ?? FIRST_CANVAS_ID)
      const nodeId = String(body?.canvas_node_id ?? 'generation-cover')
      const mediaType = path === '/api/video-generate' ? 'video' : 'image'
      await state.generationGate
      if (state.generationOutcome === 'success') return fulfillJson(route, generationResponse(state, canvasId, nodeId, mediaType))
      const failedTask = generationTask({ id: 'task-failure', origin_canvas_id: canvasId, canvas_node_id: nodeId, media_type: mediaType, model: `mock-${mediaType}-v1`, status: 'failed', result_asset_id: null, provider_request_id: null, error_code: 'provider_error', error_message: 'mock provider unavailable' })
      state.tasks = [failedTask, ...state.tasks.filter((item) => item.id !== failedTask.id)]
      return fulfillJson(route, { detail: 'mock provider unavailable' }, 503)
    }
    return fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 501)
  })
}

export async function openResourceWorkspace(
  page: Page,
  state: ResourceMockState,
  viewport = { width: 1440, height: 900 },
) {
  await page.setViewportSize(viewport)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await installResourceMockApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'resource-token'))
  await page.goto(`/app/projects/${PROJECT_ID}/canvases/${FIRST_CANVAS_ID}`)
  await expect(page.getByRole('region', { name: '项目与画布导航' })).toBeVisible()
}

export function documentPatches(state: ResourceMockState, canvasId = FIRST_CANVAS_ID) {
  return state.requests.filter((item) => item.method === 'PATCH' && item.path.endsWith(`/canvases/${canvasId}/document`))
}
