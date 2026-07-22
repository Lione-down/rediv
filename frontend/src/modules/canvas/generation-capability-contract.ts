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
  duration_seconds: number
  shot_controls?: ShotControls
} & (
  | {
      reference_mode: VideoReferenceMode
      primary_reference_node_id?: string
      reference_bindings?: never
    }
  | {
      reference_bindings: VideoReferenceBinding[]
      reference_mode?: never
      primary_reference_node_id?: never
    }
)

export interface GenerationCapabilities {
  contract_version: 1 | 2 | 3 | 4 | 5 | 6
  text: ScriptAuthoringCapabilities | null
  image: {
    model: string
    size: string
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
    reference_modes: VideoReferenceMode[]
    default_duration_seconds: number
    min_keyframes: number
    max_keyframes: number
    reference_roles: VideoReferenceRole[]
    max_references: number
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
      image: { aspect_ratio: string; output_count?: number; batch?: ImageBatchSnapshot; operation?: ImageOperationContract; shot_controls?: ShotControls }
    }
  | {
      schema_version: 1
      video: VideoGenerationParameters
    }

const VIDEO_REFERENCE_MODES = new Set<VideoReferenceMode>(['text-to-video', 'image-to-video', 'keyframes'])
const VIDEO_REFERENCE_ROLES = new Set<VideoReferenceRole>(['first-frame', 'last-frame', 'reference'])

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
  if (!isRecord(value) || ![1, 2, 3, 4, 5, 6].includes(Number(value.contract_version)) || !isRecord(value.image) || !isRecord(value.video)) {
    throw new Error('生成参数 capability contract 无效。')
  }
  const image = value.image
  const video = value.video
  const ratios = image.aspect_ratios
  const modes = video.reference_modes
  const presets = video.duration_presets
  const outputCounts = value.contract_version === 6 ? image.output_counts : [1]
  const referenceRoles = value.contract_version === 6 ? video.reference_roles : ['first-frame', 'last-frame', 'reference']
  const maxReferences = value.contract_version === 6 ? video.max_references : video.max_keyframes
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
    !Array.isArray(outputCounts) || !outputCounts.length || outputCounts.some((item) => !isPositiveInteger(item)) ||
    new Set(outputCounts).size !== outputCounts.length || !outputCounts.includes(value.contract_version === 6 ? image.default_output_count : 1) ||
    !isNonEmptyString(video.model) || !isPositiveInteger(video.width) || !isPositiveInteger(video.height) ||
    !Array.isArray(modes) || modes.length !== VIDEO_REFERENCE_MODES.size ||
    modes.some((item) => typeof item !== 'string' || !VIDEO_REFERENCE_MODES.has(item as VideoReferenceMode)) ||
    new Set(modes).size !== modes.length || !isPositiveInteger(video.default_duration_seconds) ||
    !isPositiveInteger(video.min_keyframes) || !isPositiveInteger(video.max_keyframes) ||
    video.min_keyframes > video.max_keyframes || !Array.isArray(presets) || !presets.length ||
    !Array.isArray(referenceRoles) || referenceRoles.length !== VIDEO_REFERENCE_ROLES.size ||
    referenceRoles.some((item) => typeof item !== 'string' || !VIDEO_REFERENCE_ROLES.has(item as VideoReferenceRole)) ||
    new Set(referenceRoles).size !== referenceRoles.length || !isPositiveInteger(maxReferences)
  ) throw new Error('生成参数 capability contract 无效。')
  try {
    if (value.contract_version === 2) {
      operations = parseImageOperationCapabilities(image.operations)
      if (image.shot_controls !== undefined || video.shot_controls !== undefined) throw new Error('legacy capability cannot declare shot controls')
    } else if ([3, 4, 5, 6].includes(Number(value.contract_version))) {
      operations = parseImageOperationCapabilities(image.operations)
      imageShotControls = parseShotControlCapabilities(image.shot_controls, 'image')
      videoShotControls = parseShotControlCapabilities(video.shot_controls, 'video')
      if ([4, 5, 6].includes(Number(value.contract_version))) audio = parseAudioGenerationCapabilities(value.audio)
      if (value.contract_version === 5 || value.contract_version === 6) text = parseScriptAuthoringCapabilities(value.text)
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
    contract_version: value.contract_version as 1 | 2 | 3 | 4 | 5 | 6,
    text,
    image: {
      model: image.model, size: image.size, aspect_ratios: [...ratios], default_aspect_ratio: image.default_aspect_ratio,
      output_counts: [...outputCounts] as number[],
      default_output_count: value.contract_version === 6 ? image.default_output_count as number : 1,
      operations, shotControls: imageShotControls,
    },
    video: {
      model: video.model, width: video.width, height: video.height,
      reference_modes: [...modes] as VideoReferenceMode[],
      default_duration_seconds: video.default_duration_seconds,
      min_keyframes: video.min_keyframes, max_keyframes: video.max_keyframes,
      reference_roles: [...referenceRoles] as VideoReferenceRole[], max_references: maxReferences as number,
      duration_presets: normalizedPresets, shotControls: videoShotControls,
    },
    audio,
  }
}
