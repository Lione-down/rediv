export const SHOT_SCHEMA_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3'] as const

export type ShotSchemaAspectRatio = typeof SHOT_SCHEMA_ASPECT_RATIOS[number]

export interface ShotSchemaShot {
  shot_id: string
  index: number
  title: string
  narrative: string
  image_prompt: string
}

export interface ShotSchemaDocument {
  contract_version: 1
  schema_id: 'revid.shot-sequence'
  provider: 'mock'
  model: 'revid-shot-mock-v1'
  project_id: string
  canvas_id: string
  source_script_node_id: string
  aspect_ratio: ShotSchemaAspectRatio
  shot_count: number
  shots: ShotSchemaShot[]
}

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

  const shots = value.shots.map((candidate, offset): ShotSchemaShot => {
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
