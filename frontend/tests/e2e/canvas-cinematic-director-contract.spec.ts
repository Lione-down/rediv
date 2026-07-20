import { expect, test } from '@playwright/test'
import {
  parseCinematicDirectorBrief,
  parseCinematicReferenceTransfer,
  parseCinematicRetakeContext,
} from '../../src/modules/canvas/cinematic-director'
import { parseCinematicSequenceState } from '../../src/modules/canvas/cinematic-sequence'
import { parseCanvasAgentSkillCapabilitiesV3 } from '../../src/modules/canvas/agent-skills'

const REVISION = 'a'.repeat(64)

function brief() {
  return {
    contract_version: 1,
    schema_id: 'revid.cinematic-director-brief',
    source_script_node_id: 'script-1',
    source_revision: REVISION,
    intention: '让角色从迟疑转为行动',
    visible_beat: '角色迈入雨中',
    camera: { shot: '中景', movement: '缓慢推进', endpoint: '面部近景' },
    light: { motivated_source: '街灯', transition: '由冷转暖' },
    blocking_performance: '先停顿，再迈步',
    motion: '雨线稳定',
    sound_intent: '雨声与一次呼吸',
    continuity_anchors: ['深灰风衣'],
    must_preserve: ['角色身份'],
    allowed_changes: ['镜头距离'],
    must_not_transfer: ['参考图背景'],
    safety_notes: [],
  }
}

function sequence() {
  return {
    contract_version: 1,
    schema_id: 'revid.cinematic-sequence',
    sequence_id: 'sequence-1',
    source_script_node_id: 'script-1',
    source_revision: REVISION,
    story_objective: '角色决定离开城市',
    final_outcome: '角色登上清晨列车',
    director_brief: brief(),
    ordered_beats: [
      { beat_id: 'beat-01', summary: '收到车票', state: 'completed' },
      { beat_id: 'beat-02', summary: '走入雨中', state: 'planned' },
    ],
    clips: [{
      clip_id: 'clip-01', scene_id: 'scene-01', narrative_job: '让决定可见',
      intention: '从迟疑转为行动', state: 'accepted', accepted_result_node_id: 'result-1',
      accepted_result_revision: REVISION, observed_end_state: '角色抵达站台入口',
      completed_beat_ids: ['beat-01'], reserved_beat_ids: [], extension_depth: 1, attempt_count: 1,
    }],
    canon_revision: 1,
  }
}

test('v3 registry exposes three active cinematic v2 manifests without exposing historical v1', () => {
  const parsed = parseCanvasAgentSkillCapabilitiesV3({
    contract_version: 3,
    execution_modes: ['mock-only', 'unavailable', 'native-handoff'],
    skills: [
      { id: 'revid.canvas-context', version: 1, execution_mode: 'mock-only', intent: 'canvas-context', requires_acknowledgement: false, lifecycle: 'active', replaces_version: null },
      ...['script', 'image', 'video'].map((kind) => ({
        id: `revid.cinema-${kind}`, version: 2, execution_mode: 'native-handoff',
        intent: `cinema-${kind}`, requires_acknowledgement: false, lifecycle: 'active', replaces_version: 1,
      })),
    ],
    provider: { available: false }, quota: { available: false }, task: { available: false },
  })
  expect(parsed.skills.filter((skill) => skill.intent.startsWith('cinema-')).map((skill) => skill.version)).toEqual([2, 2, 2])
  expect(parsed.skills.some((skill) => skill.intent.startsWith('cinema-') && skill.version === 1)).toBe(false)
})

test('director, reference, sequence, and retake parsers accept exact contracts', () => {
  expect(parseCinematicDirectorBrief(brief()).intention).toContain('行动')
  expect(parseCinematicReferenceTransfer({
    contract_version: 1, node_id: 'image-1', role: 'identity', instruction: '保留面部',
    must_not_transfer: ['logo', 'background', 'camera'], source_revision: REVISION,
  }).must_not_transfer).toEqual(['logo', 'background', 'camera'])
  expect(parseCinematicSequenceState(sequence()).clips[0].state).toBe('accepted')
  expect(parseCinematicRetakeContext({
    contract_version: 1, prior_task_id: 'task-1', prior_result_node_id: 'result-1',
    decision: 'reroll', problem_category: 'camera', repair_variable: 'camera_movement',
    attempt_count: 2, revised_instruction: null,
  }).repair_variable).toBe('camera_movement')
})

test('v2 parsers reject extras, version mixing, invalid enums, stale revisions, and partial canon', () => {
  const invalidBrief = { ...brief(), extra: true }
  const invalidReference = {
    contract_version: 1, node_id: 'image-1', role: 'identity', instruction: '保留面部',
    must_not_transfer: ['provider_field'], source_revision: REVISION,
  }
  const partial = sequence()
  partial.clips[0].observed_end_state = null as unknown as string
  const wrongBeatState = sequence()
  wrongBeatState.ordered_beats[0].state = 'planned'
  const invalidRetake = {
    contract_version: 1, prior_task_id: 'task-1', prior_result_node_id: 'result-1',
    decision: 'reroll', problem_category: 'camera', repair_variable: null,
    attempt_count: 2, revised_instruction: null,
  }
  for (const [parser, value] of [
    [parseCinematicDirectorBrief, invalidBrief],
    [parseCinematicReferenceTransfer, invalidReference],
    [parseCinematicSequenceState, partial],
    [parseCinematicSequenceState, wrongBeatState],
    [parseCinematicRetakeContext, invalidRetake],
  ] as const) expect(() => parser(value)).toThrow('cinematic')
})
