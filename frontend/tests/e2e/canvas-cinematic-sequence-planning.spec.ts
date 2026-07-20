import { expect, test } from '@playwright/test'
import { ref } from 'vue'
import { createCanvasCommandExecutor } from '../../src/modules/canvas/canvas-command-executor'
import { createCanvasCommandHistory } from '../../src/modules/canvas/canvas-command-history'
import { createCanvasMutationActions } from '../../src/modules/canvas/mutations'
import {
  createApplyCinematicSequenceCommand,
  resolveNextUnresolvedCinematicClip,
} from '../../src/modules/canvas/cinematic-sequence-command'
import { parseCinematicSequenceState } from '../../src/modules/canvas/cinematic-sequence'
import { createCinematicTakeReviewCommand } from '../../src/modules/canvas/cinematic-take-review'
import type { CanvasNode } from '../../src/types/canvas'

const REVISION = 'a'.repeat(64)
function sequence() {
  return parseCinematicSequenceState({
    contract_version: 1, schema_id: 'revid.cinematic-sequence', sequence_id: 'sequence-1',
    source_script_node_id: 'script-1', source_revision: REVISION,
    story_objective: '角色离开城市', final_outcome: '角色登上列车',
    director_brief: {
      contract_version: 1, schema_id: 'revid.cinematic-director-brief',
      source_script_node_id: 'script-1', source_revision: REVISION,
      intention: '从迟疑转为行动', visible_beat: '角色走入雨中',
      camera: { shot: '中景', movement: '低机位跟随', endpoint: '列车门前' },
      light: { motivated_source: '站台灯', transition: '由冷转暖' },
      blocking_performance: '先停顿再迈步', motion: '雨线稳定', sound_intent: '雨声',
      continuity_anchors: ['深灰风衣'], must_preserve: ['角色身份'],
      allowed_changes: ['镜头距离'], must_not_transfer: ['参考背景'], safety_notes: [],
    },
    ordered_beats: [
      { beat_id: 'beat-01', summary: '收到车票', state: 'planned' },
      { beat_id: 'beat-02', summary: '登上列车', state: 'planned' },
    ],
    clips: [
      {
        clip_id: 'clip-01', scene_id: 'scene-01', narrative_job: '做出决定', intention: '走入雨中',
        state: 'planned', accepted_result_node_id: null, accepted_result_revision: null,
        observed_end_state: null, completed_beat_ids: [], reserved_beat_ids: [],
        extension_depth: 0, attempt_count: 0,
      },
      {
        clip_id: 'clip-02', scene_id: 'scene-02', narrative_job: '完成离开', intention: '登上列车',
        state: 'planned', accepted_result_node_id: null, accepted_result_revision: null,
        observed_end_state: null, completed_beat_ids: [], reserved_beat_ids: [],
        extension_depth: 0, attempt_count: 0,
      },
    ],
    canon_revision: 0,
  })
}

function executor(nodes: CanvasNode[], updates: Array<{ nodeId: string; contentData: Record<string, unknown> }>) {
  return createCanvasCommandExecutor({
    getNodes: () => nodes, getConnections: () => [],
    createNode: async () => { throw new Error('not used') },
    createConnection: async () => { throw new Error('not used') },
    deleteNode: async () => undefined, deleteConnection: async () => undefined,
    updateNodeParent: async () => undefined, updateNodeLocked: async () => undefined,
    updateNodeState: async (nodeId, value) => {
      updates.push({ nodeId, contentData: value.contentData! })
      const target = nodes.find((node) => node.id === nodeId)!
      target.contentData = value.contentData
    },
    queueNodeMove: () => undefined, setSelection: () => undefined, selectConnection: () => undefined,
  })
}

test('strict sequence applies through one script-node command and stale source performs zero updates', async () => {
  const source: CanvasNode = {
    id: 'script-1', type: 'script', title: '雨夜车站', x: 100, y: 100, width: 320, height: 200,
    content: '角色收到车票。', contentData: { subtype: 'script', serialization_version: 1, text: '角色收到车票。' },
  }
  const updates: Array<{ nodeId: string; contentData: Record<string, unknown> }> = []
  const command = createApplyCinematicSequenceCommand(source, '角色收到车票。', sequence())!
  await executor([source], updates).executeCommand({ source: 'toolbar', command })

  expect(updates).toHaveLength(1)
  expect(updates[0].nodeId).toBe('script-1')
  expect(updates[0].contentData.cinematic_sequence).toEqual(sequence())
  expect(source.content).toBe('角色收到车票。')

  const stale = { ...command, expectedContent: '旧内容' }
  await executor([source], updates).executeCommand({ source: 'toolbar', command: stale })
  expect(updates).toHaveLength(1)
})

test('planning exposes only the first executable clip and waits for generated review', () => {
  const planned = sequence()
  expect(resolveNextUnresolvedCinematicClip(planned)?.clip_id).toBe('clip-01')
  const awaitingReview = structuredClone(planned)
  awaitingReview.clips[0].state = 'generated'
  expect(resolveNextUnresolvedCinematicClip(awaitingReview)).toBeNull()
  const accepted = structuredClone(planned)
  accepted.clips[0] = {
    ...accepted.clips[0], state: 'accepted', accepted_result_node_id: 'result-1',
    accepted_result_revision: REVISION, observed_end_state: '角色抵达列车门前',
  }
  expect(resolveNextUnresolvedCinematicClip(parseCinematicSequenceState(accepted))?.clip_id).toBe('clip-02')
})

test('malformed or wrong-source sequence creates no command', () => {
  const source: CanvasNode = {
    id: 'script-1', type: 'script', title: '脚本', x: 0, y: 0, width: 300, height: 200,
    content: '正文', contentData: { subtype: 'script', serialization_version: 1, text: '正文' },
  }
  expect(createApplyCinematicSequenceCommand(source, '正文', {
    ...sequence(), source_script_node_id: 'foreign-script',
    director_brief: { ...sequence().director_brief, source_script_node_id: 'foreign-script' },
  })).toBeNull()
  expect(() => createApplyCinematicSequenceCommand(source, '正文', { ...sequence(), clips: [] })).toThrow('cinematic sequence')
})

test('one sequence command participates in autosave and exact undo redo history', async () => {
  const nodes = ref<CanvasNode[]>([{
    id: 'script-1', type: 'script', title: '脚本', x: 0, y: 0, width: 300, height: 200,
    content: '正文', contentData: { subtype: 'script', serialization_version: 1, text: '正文' },
  }])
  const connections = ref([])
  let autosaves = 0
  const mutations = createCanvasMutationActions({
    activeProjectId: ref('project-1'), activeCanvasId: ref('canvas-1'),
    selectedNodeId: ref('script-1'), selectedNodeIds: ref(['script-1']), nodes, connections,
    bumpDataRevision: () => undefined, queueAutosave: () => { autosaves += 1 },
    updateNode: (nodeId, update) => {
      nodes.value = nodes.value.map((node) => node.id === nodeId ? update(node) : node)
    },
    findNodeById: (nodeId) => nodes.value.find((node) => node.id === nodeId) ?? null,
    setSelection: () => undefined, selectConnection: () => undefined,
  })
  const history = createCanvasCommandHistory({
    getNodes: () => nodes.value, getConnections: () => connections.value,
    executeCommand: mutations.executeCommand, applyGraph: mutations.applyGraph,
  })
  history.activate('project-1/canvas-1')
  const command = createApplyCinematicSequenceCommand(nodes.value[0], '正文', sequence())!

  await history.execute({ source: 'toolbar', command })
  expect(autosaves).toBe(1)
  expect(nodes.value[0].contentData?.cinematic_sequence).toEqual(sequence())
  expect(await history.undo()).toBe(true)
  expect(nodes.value[0].contentData?.cinematic_sequence).toBeUndefined()
  expect(await history.redo()).toBe(true)
  expect(nodes.value[0].contentData?.cinematic_sequence).toEqual(sequence())
})

test('accept and reject are explicit one-revision reviews and rejected result remains untouched', () => {
  const source: CanvasNode = {
    id: 'script-1', type: 'script', title: '脚本', x: 0, y: 0, width: 300, height: 200,
    content: '正文', contentData: { subtype: 'script', serialization_version: 1, text: '正文' },
  }
  const result: CanvasNode = {
    id: 'result-1', type: 'result', title: 'Take 1', x: 400, y: 0, width: 320, height: 240,
    status: 'success', contentData: {
      subtype: 'video', serialization_version: 1, asset_id: 'asset-1', source_task_id: 'task-1',
    },
  }
  const generated = structuredClone(sequence())
  generated.clips[0].state = 'generated'
  const accepted = createCinematicTakeReviewCommand({
    source, sequence: generated, clipId: 'clip-01', result, resultRevision: REVISION,
    decision: 'accept', observedEndState: '角色抵达列车门前',
    completedBeatIds: ['beat-01'], reservedBeatIds: ['beat-02'],
  })!
  expect(accepted.sequence.canon_revision).toBe(1)
  expect(accepted.sequence.clips[0]).toEqual(expect.objectContaining({
    state: 'accepted', accepted_result_node_id: 'result-1', observed_end_state: '角色抵达列车门前',
  }))

  const before = JSON.stringify(result)
  const rejected = createCinematicTakeReviewCommand({
    source, sequence: generated, clipId: 'clip-01', result, resultRevision: REVISION,
    decision: 'reject', observedEndState: null, completedBeatIds: [], reservedBeatIds: [],
  })!
  expect(rejected.sequence.canon_revision).toBe(1)
  expect(rejected.sequence.clips[0].state).toBe('rejected')
  expect(JSON.stringify(result)).toBe(before)
})
