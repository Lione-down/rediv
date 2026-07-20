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
  resolveCanvasDragNodeIds,
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

test('group drag resolution expands parent before children and rejects partial protected units', () => {
  const nodes: CanvasNode[] = [
    { id: 'group-a', type: 'group', title: '组合 A', x: 80, y: 60, width: 640, height: 360,
      contentData: { subtype: 'group', serialization_version: 1 } },
    { id: 'child-a', type: 'script', title: '子节点 A', x: 120, y: 110, width: 320, height: 200,
      parentNodeId: 'group-a', contentData: { subtype: 'script', serialization_version: 1 } },
    { id: 'child-b', type: 'asset', title: '子节点 B', x: 460, y: 130, width: 240, height: 180,
      parentNodeId: 'group-a', contentData: { subtype: 'image', serialization_version: 1 } },
    { id: 'unrelated', type: 'note', title: '无关节点', x: 900, y: 80, width: 260, height: 180,
      contentData: { subtype: 'annotation', serialization_version: 1 } },
  ]

  expect(resolveCanvasDragNodeIds(nodes, ['group-a'])).toEqual(['group-a', 'child-a', 'child-b'])
  expect(resolveCanvasDragNodeIds(nodes, ['child-a'])).toBeNull()

  const origins = nodes.slice(0, 3).map(({ id, x, y }) => ({ nodeId: id, x, y }))
  for (const node of nodes.slice(0, 3)) {
    node.x += 72
    node.y -= 40
  }
  expect(createMoveNodesCommand(origins, nodes)?.moves.map((move) => move.nodeId)).toEqual([
    'group-a', 'child-a', 'child-b',
  ])

  nodes[2].isLocked = true
  expect(resolveCanvasDragNodeIds(nodes, ['group-a'])).toBeNull()
  nodes[2].isLocked = false
  nodes[2].type = 'future-storyboard'
  nodes[2].contentData = { serialization_version: 7 }
  expect(resolveCanvasDragNodeIds(nodes, ['group-a'])).toBeNull()
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
