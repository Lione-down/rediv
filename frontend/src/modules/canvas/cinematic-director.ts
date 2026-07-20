export type CinematicReferenceRole =
  | 'general' | 'context' | 'style' | 'identity' | 'wardrobe' | 'scene' | 'product'
  | 'story' | 'character' | 'source-script' | 'shot' | 'dialogue' | 'action'
  | 'first-frame' | 'last-frame'
export type CinematicTransferExclusion =
  | 'identity' | 'face' | 'wardrobe' | 'product' | 'logo' | 'background'
  | 'scene' | 'camera' | 'lighting' | 'motion' | 'action' | 'audio'

export interface CinematicDirectorBrief {
  contract_version: 1
  schema_id: 'revid.cinematic-director-brief'
  source_script_node_id: string
  source_revision: string
  intention: string
  visible_beat: string
  camera: { shot: string; movement: string; endpoint: string }
  light: { motivated_source: string; transition: string }
  blocking_performance: string
  motion: string
  sound_intent: string
  continuity_anchors: string[]
  must_preserve: string[]
  allowed_changes: string[]
  must_not_transfer: string[]
  safety_notes: string[]
}

export interface CinematicReferenceTransfer {
  contract_version: 1
  node_id: string
  role: CinematicReferenceRole
  instruction: string
  must_not_transfer: CinematicTransferExclusion[]
  source_revision: string
}

export interface CinematicRetakeContext {
  contract_version: 1
  prior_task_id: string
  prior_result_node_id: string
  decision: 'keep' | 'fix_in_post' | 'edit' | 'reroll' | 'rewrite'
  problem_category: 'camera' | 'action' | 'identity' | 'continuity' | 'lighting' | 'composition' | 'audio' | 'other'
  repair_variable: string | null
  attempt_count: number
  revised_instruction: string | null
}

function error() { return new Error('cinematic director contract is invalid') }
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
function exact(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}
function text(value: unknown, maximum: number, allowEmpty = false) {
  if (typeof value !== 'string') throw error()
  const normalized = value.trim()
  if ((!allowEmpty && !normalized) || normalized.length > maximum) throw error()
  return normalized
}
function revision(value: unknown) {
  const normalized = text(value, 64)
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw error()
  return normalized
}
function textList(value: unknown, maximum = 12) {
  if (!Array.isArray(value) || value.length > maximum) throw error()
  return value.map((item) => text(item, 200))
}

export function parseCinematicDirectorBrief(value: unknown): CinematicDirectorBrief {
  if (!record(value) || !exact(value, [
    'allowed_changes', 'blocking_performance', 'camera', 'continuity_anchors', 'contract_version',
    'intention', 'light', 'motion', 'must_not_transfer', 'must_preserve', 'safety_notes', 'schema_id',
    'sound_intent', 'source_revision', 'source_script_node_id', 'visible_beat',
  ]) || value.contract_version !== 1 || value.schema_id !== 'revid.cinematic-director-brief' ||
    !record(value.camera) || !exact(value.camera, ['endpoint', 'movement', 'shot']) ||
    !record(value.light) || !exact(value.light, ['motivated_source', 'transition'])
  ) throw error()
  return {
    contract_version: 1,
    schema_id: 'revid.cinematic-director-brief',
    source_script_node_id: text(value.source_script_node_id, 96),
    source_revision: revision(value.source_revision),
    intention: text(value.intention, 500), visible_beat: text(value.visible_beat, 500),
    camera: {
      shot: text(value.camera.shot, 200, true), movement: text(value.camera.movement, 200, true),
      endpoint: text(value.camera.endpoint, 200, true),
    },
    light: {
      motivated_source: text(value.light.motivated_source, 200, true),
      transition: text(value.light.transition, 200, true),
    },
    blocking_performance: text(value.blocking_performance, 500, true),
    motion: text(value.motion, 500, true), sound_intent: text(value.sound_intent, 500, true),
    continuity_anchors: textList(value.continuity_anchors), must_preserve: textList(value.must_preserve),
    allowed_changes: textList(value.allowed_changes), must_not_transfer: textList(value.must_not_transfer),
    safety_notes: textList(value.safety_notes),
  }
}

const REFERENCE_ROLES = new Set<CinematicReferenceRole>([
  'general', 'context', 'style', 'identity', 'wardrobe', 'scene', 'product', 'story', 'character',
  'source-script', 'shot', 'dialogue', 'action', 'first-frame', 'last-frame',
])
const TRANSFER_EXCLUSIONS = new Set<CinematicTransferExclusion>([
  'identity', 'face', 'wardrobe', 'product', 'logo', 'background', 'scene', 'camera',
  'lighting', 'motion', 'action', 'audio',
])

export function parseCinematicReferenceTransfer(value: unknown): CinematicReferenceTransfer {
  if (!record(value) || !exact(value, [
    'contract_version', 'instruction', 'must_not_transfer', 'node_id', 'role', 'source_revision',
  ]) || value.contract_version !== 1 || typeof value.role !== 'string' ||
    !REFERENCE_ROLES.has(value.role as CinematicReferenceRole) || !Array.isArray(value.must_not_transfer) ||
    value.must_not_transfer.length > 12 || value.must_not_transfer.some((item) => (
      typeof item !== 'string' || !TRANSFER_EXCLUSIONS.has(item as CinematicTransferExclusion)
    )) || new Set(value.must_not_transfer).size !== value.must_not_transfer.length
  ) throw error()
  return {
    contract_version: 1, node_id: text(value.node_id, 96), role: value.role as CinematicReferenceRole,
    instruction: text(value.instruction, 500),
    must_not_transfer: value.must_not_transfer as CinematicTransferExclusion[],
    source_revision: revision(value.source_revision),
  }
}

export function parseCinematicRetakeContext(value: unknown): CinematicRetakeContext {
  if (!record(value) || !exact(value, [
    'attempt_count', 'contract_version', 'decision', 'prior_result_node_id', 'prior_task_id',
    'problem_category', 'repair_variable', 'revised_instruction',
  ]) || value.contract_version !== 1 || !['keep', 'fix_in_post', 'edit', 'reroll', 'rewrite'].includes(String(value.decision)) ||
    !['camera', 'action', 'identity', 'continuity', 'lighting', 'composition', 'audio', 'other'].includes(String(value.problem_category)) ||
    !Number.isInteger(value.attempt_count) || Number(value.attempt_count) < 0 || Number(value.attempt_count) > 8
  ) throw error()
  const repairVariable = value.repair_variable === null ? null : text(value.repair_variable, 200)
  const revisedInstruction = value.revised_instruction === null ? null : text(value.revised_instruction, 500)
  const decision = value.decision as CinematicRetakeContext['decision']
  if ((decision === 'reroll' || decision === 'rewrite') !== (repairVariable !== null)) throw error()
  if ((decision === 'rewrite') !== (revisedInstruction !== null)) throw error()
  return {
    contract_version: 1, prior_task_id: text(value.prior_task_id, 96),
    prior_result_node_id: text(value.prior_result_node_id, 96), decision,
    problem_category: value.problem_category as CinematicRetakeContext['problem_category'],
    repair_variable: repairVariable, attempt_count: Number(value.attempt_count), revised_instruction: revisedInstruction,
  }
}
