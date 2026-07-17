import type { Asset } from '../../types/asset'
import type { CanvasNode } from '../../types/canvas'

export const VIDEO_EDIT_CONTRACT_VERSION = 1
const VIDEO_EDIT_TEMPLATE_ID = 'video-edit-preflight'

export type VideoEditOperation =
  | { kind: 'trim'; start_seconds: number; end_seconds: number }
  | { kind: 'concat' }

export interface VideoEditTemplateReference {
  id: string
  version: number
}

export interface VideoEditTemplate extends VideoEditTemplateReference {
  contract_version: 1
  execution_mode: 'preview-only'
  title: string
}

export interface VideoEditPreflightError {
  code:
    | 'asset_not_owned'
    | 'asset_url_mismatch'
    | 'duplicate_selection'
    | 'invalid_asset_registry'
    | 'invalid_canvas_scope'
    | 'invalid_operation'
    | 'invalid_source_count'
    | 'invalid_template'
    | 'invalid_trim_range'
    | 'invalid_video_source'
    | 'missing_selection'
  message: string
}

export interface VideoEditSource {
  asset_id: string
  node_id: string
  order: number
  title: string
  url: string
}

export interface VideoEditExportBoundary {
  available: false
  code: 'backend_export_unavailable'
  message: string
}

export interface VideoEditPreview {
  mode: 'single-native' | 'sequence-native'
  source_count: number
}

export interface VideoEditPreflight {
  canvas_id: string
  contract_version: 1
  errors: VideoEditPreflightError[]
  execution_mode: 'preview-only'
  executable: boolean
  export: VideoEditExportBoundary
  fingerprint: string
  operation: VideoEditOperation | null
  preview: VideoEditPreview | null
  project_id: string
  sources: VideoEditSource[]
  template: VideoEditTemplateReference
}

export interface VideoEditPreflightInput {
  assets: readonly Asset[]
  canvasId: string
  nodes: readonly CanvasNode[]
  operation: VideoEditOperation
  projectId: string
  selectedNodeIds: readonly string[]
  template: VideoEditTemplateReference
  userId: string
}

const VIDEO_EDIT_TEMPLATE: VideoEditTemplate = {
  contract_version: VIDEO_EDIT_CONTRACT_VERSION,
  execution_mode: 'preview-only',
  id: VIDEO_EDIT_TEMPLATE_ID,
  title: '视频编辑预检',
  version: 1,
}

const EXPORT_BOUNDARY: VideoEditExportBoundary = {
  available: false,
  code: 'backend_export_unavailable',
  message: '当前 backend 尚无已批准的视频导出任务 contract，导出已阻止。',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function error(code: VideoEditPreflightError['code'], message: string): VideoEditPreflightError {
  return { code, message }
}

function failedPreflight(
  input: VideoEditPreflightInput,
  errors: VideoEditPreflightError[],
  operation: VideoEditOperation | null = null,
): VideoEditPreflight {
  return {
    canvas_id: input.canvasId,
    contract_version: VIDEO_EDIT_CONTRACT_VERSION,
    errors,
    execution_mode: 'preview-only',
    executable: false,
    export: { ...EXPORT_BOUNDARY },
    fingerprint: '',
    operation,
    preview: null,
    project_id: input.projectId,
    sources: [],
    template: { id: input.template.id, version: input.template.version },
  }
}

function normalizedOperation(operation: unknown): VideoEditOperation | null {
  if (!isRecord(operation)) return null
  if (operation.kind === 'concat') return { kind: 'concat' }
  if (operation.kind !== 'trim' || typeof operation.start_seconds !== 'number' || typeof operation.end_seconds !== 'number') return null
  return { kind: 'trim', start_seconds: operation.start_seconds, end_seconds: operation.end_seconds }
}

function validateOperation(operation: VideoEditOperation) {
  if (operation.kind === 'concat') return null
  if (!Number.isFinite(operation.start_seconds) || !Number.isFinite(operation.end_seconds) ||
    operation.start_seconds < 0 || operation.end_seconds <= operation.start_seconds) {
    return error('invalid_trim_range', '裁剪时间范围无效。')
  }
  return null
}

function fingerprint(input: {
  canvasId: string
  operation: VideoEditOperation
  projectId: string
  sources: readonly VideoEditSource[]
  template: VideoEditTemplateReference
}) {
  return JSON.stringify({
    canvas_id: input.canvasId,
    operation: input.operation,
    project_id: input.projectId,
    sources: input.sources.map((source) => ({ asset_id: source.asset_id, node_id: source.node_id, order: source.order, url: source.url })),
    template: input.template,
  })
}

function resolveVideoSource(
  node: CanvasNode,
  asset: Asset | undefined,
  input: VideoEditPreflightInput,
  order: number,
): VideoEditSource | VideoEditPreflightError {
  const assetId = readString(node.contentData?.asset_id)
  const url = readString(node.contentData?.url)
  const nodeProjectId = readString(node.contentData?.project_id)
  if (!assetId || !url || nodeProjectId !== input.projectId || node.isLocked ||
    (node.type !== 'asset' && node.type !== 'result') || node.contentData?.subtype !== 'video') {
    return error('invalid_video_source', '请选择当前画布中可用的视频素材或结果节点。')
  }
  if (!asset || asset.user_id !== input.userId || asset.project_id !== input.projectId ||
    asset.type !== 'video' || asset.status !== 'active' || !readString(asset.url)) {
    return error('asset_not_owned', '视频资产不属于当前项目或登录用户。')
  }
  if (asset.id !== assetId || asset.url !== url) {
    return error('asset_url_mismatch', '视频节点与项目资产不匹配。')
  }
  return { asset_id: assetId, node_id: node.id, order, title: node.title, url }
}

export function resolveVideoEditTemplate(id: string, version: number): VideoEditTemplate | null {
  if (id !== VIDEO_EDIT_TEMPLATE.id || version !== VIDEO_EDIT_TEMPLATE.version) return null
  return { ...VIDEO_EDIT_TEMPLATE }
}

export function preflightVideoEdit(input: VideoEditPreflightInput): VideoEditPreflight {
  const template = resolveVideoEditTemplate(input.template.id, input.template.version)
  if (!template) return failedPreflight(input, [error('invalid_template', '视频编辑模板版本不可用。')])
  if (!readString(input.projectId) || !readString(input.canvasId) || !readString(input.userId)) {
    return failedPreflight(input, [error('invalid_canvas_scope', '项目、画布或登录范围无效。')])
  }
  const operation = normalizedOperation(input.operation)
  if (!operation) return failedPreflight(input, [error('invalid_operation', '视频编辑操作无效。')])
  const operationError = validateOperation(operation)
  if (operationError) return failedPreflight(input, [operationError], operation)
  if (!input.selectedNodeIds.length) return failedPreflight(input, [error('missing_selection', '请选择至少一个视频节点。')], operation)
  if (new Set(input.selectedNodeIds).size !== input.selectedNodeIds.length) {
    return failedPreflight(input, [error('duplicate_selection', '视频编辑选择包含重复节点。')], operation)
  }
  const expectedCount = operation.kind === 'trim' ? 1 : 2
  if ((operation.kind === 'trim' && input.selectedNodeIds.length !== expectedCount) ||
    (operation.kind === 'concat' && input.selectedNodeIds.length < expectedCount)) {
    return failedPreflight(input, [error('invalid_source_count', operation.kind === 'trim' ? '裁剪必须选择一个视频节点。' : '拼接至少需要两个视频节点。')], operation)
  }

  const nodes = new Map<string, CanvasNode>()
  for (const node of input.nodes) {
    if (!readString(node.id) || nodes.has(node.id)) {
      return failedPreflight(input, [error('invalid_video_source', '当前画布节点集合无效。')], operation)
    }
    nodes.set(node.id, node)
  }
  const assets = new Map<string, Asset>()
  for (const asset of input.assets) {
    if (!readString(asset.id) || assets.has(asset.id)) {
      return failedPreflight(input, [error('invalid_asset_registry', '项目资产集合无效。')], operation)
    }
    assets.set(asset.id, asset)
  }

  const sources: VideoEditSource[] = []
  for (const [index, nodeId] of input.selectedNodeIds.entries()) {
    const node = nodes.get(nodeId)
    if (!node) return failedPreflight(input, [error('invalid_video_source', '视频节点不在当前画布中。')], operation)
    const assetId = readString(node.contentData?.asset_id)
    const source = resolveVideoSource(node, assetId ? assets.get(assetId) : undefined, input, index + 1)
    if ('code' in source) return failedPreflight(input, [source], operation)
    sources.push(source)
  }
  const preview: VideoEditPreview = {
    mode: operation.kind === 'trim' ? 'single-native' : 'sequence-native',
    source_count: sources.length,
  }
  return {
    canvas_id: input.canvasId,
    contract_version: VIDEO_EDIT_CONTRACT_VERSION,
    errors: [],
    execution_mode: template.execution_mode,
    executable: true,
    export: { ...EXPORT_BOUNDARY },
    fingerprint: fingerprint({ canvasId: input.canvasId, operation, projectId: input.projectId, sources, template }),
    operation,
    preview,
    project_id: input.projectId,
    sources,
    template: { id: template.id, version: template.version },
  }
}
