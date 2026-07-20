import {
  parseCinematicReferenceTransfer,
  parseCinematicRetakeContext,
  type CinematicReferenceRole,
  type CinematicRetakeContext,
  type CinematicTransferExclusion,
} from './cinematic-director'
import type {
  CinematicMediaType,
  CinematicModelCapability,
  CinematicSkillSource,
} from './cinematic-skills'

export const CINEMATIC_TRANSFER_EXCLUSIONS: ReadonlyArray<{
  id: CinematicTransferExclusion
  label: string
}> = [
  { id: 'identity', label: '身份' }, { id: 'face', label: '脸部' },
  { id: 'wardrobe', label: '服装' }, { id: 'product', label: '产品' },
  { id: 'logo', label: '标志' }, { id: 'background', label: '背景' },
  { id: 'scene', label: '场景' }, { id: 'camera', label: '机位' },
  { id: 'lighting', label: '灯光' }, { id: 'motion', label: '运动' },
  { id: 'action', label: '动作' }, { id: 'audio', label: '声音' },
]

function sourceMedia(source: CinematicSkillSource): CinematicMediaType | 'audio' | 'group' | 'unsupported' {
  if (source.node_type === 'group') return 'group'
  if (source.node_type === 'script' || source.node_type === 'note' || source.node_type === 'generation') {
    return 'text'
  }
  if (['text', 'image', 'video', 'audio'].includes(source.subtype)) {
    return source.subtype as CinematicMediaType | 'audio'
  }
  return 'unsupported'
}

export function resolveCinematicReferenceAvailability(
  model: CinematicModelCapability,
  source: CinematicSkillSource,
  role: string,
) {
  if (!model.accepted_reference_roles.includes(role)) {
    return { isSupported: false, reason: `当前 provider/model 不支持 ${role} 角色。` }
  }
  const media = sourceMedia(source)
  if (media === 'group') return { isSupported: true, reason: '组合成员将在预检时逐项校验。' }
  if (media === 'unsupported' || media === 'audio' || !model.accepted_reference_media.includes(media)) {
    return { isSupported: false, reason: `当前 provider/model 不支持 ${media} 引用。` }
  }
  return { isSupported: true, reason: `可作为 ${role} 引用。` }
}

export function buildCinematicReferenceTransfer(input: {
  source: CinematicSkillSource
  role: CinematicReferenceRole
  instruction: string
  mustNotTransfer: CinematicTransferExclusion[]
}) {
  try {
    const parsed = parseCinematicReferenceTransfer({
      contract_version: 1,
      node_id: input.source.node_id,
      role: input.role,
      instruction: input.instruction,
      must_not_transfer: input.mustNotTransfer,
      source_revision: input.source.source_revision,
    })
    const { contract_version: _version, ...transfer } = parsed
    return transfer
  } catch {
    throw new Error('cinematic director reference transfer is invalid')
  }
}

const TAKE_ACTIONS = ['keep', 'fix_in_post', 'edit', 'reroll', 'rewrite'] as const
export function resolveCinematicTakeActions(mediaType: 'image' | 'video', canEdit: boolean) {
  return TAKE_ACTIONS.map((action) => [
    action,
    action !== 'edit' || (canEdit && mediaType === 'video'),
  ] as const)
}

export interface CinematicRetakeDraftInput {
  decision: CinematicRetakeContext['decision']
  priorTaskId: string
  priorResultNodeId: string
  problemCategory: CinematicRetakeContext['problem_category']
  repairVariable?: string | null
  attemptCount: number
  revisedInstruction?: string | null
}

export function buildCinematicRetakeDraft(input: CinematicRetakeDraftInput) {
  try {
    const context = parseCinematicRetakeContext({
      contract_version: 1,
      prior_task_id: input.priorTaskId,
      prior_result_node_id: input.priorResultNodeId,
      decision: input.decision,
      problem_category: input.problemCategory,
      repair_variable: input.repairVariable ?? null,
      attempt_count: input.attemptCount,
      revised_instruction: input.revisedInstruction ?? null,
    })
    return { workflowMode: 'retake' as const, executionRequested: false as const, context }
  } catch {
    throw new Error('cinematic director retake is invalid')
  }
}
