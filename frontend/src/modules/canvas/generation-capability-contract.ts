import {
  parseImageOperationCapabilities,
  type ImageOperationCapabilities,
  type ImageOperationContract,
} from './image-operations'
import {
  parseShotControlCapabilities,
  type ShotControlCapabilities,
  type ShotControls,
} from './shot-controls'
import {
  parseAudioGenerationCapabilities,
  type AudioGenerationCapabilities,
} from './audio-generation'
import {
  parseScriptAuthoringCapabilities,
  type ScriptAuthoringCapabilities,
} from './script-authoring'

export type VideoReferenceMode = 'text-to-video' | 'image-to-video' | 'keyframes'
export type VideoReferenceRole = 'first-frame' | 'last-frame' | 'reference'
export type VideoResolution = '480p' | '720p' | '1080p'

export interface VideoReferenceBinding {
  node_id: string
  asset_id: string
  role: VideoReferenceRole
  order: number
}

export interface ImageBatchSnapshot {
  batch_id: string
  slot_index: number
  slot_count: number
}

type VideoGenerationParameters = {
  aspect_ratio: string
  duration_seconds: number
  resolution?: VideoResolution
  negative_prompt?: string
  shot_controls?: ShotControls
  reference_mode?: VideoReferenceMode
  primary_reference_node_id?: string
  reference_bindings?: VideoReferenceBinding[]
}

export interface GenerationCapabilities {
  contract_version: 1 | 2 | 3 | 4 | 5 | 6 | 7
  text: ScriptAuthoringCapabilities | null
  image: {
    model: string
    size: string
    sizes: string[]
    default_size: string
    size_dimensions: Record<string, Record<string, { width: number; height: number }>>
    aspect_ratios: string[]
    default_aspect_ratio: string
    output_counts: number[]
    default_output_count: number
    operations: ImageOperationCapabilities | null
    shotControls: ShotControlCapabilities | null
  }
  video: {
    model: string
    width: number
    height: number
    aspect_ratios: string[]
    aspect_ratio_dimensions: Record<string, { width: number; height: number }>
    default_aspect_ratio: string
    resolutions: VideoResolution[]
    default_resolution: VideoResolution
    resolution_dimensions: Record<VideoResolution, Record<string, { width: number; height: number }>>
    reference_modes: VideoReferenceMode[]
    default_duration_seconds: number
    min_keyframes: number
    max_keyframes: number
    reference_roles: VideoReferenceRole[]
    max_references: number
    negative_prompt_max_length: number
    supports_semantic_multi_reference: boolean
    duration_presets: Array<{
      duration_seconds: number
      num_frames: number
      frame_rate: number
    }>
    shotControls: ShotControlCapabilities | null
  }
  audio: AudioGenerationCapabilities | null
}

export type GenerationNodeParameters =
  | {
      schema_version: 1
      image: { size?: string; aspect_ratio: string; output_count?: number; batch?: ImageBatchSnapshot; operation?: ImageOperationContract; shot_controls?: ShotControls }
    }
  | {
      schema_version: 1
      video: VideoGenerationParameters
    }

const VIDEO_REFERENCE_MODES = new Set<VideoReferenceMode>(['text-to-video', 'image-to-video', 'keyframes'])
const VIDEO_REFERENCE_ROLES = new Set<VideoReferenceRole>(['first-frame', 'last-frame', 'reference'])
const VIDEO_RESOLUTIONS = new Set<VideoResolution>(['480p', '720p', '1080p'])

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
  if (!isRecord(value) || ![1, 2, 3, 4, 5, 6, 7].includes(Number(value.contract_version)) || !isRecord(value.image) || !isRecord(value.video)) {
    throw new Error('生成参数 capability contract 无效。')
  }
  const image = value.image
  const video = value.video
  const ratios = image.aspect_ratios
  const modes = video.reference_modes
  const presets = video.duration_presets
  const videoRatios = Array.isArray(video.aspect_ratios)
    ? video.aspect_ratios
    : [`${video.width}:${video.height}`]
  const defaultVideoRatio = isNonEmptyString(video.default_aspect_ratio)
    ? video.default_aspect_ratio
    : videoRatios[0]
  const isStructuredContract = Number(value.contract_version) >= 6
  const isOfficialAgnesContract = value.contract_version === 7
  const outputCounts = isStructuredContract ? image.output_counts : [1]
  const referenceRoles = isStructuredContract ? video.reference_roles : ['first-frame', 'last-frame', 'reference']
  const maxReferences = isStructuredContract ? video.max_references : video.max_keyframes
  const videoDimensions = isStructuredContract ? video.aspect_ratio_dimensions : null
  const resolutions = Array.isArray(video.resolutions) ? video.resolutions : ['720p']
  const defaultResolution = isNonEmptyString(video.default_resolution)
    ? video.default_resolution
    : resolutions[0]
  const resolutionDimensions = isRecord(video.resolution_dimensions)
    ? video.resolution_dimensions
    : {
        '720p': Object.fromEntries(videoRatios.map((ratio) => [
          ratio,
          isRecord(videoDimensions) && isRecord(videoDimensions[ratio])
            ? videoDimensions[ratio]
          : { width: video.width, height: video.height },
        ])),
      }
  const resolutionDimensionRecord = resolutionDimensions as Record<string, unknown>
  const imageSizes = isOfficialAgnesContract ? image.sizes : [image.size]
  const defaultImageSize = isOfficialAgnesContract ? image.default_size : image.size
  const imageDimensions = isOfficialAgnesContract ? image.size_dimensions : null
  let operations: ImageOperationCapabilities | null = null
  let imageShotControls: ShotControlCapabilities | null = null
  let videoShotControls: ShotControlCapabilities | null = null
  let audio: AudioGenerationCapabilities | null = null
  let text: ScriptAuthoringCapabilities | null = null
  if (
    !isNonEmptyString(image.model) || !isNonEmptyString(image.size) ||
    !Array.isArray(ratios) || !ratios.length || ratios.some((item) => !isNonEmptyString(item)) ||
    new Set(ratios).size !== ratios.length || !isNonEmptyString(image.default_aspect_ratio) ||
    !ratios.includes(image.default_aspect_ratio) ||
    !Array.isArray(imageSizes) || !imageSizes.length || imageSizes.some((item) => !isNonEmptyString(item)) ||
    new Set(imageSizes).size !== imageSizes.length || !isNonEmptyString(defaultImageSize) ||
    !imageSizes.includes(defaultImageSize) ||
    (isOfficialAgnesContract && (
      !isRecord(imageDimensions) ||
      Object.keys(imageDimensions).length !== imageSizes.length ||
      imageSizes.some((size) => {
        const dimensionsByRatio = imageDimensions[size]
        return !isRecord(dimensionsByRatio) ||
          Object.keys(dimensionsByRatio).length !== ratios.length ||
          ratios.some((ratio) => {
            const dimensions = dimensionsByRatio[ratio]
            return !isRecord(dimensions) ||
              !isPositiveInteger(dimensions.width) ||
              !isPositiveInteger(dimensions.height)
          })
      })
    )) ||
    !Array.isArray(outputCounts) || !outputCounts.length || outputCounts.some((item) => !isPositiveInteger(item)) ||
    new Set(outputCounts).size !== outputCounts.length || !outputCounts.includes(isStructuredContract ? image.default_output_count : 1) ||
    !isNonEmptyString(video.model) || !isPositiveInteger(video.width) || !isPositiveInteger(video.height) ||
    !videoRatios.length || videoRatios.some((item) => !isNonEmptyString(item)) ||
    new Set(videoRatios).size !== videoRatios.length ||
    (isStructuredContract && (
      !isRecord(videoDimensions) ||
      Object.keys(videoDimensions).length !== videoRatios.length ||
      videoRatios.some((ratio) => {
        const dimensions = videoDimensions[ratio]
        return !isRecord(dimensions) ||
          !isPositiveInteger(dimensions.width) ||
          !isPositiveInteger(dimensions.height)
      })
    )) ||
    !isNonEmptyString(defaultVideoRatio) || !videoRatios.includes(defaultVideoRatio) ||
    !Array.isArray(resolutions) || !resolutions.length ||
    resolutions.some((item) => typeof item !== 'string' || !VIDEO_RESOLUTIONS.has(item as VideoResolution)) ||
    new Set(resolutions).size !== resolutions.length ||
    !isNonEmptyString(defaultResolution) || !resolutions.includes(defaultResolution) ||
    !isRecord(resolutionDimensions) ||
    Object.keys(resolutionDimensions).length !== resolutions.length ||
    resolutions.some((resolution) => {
      if (typeof resolution !== 'string') return true
      const dimensionsByRatio = resolutionDimensionRecord[resolution]
      return !isRecord(dimensionsByRatio) ||
        Object.keys(dimensionsByRatio).length !== videoRatios.length ||
        videoRatios.some((ratio) => {
          const dimensions = dimensionsByRatio[ratio]
          return !isRecord(dimensions) ||
            !isPositiveInteger(dimensions.width) ||
            !isPositiveInteger(dimensions.height)
        })
    }) ||
    !Array.isArray(modes) || modes.length !== VIDEO_REFERENCE_MODES.size ||
    modes.some((item) => typeof item !== 'string' || !VIDEO_REFERENCE_MODES.has(item as VideoReferenceMode)) ||
    new Set(modes).size !== modes.length || !isPositiveInteger(video.default_duration_seconds) ||
    !isPositiveInteger(video.min_keyframes) || !isPositiveInteger(video.max_keyframes) ||
    video.min_keyframes > video.max_keyframes || !Array.isArray(presets) || !presets.length ||
    !Array.isArray(referenceRoles) || referenceRoles.length !== VIDEO_REFERENCE_ROLES.size ||
    referenceRoles.some((item) => typeof item !== 'string' || !VIDEO_REFERENCE_ROLES.has(item as VideoReferenceRole)) ||
    new Set(referenceRoles).size !== referenceRoles.length || !isPositiveInteger(maxReferences) ||
    (isOfficialAgnesContract && (
      !isPositiveInteger(video.negative_prompt_max_length) ||
      video.supports_semantic_multi_reference !== false
    ))
  ) throw new Error('生成参数 capability contract 无效。')
  const normalizedResolutions = resolutions as VideoResolution[]
  const normalizedResolutionDimensions = resolutionDimensions as Record<string, Record<string, unknown>>
  try {
    if (value.contract_version === 2) {
      operations = parseImageOperationCapabilities(image.operations)
      if (image.shot_controls !== undefined || video.shot_controls !== undefined) throw new Error('legacy capability cannot declare shot controls')
    } else if ([3, 4, 5, 6, 7].includes(Number(value.contract_version))) {
      operations = parseImageOperationCapabilities(image.operations)
      imageShotControls = parseShotControlCapabilities(image.shot_controls, 'image')
      videoShotControls = parseShotControlCapabilities(video.shot_controls, 'video')
      if ([4, 5, 6, 7].includes(Number(value.contract_version))) audio = parseAudioGenerationCapabilities(value.audio)
      if ([5, 6, 7].includes(Number(value.contract_version))) text = parseScriptAuthoringCapabilities(value.text)
      else if (value.text !== undefined) throw new Error('legacy capability cannot declare script authoring')
    } else if (image.operations !== undefined || image.shot_controls !== undefined || video.shot_controls !== undefined || value.audio !== undefined || value.text !== undefined) {
      throw new Error('legacy capability cannot declare extensions')
    }
  } catch {
    throw new Error('生成参数 capability contract 无效。')
  }

  const normalizedPresets = presets.map((preset) => {
    if (!isRecord(preset) || !isPositiveInteger(preset.duration_seconds) || !isPositiveInteger(preset.num_frames) ||
      !isPositiveInteger(preset.frame_rate) || (preset.num_frames - 1) % 8 !== 0
    ) throw new Error('生成参数 capability contract 无效。')
    return { duration_seconds: preset.duration_seconds, num_frames: preset.num_frames, frame_rate: preset.frame_rate }
  })
  if (new Set(normalizedPresets.map((preset) => preset.duration_seconds)).size !== normalizedPresets.length ||
    !normalizedPresets.some((preset) => preset.duration_seconds === video.default_duration_seconds)
  ) throw new Error('生成参数 capability contract 无效。')

  return {
    contract_version: value.contract_version as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    text,
    image: {
      model: image.model, size: image.size, aspect_ratios: [...ratios], default_aspect_ratio: image.default_aspect_ratio,
      sizes: [...imageSizes] as string[],
      default_size: defaultImageSize,
      size_dimensions: Object.fromEntries(imageSizes.map((size) => [
        size,
        Object.fromEntries(ratios.map((ratio) => {
          const dimensions = isRecord(imageDimensions) &&
            isRecord(imageDimensions[size]) &&
            isRecord(imageDimensions[size][ratio])
            ? imageDimensions[size][ratio]
            : { width: 0, height: 0 }
          return [ratio, { width: Number(dimensions.width), height: Number(dimensions.height) }]
        })),
      ])),
      output_counts: [...outputCounts] as number[],
      default_output_count: isStructuredContract ? image.default_output_count as number : 1,
      operations, shotControls: imageShotControls,
    },
    video: {
      model: video.model, width: video.width, height: video.height,
      aspect_ratios: [...videoRatios], default_aspect_ratio: defaultVideoRatio,
      aspect_ratio_dimensions: Object.fromEntries(videoRatios.map((ratio) => {
        const dimensions = isRecord(videoDimensions) && isRecord(videoDimensions[ratio])
          ? videoDimensions[ratio]
          : { width: video.width, height: video.height }
        return [ratio, { width: Number(dimensions.width), height: Number(dimensions.height) }]
      })),
      resolutions: [...normalizedResolutions],
      default_resolution: defaultResolution as VideoResolution,
      resolution_dimensions: Object.fromEntries(normalizedResolutions.map((resolution) => [
        resolution,
        Object.fromEntries(videoRatios.map((ratio) => {
          const dimensions = isRecord(normalizedResolutionDimensions[resolution]) &&
            isRecord(normalizedResolutionDimensions[resolution][ratio])
            ? normalizedResolutionDimensions[resolution][ratio]
            : { width: video.width, height: video.height }
          return [ratio, { width: Number(dimensions.width), height: Number(dimensions.height) }]
        })),
      ])) as Record<VideoResolution, Record<string, { width: number; height: number }>>,
      reference_modes: [...modes] as VideoReferenceMode[],
      default_duration_seconds: video.default_duration_seconds,
      min_keyframes: video.min_keyframes, max_keyframes: video.max_keyframes,
      reference_roles: [...referenceRoles] as VideoReferenceRole[], max_references: maxReferences as number,
      negative_prompt_max_length: isOfficialAgnesContract
        ? Number(video.negative_prompt_max_length)
        : 0,
      supports_semantic_multi_reference: false,
      duration_presets: normalizedPresets, shotControls: videoShotControls,
    },
    audio,
  }
}
