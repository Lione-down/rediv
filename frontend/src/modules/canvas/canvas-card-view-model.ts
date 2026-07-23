import type { CanvasNode } from '../../types/canvas'
import type { GenerationRuntimePresentation } from './generation-runtime-presentation'
import {
  isNodeGroupContainer,
  resolveNodeDefinition,
  type NodePortDefinition,
} from './node-registry'
import {
  resolveCanvasCardGeometry,
  resolveCanvasNodeMediaLayoutAspectRatio,
} from './canvas-card-geometry'

export type CanvasCardFamily = 'text' | 'image' | 'video'
export type CanvasNodeMediaPresentation =
  | { kind: 'image'; url: string; label: string; aspectRatio: number | null }
  | { kind: 'video'; url: string; poster?: string; label: string; aspectRatio: number | null }
  | { kind: 'placeholder'; label: string }
export type CanvasNodeVisualKind = 'text' | 'media' | 'generation' | 'result' | 'unknown'
export type CanvasNodeBodyKind = 'authoring' | 'media' | 'group' | 'unsupported'

export interface CanvasNodeChromePresentation {
  bodyKind: CanvasNodeBodyKind
  label: string
  labelPlacement: 'external' | 'internal'
}

export interface CanvasCardViewModel {
  nodeId: string
  kind: CanvasCardFamily | 'group' | 'unknown'
  title: string
  typeLabel: string
  visualKind: CanvasNodeVisualKind
  content: string
  canEditContent: boolean
  isUnsupported: boolean
  inputPorts: readonly NodePortDefinition[]
  outputPorts: readonly NodePortDefinition[]
  media: CanvasNodeMediaPresentation | null
  chrome: CanvasNodeChromePresentation
  body: {
    content: string
    canEdit: boolean
  }
  lifecycle: {
    phase: string
    label: string
    tone: 'progress' | 'success' | 'danger'
    progressPercent: number | null
    isIndeterminate: boolean
  } | null
  ports: {
    input: readonly NodePortDefinition[]
    output: readonly NodePortDefinition[]
  }
  workSurface: {
    family: CanvasCardFamily | null
    isAvailable: boolean
    isVisible: boolean
  }
  result: {
    assetId: string | null
    compatibilityNodeId: string | null
  }
}

export type CanvasNodePresentation = CanvasCardViewModel

function readString(content: Record<string, unknown> | undefined, key: string) {
  const value = content?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readAspectRatio(content: Record<string, unknown> | undefined) {
  const direct = content?.aspect_ratio
  if (typeof direct === 'number' && Number.isFinite(direct) && direct >= 0.1 && direct <= 10) return direct
  const width = content?.width
  const height = content?.height
  if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
    const ratio = width / height
    return Number.isFinite(ratio) && ratio >= 0.1 && ratio <= 10 ? ratio : null
  }
  return null
}

export function resolveCanvasCardFamily(
  node: Pick<CanvasNode, 'type' | 'contentData'>,
): CanvasCardFamily | null {
  if (node.type === 'text' || node.type === 'script' || node.type === 'note') return 'text'
  if (node.type === 'image' || node.type === 'model') return 'image'
  if (node.type === 'video') return 'video'
  const subtype = node.contentData?.subtype
  if (
    (node.type === 'asset' || node.type === 'generation' || node.type === 'result') &&
    (subtype === 'image' || subtype === 'video' || subtype === 'text')
  ) return subtype
  return null
}

function mediaPresentation(node: CanvasNode): CanvasNodeMediaPresentation | null {
  const subtype = readString(node.contentData, 'subtype')
  if (!['image', 'video', 'audio'].includes(subtype ?? '')) return null
  const role = node.type === 'result' ? '结果' : '素材'
  const label = subtype === 'image' ? `图片${role}` : subtype === 'video' ? `视频${role}` : '音频素材'
  const previewUrl = readString(node.contentData, 'preview_url') ?? readString(node.contentData, 'thumbnail_url')
  const assetUrl = readString(node.contentData, 'url')
  const aspectRatio = resolveCanvasNodeMediaLayoutAspectRatio(node) ?? readAspectRatio(node.contentData)
  if (subtype === 'image' && assetUrl) return { kind: 'image', url: assetUrl, label, aspectRatio }
  if (subtype === 'video' && assetUrl) {
    return { kind: 'video', url: assetUrl, poster: previewUrl ?? undefined, label, aspectRatio }
  }
  if (previewUrl) return { kind: 'image', url: previewUrl, label, aspectRatio }
  return { kind: 'placeholder', label: `${label}暂未提供预览` }
}

function isMaterializedCompatibilityNode(node: CanvasNode) {
  return typeof node.contentData?.materialized_result_node_id === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasSpecializedGenerationWorkflow(node: CanvasNode) {
  const generationParameters = node.contentData?.generation_parameters
  const imageParameters = isRecord(generationParameters) && isRecord(generationParameters.image)
    ? generationParameters.image
    : null
  return Boolean(node.contentData?.generation_recipe_id || imageParameters?.operation)
}

function cardReferenceTypeLabel(node: CanvasNode) {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  if (definition.kind === 'unsupported') return definition.label
  const subtype = node.contentData?.subtype
  return typeof subtype === 'string'
    ? definition.subtypes.find((candidate) => candidate.id === subtype)?.label ?? definition.label
    : definition.label
}

function persistedLifecycle(node: CanvasNode): CanvasCardViewModel['lifecycle'] {
  if (node.status === 'running') {
    return {
      phase: 'running',
      label: '运行中',
      tone: 'progress',
      progressPercent: null,
      isIndeterminate: true,
    }
  }
  if (node.status === 'success') {
    return {
      phase: 'succeeded',
      label: '已完成',
      tone: 'success',
      progressPercent: 100,
      isIndeterminate: false,
    }
  }
  if (node.status === 'warning') {
    return {
      phase: 'failed',
      label: '生成失败',
      tone: 'danger',
      progressPercent: null,
      isIndeterminate: false,
    }
  }
  return null
}

export function resolveCanvasCardReferenceDisplayTitle(
  node: CanvasNode,
  nodes: readonly CanvasNode[],
) {
  const title = node.title.trim()
  const duplicateCount = nodes.filter((candidate) => candidate.title.trim() === title).length
  return duplicateCount > 1
    ? `${title} · ${cardReferenceTypeLabel(node)} · ${node.id.slice(-6)}`
    : title
}

export function buildCanvasCardViewModel(
  node: CanvasNode,
  options: {
    isReadOnly?: boolean
    isSelected?: boolean
    runtimePresentation?: GenerationRuntimePresentation | null
  } = {},
): CanvasCardViewModel {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  const family = resolveCanvasCardFamily(node)
  const content = node.content ?? readString(node.contentData, 'text') ?? ''
  const runtime = options.runtimePresentation ?? null
  if (definition.kind === 'unsupported') {
    return {
      nodeId: node.id,
      kind: 'unknown',
      title: node.title,
      typeLabel: `不支持的节点 · ${node.type}`,
      visualKind: 'unknown',
      content: `节点类型 ${node.type} 暂不受支持，原始数据已保留。`,
      canEditContent: false,
      isUnsupported: true,
      inputPorts: [],
      outputPorts: [],
      media: null,
      chrome: { bodyKind: 'unsupported', label: node.title, labelPlacement: 'internal' },
      body: { content, canEdit: false },
      lifecycle: null,
      ports: { input: [], output: [] },
      workSurface: { family: null, isAvailable: false, isVisible: false },
      result: { assetId: null, compatibilityNodeId: null },
    }
  }
  const media = definition.capabilities.canPreviewMedia || isMaterializedCompatibilityNode(node)
    ? mediaPresentation(node)
    : null
  const bodyKind: CanvasNodeBodyKind = isNodeGroupContainer(node)
    ? 'group'
    : media ? 'media' : 'authoring'
  const inputPorts = definition.ports.filter((port) => port.direction === 'input')
  const outputPorts = definition.ports.filter((port) => port.direction === 'output')
  const isAvailable = Boolean(
    (family === 'image' || family === 'video') &&
    definition.capabilities.canGenerate &&
    !hasSpecializedGenerationWorkflow(node) &&
    !options.isReadOnly &&
    !node.isLocked,
  )
  const canEditBody = Boolean(
    definition.capabilities.canEditContent &&
    !options.isReadOnly &&
    !node.isLocked &&
    (!runtime || runtime.isTerminal),
  )
  const lifecycle = runtime
    ? {
        phase: runtime.phase,
        label: runtime.label,
        tone: runtime.tone,
        progressPercent: runtime.progressPercent,
        isIndeterminate: runtime.isIndeterminate,
      }
    : persistedLifecycle(node)
  return {
    nodeId: node.id,
    kind: isNodeGroupContainer(node) ? 'group' : family ?? 'unknown',
    title: node.title,
    typeLabel: definition.label,
    visualKind: node.type === 'result'
      ? 'result'
      : media ? 'media' : node.type === 'generation' ? 'generation' : 'text',
    content,
    canEditContent: definition.capabilities.canEditContent,
    isUnsupported: false,
    inputPorts,
    outputPorts,
    media,
    chrome: {
      bodyKind,
      label: node.title,
      labelPlacement: bodyKind === 'authoring' ? 'internal' : 'external',
    },
    body: { content, canEdit: canEditBody },
    lifecycle,
    ports: { input: inputPorts, output: outputPorts },
    workSurface: {
      family,
      isAvailable,
      isVisible: isAvailable && Boolean(options.isSelected),
    },
    result: {
      assetId: readString(node.contentData, 'result_asset_id') ?? readString(node.contentData, 'asset_id'),
      compatibilityNodeId: readString(node.contentData, 'materialized_result_node_id'),
    },
  }
}

export function buildCanvasNodePresentation(node: CanvasNode) {
  return buildCanvasCardViewModel(node)
}

export function isSupportedCanvasGroupNode(node: CanvasNode) {
  return isNodeGroupContainer(node)
}

export function canvasNodeVisualSize(node: CanvasNode) {
  const { width, height } = resolveCanvasCardGeometry(node).visible
  return { width, height }
}
