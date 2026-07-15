import { expect, test } from '@playwright/test'
import { reactive } from 'vue'
import { createCanvasCommandExecutor } from '../../src/modules/canvas/canvas-command-executor'
import {
  createConnectNodesCommand,
  createReconnectConnectionCommand,
  createDeleteSelectionCommand,
  createDuplicateNodesCommand,
  createGroupNodesCommand,
  createMoveNodesCommand,
  createSetNodesLockedCommand,
  createUngroupNodesCommand,
  isArrangeEligibleNode,
} from '../../src/modules/canvas/canvas-commands'
import { reduceCanvasSelection } from '../../src/modules/canvas/canvas-selection'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

const domain = {
  nodeIds: ['node-a', 'node-b', 'node-c'],
  connectionIds: ['connection-a'],
}

function canonicalNode(id: string, type: 'script' | 'generation', subtype: string): CanvasNode {
  return { id, type, title: id, x: 0, y: 0, width: 320, height: 200,
    contentData: { subtype, serialization_version: 1 } }
}

function typedConnection(id: string, from: string, to: string): CanvasConnection {
  return { id, from, to, sourcePort: 'out', targetPort: 'prompt', active: true }
}

test('selection reducer preserves request order and keeps one deterministic primary target', () => {
  const empty = { nodeIds: [], primaryNodeId: '', connectionId: '' }
  const replaced = reduceCanvasSelection(domain, empty, {
    type: 'set-nodes',
    nodeIds: ['node-c', 'missing', 'node-a', 'node-c'],
    primaryNodeId: 'missing',
  })
  expect(replaced).toEqual({ nodeIds: ['node-c', 'node-a'], primaryNodeId: 'node-a', connectionId: '' })

  const added = reduceCanvasSelection(domain, replaced, { type: 'add-node', nodeId: 'node-b' })
  expect(added).toEqual({ nodeIds: ['node-c', 'node-a', 'node-b'], primaryNodeId: 'node-b', connectionId: '' })

  const toggled = reduceCanvasSelection(domain, added, { type: 'toggle-node', nodeId: 'node-b' })
  expect(toggled).toEqual({ nodeIds: ['node-c', 'node-a'], primaryNodeId: 'node-a', connectionId: '' })

  expect(reduceCanvasSelection(domain, toggled, {
    type: 'select-connection',
    connectionId: 'connection-a',
  })).toEqual({ nodeIds: [], primaryNodeId: '', connectionId: 'connection-a' })
})

test('command factories remove empty work and preserve deterministic target order', () => {
  const nodes: CanvasNode[] = [
    { id: 'node-a', type: 'text', title: 'A', x: 30, y: 40, width: 240, height: 140 },
    { id: 'node-b', type: 'text', title: 'B', x: 80, y: 90, width: 240, height: 140 },
  ]
  expect(createMoveNodesCommand([
    { nodeId: 'node-a', x: 10, y: 20 },
    { nodeId: 'missing', x: 0, y: 0 },
    { nodeId: 'node-b', x: 80, y: 90 },
  ], nodes)).toEqual({
    type: 'move-nodes',
    moves: [{
      nodeId: 'node-a',
      from: { nodeId: 'node-a', x: 10, y: 20 },
      to: { nodeId: 'node-a', x: 30, y: 40 },
    }],
  })
  expect(createMoveNodesCommand([], nodes)).toBeNull()
  expect(createDuplicateNodesCommand(['node-b', 'node-b', 'node-a'])).toEqual({
    type: 'duplicate-nodes', nodeIds: ['node-b', 'node-a'], offset: { x: 32, y: 32 },
  })
  expect(createDeleteSelectionCommand([], [])).toBeNull()
  expect(createGroupNodesCommand(nodes, ['node-a'])).toBeNull()
  expect(createGroupNodesCommand(nodes, ['node-b', 'node-a'])).toEqual({
    type: 'group-nodes', nodeIds: ['node-a', 'node-b'], padding: 24,
  })
  expect(createConnectNodesCommand(nodes, [], 'node-a', 'node-a')).toBeNull()
  expect(createConnectNodesCommand(nodes, [], 'node-a', 'node-b')).toEqual({
    type: 'connect-nodes', sourceNodeId: 'node-a', targetNodeId: 'node-b', sourcePort: 'out', targetPort: 'in',
  })
})

test('connect command selects registry-compatible ports and rejects non-connectable nodes', () => {
  const nodes: CanvasNode[] = [
    { id: 'script', type: 'script', title: '脚本', x: 0, y: 0, width: 320, height: 200, contentData: { subtype: 'script', serialization_version: 1 } },
    { id: 'asset', type: 'asset', title: '图片', x: 0, y: 0, width: 320, height: 240, contentData: { subtype: 'image', serialization_version: 1 } },
    { id: 'video-asset', type: 'asset', title: 'Video', x: 0, y: 0, width: 320, height: 240, contentData: { subtype: 'video', serialization_version: 1 } },
    { id: 'video-result', type: 'result', title: 'Video result', x: 0, y: 0, width: 320, height: 180, contentData: { subtype: 'video', serialization_version: 1 } },
    { id: 'generation', type: 'generation', title: '视频生成', x: 0, y: 0, width: 340, height: 220, contentData: { subtype: 'video', serialization_version: 1 } },
    { id: 'note', type: 'note', title: '备注', x: 0, y: 0, width: 260, height: 180, contentData: { subtype: 'annotation', serialization_version: 1 } },
    { id: 'future', type: 'future-storyboard', title: '未来类型', x: 0, y: 0, width: 280, height: 160 },
  ]

  expect(createConnectNodesCommand(nodes, [], 'script', 'generation')).toEqual(expect.objectContaining({
    sourcePort: 'out', targetPort: 'prompt',
  }))
  expect(createConnectNodesCommand(nodes, [], 'asset', 'generation')).toEqual(expect.objectContaining({
    sourcePort: 'out', targetPort: 'media',
  }))
  expect(createConnectNodesCommand(nodes, [], 'asset', 'generation', 'out', 'prompt')).toBeNull()
  expect(createConnectNodesCommand(nodes, [], 'asset', 'generation', 'out', 'media')).toEqual(expect.objectContaining({
    sourcePort: 'out', targetPort: 'media',
  }))
  expect(createConnectNodesCommand(nodes, [], 'video-asset', 'generation', 'out', 'media')).toBeNull()
  expect(createConnectNodesCommand(nodes, [], 'video-result', 'generation', 'out', 'media')).toBeNull()
  expect(createConnectNodesCommand(nodes, [], 'script', 'generation', 'missing', 'prompt')).toBeNull()
  expect(createConnectNodesCommand(nodes, [], 'note', 'generation')).toBeNull()
  expect(createConnectNodesCommand(nodes, [], 'future', 'generation')).toBeNull()
})

test('reconnect command preserves identity and rejects duplicate or unchanged endpoints', () => {
  const nodes = [
    canonicalNode('script-a', 'script', 'script'),
    canonicalNode('script-b', 'script', 'prompt'),
    canonicalNode('generation-a', 'generation', 'image'),
    canonicalNode('generation-b', 'generation', 'video'),
    { id: 'video-asset', type: 'asset', title: 'Video', x: 0, y: 0, width: 320, height: 180,
      contentData: { subtype: 'video', serialization_version: 1 } } as CanvasNode,
  ]
  const connections = [
    typedConnection('edge-a', 'script-a', 'generation-a'),
    typedConnection('edge-b', 'script-b', 'generation-b'),
  ]

  expect(createReconnectConnectionCommand(
    nodes, connections, 'edge-a', 'script-b', 'generation-a', 'out', 'prompt',
  )).toEqual({
    type: 'reconnect-connection', connectionId: 'edge-a', sourceNodeId: 'script-b',
    targetNodeId: 'generation-a', sourcePort: 'out', targetPort: 'prompt',
  })
  expect(createReconnectConnectionCommand(
    nodes, connections, 'edge-a', 'script-a', 'generation-a', 'out', 'prompt',
  )).toBeNull()
  expect(createReconnectConnectionCommand(
    nodes, connections, 'edge-a', 'script-b', 'generation-b', 'out', 'prompt',
  )).toBeNull()
  expect(createReconnectConnectionCommand(
    nodes, connections, 'edge-a', 'video-asset', 'generation-a', 'out', 'media',
  )).toBeNull()
})

test('future-version group nodes cannot enter supported ungroup mutations', () => {
  const nodes: CanvasNode[] = [
    {
      id: 'future-group', type: 'group', title: '未来组合', x: 0, y: 0, width: 480, height: 320,
      contentData: { subtype: 'group', serialization_version: 2, future_payload: true },
    },
    {
      id: 'child', type: 'script', title: '脚本', x: 40, y: 40, width: 320, height: 200,
      parentNodeId: 'future-group', contentData: { subtype: 'script', serialization_version: 1 },
    },
  ]

  expect(createUngroupNodesCommand(nodes, ['future-group'])).toBeNull()
  expect(createUngroupNodesCommand(nodes, ['child'])).toBeNull()
})

test('unsupported nodes reject every graph mutation and retain child references', async () => {
  const nodes: CanvasNode[] = [
    {
      id: 'future-group', type: 'group', title: '未来组合', x: 0, y: 0, width: 480, height: 320,
      contentData: { subtype: 'group', serialization_version: 2 },
    },
    {
      id: 'child', type: 'script', title: '脚本', x: 40, y: 40, width: 320, height: 200,
      parentNodeId: 'future-group', contentData: { subtype: 'script', serialization_version: 1 },
    },
  ]
  const parentUpdates: Array<[string, string | null]> = []
  const deletedNodes: string[] = []
  const createdNodes: CanvasNode[] = []
  const lockUpdates: Array<[string, boolean]> = []
  const executor = createCanvasCommandExecutor({
    getNodes: () => nodes,
    getConnections: () => [],
    createNode: async (draft) => {
      const created = { id: `copy-${createdNodes.length + 1}`, ...draft }
      createdNodes.push(created)
      return created
    },
    createConnection: async () => { throw new Error('not used') },
    deleteNode: async (nodeId) => { deletedNodes.push(nodeId) },
    deleteConnection: async () => undefined,
    updateNodeParent: async (nodeId, parentNodeId) => {
      parentUpdates.push([nodeId, parentNodeId])
      const node = nodes.find((candidate) => candidate.id === nodeId)
      if (node) node.parentNodeId = parentNodeId ?? undefined
    },
    updateNodeLocked: async (nodeId, locked) => { lockUpdates.push([nodeId, locked]) },
    queueNodeMove: () => undefined,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })

  expect(isArrangeEligibleNode(nodes[0])).toBe(false)
  nodes[0].x = 24
  expect(createMoveNodesCommand([{ nodeId: 'future-group', x: 0, y: 0 }], nodes)).toBeNull()
  expect(createGroupNodesCommand([
    nodes[0],
    { id: 'peer', type: 'script', title: '同伴', x: 520, y: 0, width: 320, height: 200 },
  ], ['future-group', 'peer'])).toBeNull()
  expect(createSetNodesLockedCommand(nodes, ['future-group'], true)).toBeNull()

  await executor.executeCommand({
    source: 'keyboard',
    command: createDuplicateNodesCommand(['future-group'])!,
  })
  await executor.executeCommand({
    source: 'keyboard',
    command: { type: 'delete-selection', nodeIds: ['future-group'], connectionIds: [] },
  })
  await executor.executeCommand({
    source: 'keyboard',
    command: { type: 'delete-selection', nodeIds: ['child'], connectionIds: [] },
  })
  await executor.executeCommand({
    source: 'toolbar',
    command: { type: 'set-nodes-locked', nodeIds: ['future-group'], locked: true },
  })

  expect(createdNodes).toEqual([])
  expect(parentUpdates).toEqual([])
  expect(deletedNodes).toEqual([])
  expect(lockUpdates).toEqual([])
  expect(nodes[1].parentNodeId).toBe('future-group')
})

test('commands reject secondary child and edge mutations that touch unsupported nodes', async () => {
  const nodes: CanvasNode[] = [
    {
      id: 'group', type: 'group', title: '组合', x: 0, y: 0, width: 480, height: 320,
      contentData: { subtype: 'group', serialization_version: 1 },
    },
    {
      id: 'future-child', type: 'future-storyboard', title: '未来节点', x: 40, y: 40,
      width: 320, height: 200, parentNodeId: 'group', contentData: { serialization_version: 7 },
    },
    {
      id: 'script', type: 'script', title: '脚本', x: 560, y: 40, width: 320, height: 200,
      contentData: { subtype: 'script', serialization_version: 1 },
    },
    {
      id: 'safe-note', type: 'note', title: '笔记', x: 920, y: 40, width: 260, height: 180,
      contentData: { subtype: 'annotation', serialization_version: 1 },
    },
  ]
  const connections: CanvasConnection[] = [{
    id: 'future-edge', from: 'script', to: 'future-child', sourcePort: 'out', targetPort: 'in',
  }]
  const parentUpdates: Array<[string, string | null]> = []
  const deletedNodes: string[] = []
  const deletedConnections: string[] = []
  const queuedMoves: string[] = []
  const executor = createCanvasCommandExecutor({
    getNodes: () => nodes,
    getConnections: () => connections,
    createNode: async () => { throw new Error('not used') },
    createConnection: async () => { throw new Error('not used') },
    deleteNode: async (nodeId) => { deletedNodes.push(nodeId) },
    deleteConnection: async (connectionId) => { deletedConnections.push(connectionId) },
    updateNodeParent: async (nodeId, parentNodeId) => { parentUpdates.push([nodeId, parentNodeId]) },
    updateNodeLocked: async () => undefined,
    queueNodeMove: (nodeId) => { queuedMoves.push(nodeId) },
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })

  expect(createUngroupNodesCommand(nodes, ['group'])).toBeNull()
  await executor.executeCommand({
    source: 'pointer',
    command: {
      type: 'move-nodes',
      moves: [
        { nodeId: 'safe-note', from: { nodeId: 'safe-note', x: 920, y: 40 }, to: { nodeId: 'safe-note', x: 940, y: 40 } },
        { nodeId: 'future-child', from: { nodeId: 'future-child', x: 40, y: 40 }, to: { nodeId: 'future-child', x: 60, y: 40 } },
      ],
    },
  })
  await executor.executeCommand({
    source: 'keyboard',
    command: { type: 'delete-selection', nodeIds: ['safe-note', 'future-child'], connectionIds: [] },
  })
  await executor.executeCommand({
    source: 'toolbar', command: { type: 'delete-selection', nodeIds: ['group'], connectionIds: [] },
  })
  await executor.executeCommand({
    source: 'keyboard', command: { type: 'delete-selection', nodeIds: [], connectionIds: ['future-edge'] },
  })

  expect(parentUpdates).toEqual([])
  expect(queuedMoves).toEqual([])
  expect(deletedNodes).toEqual([])
  expect(deletedConnections).toEqual([])
})

test('duplicate command copies selected nodes and only their internal connections', async () => {
  const nodes = reactive<CanvasNode[]>([
    {
      id: 'node-a', type: 'generation', title: 'A', x: 10, y: 20, width: 240, height: 140,
      contentData: {
        subtype: 'image', serialization_version: 1, nested: { value: 1 },
        generation_status: 'succeeded', generation_task_id: 'task-old',
        result_materialized_task_id: 'task-old',
      },
    },
    { id: 'node-b', type: 'image', title: 'B', x: 310, y: 20, width: 240, height: 140 },
    { id: 'node-c', type: 'result', title: 'C', x: 610, y: 20, width: 240, height: 140 },
  ])
  const connections = reactive<CanvasConnection[]>([
    { id: 'internal', from: 'node-a', to: 'node-b', sourcePort: 'out', targetPort: 'in' },
    { id: 'external', from: 'node-b', to: 'node-c', sourcePort: 'out', targetPort: 'in' },
  ])
  const createdConnections: Array<Omit<CanvasConnection, 'id'>> = []
  let selection: string[] = []
  const executor = createCanvasCommandExecutor({
    getNodes: () => nodes,
    getConnections: () => connections,
    createNode: async (draft) => {
      const created = { id: `copy-${nodes.length}`, ...draft }
      nodes.push(created)
      return created
    },
    createConnection: async (draft) => {
      createdConnections.push(draft)
      return { id: 'copy-connection', ...draft }
    },
    deleteNode: async () => undefined,
    deleteConnection: async () => undefined,
    updateNodeParent: async () => undefined,
    updateNodeLocked: async () => undefined,
    queueNodeMove: () => undefined,
    setSelection: (nodeIds) => { selection = nodeIds },
    selectConnection: () => undefined,
  })

  await executor.executeCommand({
    source: 'context-menu',
    command: createDuplicateNodesCommand(['node-a', 'node-b'])!,
  })

  expect(nodes.slice(-2).map(({ id, title, x, y }) => ({ id, title, x, y }))).toEqual([
    { id: 'copy-3', title: 'A 副本', x: 42, y: 52 },
    { id: 'copy-4', title: 'B 副本', x: 342, y: 52 },
  ])
  expect(createdConnections).toEqual([expect.objectContaining({ from: 'copy-3', to: 'copy-4' })])
  expect(selection).toEqual(['copy-3', 'copy-4'])
  expect(nodes[3].contentData).toEqual({
    subtype: 'image', serialization_version: 1, nested: { value: 1 },
  })
})

test('move and delete envelopes execute each selected target through one dispatcher', async () => {
  const queuedMoves: Array<[string, number, number]> = []
  const deletedNodes: string[] = []
  const deletedConnections: string[] = []
  const executor = createCanvasCommandExecutor({
    getNodes: () => [
      { id: 'node-a', type: 'text', title: 'A', x: 10, y: 20, width: 240, height: 140 },
      { id: 'node-b', type: 'text', title: 'B', x: 30, y: 40, width: 240, height: 140 },
    ],
    getConnections: () => [{ id: 'connection-a', from: 'node-a', to: 'node-b' }],
    createNode: async () => { throw new Error('not used') },
    createConnection: async () => { throw new Error('not used') },
    deleteNode: async (nodeId) => { deletedNodes.push(nodeId) },
    deleteConnection: async (connectionId) => { deletedConnections.push(connectionId) },
    updateNodeParent: async () => undefined,
    updateNodeLocked: async () => undefined,
    queueNodeMove: (nodeId, x, y) => { queuedMoves.push([nodeId, x, y]) },
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })

  await executor.executeCommand({
    source: 'pointer',
    command: {
      type: 'move-nodes',
      moves: [
        { nodeId: 'node-a', from: { nodeId: 'node-a', x: 0, y: 0 }, to: { nodeId: 'node-a', x: 10, y: 20 } },
        { nodeId: 'missing', from: { nodeId: 'missing', x: 0, y: 0 }, to: { nodeId: 'missing', x: 50, y: 60 } },
      ],
    },
  })
  await executor.executeCommand({
    source: 'keyboard',
    command: createDeleteSelectionCommand(['node-b', 'node-a'], ['connection-a'])!,
  })

  expect(queuedMoves).toEqual([['node-a', 10, 20]])
  expect(deletedConnections).toEqual(['connection-a'])
  expect(deletedNodes).toEqual(['node-b', 'node-a'])
})

test('group, ungroup, and connect commands validate and execute deterministic graph changes', async () => {
  const nodes: CanvasNode[] = [
    { id: 'node-a', type: 'text', title: 'A', x: 100, y: 80, width: 240, height: 140 },
    { id: 'node-b', type: 'image', title: 'B', x: 420, y: 180, width: 200, height: 160 },
  ]
  const connections: CanvasConnection[] = []
  const parentUpdates: Array<[string, string | null]> = []
  const deletedNodes: string[] = []
  let selection: string[] = []
  const executor = createCanvasCommandExecutor({
    getNodes: () => nodes,
    getConnections: () => connections,
    createNode: async (draft) => {
      const created = { id: 'group-1', ...draft }
      nodes.push(created)
      return created
    },
    createConnection: async (draft) => {
      const created = { id: 'connection-ac', ...draft }
      connections.push(created)
      return created
    },
    updateNodeParent: async (nodeId, parentNodeId) => {
      parentUpdates.push([nodeId, parentNodeId])
      const target = nodes.find((node) => node.id === nodeId)
      if (target) target.parentNodeId = parentNodeId
    },
    updateNodeLocked: async () => undefined,
    deleteNode: async (nodeId) => { deletedNodes.push(nodeId) },
    deleteConnection: async () => undefined,
    queueNodeMove: () => undefined,
    setSelection: (nodeIds) => { selection = nodeIds },
    selectConnection: () => undefined,
  })

  await executor.executeCommand({
    source: 'toolbar',
    command: createGroupNodesCommand(nodes, ['node-b', 'node-a'])!,
  })
  expect(nodes.at(-1)).toEqual(expect.objectContaining({
    id: 'group-1', type: 'group', x: 76, y: 56, width: 568, height: 308,
    contentData: { subtype: 'group', serialization_version: 1 },
  }))
  expect(parentUpdates).toEqual([['node-a', 'group-1'], ['node-b', 'group-1']])
  expect(selection).toEqual(['group-1'])

  await executor.executeCommand({
    source: 'keyboard',
    command: createUngroupNodesCommand(nodes, ['group-1'])!,
  })
  expect(parentUpdates.slice(-2)).toEqual([['node-a', null], ['node-b', null]])
  expect(deletedNodes).toEqual(['group-1'])
  expect(selection).toEqual(['node-a', 'node-b'])

  await executor.executeCommand({
    source: 'pointer',
    command: createConnectNodesCommand(nodes, connections, 'node-a', 'node-b')!,
  })
  expect(connections).toEqual([expect.objectContaining({ from: 'node-a', to: 'node-b' })])
  expect(createConnectNodesCommand(nodes, connections, 'node-a', 'node-b')).toBeNull()
})
