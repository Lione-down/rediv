import { parseCinematicDirectorBrief, type CinematicDirectorBrief } from './cinematic-director'

export interface CinematicSequenceBeat {
  beat_id: string
  summary: string
  state: 'planned' | 'completed' | 'reserved'
}
export interface CinematicSequenceClip {
  clip_id: string
  scene_id: string
  narrative_job: string
  intention: string
  state: 'planned' | 'generated' | 'accepted' | 'rejected'
  accepted_result_node_id: string | null
  accepted_result_revision: string | null
  observed_end_state: string | null
  completed_beat_ids: string[]
  reserved_beat_ids: string[]
  extension_depth: number
  attempt_count: number
}
export interface CinematicSequenceState {
  contract_version: 1
  schema_id: 'revid.cinematic-sequence'
  sequence_id: string
  source_script_node_id: string
  source_revision: string
  story_objective: string
  final_outcome: string
  director_brief: CinematicDirectorBrief
  ordered_beats: CinematicSequenceBeat[]
  clips: CinematicSequenceClip[]
  canon_revision: number
}

function error() { return new Error('cinematic sequence contract is invalid') }
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
function exact(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}
function text(value: unknown, maximum: number) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) throw error()
  return value.trim()
}
function revision(value: unknown) {
  const normalized = text(value, 64)
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw error()
  return normalized
}
function integer(value: unknown, minimum: number, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || Number(value) < minimum || Number(value) > maximum) throw error()
  return Number(value)
}
function idList(value: unknown, maximum: number) {
  if (!Array.isArray(value) || value.length > maximum) throw error()
  const ids = value.map((item) => text(item, 96))
  if (new Set(ids).size !== ids.length) throw error()
  return ids
}

export function parseCinematicSequenceState(value: unknown): CinematicSequenceState {
  if (!record(value) || !exact(value, [
    'canon_revision', 'clips', 'contract_version', 'director_brief', 'final_outcome', 'ordered_beats',
    'schema_id', 'sequence_id', 'source_revision', 'source_script_node_id', 'story_objective',
  ]) || value.contract_version !== 1 || value.schema_id !== 'revid.cinematic-sequence' ||
    !Array.isArray(value.ordered_beats) || value.ordered_beats.length < 1 || value.ordered_beats.length > 100 ||
    !Array.isArray(value.clips) || value.clips.length < 1 || value.clips.length > 25
  ) throw error()
  const sourceScriptNodeId = text(value.source_script_node_id, 96)
  const sourceRevision = revision(value.source_revision)
  const directorBrief = parseCinematicDirectorBrief(value.director_brief)
  if (directorBrief.source_script_node_id !== sourceScriptNodeId || directorBrief.source_revision !== sourceRevision) throw error()
  const orderedBeats = value.ordered_beats.map((raw): CinematicSequenceBeat => {
    if (!record(raw) || !exact(raw, ['beat_id', 'state', 'summary']) ||
      !['planned', 'completed', 'reserved'].includes(String(raw.state))) throw error()
    return { beat_id: text(raw.beat_id, 96), summary: text(raw.summary, 500), state: raw.state as CinematicSequenceBeat['state'] }
  })
  const beatIds = orderedBeats.map((beat) => beat.beat_id)
  if (new Set(beatIds).size !== beatIds.length) throw error()
  const knownBeats = new Set(beatIds)
  const beatStates = new Map(orderedBeats.map((beat) => [beat.beat_id, beat.state]))
  const clips = value.clips.map((raw): CinematicSequenceClip => {
    if (!record(raw) || !exact(raw, [
      'accepted_result_node_id', 'accepted_result_revision', 'attempt_count', 'clip_id', 'completed_beat_ids',
      'extension_depth', 'intention', 'narrative_job', 'observed_end_state', 'reserved_beat_ids', 'scene_id', 'state',
    ]) || !['planned', 'generated', 'accepted', 'rejected'].includes(String(raw.state))) throw error()
    const state = raw.state as CinematicSequenceClip['state']
    const acceptedResultNodeId = raw.accepted_result_node_id === null ? null : text(raw.accepted_result_node_id, 96)
    const acceptedResultRevision = raw.accepted_result_revision === null ? null : revision(raw.accepted_result_revision)
    const observedEndState = raw.observed_end_state === null ? null : text(raw.observed_end_state, 500)
    const hasCompleteCanon = acceptedResultNodeId !== null && acceptedResultRevision !== null && observedEndState !== null
    const hasAnyCanon = acceptedResultNodeId !== null || acceptedResultRevision !== null || observedEndState !== null
    if ((state === 'accepted' && !hasCompleteCanon) || (state !== 'accepted' && hasAnyCanon)) throw error()
    const completedBeatIds = idList(raw.completed_beat_ids, 100)
    const reservedBeatIds = idList(raw.reserved_beat_ids, 100)
    if (completedBeatIds.some((id) => !knownBeats.has(id)) || reservedBeatIds.some((id) => !knownBeats.has(id)) ||
      completedBeatIds.some((id) => reservedBeatIds.includes(id)) ||
      completedBeatIds.some((id) => beatStates.get(id) !== 'completed') ||
      reservedBeatIds.some((id) => beatStates.get(id) !== 'reserved')) throw error()
    return {
      clip_id: text(raw.clip_id, 96), scene_id: text(raw.scene_id, 96),
      narrative_job: text(raw.narrative_job, 500), intention: text(raw.intention, 500), state,
      accepted_result_node_id: acceptedResultNodeId, accepted_result_revision: acceptedResultRevision,
      observed_end_state: observedEndState, completed_beat_ids: completedBeatIds, reserved_beat_ids: reservedBeatIds,
      extension_depth: integer(raw.extension_depth, 0, 8), attempt_count: integer(raw.attempt_count, 0, 8),
    }
  })
  if (new Set(clips.map((clip) => clip.clip_id)).size !== clips.length) throw error()
  return {
    contract_version: 1, schema_id: 'revid.cinematic-sequence', sequence_id: text(value.sequence_id, 96),
    source_script_node_id: sourceScriptNodeId, source_revision: sourceRevision,
    story_objective: text(value.story_objective, 500), final_outcome: text(value.final_outcome, 500),
    director_brief: directorBrief, ordered_beats: orderedBeats, clips,
    canon_revision: integer(value.canon_revision, 0),
  }
}
