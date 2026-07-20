import type { CanvasNode } from '../../types/canvas'
import { parseCinematicSequenceState, type CinematicSequenceClip, type CinematicSequenceState } from './cinematic-sequence'

export interface ApplyCinematicSequenceCommand {
  type: 'apply-cinematic-sequence'
  nodeId: string
  expectedContent: string
  sequence: CinematicSequenceState
}

export function createApplyCinematicSequenceCommand(
  source: CanvasNode,
  expectedContent: string,
  value: unknown,
): ApplyCinematicSequenceCommand | null {
  const currentContent = source.content ?? source.contentData?.text ?? ''
  if (source.type !== 'script' || source.isLocked || currentContent !== expectedContent) return null
  const sequence = parseCinematicSequenceState(value)
  if (sequence.source_script_node_id !== source.id) return null
  return { type: 'apply-cinematic-sequence', nodeId: source.id, expectedContent, sequence }
}

export function resolveNextUnresolvedCinematicClip(
  sequence: CinematicSequenceState,
): CinematicSequenceClip | null {
  for (const clip of sequence.clips) {
    if (clip.state === 'generated') return null
    if (clip.state === 'planned') return clip
  }
  return null
}

export async function executeApplyCinematicSequenceCommand(
  nodes: readonly CanvasNode[],
  updateNodeState: ((nodeId: string, updates: Partial<Omit<CanvasNode, 'id'>>) => Promise<void>) | undefined,
  command: ApplyCinematicSequenceCommand,
) {
  if (!updateNodeState) throw new Error('Cinematic sequence planning is unavailable')
  const target = nodes.find((node) => node.id === command.nodeId)
  const currentContent = target?.content ?? target?.contentData?.text ?? ''
  if (!target || target.type !== 'script' || target.isLocked || currentContent !== command.expectedContent) return
  const sequence = parseCinematicSequenceState(command.sequence)
  if (sequence.source_script_node_id !== target.id ||
    JSON.stringify(target.contentData?.cinematic_sequence) === JSON.stringify(sequence)) return
  await updateNodeState(target.id, {
    contentData: { ...target.contentData, cinematic_sequence: structuredClone(sequence) },
  })
}
