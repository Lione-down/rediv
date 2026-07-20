import type { CanvasNode } from '../../types/canvas'
import { parseCinematicSequenceState, type CinematicSequenceState } from './cinematic-sequence'
import { createApplyCinematicSequenceCommand, type ApplyCinematicSequenceCommand } from './cinematic-sequence-command'

export interface CinematicTakeReviewInput {
  source: CanvasNode
  sequence: CinematicSequenceState
  clipId: string
  result: CanvasNode
  resultRevision: string
  decision: 'accept' | 'reject'
  observedEndState: string | null
  completedBeatIds: string[]
  reservedBeatIds: string[]
}

export function createCinematicTakeReviewCommand(
  input: CinematicTakeReviewInput,
): ApplyCinematicSequenceCommand | null {
  const sequence = parseCinematicSequenceState(input.sequence)
  const clipIndex = sequence.clips.findIndex((clip) => clip.clip_id === input.clipId)
  const clip = sequence.clips[clipIndex]
  const content = input.result.contentData
  if (!clip || clip.state !== 'generated' || input.result.type !== 'result' || input.result.status !== 'success' ||
    !content || !['image', 'video'].includes(String(content.subtype)) ||
    typeof content.asset_id !== 'string' || typeof content.source_task_id !== 'string' ||
    !/^[a-f0-9]{64}$/.test(input.resultRevision)
  ) return null
  const completed = new Set(input.completedBeatIds)
  const reserved = new Set(input.reservedBeatIds)
  if ([...completed].some((id) => reserved.has(id))) return null
  const next = structuredClone(sequence)
  if (input.decision === 'accept') {
    if (!input.observedEndState?.trim()) return null
    next.ordered_beats = next.ordered_beats.map((beat) => ({
      ...beat,
      state: completed.has(beat.beat_id) ? 'completed' : reserved.has(beat.beat_id) ? 'reserved' : beat.state,
    }))
    next.clips[clipIndex] = {
      ...clip,
      state: 'accepted',
      accepted_result_node_id: input.result.id,
      accepted_result_revision: input.resultRevision,
      observed_end_state: input.observedEndState.trim(),
      completed_beat_ids: [...input.completedBeatIds],
      reserved_beat_ids: [...input.reservedBeatIds],
    }
  } else {
    if (input.observedEndState !== null || input.completedBeatIds.length || input.reservedBeatIds.length) return null
    next.clips[clipIndex] = { ...clip, state: 'rejected' }
  }
  next.canon_revision += 1
  const validated = parseCinematicSequenceState(next)
  const expectedContent = input.source.content ?? input.source.contentData?.text ?? ''
  return createApplyCinematicSequenceCommand(input.source, String(expectedContent), validated)
}
