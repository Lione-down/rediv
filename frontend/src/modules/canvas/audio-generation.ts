import { resolveNodeDefinition } from './node-registry'
import type { Asset } from '../../types/asset'
import type { CanvasNode } from '../../types/canvas'

export const AUDIO_GENERATION_CONTRACT_VERSION = 1

export type AudioExecutionMode = 'mock-only' | 'unavailable'
export type AudioGenerationIntent = 'text-to-audio' | 'audio-driven-video'
export type AudioGenerationMode = 'text-to-audio'
export type AudioDrivenVideoMode = 'audio-driven-video'

export interface AudioGenerationCapabilities {
  contract_version: 1
  execution_mode: AudioExecutionMode
  model: string | null
  generation_modes: AudioGenerationMode[]
  provider_generation_modes: AudioGenerationMode[]
  audio_driven_video_modes: AudioDrivenVideoMode[]
  provider_audio_driven_video_modes: AudioDrivenVideoMode[]
  quota: { available: false; quota_type: null; unit_estimate: null }
  task: { available: false; cancel_supported: false; resume_supported: false }
}

export interface AudioGenerationSource {
  role: 'audio' | 'prompt' | 'video'
  node_id: string
  asset_id: string | null
  title: string
  url: string | null
}

export interface AudioGenerationPreflightError {
  code:
    | 'asset_not_owned'
    | 'asset_url_mismatch'
    | 'capability_unavailable'
    | 'duplicate_selection'
    | 'invalid_asset_registry'
    | 'invalid_canvas_scope'
    | 'invalid_source_count'
    | 'invalid_source_type'
    | 'invalid_video_source'
    | 'missing_selection'
    | 'project_scope_mismatch'
  message: string
}

export interface AudioGenerationPreflight {
  capabilities: AudioGenerationCapabilities | null
  canvas_id: string
  contract_version: 1
  errors: AudioGenerationPreflightError[]
  executable: boolean
  execution_mode: AudioExecutionMode
  fingerprint: string
  intent: AudioGenerationIntent
  project_id: string
  provider: { available: false }
  quota: { available: false; quota_type: null; unit_estimate: null }
  sources: AudioGenerationSource[]
  task: { available: false; cancel_supported: false; resume_supported: false }
}

interface AudioGenerationPreflightInput {
  assets: readonly Asset[]
  capabilities: AudioGenerationCapabilities | null
  canvasId: string
  intent: AudioGenerationIntent
  nodes: readonly CanvasNode[]
  projectId: string
  selectedNodeIds: readonly string[]
  userId: string
}

const GENERATION_MODES = new Set<AudioGenerationMode>(['text-to-audio'])
const AUDIO_DRIVEN_VIDEO_MODES = new Set<AudioDrivenVideoMode>(['audio-driven-video'])
const UNAVAILABLE_QUOTA = { available: false, quota_type: null, unit_estimate: null } as const
const UNAVAILABLE_TASK = { available: false, cancel_supported: false, resume_supported: false } as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort()
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index])
}

function isModeList<T extends string>(value: unknown, allowed: ReadonlySet<T>): value is T[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && allowed.has(item as T)) &&
    new Set(value).size === value.length
}

function isUnavailableQuota(value: unknown): value is AudioGenerationCapabilities['quota'] {
  return isRecord(value) && isExactKeys(value, ['available', 'quota_type', 'unit_estimate']) &&
    value.available === false && value.quota_type === null && value.unit_estimate === null
}

function isUnavailableTask(value: unknown): value is AudioGenerationCapabilities['task'] {
  return isRecord(value) && isExactKeys(value, ['available', 'cancel_supported', 'resume_supported']) &&
    value.available === false && value.cancel_supported === false && value.resume_supported === false
}

export function parseAudioGenerationCapabilities(value: unknown): AudioGenerationCapabilities {
  if (!isRecord(value) || !isExactKeys(value, [
    'audio_driven_video_modes', 'contract_version', 'execution_mode', 'generation_modes', 'model',
    'provider_audio_driven_video_modes', 'provider_generation_modes', 'quota', 'task',
  ]) || value.contract_version !== AUDIO_GENERATION_CONTRACT_VERSION ||
    (value.execution_mode !== 'unavailable' && value.execution_mode !== 'mock-only') ||
    !isModeList(value.generation_modes, GENERATION_MODES) ||
    !isModeList(value.provider_generation_modes, GENERATION_MODES) ||
    !isModeList(value.audio_driven_video_modes, AUDIO_DRIVEN_VIDEO_MODES) ||
    !isModeList(value.provider_audio_driven_video_modes, AUDIO_DRIVEN_VIDEO_MODES) ||
    !isUnavailableQuota(value.quota) || !isUnavailableTask(value.task)
  ) throw new Error('音频 generation capability contract 无效。')

  const mode = value.execution_mode as AudioExecutionMode
  const generationModes = [...value.generation_modes] as AudioGenerationMode[]
  const providerGenerationModes = [...value.provider_generation_modes] as AudioGenerationMode[]
  const drivenModes = [...value.audio_driven_video_modes] as AudioDrivenVideoMode[]
  const providerDrivenModes = [...value.provider_audio_driven_video_modes] as AudioDrivenVideoMode[]
  if (mode === 'unavailable' && (
    value.model !== null || generationModes.length || providerGenerationModes.length ||
    drivenModes.length || providerDrivenModes.length
  )) throw new Error('音频 generation capability contract 无效。')
  if (mode === 'mock-only' && (
    value.model !== 'revid-audio-mock-v1' || providerGenerationModes.length || providerDrivenModes.length ||
    (!generationModes.length && !drivenModes.length)
  )) throw new Error('音频 generation capability contract 无效。')
  return {
    contract_version: 1,
    execution_mode: mode,
    model: value.model as string | null,
    generation_modes: generationModes,
    provider_generation_modes: providerGenerationModes,
    audio_driven_video_modes: drivenModes,
    provider_audio_driven_video_modes: providerDrivenModes,
    quota: { ...UNAVAILABLE_QUOTA },
    task: { ...UNAVAILABLE_TASK },
  }
}

function error(code: AudioGenerationPreflightError['code'], message: string): AudioGenerationPreflightError {
  return { code, message }
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function fingerprint(value: unknown) {
  let hash = 2166136261
  for (const character of JSON.stringify(value)) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `audio-preflight-${(hash >>> 0).toString(16)}`
}

function failedPreflight(
  input: AudioGenerationPreflightInput,
  errors: AudioGenerationPreflightError[],
  sources: AudioGenerationSource[] = [],
): AudioGenerationPreflight {
  return {
    capabilities: input.capabilities,
    canvas_id: input.canvasId,
    contract_version: AUDIO_GENERATION_CONTRACT_VERSION,
    errors,
    executable: false,
    execution_mode: input.capabilities?.execution_mode ?? 'unavailable',
    fingerprint: fingerprint({ intent: input.intent, projectId: input.projectId, selectedNodeIds: input.selectedNodeIds, sources }),
    intent: input.intent,
    project_id: input.projectId,
    provider: { available: false },
    quota: { ...UNAVAILABLE_QUOTA },
    sources,
    task: { ...UNAVAILABLE_TASK },
  }
}

function resolvePromptSource(node: CanvasNode): AudioGenerationSource | AudioGenerationPreflightError {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  const prompt = readString(node.content ?? node.contentData?.text)
  if (
    node.type !== 'script' || definition.kind !== 'canonical' || node.contentData?.subtype !== 'script' ||
    node.isLocked || node.parentNodeId || !prompt || prompt.length > 12000
  ) return error('invalid_source_type', '请选择一条可用的脚本作为音频生成提示。')
  return { role: 'prompt', node_id: node.id, asset_id: null, title: node.title || '脚本提示', url: null }
}

function resolveMediaSource(
  node: CanvasNode,
  expectedType: 'audio' | 'video',
  asset: Asset | undefined,
  input: AudioGenerationPreflightInput,
): AudioGenerationSource | AudioGenerationPreflightError {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  const assetId = readString(node.contentData?.asset_id)
  const url = readString(node.contentData?.url)
  if (
    !assetId || !url || node.isLocked || (node.type !== 'asset' && node.type !== 'result') ||
    definition.kind !== 'canonical' || node.contentData?.subtype !== expectedType ||
    node.contentData?.project_id !== input.projectId
  ) return error('invalid_source_type', `请选择当前画布中可用的${expectedType === 'audio' ? '音频' : '视频'}素材。`)
  if (!asset || asset.user_id !== input.userId || asset.project_id !== input.projectId || asset.type !== expectedType || asset.status !== 'active') {
    return error('asset_not_owned', '音频工作流只能使用当前用户拥有的活动项目素材。')
  }
  if (asset.url !== url) return error('asset_url_mismatch', '画布媒体 URL 与项目素材记录不一致。')
  return { role: expectedType, node_id: node.id, asset_id: assetId, title: node.title || `${expectedType}素材`, url }
}

function isPreflightCapabilityAvailable(capabilities: AudioGenerationCapabilities, intent: AudioGenerationIntent) {
  return capabilities.execution_mode === 'mock-only' && (
    intent === 'text-to-audio'
      ? capabilities.generation_modes.includes('text-to-audio')
      : capabilities.audio_driven_video_modes.includes('audio-driven-video')
  )
}

export function preflightAudioGeneration(input: AudioGenerationPreflightInput): AudioGenerationPreflight {
  if (!readString(input.projectId) || !readString(input.canvasId) || !readString(input.userId)) {
    return failedPreflight(input, [error('invalid_canvas_scope', '项目、画布或登录范围无效。')])
  }
  if (!input.selectedNodeIds.length) return failedPreflight(input, [error('missing_selection', '请选择音频工作流来源。')])
  if (new Set(input.selectedNodeIds).size !== input.selectedNodeIds.length) {
    return failedPreflight(input, [error('duplicate_selection', '音频工作流选择包含重复节点。')])
  }
  const nodes = new Map<string, CanvasNode>()
  for (const node of input.nodes) {
    if (!readString(node.id) || nodes.has(node.id)) return failedPreflight(input, [error('invalid_source_type', '当前画布节点集合无效。')])
    nodes.set(node.id, node)
  }
  const assets = new Map<string, Asset>()
  for (const asset of input.assets) {
    if (!readString(asset.id) || assets.has(asset.id)) return failedPreflight(input, [error('invalid_asset_registry', '项目素材集合无效。')])
    assets.set(asset.id, asset)
  }

  let sources: AudioGenerationSource[] = []
  if (input.intent === 'text-to-audio') {
    if (input.selectedNodeIds.length !== 1) return failedPreflight(input, [error('invalid_source_count', '文生音频需要且仅支持一条脚本。')])
    const node = nodes.get(input.selectedNodeIds[0])
    if (!node) return failedPreflight(input, [error('invalid_source_type', '脚本节点不在当前画布中。')])
    const source = resolvePromptSource(node)
    if ('code' in source) return failedPreflight(input, [source])
    sources = [source]
  } else {
    if (input.selectedNodeIds.length !== 2) return failedPreflight(input, [error('invalid_source_count', '音频驱动视频需要一条音频和一条视频素材。')])
    const selected = input.selectedNodeIds.map((id) => nodes.get(id))
    if (selected.some((node) => !node)) return failedPreflight(input, [error('invalid_source_type', '媒体节点不在当前画布中。')])
    const audioNode = selected.find((node) => node?.contentData?.subtype === 'audio')!
    const videoNode = selected.find((node) => node?.contentData?.subtype === 'video')!
    if (!audioNode || !videoNode) return failedPreflight(input, [error('invalid_source_type', '请选择一条音频和一条视频素材。')])
    const audio = resolveMediaSource(audioNode, 'audio', assets.get(readString(audioNode.contentData?.asset_id) ?? ''), input)
    if ('code' in audio) return failedPreflight(input, [audio])
    const video = resolveMediaSource(videoNode, 'video', assets.get(readString(videoNode.contentData?.asset_id) ?? ''), input)
    if ('code' in video) return failedPreflight(input, [video])
    sources = [audio, video]
  }
  if (!input.capabilities || !isPreflightCapabilityAvailable(input.capabilities, input.intent)) {
    return failedPreflight(input, [error('capability_unavailable', '当前 provider、quota 与任务 contract 未配置，音频执行已阻止。')], sources)
  }
  return {
    capabilities: input.capabilities,
    canvas_id: input.canvasId,
    contract_version: AUDIO_GENERATION_CONTRACT_VERSION,
    errors: [],
    executable: true,
    execution_mode: 'mock-only',
    fingerprint: fingerprint({ intent: input.intent, projectId: input.projectId, sources }),
    intent: input.intent,
    project_id: input.projectId,
    provider: { available: false },
    quota: { ...UNAVAILABLE_QUOTA },
    sources,
    task: { ...UNAVAILABLE_TASK },
  }
}
