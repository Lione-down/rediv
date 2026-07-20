import {
  parseCinematicReferenceTransfer,
  type CinematicReferenceRole,
  type CinematicTransferExclusion,
} from './cinematic-director'

export interface PersistedCinematicMention {
  node_id: string
  role: string
  instruction: string
  source_revision: string
}

export interface PersistedCinematicDirectorMention extends PersistedCinematicMention {
  role: CinematicReferenceRole
  must_not_transfer: CinematicTransferExclusion[]
}

export interface CinematicSkillNodeSettingsV1 {
  contract_version: 1
  enabled: boolean
  skill_id: 'revid.cinema-image' | 'revid.cinema-video'
  skill_version: 1
  provider_id: string
  model_id: string
  mentions: PersistedCinematicMention[]
}

export interface CinematicSkillNodeSettingsV2 {
  contract_version: 1
  enabled: boolean
  skill_id: 'revid.cinema-image' | 'revid.cinema-video'
  skill_version: 2
  provider_id: string
  model_id: string
  mentions: PersistedCinematicDirectorMention[]
}

export type CinematicSkillNodeSettings = CinematicSkillNodeSettingsV1 | CinematicSkillNodeSettingsV2

function contractError() { return new Error('cinematic Skill mention contract 无效。') }
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
function exact(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}
function text(value: unknown, maximum: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maximum
    ? value.trim()
    : null
}

export function parseCinematicSkillNodeSettings(
  value: unknown,
  mediaType: 'image' | 'video',
): CinematicSkillNodeSettings {
  if (!record(value) || !exact(value, [
    'contract_version', 'enabled', 'mentions', 'model_id', 'provider_id', 'skill_id', 'skill_version',
  ]) || value.contract_version !== 1 || typeof value.enabled !== 'boolean' ||
    (value.skill_version !== 1 && value.skill_version !== 2) || !text(value.provider_id, 64) ||
    !text(value.model_id, 96) || !Array.isArray(value.mentions) || value.mentions.length > 25
  ) throw contractError()
  const expectedSkill = mediaType === 'image' ? 'revid.cinema-image' : 'revid.cinema-video'
  if (value.skill_id !== expectedSkill) throw contractError()
  const skillVersion = value.skill_version
  const ids = new Set<string>()
  const mentions = value.mentions.map((rawMention) => {
    const keys = skillVersion === 1
      ? ['instruction', 'node_id', 'role', 'source_revision']
      : ['instruction', 'must_not_transfer', 'node_id', 'role', 'source_revision']
    if (!record(rawMention) || !exact(rawMention, keys)) throw contractError()
    const nodeId = text(rawMention.node_id, 96)
    const role = text(rawMention.role, 32)
    const instruction = text(rawMention.instruction, 500)
    const revision = text(rawMention.source_revision, 64)
    if (!nodeId || ids.has(nodeId) || !role || !instruction || !revision || !/^[a-f0-9]{64}$/i.test(revision)) {
      throw contractError()
    }
    ids.add(nodeId)
    const base = { node_id: nodeId, role, instruction, source_revision: revision.toLowerCase() }
    if (skillVersion === 1) return base
    try {
      const parsed = parseCinematicReferenceTransfer({
        contract_version: 1, ...base, must_not_transfer: rawMention.must_not_transfer,
      })
      const { contract_version: _version, ...transfer } = parsed
      return transfer
    } catch {
      throw contractError()
    }
  })
  return {
    contract_version: 1,
    enabled: value.enabled,
    skill_id: expectedSkill,
    skill_version: skillVersion,
    provider_id: value.provider_id as string,
    model_id: value.model_id as string,
    mentions,
  } as CinematicSkillNodeSettings
}

export function recommendedCinematicSkillNodeSettings(
  mediaType: 'image' | 'video',
  providerId: string,
  modelId: string,
): CinematicSkillNodeSettingsV2 {
  const provider = text(providerId, 64)
  const model = text(modelId, 96)
  if (!provider || !model) throw new Error('cinematic Skill capability contract 无效。')
  return {
    contract_version: 1,
    enabled: false,
    skill_id: mediaType === 'image' ? 'revid.cinema-image' : 'revid.cinema-video',
    skill_version: 2,
    provider_id: provider,
    model_id: model,
    mentions: [],
  }
}
