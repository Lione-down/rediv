import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import {
  resolveGenerationContext,
  type ConnectedMediaContext,
  type ResolvedGenerationContext,
} from './generation-context'
import { resolveVisualAssetRecipe } from './visual-asset-recipes'
import {
  IMAGE_OPERATIONS,
  parseImageOperationContract,
  type ImageOperationContract,
  type ProviderImageOperationId,
} from './image-operations'
import {
  formatShotControls,
  parseShotControls,
  type ShotControlCapabilities,
  type ShotControls,
} from './shot-controls'
import type {
  GenerationCapabilities,
  GenerationNodeParameters,
  ImageBatchSnapshot,
  VideoReferenceBinding,
  VideoReferenceMode,
  VideoReferenceRole,
} from './generation-capability-contract'

export { parseGenerationCapabilities } from './generation-capability-contract'
export type {
  GenerationCapabilities,
  GenerationNodeParameters,
  ImageBatchSnapshot,
  VideoReferenceBinding,
  VideoReferenceMode,
  VideoReferenceRole,
} from './generation-capability-contract'

export function replaceImageOperationParameters(
  parameters: GenerationNodeParameters,
  operation: ImageOperationContract,
): GenerationNodeParameters {
  if (!('image' in parameters)) throw new Error('图片操作只能更新图片生成参数。')
  return {
    schema_version: 1,
    image: { ...parameters.image, operation },
  }
}

export interface ResolvedGenerationRequestContext extends ResolvedGenerationContext {
  capabilities: GenerationCapabilities | null
  mediaType: 'image' | 'video'
  isRecipe: boolean
  parameterError: string
  parameters: GenerationNodeParameters | null
  aspectRatio?: string
  outputCount?: number
  imageBatch?: ImageBatchSnapshot
  durationSeconds?: number
  imageOperation?: ImageOperationContract
  shotControls?: ShotControls
  shotControlCapabilities?: ShotControlCapabilities
  referenceMode?: VideoReferenceMode
  primaryReferenceNodeId?: string
  videoReferences?: VideoReferenceBinding[]
  parameterSummary: string[]
}

const VIDEO_REFERENCE_MODES = new Set<VideoReferenceMode>([
  'text-to-video', 'image-to-video', 'keyframes',
])
const VIDEO_REFERENCE_ROLES = new Set<VideoReferenceRole>([
  'first-frame', 'last-frame', 'reference',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0
}

function parseImageBatch(value: unknown, outputCount: number): ImageBatchSnapshot | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value) || Object.keys(value).length !== 3 ||
    !isNonEmptyString(value.batch_id) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.batch_id) ||
    !isPositiveInteger(value.slot_index) || !isPositiveInteger(value.slot_count) ||
    value.slot_count !== outputCount || value.slot_index > value.slot_count
  ) throw new Error('节点保存的图片 batch slot 无效，请重新生成。')
  return {
    batch_id: value.batch_id,
    slot_index: value.slot_index,
    slot_count: value.slot_count,
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
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

function parseVideoReferenceBindings(
  value: unknown,
  sources: readonly ConnectedMediaContext[],
  capabilities: GenerationCapabilities['video'],
) {
  if (!Array.isArray(value) || value.length > capabilities.max_references) {
    throw new Error(`视频参考绑定最多允许 ${capabilities.max_references} 条。`)
  }
  const sourcesById = new Map(sources.map((source) => [source.nodeId, source]))
  const identities = new Set<string>()
  const roleCounts = new Map<VideoReferenceRole, number>()
  return value.map((item, index) => {
    if (!isRecord(item) || Object.keys(item).length !== 4 ||
      !isNonEmptyString(item.node_id) || !isNonEmptyString(item.asset_id) ||
      typeof item.role !== 'string' || !VIDEO_REFERENCE_ROLES.has(item.role as VideoReferenceRole) ||
      item.order !== index
    ) throw new Error('节点保存的视频参考绑定无效，请重新选择。')
    const role = item.role as VideoReferenceRole
    if (!capabilities.reference_roles.includes(role)) {
      throw new Error('节点保存的视频参考角色不受当前 capability 支持。')
    }
    const source = sourcesById.get(item.node_id)
    if (!source || source.assetId !== item.asset_id) {
      throw new Error('节点保存的视频参考来源已失效，请重新选择。')
    }
    const identity = `${item.node_id}\u0000${item.asset_id}\u0000${role}`
    if (identities.has(identity)) throw new Error('节点保存了重复的视频参考角色。')
    identities.add(identity)
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1)
    if ((role === 'first-frame' || role === 'last-frame') && roleCounts.get(role)! > 1) {
      throw new Error(`视频参考最多允许一个 ${role}。`)
    }
    return { node_id: item.node_id, asset_id: item.asset_id, role, order: index }
  })
}

function legacyVideoBindings(
  mode: VideoReferenceMode,
  sources: readonly ConnectedMediaContext[],
  primaryReferenceNodeId?: string,
) {
  if (mode === 'text-to-video') return []
  const selectedSources = mode === 'image-to-video'
    ? sources.filter((source) => source.nodeId === primaryReferenceNodeId)
    : [...sources]
  return selectedSources.map((source, index): VideoReferenceBinding => ({
    node_id: source.nodeId,
    asset_id: source.assetId!,
    role: mode === 'image-to-video'
      ? 'first-frame'
      : index === 0
        ? 'first-frame'
        : index === selectedSources.length - 1 ? 'last-frame' : 'reference',
    order: index,
  }))
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
  if (mediaType === 'image' && base.imageIds.length > 8) {
    return failedContext(base, mediaType, capabilities, '图片生成最多允许 8 张有效参考图，当前请求已阻止。')
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
    const outputCount = capabilities.contract_version === 6
      ? isRecord(image) && image.output_count !== undefined
        ? Number(image.output_count)
        : capabilities.image.default_output_count
      : 1
    if (!capabilities.image.output_counts.includes(outputCount)) {
      return failedContext(base, mediaType, capabilities, '节点保存的图片输出数量不受当前 capability 支持，请重新选择。')
    }
    let imageBatch: ImageBatchSnapshot | undefined
    try {
      imageBatch = parseImageBatch(isRecord(image) ? image.batch : undefined, outputCount)
    } catch (error) {
      return failedContext(base, mediaType, capabilities, (error as Error).message)
    }
    let imageOperation: ImageOperationContract | undefined
    if (isRecord(image) && image.operation !== undefined) {
      const operationCapabilities = capabilities.image.operations
      if (!operationCapabilities) {
        return failedContext(base, mediaType, capabilities, '当前 capability 不支持图片操作，请重新创建分支。')
      }
      try {
        imageOperation = parseImageOperationContract(image.operation, operationCapabilities)
      } catch {
        return failedContext(base, mediaType, capabilities, '节点保存的图片操作参数无效，请重新创建分支。')
      }
      const definition = IMAGE_OPERATIONS[imageOperation.id]
      if (
        definition.execution === 'provider' &&
        !operationCapabilities.provider_operations.includes(imageOperation.id as ProviderImageOperationId)
      ) {
        return failedContext(base, mediaType, capabilities, '当前 capability 不支持此图片操作，当前请求已阻止。')
      }
      const maximumSources = imageOperation.id === 'fusion'
        ? Math.min(definition.sourceCount[1], operationCapabilities.max_fusion_images)
        : definition.sourceCount[1]
      if (
        base.imageIds.length < definition.sourceCount[0] ||
        base.imageIds.length > maximumSources ||
        new Set(base.imageIds).size !== base.imageIds.length
      ) {
        return failedContext(base, mediaType, capabilities, '图片操作的有效参考图与分支 contract 不一致，当前请求已阻止。')
      }
    }
    let shotControls: ShotControls | undefined
    if (isRecord(image) && image.shot_controls !== undefined) {
      if (imageOperation || !capabilities.image.shotControls) {
        return failedContext(base, mediaType, capabilities, '节点保存的镜头控制不受当前 capability 支持，请重新选择。')
      }
      try {
        shotControls = parseShotControls(
          image.shot_controls, capabilities.image.shotControls, 'image', null, base.imageIds,
        )
      } catch (error) {
        return failedContext(base, mediaType, capabilities, (error as Error).message)
      }
    }
    const parameters: GenerationNodeParameters = {
      schema_version: 1,
      image: {
        aspect_ratio: aspectRatio,
        ...(capabilities.contract_version === 6 ? { output_count: outputCount } : {}),
        ...(imageBatch ? { batch: imageBatch } : {}),
        ...(imageOperation ? { operation: imageOperation } : {}),
        ...(shotControls ? { shot_controls: shotControls } : {}),
      },
    }
    return {
      ...base,
      capabilities,
      mediaType,
      isRecipe: false,
      parameterError: '',
      parameters,
      aspectRatio,
      outputCount,
      imageBatch,
      imageOperation,
      shotControls,
      shotControlCapabilities: capabilities.image.shotControls ?? undefined,
      parameterSummary: [
        ...(imageOperation ? [`操作 ${IMAGE_OPERATIONS[imageOperation.id].title}`] : []),
        ...formatShotControls(shotControls),
        `比例 ${aspectRatio}`,
        ...(capabilities.contract_version === 6 ? [`输出 ${outputCount} 张`] : []),
        `规格 ${capabilities.image.size}`,
      ],
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
  let videoReferences: VideoReferenceBinding[] | undefined
  const hasStructuredReferences = capabilities.contract_version === 6 && isRecord(video) && video.reference_bindings !== undefined
  if (hasStructuredReferences) {
    try {
      videoReferences = parseVideoReferenceBindings(
        video.reference_bindings,
        validSources,
        capabilities.video,
      )
    } catch (error) {
      return failedContext(base, mediaType, capabilities, (error as Error).message)
    }
    referenceMode = videoReferences.length === 0
      ? 'text-to-video'
      : videoReferences.length === 1 && videoReferences[0]?.role === 'first-frame'
        ? 'image-to-video'
        : 'keyframes'
  } else if (saved === null) {
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
  if (videoReferences) {
    selectedNodeIds = new Set(videoReferences.map((binding) => binding.node_id))
  } else if (referenceMode === 'image-to-video') {
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
  if (capabilities.contract_version === 6 && !videoReferences) {
    videoReferences = legacyVideoBindings(referenceMode, validSources, primaryReferenceNodeId)
  }
  const mediaSelection = applyMediaSelection(base, selectedNodeIds)
  const selected = videoReferences
    ? { ...mediaSelection, imageIds: videoReferences.map((binding) => binding.asset_id) }
    : mediaSelection
  let shotControls: ShotControls | undefined
  if (isRecord(video) && video.shot_controls !== undefined) {
    if (!capabilities.video.shotControls) {
      return failedContext(base, mediaType, capabilities, '节点保存的镜头控制不受当前 capability 支持，请重新选择。')
    }
    try {
      shotControls = parseShotControls(
        video.shot_controls, capabilities.video.shotControls, 'video', referenceMode, selected.imageIds,
      )
    } catch (error) {
      return failedContext(base, mediaType, capabilities, (error as Error).message)
    }
  }
  const framePreset = capabilities.video.duration_presets.find((preset) => (
    preset.duration_seconds === durationSeconds
  ))!
  const parameters: GenerationNodeParameters = {
    schema_version: 1,
    video: {
      duration_seconds: durationSeconds,
      ...(capabilities.contract_version === 6
        ? { reference_bindings: videoReferences ?? [] }
        : {
            reference_mode: referenceMode,
            ...(primaryReferenceNodeId ? { primary_reference_node_id: primaryReferenceNodeId } : {}),
          }),
      ...(shotControls ? { shot_controls: shotControls } : {}),
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
    ...(capabilities.contract_version === 6 ? { videoReferences: videoReferences ?? [] } : {}),
    shotControls,
    shotControlCapabilities: capabilities.video.shotControls ?? undefined,
    parameterSummary: [
      `模式 ${referenceMode}`,
      ...(capabilities.contract_version === 6
        ? [`已用 ${(videoReferences ?? []).length}/${capabilities.video.max_references}`]
        : []),
      `时长 ${durationSeconds}s`,
      `${framePreset.num_frames} 帧 @ ${framePreset.frame_rate}fps`,
      `${capabilities.video.width}×${capabilities.video.height}`,
      ...formatShotControls(shotControls),
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
