import { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, type Page, type Route } from '@playwright/test'
import {
  createMockGenerationRequestParameters,
  GENERATION_CAPABILITIES as LEGACY_GENERATION_CAPABILITIES,
} from './canvas-generation-parameters-fixture'

const GENERATION_CAPABILITIES = {
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
  capabilitiesOutcome: 'success' | 'failure'
  cinematicAcknowledgementActive: boolean
  cinematicRequiresAcknowledgement: boolean
  capturedFrames: Record<string, Buffer>
  canvases: CanvasRecord[]
  documents: Record<string, CanvasDocument>
  events: string[]
  generationGate: Promise<void> | null
  generationCount: number
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
    cinematicAcknowledgementActive: false,
    cinematicRequiresAcknowledgement: false,
    capturedFrames: {},
    canvases: [canvas(FIRST_CANVAS_ID, '画布 1', 0), canvas(SECOND_CANVAS_ID, '分镜', 1)],
    documents: { [FIRST_CANVAS_ID]: firstDocument, [SECOND_CANVAS_ID]: secondDocument },
    events: [],
    generationGate: null,
    generationCount: 0,
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

function generationResponse(
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

function cinematicScriptGenerationResponse(state: ResourceMockState, canvasId: string, requestBody: Record<string, unknown>) {
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

function scriptAuthoringGenerationResponse(state: ResourceMockState, canvasId: string, requestBody: Record<string, unknown>) {
  const intent = requestBody.intent === 'script_refine' ? 'script_refine' : 'script_draft'
  const locale = requestBody.locale === 'en-US' ? 'en-US' : 'zh-CN'
  const sourceNodeId = String(requestBody.canvas_node_id)
  const canvasRevision = Number(requestBody.canvas_revision)
  const taskId = `task-authoring-${state.generationCount + 1}`
  const assetId = `asset-authoring-${state.generationCount + 1}`
  const content = intent === 'script_refine'
    ? '黄昏海岸。主角在潮声中走入画面，停下并望向远处灯塔。'
    : '雨夜车站。摄影师穿过人群，寻找装着失踪胶卷的银色手提箱。'
  state.generationCount += 1
  const lineage = {
    contract_version: 1, intent, locale, source_node_id: sourceNodeId,
    source_task_id: taskId, source_model: 'agnes-2.0-flash', canvas_revision: canvasRevision,
  }
  const requestSnapshot = {
    ...lineage,
    ...(Array.isArray(requestBody.reference_asset_ids)
      ? { reference_asset_ids: requestBody.reference_asset_ids }
      : {}),
  }
  const task = generationTask({
    id: taskId, origin_canvas_id: canvasId, canvas_node_id: sourceNodeId, media_type: 'text',
    model: 'agnes-2.0-flash', status: 'succeeded', result_asset_id: assetId,
    provider_request_id: `request-${taskId}`, client_request_id: requestBody.client_request_id,
    request_fingerprint: 'c'.repeat(64), request_parameters: { script_authoring: requestSnapshot },
  })
  const asset = {
    id: assetId, user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: canvasId,
    canvas_node_id: sourceNodeId, type: 'prompt', url: null, content_text: content,
    source: 'generation', source_model: 'agnes-2.0-flash', source_task_id: taskId, status: 'active',
    created_at: NOW, updated_at: NOW,
  }
  state.tasks = [task, ...state.tasks]
  state.assets = [asset, ...state.assets]
  state.quotas = { ...state.quotas, text: state.quotas.text - 1 }
  state.quotaRevision += 1
  return { content, asset, generation_task: task, quotas: state.quotas, quota_revision: state.quotaRevision, script_authoring: lineage }
}

function shotSchemaResponse(
  state: ResourceMockState,
  canvasId: string,
  requestBody: Record<string, unknown>,
) {
  const requestedShotCount = Number(requestBody.requested_shot_count ?? 2)
  const shotCount = Number.isSafeInteger(requestedShotCount) && requestedShotCount >= 2 && requestedShotCount <= 25
    ? requestedShotCount
    : 2
  const narratives = ['人物走入黄昏海岸。', '海浪在人物身后翻涌。']
  const shots = Array.from({ length: shotCount }, (_, offset) => {
    const index = offset + 1
    const narrative = narratives[offset % narratives.length]
    return {
      shot_id: `shot-${String(index).padStart(2, '0')}`,
      index,
      title: `镜头 ${String(index).padStart(2, '0')}`,
      narrative,
      image_prompt: narrative,
    }
  })
  return {
    contract_version: 1,
    schema_id: 'revid.shot-sequence',
    provider: state.shotSchemaOutcome === 'malformed' ? 'agnes' : 'mock',
    model: 'revid-shot-mock-v1',
    project_id: PROJECT_ID,
    canvas_id: canvasId,
    source_script_node_id: requestBody.source_script_node_id,
    aspect_ratio: '16:9',
    shot_count: shots.length,
    shots,
  }
}

export async function installResourceMockApi(page: Page, state: ResourceMockState) {
  await page.route('https://media.revid.test/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (state.capturedFrames[pathname]) {
      return route.fulfill({ status: 200, headers: { 'content-type': 'image/png', 'access-control-allow-origin': '*' }, body: state.capturedFrames[pathname] })
    }
    const isBroken = pathname.includes('broken')
    const isVideo = pathname.endsWith('.mp4')
    if (pathname === '/forbidden.mp4') return route.fulfill({ status: 403, headers: { 'content-type': 'video/mp4', 'access-control-allow-origin': '*' }, body: Buffer.from('expired') })
    if (pathname === '/unsupported.mp4') return route.fulfill({ status: 200, headers: { 'content-type': 'video/mp4', 'access-control-allow-origin': '*' }, body: Buffer.from('not-a-supported-codec') })
    if (pathname === '/scenario.mp4') {
      const body = readFileSync(resolve(process.cwd(), 'tests', 'fixtures', 'dynamic-frame-source.mp4'))
      const range = route.request().headers().range
      if (!range?.startsWith('bytes=')) return route.fulfill({ status: 200, headers: { 'content-type': 'video/mp4', 'content-length': String(body.length), 'accept-ranges': 'bytes', 'access-control-allow-origin': '*' }, body })
      const [startText, endText] = range.slice('bytes='.length).split('-', 2)
      const start = Number(startText)
      const end = endText ? Math.min(Number(endText), body.length - 1) : body.length - 1
      return route.fulfill({
        status: 206,
        headers: { 'content-type': 'video/mp4', 'content-length': String(end - start + 1), 'content-range': `bytes ${start}-${end}/${body.length}`, 'accept-ranges': 'bytes', 'access-control-allow-origin': '*' },
        body: body.subarray(start, end + 1),
      })
    }
    const dimensions = pathname.includes('portrait-736x1312')
      ? { width: 736, height: 1312, label: 'PORTRAIT 736:1312' }
      : pathname.includes('parity-reference')
      ? { width: 225, height: 300, label: 'REFERENCE 3:4' }
      : pathname.includes('parity-output')
        ? { width: 225, height: 300, label: 'OUTPUT 3:4' }
        : pathname.includes('square')
          ? { width: 240, height: 240, label: 'SQUARE 1:1' }
          : pathname.includes('portrait')
            ? { width: 180, height: 320, label: 'PORTRAIT 9:16' }
            : { width: 320, height: 180, label: 'LANDSCAPE 16:9' }
    if (pathname.includes('portrait-736x1312')) await new Promise((resolveDelay) => setTimeout(resolveDelay, 3000))
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}"><rect width="100%" height="100%" rx="12" fill="#6242df"/><path d="M0 0h32v32H0zM${dimensions.width - 32} 0h32v32h-32zM0 ${dimensions.height - 32}h32v32H0zM${dimensions.width - 32} ${dimensions.height - 32}h32v32h-32z" fill="#d8ccff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16">${dimensions.label}</text></svg>`
    return route.fulfill({
    status: isBroken ? 404 : 200,
    headers: { 'content-type': isBroken ? 'image/png' : isVideo ? 'video/mp4' : 'image/svg+xml', 'access-control-allow-origin': '*' },
    body: isBroken ? Buffer.from('not-an-image') : isVideo
      ? Buffer.from(GENERATED_VIDEO_BASE64, 'base64')
      : Buffer.from(svg),
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
    if (method === 'POST' && path === '/assets/upload') {
      const buffer = request.postDataBuffer() ?? Buffer.alloc(0)
      state.uploads.push({ byteLength: buffer.byteLength, contentType: request.headers()['content-type'] ?? '', payload: buffer.toString('latin1') })
      await state.uploadGate
      if (state.uploadOutcome === 'failure') {
        return fulfillJson(route, { detail: 'mock frame upload rejected' }, 503)
      }
      if (state.uploadFailureAt === state.uploads.length) {
        return fulfillJson(route, { detail: 'mock image upload rejected' }, 503)
      }
      const pngStart = buffer.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      const pngEndMarker = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82])
      const pngEnd = buffer.indexOf(pngEndMarker, pngStart)
      if (pngStart < 0 || pngEnd < 0) return fulfillJson(route, { detail: 'mock upload did not contain a complete PNG' }, 422)
      const assetSequence = state.uploads.length
      const capturedPath = `/captured-frame-${assetSequence}.png`
      state.capturedFrames[capturedPath] = buffer.subarray(pngStart, pngEnd + pngEndMarker.length)
      const isGridCrop = buffer.includes(Buffer.from('revid-grid-'))
      const asset = {
        id: `asset-captured-frame-${assetSequence}`, user_id: 'user-resource', project_id: PROJECT_ID,
        origin_canvas_id: FIRST_CANVAS_ID, canvas_node_id: null, type: 'image',
        url: `https://media.revid.test${capturedPath}`,
        content_text: isGridCrop ? '本地图片切片' : '视频截取帧', source: 'upload',
        source_model: null, source_task_id: null, status: 'active', created_at: NOW, updated_at: NOW,
      }
      state.assets.unshift(asset)
      return fulfillJson(route, asset, 201)
    }
    if (method === 'GET' && path === '/templates') return fulfillJson(route, { items: state.templates, total: state.templates.length })
    if (method === 'GET' && path === '/api/generation-tasks') {
      if (url.searchParams.get('project_id') !== PROJECT_ID) return fulfillJson(route, { detail: 'project_id required' }, 400)
      if (state.taskListOutcome === 'failure') return fulfillJson(route, { detail: 'mock task list unavailable' }, 503)
      return fulfillJson(route, { items: state.tasks, total: state.tasks.length, page: 1, page_size: 100 })
    }
    if (method === 'GET' && path === '/api/generation-capabilities') {
      return state.capabilitiesOutcome === 'success'
        ? fulfillJson(route, GENERATION_CAPABILITIES)
        : fulfillJson(route, { detail: 'mock capability unavailable' }, 503)
    }
    const cinematicSkillMatch = path.match(new RegExp(
      `^/api/projects/${PROJECT_ID}/canvases/([^/]+)/agent-skills/(cinematic-capabilities|cinematic-sources|cinematic-preflight)$`,
    ))
    if (cinematicSkillMatch && method === 'GET' && cinematicSkillMatch[2] === 'cinematic-capabilities') {
      return fulfillJson(route, {
        contract_version: 1,
        providers: [{
          id: 'agnes', capability_version: 1, billing_responsibility: 'platform',
          requires_acknowledgement: state.cinematicRequiresAcknowledgement,
          models: [
            { id: 'agnes-2.0-flash', media_type: 'text', user_selectable: true, automatic_routing: false, accepted_reference_media: ['text'], accepted_reference_roles: ['story'], max_references: 25, supported_controls: ['shot-count'] },
            { id: 'agnes-image-2.1-flash', media_type: 'image', user_selectable: true, automatic_routing: false, accepted_reference_media: ['image', 'text'], accepted_reference_roles: ['general', 'context', 'style', 'identity', 'wardrobe', 'scene', 'product'], max_references: 8, supported_controls: ['aspect-ratio', 'shot-controls'] },
            { id: 'agnes-video-v2.0', media_type: 'video', user_selectable: true, automatic_routing: false, accepted_reference_media: ['image', 'text'], accepted_reference_roles: ['general', 'context', 'first-frame', 'last-frame'], max_references: 8, supported_controls: ['duration', 'reference-mode', 'shot-controls', 'temporal'] },
          ],
        }],
      })
    }
    if (cinematicSkillMatch && method === 'GET' && cinematicSkillMatch[2] === 'cinematic-sources') {
      const canvasId = cinematicSkillMatch[1]
      const activeCanvas = state.canvases.find((item) => item.id === canvasId)!
      return fulfillJson(route, {
        canvas_revision: activeCanvas.graph_revision,
        items: state.documents[canvasId].nodes.map((item) => {
          const content = item.content as Record<string, unknown>
          return {
            node_id: item.id,
            title: content.title,
            node_type: item.node_type,
            subtype: content.subtype,
            source_revision: 'a'.repeat(64),
          }
        }),
      })
    }
    if (cinematicSkillMatch && method === 'POST' && cinematicSkillMatch[2] === 'cinematic-preflight') {
      const canvasId = cinematicSkillMatch[1]
      const mentions = Array.isArray(body?.mentions) ? body.mentions as Array<Record<string, unknown>> : []
      const references = mentions.map((mention) => {
        const source = state.documents[canvasId].nodes.find((item) => item.id === mention.node_id)!
        const content = source.content as Record<string, unknown>
        const mediaType = content.subtype === 'image' ? 'image' : 'text'
        return {
          node_id: mention.node_id,
          role: mention.role,
          instruction: mention.instruction,
          source_revision: mention.source_revision,
          media_type: mediaType,
          asset_id: mediaType === 'image' ? content.asset_id : null,
          text: mediaType === 'text' ? content.text ?? null : null,
        }
      })
      const nativeImageIds = Array.isArray((body?.generation_parameters as Record<string, unknown> | undefined)?.image_ids)
        ? (body?.generation_parameters as Record<string, unknown>).image_ids as unknown[]
        : []
      const mentionedImageIds = references.flatMap((reference) => reference.asset_id ? [reference.asset_id] : [])
      const canonicalRequest = {
        skill_id: body?.skill_id,
        skill_version: body?.skill_version,
        provider_id: body?.provider_id,
        model_id: body?.model_id,
        optimized_prompt: body?.skill_id === 'revid.cinema-script'
          ? `用户指令：${body?.user_instruction}\nSkill 约束：仅返回 revid.shot-sequence contract_version 2 JSON。`
          : `用户指令：${body?.user_instruction}`,
        references,
        image_ids: [...nativeImageIds, ...mentionedImageIds.filter((imageId) => !nativeImageIds.includes(imageId))],
        parameters: body?.generation_parameters ?? {},
      }
      const exactRequest = JSON.stringify(canonicalRequest)
      return fulfillJson(route, {
        contract_version: 1,
        skill: { id: body?.skill_id, version: body?.skill_version },
        project_id: PROJECT_ID,
        canvas_id: canvasId,
        canvas_revision: body?.canvas_revision,
        provider_id: body?.provider_id,
        model_id: body?.model_id,
        capability_version: 1,
        references,
        summary: {
          preserved_attributes: references.map((reference) => reference.role),
          allowed_changes: [], conflicts: [],
        },
        canonical_request: canonicalRequest,
        canonical_request_json: exactRequest,
        exact_request: exactRequest,
        request_digest: 'b'.repeat(64),
        requires_acknowledgement: state.cinematicRequiresAcknowledgement,
      })
    }
    if (path === '/api/provider-cost-acknowledgements/agnes') {
      if (method === 'POST') state.cinematicAcknowledgementActive = true
      if (method === 'DELETE') state.cinematicAcknowledgementActive = false
      if (['GET', 'POST', 'DELETE'].includes(method)) return fulfillJson(route, {
        user_id: 'user-resource', provider_id: 'agnes',
        acknowledged_until: state.cinematicAcknowledgementActive ? '2026-07-19T08:00:00Z' : null,
        cancelled_at: method === 'DELETE' ? NOW : null,
        active: state.cinematicAcknowledgementActive,
      })
    }
    const agentSkillMatch = path.match(new RegExp(`^/api/projects/${PROJECT_ID}/canvases/([^/]+)/agent-skills(?:/(preflight))?$`))
    if (agentSkillMatch && method === 'GET' && !agentSkillMatch[2]) {
      return fulfillJson(route, {
        contract_version: 1,
        execution_modes: ['mock-only', 'unavailable'],
        skills: [{
          id: 'revid.canvas-context', version: 1, execution_mode: 'mock-only',
          intent: 'canvas-context', requires_acknowledgement: false,
        }],
        provider: { available: false }, quota: { available: false }, task: { available: false },
      })
    }
    if (agentSkillMatch && method === 'POST' && agentSkillMatch[2] === 'preflight') {
      const selectedNodeIds = Array.isArray(body?.selected_node_ids) ? body.selected_node_ids : []
      return fulfillJson(route, {
        contract_version: 1,
        skill: {
          id: 'revid.canvas-context', version: 1, execution_mode: 'mock-only',
          intent: 'canvas-context', requires_acknowledgement: false,
        },
        project_id: PROJECT_ID,
        canvas_id: agentSkillMatch[1],
        sources: selectedNodeIds.map((nodeId) => ({
          node_id: nodeId,
          role: 'canvas-node',
          node_type: nodeId === 'script-source' ? 'script' : 'generation',
          subtype: nodeId === 'script-source' ? 'script' : 'image',
        })),
        execution_mode: 'mock-only',
        requires_acknowledgement: false,
        provider: { available: false }, quota: { available: false }, task: { available: false },
      })
    }
    const shotSchemaMatch = path.match(new RegExp(`^/api/projects/${PROJECT_ID}/canvases/([^/]+)/shot-schema$`))
    if (method === 'POST' && shotSchemaMatch) {
      state.shotSchemaCount += 1
      state.events.push(`shot-schema-requested:${shotSchemaMatch[1]}`)
      await state.shotSchemaGate
      if (state.shotSchemaOutcome === 'failure') {
        return fulfillJson(route, { detail: 'mock shot provider unavailable' }, 503)
      }
      return fulfillJson(route, shotSchemaResponse(state, shotSchemaMatch[1], body ?? {}))
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
      state.events.push(`generation-requested:${nodeId}`)
      await state.generationGate
      if (state.generationOutcome === 'success') {
        return fulfillJson(route, generationResponse(state, canvasId, nodeId, mediaType, body ?? {}))
      }
      const failedTask = generationTask({ id: 'task-failure', origin_canvas_id: canvasId, canvas_node_id: nodeId, media_type: mediaType, model: `mock-${mediaType}-v1`, status: 'failed', result_asset_id: null, provider_request_id: null, error_code: 'provider_error', error_message: 'mock provider unavailable' })
      state.tasks = [failedTask, ...state.tasks.filter((item) => item.id !== failedTask.id)]
      return fulfillJson(route, { detail: 'mock provider unavailable' }, 503)
    }
    if (method === 'POST' && path === '/api/text-generate') {
      const canvasId = String(body?.origin_canvas_id ?? FIRST_CANVAS_ID)
      if (body?.intent === 'script_draft' || body?.intent === 'script_refine') {
        state.events.push(`script-authoring-requested:${body?.canvas_node_id}`)
        if (state.generationOutcome === 'failure') {
          return fulfillJson(route, { detail: {
            code: 'provider_unavailable', message: 'mock provider unavailable', retryable: true,
            retry_after_seconds: 2,
          } }, 503)
        }
        return fulfillJson(route, scriptAuthoringGenerationResponse(state, canvasId, body ?? {}))
      }
      state.events.push(`cinematic-script-requested:${body?.canvas_node_id}`)
      return fulfillJson(route, cinematicScriptGenerationResponse(state, canvasId, body ?? {}))
    }
    return fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 501)
  })
}

export async function openResourceWorkspace(
  page: Page,
  state: ResourceMockState,
  viewport = { width: 1440, height: 900 },
  options: { enableCanvasInspection?: boolean } = {},
) {
  await page.setViewportSize(viewport)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await installResourceMockApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'resource-token'))
  const inspectionQuery = options.enableCanvasInspection ? '?revidCanvasInspection=1' : ''
  await page.goto(`/app/projects/${PROJECT_ID}/canvases/${FIRST_CANVAS_ID}${inspectionQuery}`)
  await expect(page.getByRole('region', { name: '项目与画布导航' })).toBeVisible()
}

export function documentPatches(state: ResourceMockState, canvasId = FIRST_CANVAS_ID) {
  return state.requests.filter((item) => item.method === 'PATCH' && item.path.endsWith(`/canvases/${canvasId}/document`))
}
