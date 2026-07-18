export const SHOT_SCHEMA_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3'] as const

export type ShotSchemaAspectRatio = typeof SHOT_SCHEMA_ASPECT_RATIOS[number]

export interface LegacyShotSchemaShot {
  shot_id: string
  index: number
  title: string
  narrative: string
  image_prompt: string
}

export interface LegacyShotSchemaDocument {
  contract_version: 1
  schema_id: 'revid.shot-sequence'
  provider: 'mock'
  model: 'revid-shot-mock-v1'
  project_id: string
  canvas_id: string
  source_script_node_id: string
  aspect_ratio: ShotSchemaAspectRatio
  shot_count: number
  shots: LegacyShotSchemaShot[]
}

export interface CinematicShotSchemaShot {
  shot_id: string
  index: number
  title: string
  narrative: string
  dialogue: string | null
  characters: string[]
  wardrobe: string | null
  scene: string
  action: string
  framing_camera: string
  duration_seconds: number
  image_prompt: string
  video_prompt: string
  generatable: boolean
  generatability_reason: string | null
}

export interface CinematicShotSchemaDocument {
  contract_version: 2
  schema_id: 'revid.shot-sequence'
  skill_id: 'revid.cinema-script'
  skill_version: 1
  source_script_node_id: string
  source_revision: string
  aspect_ratio: ShotSchemaAspectRatio
  shot_count: number
  story_structure: string
  character_consistency: string
  shots: CinematicShotSchemaShot[]
}

export type ShotSchemaDocument = LegacyShotSchemaDocument | CinematicShotSchemaDocument

const DOCUMENT_KEYS = [
  'contract_version',
  'schema_id',
  'provider',
  'model',
  'project_id',
  'canvas_id',
  'source_script_node_id',
  'aspect_ratio',
  'shot_count',
  'shots',
] as const
const SHOT_KEYS = ['shot_id', 'index', 'title', 'narrative', 'image_prompt'] as const
const CINEMATIC_DOCUMENT_KEYS = [
  'aspect_ratio', 'character_consistency', 'contract_version', 'schema_id', 'shot_count', 'shots',
  'skill_id', 'skill_version', 'source_revision', 'source_script_node_id', 'story_structure',
] as const
const CINEMATIC_SHOT_KEYS = [
  'action', 'characters', 'dialogue', 'duration_seconds', 'framing_camera', 'generatability_reason',
  'generatable', 'image_prompt', 'index', 'narrative', 'scene', 'shot_id', 'title', 'video_prompt', 'wardrobe',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const keys = Object.keys(value)
  return keys.length === expected.length && expected.every((key) => keys.includes(key))
}

function boundedString(value: unknown, maximum: number) {
  return typeof value === 'string' && value.length >= 1 && value.length <= maximum && value === value.trim()
}

function invalid(): never {
  throw new Error('Shot schema response is invalid')
}

export function parseShotSchemaDocument(value: unknown): ShotSchemaDocument {
  if (isRecord(value) && value.contract_version === 2) return parseCinematicShotSchemaDocument(value)
  if (
    !isRecord(value) || !hasExactKeys(value, DOCUMENT_KEYS) ||
    value.contract_version !== 1 || value.schema_id !== 'revid.shot-sequence' ||
    value.provider !== 'mock' || value.model !== 'revid-shot-mock-v1' ||
    !boundedString(value.project_id, 36) || !boundedString(value.canvas_id, 36) ||
    !boundedString(value.source_script_node_id, 36) ||
    !SHOT_SCHEMA_ASPECT_RATIOS.includes(value.aspect_ratio as ShotSchemaAspectRatio) ||
    !Number.isSafeInteger(value.shot_count) || Number(value.shot_count) < 2 || Number(value.shot_count) > 25 ||
    !Array.isArray(value.shots) || value.shots.length !== value.shot_count
  ) invalid()

  const shots = value.shots.map((candidate, offset): LegacyShotSchemaShot => {
    const index = offset + 1
    if (
      !isRecord(candidate) || !hasExactKeys(candidate, SHOT_KEYS) ||
      candidate.index !== index || candidate.shot_id !== `shot-${String(index).padStart(2, '0')}` ||
      !boundedString(candidate.title, 80) || !boundedString(candidate.narrative, 500) ||
      !boundedString(candidate.image_prompt, 1000)
    ) invalid()
    return {
      shot_id: candidate.shot_id as string,
      index,
      title: candidate.title as string,
      narrative: candidate.narrative as string,
      image_prompt: candidate.image_prompt as string,
    }
  })

  return {
    contract_version: 1,
    schema_id: 'revid.shot-sequence',
    provider: 'mock',
    model: 'revid-shot-mock-v1',
    project_id: value.project_id as string,
    canvas_id: value.canvas_id as string,
    source_script_node_id: value.source_script_node_id as string,
    aspect_ratio: value.aspect_ratio as ShotSchemaAspectRatio,
    shot_count: value.shot_count as number,
    shots,
  }
}

function parseCinematicShotSchemaDocument(value: Record<string, unknown>): CinematicShotSchemaDocument {
  if (!hasExactKeys(value, CINEMATIC_DOCUMENT_KEYS) || value.schema_id !== 'revid.shot-sequence' ||
    value.skill_id !== 'revid.cinema-script' || value.skill_version !== 1 ||
    !boundedString(value.source_script_node_id, 36) ||
    typeof value.source_revision !== 'string' || !/^[a-f0-9]{64}$/.test(value.source_revision) ||
    !SHOT_SCHEMA_ASPECT_RATIOS.includes(value.aspect_ratio as ShotSchemaAspectRatio) ||
    !Number.isSafeInteger(value.shot_count) || Number(value.shot_count) < 2 || Number(value.shot_count) > 25 ||
    !boundedString(value.story_structure, 500) || !boundedString(value.character_consistency, 500) ||
    !Array.isArray(value.shots) || value.shots.length !== value.shot_count
  ) invalid()
  const shots = value.shots.map((candidate, offset): CinematicShotSchemaShot => {
    const index = offset + 1
    if (!isRecord(candidate) || !hasExactKeys(candidate, CINEMATIC_SHOT_KEYS) ||
      candidate.index !== index || candidate.shot_id !== `shot-${String(index).padStart(2, '0')}` ||
      !boundedString(candidate.title, 80) || !boundedString(candidate.narrative, 500) ||
      (candidate.dialogue !== null && !boundedString(candidate.dialogue, 500)) ||
      !Array.isArray(candidate.characters) || candidate.characters.length > 12 ||
      candidate.characters.some((item) => !boundedString(item, 80)) ||
      (candidate.wardrobe !== null && !boundedString(candidate.wardrobe, 500)) ||
      !boundedString(candidate.scene, 500) || !boundedString(candidate.action, 500) ||
      !boundedString(candidate.framing_camera, 500) ||
      !Number.isSafeInteger(candidate.duration_seconds) || Number(candidate.duration_seconds) < 1 || Number(candidate.duration_seconds) > 30 ||
      !boundedString(candidate.image_prompt, 1200) || !boundedString(candidate.video_prompt, 1200) ||
      typeof candidate.generatable !== 'boolean' ||
      (candidate.generatability_reason !== null && !boundedString(candidate.generatability_reason, 300)) ||
      (candidate.generatable ? candidate.generatability_reason !== null : candidate.generatability_reason === null)
    ) invalid()
    return candidate as unknown as CinematicShotSchemaShot
  })
  return { ...value, shots } as unknown as CinematicShotSchemaDocument
}
