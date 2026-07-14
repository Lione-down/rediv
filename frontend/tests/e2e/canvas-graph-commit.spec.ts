import { expect, test } from '@playwright/test'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { request } from '../../src/api/request'
import { createCanvasAutosave } from '../../src/modules/canvas/canvas-autosave'
import { createCanvasCommandHistory } from '../../src/modules/canvas/canvas-command-history'
import { createCanvasHistoryActions } from '../../src/modules/canvas/canvas-history-actions'
import { applyGenerationNodeState } from '../../src/modules/canvas/generation-node-state'
import { createCanvasMutationActions } from '../../src/modules/canvas/mutations'
import type { CanvasCommandEnvelope } from '../../src/modules/canvas/canvas-commands'
import { createGeneratedResultCommand } from '../../src/modules/canvas/resource-commands'
import type { CanvasDocumentPatchResponse } from '../../src/modules/canvas/types'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

function createMemoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() { return items.size },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => { items.delete(key) },
    setItem: (key, value) => { items.set(key, value) },
  }
}

test('insert-graph command adds one graph fragment through one autosave boundary', async () => {
  const nodes = ref<CanvasNode[]>([
    {
      id: 'generation-node', type: 'generation', title: '图片生成', x: 80, y: 120,
      width: 340, height: 220, contentData: { subtype: 'image', serialization_version: 1 },
    },
  ])
  const connections = ref<CanvasConnection[]>([])
  let autosaveCount = 0
  let selectedIds: string[] = []
  const mutations = createCanvasMutationActions({
    activeProjectId: ref('project-a'),
    activeCanvasId: ref('canvas-a'),
    selectedNodeId: ref(''),
    selectedNodeIds: ref<string[]>([]),
    nodes,
    connections,
    bumpDataRevision: () => undefined,
    queueAutosave: () => { autosaveCount += 1 },
    updateNode: (nodeId, updater) => {
      nodes.value = nodes.value.map((node) => node.id === nodeId ? updater(node) : node)
    },
    findNodeById: (nodeId) => nodes.value.find((node) => node.id === nodeId) ?? null,
    setSelection: (nodeIds) => { selectedIds = nodeIds },
    selectConnection: () => undefined,
  })
  const resultNode: CanvasNode = {
    id: 'result-node', type: 'result', title: '生成结果', x: 520, y: 120,
    width: 320, height: 240,
    contentData: { subtype: 'image', serialization_version: 1, asset_id: 'asset-result' },
  }
  const resultConnection: CanvasConnection = {
    id: 'result-edge', from: 'generation-node', to: 'result-node',
    sourcePort: 'out', targetPort: 'in',
  }

  await mutations.executeCommand({
    source: 'toolbar',
    command: { type: 'insert-graph', nodes: [resultNode], connections: [resultConnection] },
  })

  expect(nodes.value.map((node) => node.id)).toEqual(['generation-node', 'result-node'])
  expect(connections.value).toEqual([resultConnection])
  expect(autosaveCount).toBe(1)
  expect(selectedIds).toEqual(['result-node'])

  resultNode.title = '调用方后续修改'
  resultConnection.to = 'generation-node'
  expect(nodes.value.find((node) => node.id === 'result-node')?.title).toBe('生成结果')
  expect(connections.value[0].to).toBe('result-node')
})

test('generation reconciliation atomically marks the source and undo never rematerializes the result', async () => {
  const nodes = ref<CanvasNode[]>([{
    id: 'generation-node', type: 'generation', title: '图片生成', x: 80, y: 120,
    width: 340, height: 220,
    contentData: { subtype: 'image', serialization_version: 1 },
  }])
  const connections = ref<CanvasConnection[]>([])
  let autosaveCount = 0
  const mutations = createCanvasMutationActions({
    activeProjectId: ref('project-a'),
    activeCanvasId: ref('canvas-a'),
    selectedNodeId: ref('generation-node'),
    selectedNodeIds: ref(['generation-node']),
    nodes,
    connections,
    bumpDataRevision: () => undefined,
    queueAutosave: () => { autosaveCount += 1 },
    updateNode: (nodeId, updater) => {
      nodes.value = nodes.value.map((node) => node.id === nodeId ? updater(node) : node)
    },
    findNodeById: (nodeId) => nodes.value.find((node) => node.id === nodeId) ?? null,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })
  const history = createCanvasCommandHistory({
    getNodes: () => nodes.value,
    getConnections: () => connections.value,
    executeCommand: mutations.executeCommand,
    applyGraph: mutations.applyGraph,
  })
  history.activate('project-a/canvas-a')
  const command = createGeneratedResultCommand(
    nodes.value[0],
    {
      id: 'asset-task', user_id: 'user-a', project_id: 'project-a',
      origin_canvas_id: 'canvas-a', canvas_node_id: 'generation-node', type: 'image',
      url: 'https://media.revid.test/task.png', content_text: null, source: 'generation',
      source_model: 'mock-image-v1', source_task_id: 'task-a', status: 'active',
      created_at: '2026-07-14T08:00:00Z', updated_at: '2026-07-14T08:00:00Z',
    },
    {
      id: 'task-a', user_id: 'user-a', project_id: 'project-a',
      origin_canvas_id: 'canvas-a', canvas_node_id: 'generation-node', media_type: 'image',
      provider: 'mock', model: 'mock-image-v1', provider_request_id: 'request-a',
      status: 'succeeded', duration_ms: 10, result_asset_id: 'asset-task',
      error_code: null, error_message: null, created_at: '2026-07-14T08:00:00Z',
      updated_at: '2026-07-14T08:00:00Z',
    },
  )

  nodes.value = [applyGenerationNodeState(nodes.value[0], 'succeeded', 'task-a', true)]
  autosaveCount += 1
  await history.execute({ source: 'toolbar', command })

  expect(autosaveCount).toBe(2)
  expect(nodes.value).toHaveLength(2)
  expect(nodes.value[0].contentData).toEqual(expect.objectContaining({
    generation_status: 'succeeded',
    generation_task_id: 'task-a',
    result_materialized_task_id: 'task-a',
  }))
  expect(await history.undo()).toBe(true)
  expect(nodes.value).toHaveLength(1)
  expect(nodes.value[0].contentData?.result_materialized_task_id).toBe('task-a')
})

test('insert-graph rejects an invalid fragment without partially mutating the graph', async () => {
  const originalNode: CanvasNode = {
    id: 'generation-node', type: 'generation', title: '图片生成', x: 80, y: 120,
    width: 340, height: 220, contentData: { subtype: 'image', serialization_version: 1 },
  }
  const nodes = ref<CanvasNode[]>([originalNode])
  const connections = ref<CanvasConnection[]>([])
  let autosaveCount = 0
  const mutations = createCanvasMutationActions({
    activeProjectId: ref('project-a'),
    activeCanvasId: ref('canvas-a'),
    selectedNodeId: ref(''),
    selectedNodeIds: ref<string[]>([]),
    nodes,
    connections,
    bumpDataRevision: () => undefined,
    queueAutosave: () => { autosaveCount += 1 },
    updateNode: (nodeId, updater) => {
      nodes.value = nodes.value.map((node) => node.id === nodeId ? updater(node) : node)
    },
    findNodeById: (nodeId) => nodes.value.find((node) => node.id === nodeId) ?? null,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })

  await expect(mutations.executeCommand({
    source: 'toolbar',
    command: {
      type: 'insert-graph',
      nodes: [{ id: 'result-node', type: 'result', title: '生成结果', x: 520, y: 120, width: 320, height: 240 }],
      connections: [{ id: 'broken-edge', from: 'missing-node', to: 'result-node' }],
    },
  })).rejects.toThrow('插入图段包含无效的连接端点')
  await expect(mutations.executeCommand({
    source: 'toolbar',
    command: {
      type: 'insert-graph',
      nodes: [{
        id: 'orphan-child', type: 'script', title: '孤立子节点', x: 0, y: 0,
        width: 320, height: 200, parentNodeId: 'missing-group',
      }],
      connections: [],
    },
  })).rejects.toThrow('插入图段包含无效的父子关系')

  expect(nodes.value).toEqual([originalNode])
  expect(connections.value).toEqual([])
  expect(autosaveCount).toBe(0)
})

test('insert-graph rejects node and connection identity collisions', async () => {
  const nodes = ref<CanvasNode[]>([
    { id: 'generation-node', type: 'generation', title: '图片生成', x: 80, y: 120, width: 340, height: 220 },
    { id: 'existing-result', type: 'result', title: '已有结果', x: 520, y: 120, width: 320, height: 240 },
  ])
  const connections = ref<CanvasConnection[]>([
    { id: 'existing-edge', from: 'generation-node', to: 'existing-result' },
  ])
  let autosaveCount = 0
  const mutations = createCanvasMutationActions({
    activeProjectId: ref('project-a'),
    activeCanvasId: ref('canvas-a'),
    selectedNodeId: ref(''),
    selectedNodeIds: ref<string[]>([]),
    nodes,
    connections,
    bumpDataRevision: () => undefined,
    queueAutosave: () => { autosaveCount += 1 },
    updateNode: (nodeId, updater) => {
      nodes.value = nodes.value.map((node) => node.id === nodeId ? updater(node) : node)
    },
    findNodeById: (nodeId) => nodes.value.find((node) => node.id === nodeId) ?? null,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })
  const originalNodes = nodes.value.map((node) => ({ ...node }))
  const originalConnections = connections.value.map((connection) => ({ ...connection }))

  await expect(mutations.executeCommand({
    source: 'toolbar',
    command: {
      type: 'insert-graph',
      nodes: [{ id: 'generation-node', type: 'asset', title: '冲突资产', x: 0, y: 0, width: 320, height: 240 }],
      connections: [],
    },
  })).rejects.toThrow('插入图段包含重复的实体 ID')
  await expect(mutations.executeCommand({
    source: 'toolbar',
    command: {
      type: 'insert-graph',
      nodes: [{ id: 'new-result', type: 'result', title: '新结果', x: 880, y: 120, width: 320, height: 240 }],
      connections: [{ id: 'existing-edge', from: 'generation-node', to: 'new-result' }],
    },
  })).rejects.toThrow('插入图段包含重复的实体 ID')

  expect(nodes.value).toEqual(originalNodes)
  expect(connections.value).toEqual(originalConnections)
  expect(autosaveCount).toBe(0)
})

test('committed graph adoption makes undo save from the adopted revision', async () => {
  const originalLocalStorage = globalThis.localStorage
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  })
  setActivePinia(createPinia())
  let nodes: CanvasNode[] = [
    { id: 'generation-node', type: 'generation', title: '图片生成', x: 80, y: 120, width: 340, height: 220 },
  ]
  let connections: CanvasConnection[] = []
  const revisions: number[] = []
  const patchBodies: Array<Record<string, unknown>> = []
  const originalAdapter = request.defaults.adapter
  request.defaults.adapter = async (config) => {
    const body = JSON.parse(String(config.data)) as Record<string, unknown>
    patchBodies.push(body)
    return {
      data: {
        revision: 5,
        node_upserts: body.node_upserts,
        node_deletes: body.node_deletes,
        connection_upserts: body.connection_upserts,
        connection_deletes: body.connection_deletes,
        server_timestamp: '2026-07-14T00:00:00Z',
        save_state: 'saved',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  try {
    const autosave = createCanvasAutosave({
      getIdentity: () => ({ userId: 'user-a', projectId: 'project-a', canvasId: 'canvas-a' }),
      getNodes: () => nodes,
      getConnections: () => connections,
      onRecovery: (nextNodes, nextConnections) => {
        nodes = nextNodes
        connections = nextConnections
      },
      onRevision: (revision) => { revisions.push(revision) },
      onStatus: () => undefined,
    })
    autosave.initialize(3)
    const history = createCanvasCommandHistory({
      getNodes: () => nodes,
      getConnections: () => connections,
      executeCommand: () => undefined,
      applyGraph: (nextNodes, nextConnections) => {
        nodes = nextNodes
        connections = nextConnections
        autosave.queue()
      },
    })
    history.activate('user-a/project-a/canvas-a')
    const templateNode: CanvasNode = {
      id: 'template-node', type: 'script', title: '模板脚本', x: 480, y: 120,
      width: 320, height: 200, contentData: { subtype: 'script', serialization_version: 1 },
    }
    const envelope: CanvasCommandEnvelope = {
      source: 'toolbar',
      command: { type: 'insert-graph', nodes: [templateNode], connections: [] },
    }

    await history.adopt(envelope, () => autosave.adoptCommittedRevision(4, () => {
      nodes = [...nodes, templateNode]
    }))

    expect(nodes.map((node) => node.id)).toEqual(['generation-node', 'template-node'])
    expect(history.getState().undoCount).toBe(1)
    expect(revisions).toEqual([4])
    expect(patchBodies).toEqual([])

    expect(await history.undo()).toBe(true)
    await autosave.flush()
    expect(patchBodies).toHaveLength(1)
    expect(patchBodies[0]).toEqual(expect.objectContaining({
      base_revision: 4,
      node_deletes: ['template-node'],
    }))
    expect(revisions).toEqual([4, 5])
  } finally {
    request.defaults.adapter = originalAdapter
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: originalLocalStorage,
      })
    } else {
      delete (globalThis as { localStorage?: Storage }).localStorage
    }
  }
})

test('committed document mutation merges the authenticated server graph without autosave', async () => {
  const nodes = ref<CanvasNode[]>([
    { id: 'generation-node', type: 'generation', title: '图片生成', x: 80, y: 120, width: 340, height: 220 },
  ])
  const connections = ref<CanvasConnection[]>([])
  let autosaveCount = 0
  let dataRevisionCount = 0
  let adoptedRevision = -1
  const mutations = createCanvasMutationActions({
    activeProjectId: ref('project-a'),
    activeCanvasId: ref('canvas-a'),
    selectedNodeId: ref(''),
    selectedNodeIds: ref<string[]>([]),
    nodes,
    connections,
    bumpDataRevision: () => { dataRevisionCount += 1 },
    queueAutosave: () => { autosaveCount += 1 },
    updateNode: (nodeId, updater) => {
      nodes.value = nodes.value.map((node) => node.id === nodeId ? updater(node) : node)
    },
    findNodeById: (nodeId) => nodes.value.find((node) => node.id === nodeId) ?? null,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })
  const mutation: CanvasDocumentPatchResponse = {
    revision: 4,
    node_upserts: [{
      id: 'template-node', project_id: 'project-a', canvas_id: 'canvas-a', node_type: 'script',
      content: { title: '模板脚本', subtype: 'script', serialization_version: 1 },
      position_x: 480, position_y: 120, width: 320, height: 200, z_index: 0,
      parent_node_id: null, is_locked: false, is_collapsed: false, status: 'idle',
      created_at: '2026-07-14T00:00:00Z', updated_at: '2026-07-14T00:00:00Z',
    }],
    node_deletes: [],
    connection_upserts: [{
      id: 'template-edge', project_id: 'project-a', canvas_id: 'canvas-a',
      source_node_id: 'generation-node', source_port: 'out', target_node_id: 'template-node',
      target_port: 'in', status: 'active', metadata: {},
      created_at: '2026-07-14T00:00:00Z', updated_at: '2026-07-14T00:00:00Z',
    }],
    connection_deletes: [],
    server_timestamp: '2026-07-14T00:00:00Z',
    save_state: 'saved',
  }

  const history = createCanvasHistoryActions(
    mutations,
    nodes,
    connections,
    (revision, applyCommittedGraph) => {
      adoptedRevision = revision
      applyCommittedGraph()
    },
  )
  history.activate('project-a', 'canvas-a')
  await history.adoptCommittedMutation(mutation)

  expect(nodes.value.map((node) => node.id)).toEqual(['generation-node', 'template-node'])
  expect(connections.value).toEqual([expect.objectContaining({
    id: 'template-edge', from: 'generation-node', to: 'template-node',
  })])
  expect(dataRevisionCount).toBe(1)
  expect(autosaveCount).toBe(0)
  expect(adoptedRevision).toBe(4)
  expect(history.canUndo.value).toBe(true)
})
