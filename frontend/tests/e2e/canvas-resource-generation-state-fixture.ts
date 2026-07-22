import { Buffer } from 'node:buffer'
import type { Route } from '@playwright/test'
import {
  createMockGenerationRequestParameters,
  GENERATION_CAPABILITIES as LEGACY_GENERATION_CAPABILITIES,
  GENERATION_CAPABILITIES_V6,
} from './canvas-generation-parameters-fixture'

export const GENERATION_CAPABILITIES = {
  ...LEGACY_GENERATION_CAPABILITIES,
  contract_version: 5,
  text: {
    contract_version: 1,
    available: true,
    model: 'agnes-2.0-flash',
    model_label: 'Agnes 2.0 Flash',
    intents: ['script_draft', 'script_refine'],
    locales: ['zh-CN', 'en-US'],
    default_locale: 'zh-CN',
    brief_max_length: 4000,
    source_max_length: 12000,
    output_max_length: 12000,
    creates_media: false,
    runs_cinematic_decomposition: false,
  },
  audio: {
    contract_version: 1,
    execution_mode: 'unavailable',
    model: null,
    generation_modes: [],
    provider_generation_modes: [],
    audio_driven_video_modes: [],
    provider_audio_driven_video_modes: [],
    quota: { available: false, quota_type: null, unit_estimate: null },
    task: { available: false, cancel_supported: false, resume_supported: false },
  },
} as const
export const T6_GENERATION_CAPABILITIES = GENERATION_CAPABILITIES_V6

export const API_ORIGIN = 'http://localhost:8000'
export const APP_ORIGIN = 'http://127.0.0.1:9099'
export const PROJECT_ID = 'project-resources'
export const FIRST_CANVAS_ID = 'canvas-first'
export const SECOND_CANVAS_ID = 'canvas-second'
export const NOW = '2026-07-14T08:00:00Z'
export const GENERATED_VIDEO_BASE64 = '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'

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
  capabilitiesOutcome: 'success' | 'failure'
  capabilityVersion: 5 | 6
  cinematicAcknowledgementActive: boolean
  cinematicRequiresAcknowledgement: boolean
  capturedFrames: Record<string, Buffer>
  canvases: CanvasRecord[]
  documents: Record<string, CanvasDocument>
  events: string[]
  generationGate: Promise<void> | null
  generationCount: number
  generationFailureSlots: number[]
  generationFailureCalls: number[]
  generationOutcome: 'success' | 'failure'
  requests: MockRequest[]
  shotSchemaCount: number
  shotSchemaGate: Promise<void> | null
  shotSchemaOutcome: 'success' | 'failure' | 'malformed'
  taskListOutcome: 'success' | 'failure'
  tasks: Array<Record<string, unknown>>
  templateInstantiationGate: Promise<void> | null
  templates: Array<Record<string, unknown>>
  uploads: Array<{ byteLength: number; contentType: string; payload: string }>
  uploadFailureAt: number | null
  uploadOutcome: 'success' | 'failure'
  uploadGate: Promise<void> | null
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

export function generationTask(overrides: Record<string, unknown>) {
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
    client_request_id: null,
    request_fingerprint: null,
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
        project_id: PROJECT_ID, source_task_id: 'task-existing-success',
        url: 'https://media.revid.test/generated.png', width: 320, height: 180,
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
    capabilitiesOutcome: 'success',
    capabilityVersion: 5,
    cinematicAcknowledgementActive: false,
    cinematicRequiresAcknowledgement: false,
    capturedFrames: {},
    canvases: [canvas(FIRST_CANVAS_ID, '画布 1', 0), canvas(SECOND_CANVAS_ID, '分镜', 1)],
    documents: { [FIRST_CANVAS_ID]: firstDocument, [SECOND_CANVAS_ID]: secondDocument },
    events: [],
    generationGate: null,
    generationCount: 0,
    generationFailureSlots: [],
    generationFailureCalls: [],
    generationOutcome: 'success',
    requests: [],
    shotSchemaCount: 0,
    shotSchemaGate: null,
    shotSchemaOutcome: 'success',
    taskListOutcome: 'success',
    tasks: [
      generationTask({}),
      generationTask({ id: 'task-existing-failure', status: 'failed', result_asset_id: null, error_code: 'provider_error', error_message: '历史 mock provider unavailable', provider_request_id: null }),
    ],
    templateInstantiationGate: null,
    templates: [{ id: 'template-storyboard', name: '分镜起步流程', user_id: 'user-resource', node_count: 2, created_at: NOW, node_data: graphData.nodes, schema_version: 1, graph_data: graphData }],
    uploads: [],
    uploadFailureAt: null,
    uploadOutcome: 'success',
    uploadGate: null,
    quotas: { text: 5, image: 4, video: 2 },
    quotaRevision: 7,
  }
}

export function addProjectImageNode(
  state: ResourceMockState,
  assetId = 'asset-reference',
  nodeId = 'asset-reference-node',
) {
  const asset = state.assets.find((candidate) => candidate.id === assetId)
  if (!asset?.url) throw new Error(`Mock image asset ${assetId} is unavailable.`)
  state.documents[FIRST_CANVAS_ID].nodes.push(node(nodeId, 'asset', '项目参考图', {
    subtype: 'image', serialization_version: 1, asset_id: asset.id,
    project_id: asset.project_id, origin_canvas_id: asset.origin_canvas_id, url: asset.url,
  }, 1380))
  return state.documents[FIRST_CANVAS_ID].nodes.at(-1)!
}

export function addEarlierVariant(state: ResourceMockState) {
  const document = state.documents[FIRST_CANVAS_ID]
  const existingResult = document.nodes.find((item) => item.id === 'result-existing')!
  const existingResultEdge = document.connections.find((item) => item.target_node_id === existingResult.id)!
  document.nodes.push({
    ...existingResult,
    id: 'result-earlier-variant',
    content: {
      ...(existingResult.content as Record<string, unknown>),
      asset_id: 'asset-earlier-variant',
      title: '更早的封面版本',
      url: 'https://media.revid.test/earlier-variant.png',
    },
    position_x: existingResult.position_x,
    position_y: existingResult.position_y + 260,
  })
  document.connections.unshift({
    ...existingResultEdge,
    id: 'connection-earlier-variant',
    target_node_id: 'result-earlier-variant',
  })
}

export function addTwoOriginMerge(state: ResourceMockState) {
  addEarlierVariant(state)
  const document = state.documents[FIRST_CANVAS_ID]
  const sourceGeneration = document.nodes.find((item) => item.id === 'generation-cover')!
  const sourceResult = document.nodes.find((item) => item.id === 'result-existing')!
  const sourceEdge = document.connections.find((item) => item.target_node_id === sourceResult.id)!
  document.nodes.push(
    {
      ...sourceGeneration,
      id: 'generation-second-origin',
      content: { subtype: 'image', serialization_version: 1, title: '第二镜头生成', text: '远景海岸。' },
      position_x: 540,
      position_y: 520,
    },
    {
      ...sourceResult,
      id: 'result-second-origin',
      content: {
        ...(sourceResult.content as Record<string, unknown>),
        asset_id: 'asset-second-origin', source_task_id: 'task-second-origin',
        title: '第二镜头结果', url: 'https://media.revid.test/second-origin.png',
      },
      position_x: 980,
      position_y: 520,
    },
    {
      ...sourceGeneration,
      id: 'generation-two-origin-merge',
      content: { subtype: 'image', serialization_version: 1, title: '双源合并生成', text: '融合两个海岸镜头。' },
      position_x: 1420,
      position_y: 300,
    },
  )
  document.connections.push(
    { ...sourceEdge, id: 'connection-second-origin-result', source_node_id: 'generation-second-origin', target_node_id: 'result-second-origin', metadata: { source_task_id: 'task-second-origin' } },
    { ...sourceEdge, id: 'connection-merge-first', source_node_id: 'result-existing', target_node_id: 'generation-two-origin-merge', target_port: 'media', metadata: { input_order: 1 } },
    { ...sourceEdge, id: 'connection-merge-second', source_node_id: 'result-second-origin', target_node_id: 'generation-two-origin-merge', target_port: 'media', metadata: { input_order: 2 } },
  )
  state.assets.push({
    ...state.assets.find((item) => item.id === 'asset-generated')!,
    id: 'asset-second-origin', canvas_node_id: 'generation-second-origin',
    url: 'https://media.revid.test/second-origin.png', source_task_id: 'task-second-origin',
  })
}

export function corsHeaders(contentType = 'application/json') {
  return {
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'access-control-allow-origin': APP_ORIGIN,
    'content-type': contentType,
  }
}

export async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, headers: corsHeaders(), body: JSON.stringify(body) })
}

export function documentResponse(state: ResourceMockState, canvasId: string) {
  const activeCanvas = state.canvases.find((item) => item.id === canvasId)!
  return { canvas: activeCanvas, ...state.documents[canvasId], revision: activeCanvas.graph_revision }
}

export function applyDocumentPatch(state: ResourceMockState, canvasId: string, payload: Record<string, unknown>) {
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

export function instantiateTemplate(state: ResourceMockState, canvasId: string) {
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

export function generationResponse(
  state: ResourceMockState,
  canvasId: string,
  nodeId: string,
  mediaType: 'image' | 'video',
  requestBody: Record<string, unknown>,
) {
  state.generationCount += 1
  const suffix = state.generationCount === 1 ? '' : `-${state.generationCount}`
  const taskId = `task-success${suffix}`
  const assetId = `asset-success${suffix}`
  const model = `mock-${mediaType}-v1`
  const requestParameters = createMockGenerationRequestParameters(mediaType, requestBody)
  const task = generationTask({
    id: taskId, origin_canvas_id: canvasId, canvas_node_id: nodeId, media_type: mediaType,
    model, status: 'succeeded', result_asset_id: assetId,
    provider_request_id: `request-success${suffix}`, request_parameters: requestParameters,
    client_request_id: requestBody.client_request_id,
    request_fingerprint: 'a'.repeat(64),
  })
  const asset = { id: assetId, user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: canvasId, canvas_node_id: nodeId, type: mediaType, url: `https://media.revid.test/success${suffix}.${mediaType === 'video' ? 'mp4' : 'png'}`, content_text: null, source: 'generation', source_model: model, source_task_id: taskId, status: 'active', created_at: NOW, updated_at: NOW }
  state.tasks = [task, ...state.tasks.filter((item) => item.id !== task.id)]
  state.assets = [asset, ...state.assets.filter((item) => item.id !== asset.id)]
  state.quotas = { ...state.quotas, [mediaType]: state.quotas[mediaType] - 1 }
  state.quotaRevision += 1
  return { asset, generation_task: task, quotas: state.quotas, quota_revision: state.quotaRevision }
}

export function addCinematicVideoNode(state: ResourceMockState) {
  const referenceNode = addProjectImageNode(state)
  const videoNode = node('generation-cinematic-video', 'generation', '连续性视频生成', {
    subtype: 'video', serialization_version: 1, text: '镜头缓慢推进，人物动作保持稳定',
    generation_parameters: {
      schema_version: 1,
      video: { duration_seconds: 5, reference_mode: 'keyframes' },
    },
    cinematic_skill: {
      contract_version: 1, enabled: true, skill_id: 'revid.cinema-video', skill_version: 1,
      provider_id: 'agnes', model_id: 'agnes-video-v2.0',
      mentions: [
        { node_id: 'result-existing', role: 'first-frame', instruction: '作为精确首帧', source_revision: 'a'.repeat(64) },
        { node_id: referenceNode.id, role: 'last-frame', instruction: '作为精确尾帧', source_revision: 'a'.repeat(64) },
      ],
    },
  }, 1720)
  state.documents[FIRST_CANVAS_ID].nodes.push(videoNode)
  state.documents[FIRST_CANVAS_ID].connections.push(
    {
      id: 'connection-video-first', project_id: PROJECT_ID, canvas_id: FIRST_CANVAS_ID,
      source_node_id: 'result-existing', target_node_id: videoNode.id, source_port: 'out', target_port: 'media',
      status: 'active', metadata: { input_order: 1 }, created_at: NOW, updated_at: NOW,
    },
    {
      id: 'connection-video-last', project_id: PROJECT_ID, canvas_id: FIRST_CANVAS_ID,
      source_node_id: referenceNode.id, target_node_id: videoNode.id, source_port: 'out', target_port: 'media',
      status: 'active', metadata: { input_order: 2 }, created_at: NOW, updated_at: NOW,
    },
  )
  return videoNode
}

export function cinematicScriptGenerationResponse(state: ResourceMockState, canvasId: string, requestBody: Record<string, unknown>) {
  const handoff = requestBody.cinematic_handoff as Record<string, unknown>
  const preflight = handoff.submitted_preflight as Record<string, unknown>
  const references = preflight.references as Array<Record<string, unknown>>
  const parameters = handoff.generation_parameters as Record<string, unknown>
  const shotCount = Number(parameters.requested_shot_count ?? 8)
  const sourceNodeId = String(references[0]?.node_id ?? requestBody.canvas_node_id)
  const sourceRevision = String(references[0]?.source_revision ?? 'a'.repeat(64))
  const shots = Array.from({ length: shotCount }, (_, offset) => {
    const index = offset + 1
    return {
      shot_id: `shot-${String(index).padStart(2, '0')}`, index, title: `镜头 ${String(index).padStart(2, '0')}`,
      narrative: `电影叙事镜头 ${index}`, dialogue: null, characters: ['主角'], wardrobe: '保持既定服装',
      scene: '黄昏海岸', action: '人物稳定入画', framing_camera: '中景缓慢推进', duration_seconds: 5,
      image_prompt: `黄昏海岸电影画面 ${index}`, video_prompt: `中景缓慢推进，人物稳定入画 ${index}`,
      generatable: true, generatability_reason: null,
    }
  })
  const document = {
    contract_version: 2, schema_id: 'revid.shot-sequence', skill_id: 'revid.cinema-script', skill_version: 1,
    source_script_node_id: sourceNodeId, source_revision: sourceRevision, aspect_ratio: '16:9',
    shot_count: shotCount, story_structure: '建立、发展与收束', character_consistency: '保持主角身份与服装', shots,
  }
  const taskId = `task-script-${state.generationCount + 1}`
  const assetId = `asset-script-${state.generationCount + 1}`
  state.generationCount += 1
  const requestParameters = {
    cinematic_skill: {
      contract_version: 1, skill_id: handoff.skill_id, skill_version: handoff.skill_version,
      canvas_revision: handoff.canvas_revision, capability_version: 1,
      canonical_request: preflight.canonical_request, request_digest: preflight.request_digest,
    },
  }
  const task = generationTask({
    id: taskId, origin_canvas_id: canvasId, canvas_node_id: sourceNodeId, media_type: 'text',
    model: 'agnes-2.0-flash', status: 'succeeded', result_asset_id: assetId,
    provider_request_id: `request-${taskId}`, client_request_id: requestBody.client_request_id,
    request_fingerprint: 'b'.repeat(64), request_parameters: requestParameters,
  })
  const asset = {
    id: assetId, user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: canvasId,
    canvas_node_id: sourceNodeId, type: 'prompt', url: null, content_text: JSON.stringify(document),
    source: 'generation', source_model: 'agnes-2.0-flash', source_task_id: taskId, status: 'active',
    created_at: NOW, updated_at: NOW,
  }
  state.tasks = [task, ...state.tasks]
  state.assets = [asset, ...state.assets]
  state.quotas = { ...state.quotas, text: state.quotas.text - 1 }
  state.quotaRevision += 1
  return { content: JSON.stringify(document), asset, generation_task: task, quotas: state.quotas, quota_revision: state.quotaRevision }
}
