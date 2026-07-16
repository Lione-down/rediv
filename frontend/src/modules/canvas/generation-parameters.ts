import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import {
  resolveGenerationContext,
  type ConnectedMediaContext,
  type ResolvedGenerationContext,
} from './generation-context'
import { resolveVisualAssetRecipe } from './visual-asset-recipes'

export type VideoReferenceMode = 'text-to-video' | 'image-to-video' | 'keyframes'

export interface GenerationCapabilities {
  contract_version: 1
  image: {
    model: string
    size: string
    aspect_ratios: string[]
    default_aspect_ratio: string
  }
  video: {
    model: string
    width: number
    height: number
    reference_modes: VideoReferenceMode[]
    default_duration_seconds: number
    min_keyframes: number
    max_keyframes: number
    duration_presets: Array<{
      duration_seconds: number
      num_frames: number
      frame_rate: number
    }>
  }
}

export type GenerationNodeParameters =
  | { schema_version: 1; image: { aspect_ratio: string } }
  | {
      schema_version: 1
      video: {
        duration_seconds: number
        reference_mode: VideoReferenceMode
        primary_reference_node_id?: string
      }
    }

export interface ResolvedGenerationRequestContext extends ResolvedGenerationContext {
  capabilities: GenerationCapabilities | null
  mediaType: 'image' | 'video'
  isRecipe: boolean
  parameterError: string
  parameters: GenerationNodeParameters | null
  aspectRatio?: string
  durationSeconds?: number
  referenceMode?: VideoReferenceMode
  primaryReferenceNodeId?: string
  parameterSummary: string[]
}

const VIDEO_REFERENCE_MODES = new Set<VideoReferenceMode>([
  'text-to-video', 'image-to-video', 'keyframes',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

export function parseGenerationCapabilities(value: unknown): GenerationCapabilities {
  if (!isRecord(value) || value.contract_version !== 1 || !isRecord(value.image) || !isRecord(value.video)) {
    throw new Error('生成参数 capability contract 无效。')
  }
  const image = value.image
  const video = value.video
  const ratios = image.aspect_ratios
  const modes = video.reference_modes
  const presets = video.duration_presets
  if (
    !isNonEmptyString(image.model) || !isNonEmptyString(image.size) ||
    !Array.isArray(ratios) || !ratios.length || ratios.some((item) => !isNonEmptyString(item)) ||
    new Set(ratios).size !== ratios.length || !isNonEmptyString(image.default_aspect_ratio) ||
    !ratios.includes(image.default_aspect_ratio) ||
    !isNonEmptyString(video.model) || !isPositiveInteger(video.width) || !isPositiveInteger(video.height) ||
    !Array.isArray(modes) || modes.length !== VIDEO_REFERENCE_MODES.size ||
    modes.some((item) => typeof item !== 'string' || !VIDEO_REFERENCE_MODES.has(item as VideoReferenceMode)) ||
    new Set(modes).size !== modes.length ||
    !isPositiveInteger(video.default_duration_seconds) ||
    !isPositiveInteger(video.min_keyframes) || !isPositiveInteger(video.max_keyframes) ||
    video.min_keyframes > video.max_keyframes || !Array.isArray(presets) || !presets.length
  ) throw new Error('生成参数 capability contract 无效。')

  const normalizedPresets = presets.map((preset) => {
    if (
      !isRecord(preset) || !isPositiveInteger(preset.duration_seconds) ||
      !isPositiveInteger(preset.num_frames) || !isPositiveInteger(preset.frame_rate) ||
      (preset.num_frames - 1) % 8 !== 0
    ) throw new Error('生成参数 capability contract 无效。')
    return {
      duration_seconds: preset.duration_seconds,
      num_frames: preset.num_frames,
      frame_rate: preset.frame_rate,
    }
  })
  if (
    new Set(normalizedPresets.map((preset) => preset.duration_seconds)).size !== normalizedPresets.length ||
    !normalizedPresets.some((preset) => preset.duration_seconds === video.default_duration_seconds)
  ) throw new Error('生成参数 capability contract 无效。')

  return {
    contract_version: 1,
    image: {
      model: image.model,
      size: image.size,
      aspect_ratios: [...ratios],
      default_aspect_ratio: image.default_aspect_ratio,
    },
    video: {
      model: video.model,
      width: video.width,
      height: video.height,
      reference_modes: [...modes] as VideoReferenceMode[],
      default_duration_seconds: video.default_duration_seconds,
      min_keyframes: video.min_keyframes,
      max_keyframes: video.max_keyframes,
      duration_presets: normalizedPresets,
    },
  }
}

function readParameters(node: CanvasNode) {
  const value = node.contentData?.generation_parameters
  if (value === undefined) return null
  if (!isRecord(value) || value.schema_version !== 1) {
    throw new Error('节点保存的生成参数版本无效，请重新选择参数。')
  }
  return value
}

function applyMediaSelection(
  context: ResolvedGenerationContext,
  includedNodeIds: ReadonlySet<string>,
) {
  const imageIds: string[] = []
  const mediaSources: ConnectedMediaContext[] = context.mediaSources.map((source) => {
    if (source.state !== 'included') return source
    if (!includedNodeIds.has(source.nodeId)) {
      return { ...source, state: 'reference-mode-excluded', requestOrder: null }
    }
    imageIds.push(source.assetId!)
    return { ...source, requestOrder: imageIds.length }
  })
  const includedConnections = new Set(mediaSources
    .filter((source) => source.state === 'included')
    .map((source) => source.connectionId))
  return {
    imageIds,
    mediaSources,
    provenance: context.provenance.map((item) => (
      item.kind === 'media'
        ? { ...item, isIncluded: includedConnections.has(item.connectionId) }
        : item
    )),
  }
}

function failedContext(
  base: ResolvedGenerationContext,
  mediaType: 'image' | 'video',
  capabilities: GenerationCapabilities | null,
  message: string,
): ResolvedGenerationRequestContext {
  return {
    ...base,
    capabilities,
    mediaType,
    isRecipe: false,
    parameterError: message,
    parameters: null,
    parameterSummary: [],
  }
}

export function resolveGenerationRequestContext(
  generationNode: CanvasNode,
  mediaType: 'image' | 'video',
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
  capabilities: GenerationCapabilities | null,
): ResolvedGenerationRequestContext {
  const base = resolveGenerationContext(generationNode, nodes, connections)
  const recipe = resolveVisualAssetRecipe(generationNode)
  if (!capabilities) {
    return failedContext(base, mediaType, null, '生成参数 capability 尚未加载，当前请求已阻止。')
  }
  if (recipe) {
    return {
      ...base,
      capabilities,
      mediaType,
      isRecipe: true,
      parameterError: '',
      parameters: null,
      aspectRatio: '4:3',
      parameterSummary: ['配方固定 4:3', '输出 1024×768'],
    }
  }

  let saved: Record<string, unknown> | null
  try {
    saved = readParameters(generationNode)
  } catch (error) {
    return failedContext(base, mediaType, capabilities, (error as Error).message)
  }
  if (mediaType === 'image') {
    const image = saved?.image
    const aspectRatio = saved === null
      ? capabilities.image.default_aspect_ratio
      : isRecord(image) && isNonEmptyString(image.aspect_ratio) ? image.aspect_ratio : ''
    if (!capabilities.image.aspect_ratios.includes(aspectRatio)) {
      return failedContext(base, mediaType, capabilities, '节点保存的图片比例不受当前 capability 支持，请重新选择。')
    }
    return {
      ...base,
      capabilities,
      mediaType,
      isRecipe: false,
      parameterError: '',
      parameters: { schema_version: 1, image: { aspect_ratio: aspectRatio } },
      aspectRatio,
      parameterSummary: [`比例 ${aspectRatio}`, `规格 ${capabilities.image.size}`],
    }
  }

  const video = saved?.video
  const validSources = base.mediaSources.filter((source) => source.state === 'included')
  const durationSeconds = saved === null
    ? capabilities.video.default_duration_seconds
    : isRecord(video) && isPositiveInteger(video.duration_seconds) ? video.duration_seconds : 0
  if (!capabilities.video.duration_presets.some((preset) => preset.duration_seconds === durationSeconds)) {
    return failedContext(base, mediaType, capabilities, '节点保存的视频时长不受当前 capability 支持，请重新选择。')
  }

  let referenceMode: VideoReferenceMode | null = null
  let primaryReferenceNodeId: string | undefined
  if (saved === null) {
    if (!validSources.length) referenceMode = 'text-to-video'
    else if (validSources.length === 1) {
      referenceMode = 'image-to-video'
      primaryReferenceNodeId = validSources[0].nodeId
    } else {
      return failedContext(base, mediaType, capabilities, '检测到多张参考图，请先明确选择图生视频或关键帧模式。')
    }
  } else if (isRecord(video) && typeof video.reference_mode === 'string' && VIDEO_REFERENCE_MODES.has(video.reference_mode as VideoReferenceMode)) {
    referenceMode = video.reference_mode as VideoReferenceMode
    primaryReferenceNodeId = isNonEmptyString(video.primary_reference_node_id)
      ? video.primary_reference_node_id
      : undefined
  }
  if (!referenceMode || !capabilities.video.reference_modes.includes(referenceMode)) {
    return failedContext(base, mediaType, capabilities, '节点保存的视频参考模式无效，请重新选择。')
  }

  let selectedNodeIds = new Set<string>()
  if (referenceMode === 'image-to-video') {
    if (!primaryReferenceNodeId && validSources.length === 1) primaryReferenceNodeId = validSources[0].nodeId
    if (!primaryReferenceNodeId || !validSources.some((source) => source.nodeId === primaryReferenceNodeId)) {
      return failedContext(base, mediaType, capabilities, '图生视频需要选择一张仍然有效的主参考图。')
    }
    selectedNodeIds = new Set([primaryReferenceNodeId])
  } else if (referenceMode === 'keyframes') {
    if (
      validSources.length < capabilities.video.min_keyframes ||
      validSources.length > capabilities.video.max_keyframes
    ) {
      return failedContext(
        base, mediaType, capabilities,
        `关键帧模式需要 ${capabilities.video.min_keyframes}–${capabilities.video.max_keyframes} 张有效参考图。`,
      )
    }
    selectedNodeIds = new Set(validSources.map((source) => source.nodeId))
  }
  const selected = applyMediaSelection(base, selectedNodeIds)
  const framePreset = capabilities.video.duration_presets.find((preset) => (
    preset.duration_seconds === durationSeconds
  ))!
  const parameters: GenerationNodeParameters = {
    schema_version: 1,
    video: {
      duration_seconds: durationSeconds,
      reference_mode: referenceMode,
      ...(primaryReferenceNodeId ? { primary_reference_node_id: primaryReferenceNodeId } : {}),
    },
  }
  return {
    ...base,
    ...selected,
    capabilities,
    mediaType,
    isRecipe: false,
    parameterError: '',
    parameters,
    durationSeconds,
    referenceMode,
    primaryReferenceNodeId,
    parameterSummary: [
      `模式 ${referenceMode}`,
      `时长 ${durationSeconds}s`,
      `${framePreset.num_frames} 帧 @ ${framePreset.frame_rate}fps`,
      `${capabilities.video.width}×${capabilities.video.height}`,
    ],
  }
}

export function formatGenerationRequestParameters(value: unknown) {
  if (!isRecord(value)) return ''
  if (value.media_type === 'image') {
    const ratio = isNonEmptyString(value.aspect_ratio) ? value.aspect_ratio : '未知比例'
    const size = isNonEmptyString(value.size) ? value.size : '未知规格'
    return `${ratio} · ${size}`
  }
  if (value.media_type === 'video') {
    const mode = value.reference_mode === 'text-to-video'
      ? '文生视频'
      : value.reference_mode === 'image-to-video'
        ? '图生视频'
        : value.reference_mode === 'keyframes' ? '关键帧' : '未知模式'
    const duration = isPositiveInteger(value.duration_seconds) ? `${value.duration_seconds} 秒` : '未知时长'
    const frames = isPositiveInteger(value.num_frames) && isPositiveInteger(value.frame_rate)
      ? ` · ${value.num_frames}/${value.frame_rate}`
      : ''
    return `${mode} · ${duration}${frames}`
  }
  return ''
}
