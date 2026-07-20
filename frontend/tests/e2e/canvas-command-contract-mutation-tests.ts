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

test('duplicate command copies selected nodes and only their internal connections', async () => {
  const nodes = reactive<CanvasNode[]>([
    {
      id: 'node-a', type: 'generation', title: 'A', x: 10, y: 20, width: 240, height: 140,
      contentData: {
        subtype: 'image', serialization_version: 1, nested: { value: 1 },
        generation_parameters: {
          schema_version: 1,
          image: {
            aspect_ratio: '4:3',
            shot_controls: {
              contract_version: 1, angle: 'high-angle', framing: 'medium', focus: 'deep', lighting: 'natural', temporal: 'hold',
            },
          },
        },
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
    generation_parameters: {
      schema_version: 1,
      image: {
        aspect_ratio: '4:3',
        shot_controls: {
          contract_version: 1, angle: 'high-angle', framing: 'medium', focus: 'deep', lighting: 'natural', temporal: 'hold',
        },
      },
    },
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

test('group command encloses canonical visible media bounds', async () => {
  const nodes: CanvasNode[] = [
    { id: 'node-a', type: 'script', title: 'A', x: 100, y: 80, width: 240, height: 140 },
    {
      id: 'node-b', type: 'asset', title: 'Portrait', x: 420, y: 180, width: 200, height: 160,
      contentData: {
        subtype: 'image', serialization_version: 1, url: '/uploads/portrait.png', aspect_ratio: 0.5,
      },
    },
  ]
  let createdGroup: CanvasNode | null = null
  const executor = createCanvasCommandExecutor({
    getNodes: () => nodes,
    getConnections: () => [],
    createNode: async (draft) => {
      createdGroup = { id: 'group-visible-bounds', ...draft }
      nodes.push(createdGroup)
      return createdGroup
    },
    createConnection: async () => { throw new Error('not used') },
    updateNodeParent: async (nodeId, parentNodeId) => {
      const target = nodes.find((node) => node.id === nodeId)
      if (target) target.parentNodeId = parentNodeId
    },
    updateNodeLocked: async () => undefined,
    deleteNode: async () => undefined,
    deleteConnection: async () => undefined,
    queueNodeMove: () => undefined,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })

  await executor.executeCommand({
    source: 'toolbar',
    command: createGroupNodesCommand(nodes, ['node-a', 'node-b'])!,
  })

  expect(createdGroup).toEqual(expect.objectContaining({
    x: 76,
    y: 56,
    width: 468,
    height: 348,
  }))
})
