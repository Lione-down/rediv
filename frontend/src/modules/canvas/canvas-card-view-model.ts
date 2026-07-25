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
export type CanvasCardRuntimePhase =
  | 'idle'
  | 'selected'
  | 'editing'
  | 'composing'
  | 'submitting'
  | 'running'
  | 'succeeded'
  | 'failed'
export type CanvasCardOwnership =
  | 'authoring'
  | 'project-asset'
  | 'generated-result'
  | 'structural'
  | 'legacy'
  | 'unsupported'

export interface CanvasCardReference {
  stableId: string
  assetId: string
  displayName: string
  thumbnailUrl: string
  sourceRevision: number
  role: string
  order: number
}

export type CanvasCardPromptSegment =
  | { kind: 'text'; text: string }
  | { kind: 'reference'; stableId: string; assetId: string }

export interface CanvasCardPromptDocument {
  schemaVersion: 1
  segments: readonly CanvasCardPromptSegment[]
}

export interface CanvasCardConfiguration {
  schemaVersion: number
  generationMode: string | null
  modelId: string | null
  promptDocument: CanvasCardPromptDocument
}

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
  configuration: CanvasCardConfiguration
  references: readonly CanvasCardReference[]
  ownership: CanvasCardOwnership
  editability: {
    title: boolean
    body: boolean
    configuration: boolean
  }
  state: {
    phase: CanvasCardRuntimePhase
    canDrag: boolean
  }
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

export function readCanvasCardConfiguration(content: Record<string, unknown> | undefined) {
  const raw = content?.card_configuration
  if (!isRecord(raw)) {
    return {
      configuration: {
        schemaVersion: 1,
        generationMode: null,
        modelId: null,
        promptDocument: { schemaVersion: 1, segments: [] },
      } satisfies CanvasCardConfiguration,
      references: [] as CanvasCardReference[],
    }
  }
  const rawReferences = raw.references
  const references = Array.isArray(rawReferences)
    ? rawReferences.flatMap((value): CanvasCardReference[] => {
        if (!isRecord(value)) return []
        const {
          stable_id: stableId,
          asset_id: assetId,
          display_name: displayName,
          thumbnail_url: thumbnailUrl,
          source_revision: sourceRevision,
          role,
          order,
        } = value
        if (
          typeof stableId !== 'string' || !stableId.trim() ||
          typeof assetId !== 'string' || !assetId.trim() ||
          typeof displayName !== 'string' || !displayName.trim() ||
          typeof thumbnailUrl !== 'string' || !thumbnailUrl.trim() ||
          !Number.isSafeInteger(sourceRevision) || (sourceRevision as number) < 0 ||
          typeof role !== 'string' || !role.trim() ||
          !Number.isSafeInteger(order) || (order as number) < 0
        ) return []
        return [{
          stableId: stableId.trim(),
          assetId: assetId.trim(),
          displayName: displayName.trim(),
          thumbnailUrl: thumbnailUrl.trim(),
          sourceRevision: sourceRevision as number,
          role: role.trim(),
          order: order as number,
        }]
      }).sort((left, right) => left.order - right.order)
    : []
  const schemaVersion = raw.schema_version
  const generationMode = raw.generation_mode
  const modelId = raw.model_id
  const rawPromptDocument = raw.prompt_document
  const promptSegments = isRecord(rawPromptDocument) && Array.isArray(rawPromptDocument.segments)
    ? rawPromptDocument.segments.flatMap((value): CanvasCardPromptSegment[] => {
        if (!isRecord(value)) return []
        if (value.kind === 'text' && typeof value.text === 'string') {
          return value.text ? [{ kind: 'text', text: value.text }] : []
        }
        if (
          value.kind === 'reference' &&
          typeof value.stable_id === 'string' && value.stable_id.trim() &&
          typeof value.asset_id === 'string' && value.asset_id.trim()
        ) {
          return [{
            kind: 'reference',
            stableId: value.stable_id.trim(),
            assetId: value.asset_id.trim(),
          }]
        }
        return []
      })
    : []
  return {
    configuration: {
      schemaVersion: Number.isSafeInteger(schemaVersion) && (schemaVersion as number) > 0
        ? schemaVersion as number
        : 1,
      generationMode: typeof generationMode === 'string' && generationMode.trim()
        ? generationMode.trim()
        : null,
      modelId: typeof modelId === 'string' && modelId.trim() ? modelId.trim() : null,
      promptDocument: {
        schemaVersion: 1,
        segments: promptSegments,
      },
    } satisfies CanvasCardConfiguration,
    references,
  }
}

function resolveCardOwnership(node: CanvasNode, definitionKind: 'canonical' | 'compatibility') {
  if (definitionKind === 'compatibility') return 'legacy' as const
  if (node.type === 'asset') return 'project-asset' as const
  if (node.type === 'result') return 'generated-result' as const
  if (node.type === 'group') return 'structural' as const
  return 'authoring' as const
}

function resolveCardRuntimePhase(
  node: CanvasNode,
  options: {
    isSelected?: boolean
    interactionState?: 'editing' | 'composing' | 'submitting'
    runtimePresentation?: GenerationRuntimePresentation | null
  },
): CanvasCardRuntimePhase {
  if (options.runtimePresentation?.phase === 'submitting') return 'submitting'
  if (
    options.runtimePresentation?.phase === 'queued' ||
    options.runtimePresentation?.phase === 'running' ||
    node.status === 'running'
  ) return 'running'
  if (options.runtimePresentation?.phase === 'succeeded' || node.status === 'success') return 'succeeded'
  if (
    options.runtimePresentation?.phase === 'failed' ||
    options.runtimePresentation?.phase === 'timed_out' ||
    node.status === 'warning'
  ) return 'failed'
  if (options.interactionState) return options.interactionState
  return options.isSelected ? 'selected' : 'idle'
}

function hasSpecializedGenerationWorkflow(node: CanvasNode) {
  const generationParameters = node.contentData?.generation_parameters
  const imageParameters = isRecord(generationParameters) && isRecord(generationParameters.image)
    ? generationParameters.image
    : null
  return Boolean(node.contentData?.generation_recipe_id || imageParameters?.operation)
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
  _nodes: readonly CanvasNode[],
) {
  return node.title.trim()
}

export function buildCanvasCardViewModel(
  node: CanvasNode,
  options: {
    isReadOnly?: boolean
    isSelected?: boolean
    interactionState?: 'editing' | 'composing' | 'submitting'
    runtimePresentation?: GenerationRuntimePresentation | null
  } = {},
): CanvasCardViewModel {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  const family = resolveCanvasCardFamily(node)
  const content = node.content ?? readString(node.contentData, 'text') ?? ''
  const runtime = options.runtimePresentation ?? null
  const { configuration, references } = readCanvasCardConfiguration(node.contentData)
  const statePhase = resolveCardRuntimePhase(node, options)
  const canDrag = !options.isReadOnly && !node.isLocked
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
      configuration,
      references,
      ownership: 'unsupported',
      editability: { title: false, body: false, configuration: false },
      state: { phase: statePhase, canDrag: false },
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
  const ownership = resolveCardOwnership(node, definition.kind)
  const canEditTitle = !options.isReadOnly && !node.isLocked
  const canEditConfiguration = ownership === 'authoring' && Boolean(
    definition.capabilities.canGenerate && canEditTitle && (!runtime || runtime.isTerminal),
  )
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
    configuration,
    references,
    ownership,
    editability: {
      title: canEditTitle,
      body: canEditBody,
      configuration: canEditConfiguration,
    },
    state: { phase: statePhase, canDrag },
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
