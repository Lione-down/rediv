import { loadProviderCostAcknowledgement } from './provider-cost-acknowledgement'
import {
  buildCinematicDirectorHandoff,
  requestCinematicDirectorPreflight,
  type CinematicDirectorGenerationHandoff,
} from './cinematic-director-preflight'
import {
  parseCinematicSkillNodeSettings,
  type PersistedCinematicMention,
} from './cinematic-skill-settings'
export {
  parseCinematicSkillNodeSettings,
  recommendedCinematicSkillNodeSettings,
} from './cinematic-skill-settings'
export type {
  CinematicSkillNodeSettings,
  CinematicSkillNodeSettingsV1,
  CinematicSkillNodeSettingsV2,
  PersistedCinematicDirectorMention,
  PersistedCinematicMention,
} from './cinematic-skill-settings'

export type CinematicMediaType = 'text' | 'image' | 'video'

export interface CinematicModelCapability {
  id: string
  media_type: CinematicMediaType
  user_selectable: true
  automatic_routing: false
  accepted_reference_media: CinematicMediaType[]
  accepted_reference_roles: string[]
  max_references: number
  supported_controls: string[]
}

export interface CinematicProviderCapability {
  id: string
  capability_version: 1
  billing_responsibility: 'platform' | 'user'
  requires_acknowledgement: boolean
  models: CinematicModelCapability[]
}

export interface CinematicSkillCapabilities {
  contract_version: 1
  providers: CinematicProviderCapability[]
}

export interface CinematicMention {
  node_id: string
  display_title: string
  role: string
  instruction: string
  source_revision: string
}

export interface CinematicSkillPreflightScope {
  projectId: string
  canvasId: string
  skillId: string
  skillVersion: number
}

export interface CinematicSkillPreflight {
  contract_version: 1
  skill: { id: string; version: 1 }
  project_id: string
  canvas_id: string
  canvas_revision: number
  provider_id: string
  model_id: string
  capability_version: 1
  references: Array<Record<string, unknown>>
  summary: { preserved_attributes: string[]; allowed_changes: string[]; conflicts: string[] }
  canonical_request: Record<string, unknown>
  canonical_request_json: string
  exact_request: string
  request_digest: string
  requires_acknowledgement: boolean
}

export interface CinematicSkillSource {
  node_id: string
  title: string
  node_type: 'script' | 'note' | 'asset' | 'generation' | 'result' | 'group'
  subtype: string
  source_revision: string
}

export interface CinematicSkillSourceIndex {
  canvas_revision: number
  items: CinematicSkillSource[]
}

export interface CinematicSkillPreflightInput {
  projectId: string
  canvasId: string
  canvasRevision: number
  skillId: string
  skillVersion: 1
  providerId: string
  modelId: string
  userInstruction: string
  mentions: CinematicMention[]
  generationParameters: Record<string, unknown>
}

export interface CinematicGenerationHandoff {
  skill_id: string
  skill_version: 1
  canvas_revision: number
  provider_id: string
  model_id: string
  user_instruction: string
  mentions: PersistedCinematicMention[]
  generation_parameters: Record<string, unknown>
  submitted_preflight: CinematicSkillPreflight
}

export interface PreparedCinematicGeneration {
  handoff: CinematicGenerationHandoff | CinematicDirectorGenerationHandoff
  optimizedPrompt: string
  imageIds: string[]
}

export interface CinematicSkillTransport {
  get<T>(path: string): Promise<{ data: T }>
  post<T>(path: string, payload: unknown): Promise<{ data: T }>
  delete?<T>(path: string): Promise<{ data: T }>
}

function contractError(kind: 'capability' | 'mention' | 'preflight') {
  return new Error(`cinematic Skill ${kind} contract 无效。`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

function boundedString(value: unknown, maximum: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maximum
    ? value.trim()
    : null
}


function parseModel(value: unknown): CinematicModelCapability {
  if (!isRecord(value)) throw contractError('capability')
  const baseKeys = ['automatic_routing', 'id', 'media_type', 'user_selectable']
  const fullKeys = [
    ...baseKeys, 'accepted_reference_media', 'accepted_reference_roles', 'max_references', 'supported_controls',
  ]
  if (!hasExactKeys(value, baseKeys) && !hasExactKeys(value, fullKeys)) throw contractError('capability')
  const id = boundedString(value.id, 96)
  if (!id || !['text', 'image', 'video'].includes(String(value.media_type)) ||
    value.user_selectable !== true || value.automatic_routing !== false
  ) throw contractError('capability')
  if (hasExactKeys(value, fullKeys) && (
    !Array.isArray(value.accepted_reference_media) || !Array.isArray(value.accepted_reference_roles) ||
    value.accepted_reference_media.some((item) => !['text', 'image', 'video'].includes(String(item))) ||
    value.accepted_reference_roles.some((item) => !boundedString(item, 32)) ||
    new Set(value.accepted_reference_media).size !== value.accepted_reference_media.length ||
    new Set(value.accepted_reference_roles).size !== value.accepted_reference_roles.length ||
    !Number.isInteger(value.max_references) || Number(value.max_references) < 0 || Number(value.max_references) > 25 ||
    !Array.isArray(value.supported_controls) || value.supported_controls.some((item) => !boundedString(item, 64)) ||
    new Set(value.supported_controls).size !== value.supported_controls.length
  )) throw contractError('capability')
  return {
    id,
    media_type: value.media_type as CinematicMediaType,
    user_selectable: true,
    automatic_routing: false,
    accepted_reference_media: hasExactKeys(value, fullKeys)
      ? [...value.accepted_reference_media as unknown[]] as CinematicMediaType[]
      : [],
    accepted_reference_roles: hasExactKeys(value, fullKeys)
      ? [...value.accepted_reference_roles as unknown[]] as string[]
      : [],
    max_references: hasExactKeys(value, fullKeys) ? Number(value.max_references) : 0,
    supported_controls: hasExactKeys(value, fullKeys)
      ? [...value.supported_controls as unknown[]] as string[]
      : [],
  }
}

export function parseCinematicSkillCapabilities(value: unknown): CinematicSkillCapabilities {
  if (!isRecord(value) || !hasExactKeys(value, ['contract_version', 'providers']) ||
    value.contract_version !== 1 || !Array.isArray(value.providers) || value.providers.length < 1
  ) throw contractError('capability')
  const providerIds = new Set<string>()
  const providers = value.providers.map((rawProvider) => {
    if (!isRecord(rawProvider) || !hasExactKeys(rawProvider, [
      'billing_responsibility', 'capability_version', 'id', 'models', 'requires_acknowledgement',
    ])) throw contractError('capability')
    const id = boundedString(rawProvider.id, 64)
    if (!id || providerIds.has(id) || rawProvider.capability_version !== 1 ||
      !['platform', 'user'].includes(String(rawProvider.billing_responsibility)) ||
      typeof rawProvider.requires_acknowledgement !== 'boolean' || !Array.isArray(rawProvider.models) ||
      rawProvider.models.length < 1
    ) throw contractError('capability')
    providerIds.add(id)
    const models = rawProvider.models.map(parseModel)
    if (new Set(models.map((model) => model.id)).size !== models.length) throw contractError('capability')
    return {
      id,
      capability_version: 1 as const,
      billing_responsibility: rawProvider.billing_responsibility as 'platform' | 'user',
      requires_acknowledgement: rawProvider.requires_acknowledgement,
      models,
    }
  })
  return { contract_version: 1, providers }
}

export function buildCinematicMention(input: {
  nodeId: string
  title: string
  role: string
  instruction: string
  sourceRevision: string
}): CinematicMention {
  const nodeId = boundedString(input.nodeId, 96)
  const title = boundedString(input.title, 200)
  const role = boundedString(input.role, 32)
  const instruction = boundedString(input.instruction, 500)
  const sourceRevision = boundedString(input.sourceRevision, 64)
  if (!nodeId || !title || !role || !instruction || !sourceRevision ||
    !/^[a-f0-9]{64}$/i.test(sourceRevision)
  ) throw contractError('mention')
  return {
    node_id: nodeId,
    display_title: title,
    role,
    instruction,
    source_revision: sourceRevision.toLowerCase(),
  }
}

export function parseCinematicSkillPreflight(
  value: unknown,
  scope: CinematicSkillPreflightScope,
): CinematicSkillPreflight {
  if (!isRecord(value) || !hasExactKeys(value, [
    'canvas_id', 'canvas_revision', 'canonical_request', 'canonical_request_json', 'capability_version',
    'contract_version', 'exact_request', 'model_id', 'project_id', 'provider_id', 'references',
    'request_digest', 'requires_acknowledgement', 'skill', 'summary',
  ]) || value.contract_version !== 1 || value.capability_version !== 1 ||
    value.project_id !== scope.projectId || value.canvas_id !== scope.canvasId ||
    !Number.isInteger(value.canvas_revision) || Number(value.canvas_revision) < 0 ||
    !isRecord(value.skill) || !hasExactKeys(value.skill, ['id', 'version']) ||
    value.skill.id !== scope.skillId || value.skill.version !== scope.skillVersion || scope.skillVersion !== 1 ||
    !boundedString(value.provider_id, 64) || !boundedString(value.model_id, 96) ||
    !Array.isArray(value.references) || !isRecord(value.summary) ||
    !hasExactKeys(value.summary, ['allowed_changes', 'conflicts', 'preserved_attributes']) ||
    !Array.isArray(value.summary.allowed_changes) || !Array.isArray(value.summary.conflicts) ||
    !Array.isArray(value.summary.preserved_attributes) || !isRecord(value.canonical_request) ||
    typeof value.canonical_request_json !== 'string' || value.exact_request !== value.canonical_request_json ||
    JSON.stringify(value.canonical_request) !== value.canonical_request_json ||
    typeof value.request_digest !== 'string' || !/^[a-f0-9]{64}$/i.test(value.request_digest) ||
    typeof value.requires_acknowledgement !== 'boolean'
  ) throw contractError('preflight')
  return value as unknown as CinematicSkillPreflight
}

function cinematicSkillPath(projectId: string, canvasId: string) {
  const normalizedProjectId = boundedString(projectId, 96)
  const normalizedCanvasId = boundedString(canvasId, 96)
  if (!normalizedProjectId || !normalizedCanvasId) throw contractError('preflight')
  return `/api/projects/${encodeURIComponent(normalizedProjectId)}/canvases/${encodeURIComponent(normalizedCanvasId)}/agent-skills`
}

function parseCinematicSkillSources(value: unknown): CinematicSkillSourceIndex {
  if (!isRecord(value) || !hasExactKeys(value, ['canvas_revision', 'items']) ||
    !Number.isInteger(value.canvas_revision) || Number(value.canvas_revision) < 0 || !Array.isArray(value.items)
  ) throw contractError('mention')
  const ids = new Set<string>()
  const items = value.items.map((rawItem) => {
    if (!isRecord(rawItem) || !hasExactKeys(rawItem, [
      'node_id', 'node_type', 'source_revision', 'subtype', 'title',
    ])) throw contractError('mention')
    const nodeId = boundedString(rawItem.node_id, 96)
    const title = boundedString(rawItem.title, 200)
    const subtype = boundedString(rawItem.subtype, 64)
    const sourceRevision = boundedString(rawItem.source_revision, 64)
    if (!nodeId || ids.has(nodeId) || !title || !subtype || !sourceRevision ||
      !/^[a-f0-9]{64}$/i.test(sourceRevision) ||
      !['script', 'note', 'asset', 'generation', 'result', 'group'].includes(String(rawItem.node_type))
    ) throw contractError('mention')
    ids.add(nodeId)
    return {
      node_id: nodeId,
      title,
      node_type: rawItem.node_type as CinematicSkillSource['node_type'],
      subtype,
      source_revision: sourceRevision.toLowerCase(),
    }
  })
  return { canvas_revision: Number(value.canvas_revision), items }
}

export async function loadCinematicSkillCapabilities(
  projectId: string,
  canvasId: string,
  transport: CinematicSkillTransport,
) {
  const response = await transport.get<unknown>(
    `${cinematicSkillPath(projectId, canvasId)}/cinematic-capabilities`,
  )
  return parseCinematicSkillCapabilities(response.data)
}

export async function loadCinematicSkillSources(
  projectId: string,
  canvasId: string,
  transport: CinematicSkillTransport,
) {
  const response = await transport.get<unknown>(
    `${cinematicSkillPath(projectId, canvasId)}/cinematic-sources`,
  )
  return parseCinematicSkillSources(response.data)
}

export async function requestCinematicSkillPreflight(
  input: CinematicSkillPreflightInput,
  transport: CinematicSkillTransport,
) {
  const userInstruction = boundedString(input.userInstruction, 4_000)
  const providerId = boundedString(input.providerId, 64)
  const modelId = boundedString(input.modelId, 96)
  if (!userInstruction || !providerId || !modelId || input.skillVersion !== 1 ||
    !Number.isInteger(input.canvasRevision) || input.canvasRevision < 0 ||
    !Array.isArray(input.mentions) || input.mentions.length > 25 ||
    !isRecord(input.generationParameters)
  ) throw contractError('preflight')
  const mentionIds = new Set<string>()
  const mentions = input.mentions.map((mention) => {
    const normalized = buildCinematicMention({
      nodeId: mention.node_id,
      title: mention.display_title,
      role: mention.role,
      instruction: mention.instruction,
      sourceRevision: mention.source_revision,
    })
    if (mentionIds.has(normalized.node_id)) throw contractError('mention')
    mentionIds.add(normalized.node_id)
    return {
      node_id: normalized.node_id,
      role: normalized.role,
      instruction: normalized.instruction,
      source_revision: normalized.source_revision,
    }
  })
  const response = await transport.post<unknown>(
    `${cinematicSkillPath(input.projectId, input.canvasId)}/cinematic-preflight`,
    {
      skill_id: input.skillId,
      skill_version: input.skillVersion,
      canvas_revision: input.canvasRevision,
      provider_id: providerId,
      model_id: modelId,
      user_instruction: userInstruction,
      mentions,
      generation_parameters: input.generationParameters,
    },
  )
  return parseCinematicSkillPreflight(response.data, {
    projectId: input.projectId,
    canvasId: input.canvasId,
    skillId: input.skillId,
    skillVersion: input.skillVersion,
  })
}

export async function prepareCinematicGeneration(input: {
  projectId: string
  canvasId: string
  mediaType: 'image' | 'video'
  userInstruction: string
  rawSettings: unknown
  generationParameters: Record<string, unknown>
}, transport: CinematicSkillTransport): Promise<PreparedCinematicGeneration | null> {
  if (input.rawSettings === undefined || input.rawSettings === null) return null
  const settings = parseCinematicSkillNodeSettings(input.rawSettings, input.mediaType)
  if (!settings.enabled) return null
  const [capabilities, sources] = await Promise.all([
    loadCinematicSkillCapabilities(input.projectId, input.canvasId, transport),
    loadCinematicSkillSources(input.projectId, input.canvasId, transport),
  ])
  const provider = capabilities.providers.find((item) => item.id === settings.provider_id)
  const model = provider?.models.find((item) => (
    item.id === settings.model_id && item.media_type === input.mediaType
  ))
  if (!provider || !model) throw new Error('已保存的 cinematic Skill provider/model 当前不可用。')
  if (provider.requires_acknowledgement) {
    const acknowledgement = await loadProviderCostAcknowledgement(provider.id, transport)
    if (!acknowledgement.active) {
      throw new Error('当前 provider 需要计费确认；尚未取得有效确认，生成已阻止。')
    }
  }
  const sourcesById = new Map(sources.items.map((item) => [item.node_id, item]))
  const mentions = settings.mentions.map((mention) => {
    const source = sourcesById.get(mention.node_id)
    if (!source || source.source_revision !== mention.source_revision) {
      throw new Error(`@ 引用 ${mention.node_id} 已变化或不可用，请重新确认。`)
    }
    return buildCinematicMention({
      nodeId: mention.node_id,
      title: source.title,
      role: mention.role,
      instruction: mention.instruction,
      sourceRevision: mention.source_revision,
    })
  })
  if (settings.skill_version === 2) {
    const preflightInput = {
      projectId: input.projectId,
      canvasId: input.canvasId,
      canvasRevision: sources.canvas_revision,
      skillId: settings.skill_id,
      providerId: settings.provider_id,
      modelId: settings.model_id,
      userInstruction: input.userInstruction,
      mentions: settings.mentions.map((mention) => ({
        node_id: mention.node_id,
        role: mention.role,
        instruction: mention.instruction,
        must_not_transfer: mention.must_not_transfer,
        source_revision: mention.source_revision,
      })),
      generationParameters: input.generationParameters,
      workflowMode: 'standalone_clip' as const,
      directorBrief: null,
      sequenceContext: null,
      retakeContext: null,
    }
    const preflight = await requestCinematicDirectorPreflight(preflightInput, transport)
    if (!preflight.ready_for_handoff) {
      const issue = preflight.conflicts[0] ?? preflight.recommendations[0]
      throw new Error(issue?.message ?? 'cinematic director preflight 尚未满足执行条件。')
    }
    const optimizedPrompt = boundedString(preflight.canonical_request.optimized_prompt, 20_000)
    const imageIds = preflight.canonical_request.image_ids
    if (!optimizedPrompt || !Array.isArray(imageIds) || imageIds.some((item) => !boundedString(item, 96))) {
      throw contractError('preflight')
    }
    return {
      handoff: buildCinematicDirectorHandoff(preflightInput, preflight),
      optimizedPrompt,
      imageIds: imageIds as string[],
    }
  }
  const preflight = await requestCinematicSkillPreflight({
    projectId: input.projectId,
    canvasId: input.canvasId,
    canvasRevision: sources.canvas_revision,
    skillId: settings.skill_id,
    skillVersion: 1,
    providerId: settings.provider_id,
    modelId: settings.model_id,
    userInstruction: input.userInstruction,
    mentions,
    generationParameters: input.generationParameters,
  }, transport)
  const optimizedPrompt = boundedString(preflight.canonical_request.optimized_prompt, 20_000)
  const imageIds = preflight.canonical_request.image_ids
  if (!optimizedPrompt || !Array.isArray(imageIds) || imageIds.some((item) => !boundedString(item, 96))) {
    throw contractError('preflight')
  }
  const handoff: CinematicGenerationHandoff = {
    skill_id: settings.skill_id,
    skill_version: 1,
    canvas_revision: sources.canvas_revision,
    provider_id: settings.provider_id,
    model_id: settings.model_id,
    user_instruction: input.userInstruction.trim(),
    mentions: settings.mentions as PersistedCinematicMention[],
    generation_parameters: input.generationParameters,
    submitted_preflight: preflight,
  }
  return {
    handoff,
    optimizedPrompt,
    imageIds: imageIds as string[],
  }
}
