import { expect, test } from '@playwright/test'
import { reactive } from 'vue'
import { createCanvasCommandExecutor } from '../../src/modules/canvas/canvas-command-executor'
import {
  createDeleteSelectionCommand,
  createDuplicateNodesCommand,
  createMoveNodesCommand,
} from '../../src/modules/canvas/canvas-commands'
import { reduceCanvasSelection } from '../../src/modules/canvas/canvas-selection'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

const domain = {
  nodeIds: ['node-a', 'node-b', 'node-c'],
  connectionIds: ['connection-a'],
}

test('selection reducer follows graph order and keeps one deterministic primary target', () => {
  const empty = { nodeIds: [], primaryNodeId: '', connectionId: '' }
  const replaced = reduceCanvasSelection(domain, empty, {
    type: 'set-nodes',
    nodeIds: ['node-c', 'missing', 'node-a', 'node-c'],
    primaryNodeId: 'missing',
  })
  expect(replaced).toEqual({ nodeIds: ['node-a', 'node-c'], primaryNodeId: 'node-c', connectionId: '' })

  const added = reduceCanvasSelection(domain, replaced, { type: 'add-node', nodeId: 'node-b' })
  expect(added).toEqual({ nodeIds: ['node-a', 'node-b', 'node-c'], primaryNodeId: 'node-b', connectionId: '' })

  const toggled = reduceCanvasSelection(domain, added, { type: 'toggle-node', nodeId: 'node-b' })
  expect(toggled).toEqual({ nodeIds: ['node-a', 'node-c'], primaryNodeId: 'node-c', connectionId: '' })

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
})

test('duplicate command copies selected nodes and only their internal connections', async () => {
  const nodes = reactive<CanvasNode[]>([
    { id: 'node-a', type: 'text', title: 'A', x: 10, y: 20, width: 240, height: 140, contentData: { nested: { value: 1 } } },
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
    getConnections: () => [],
    createNode: async () => { throw new Error('not used') },
    createConnection: async () => { throw new Error('not used') },
    deleteNode: async (nodeId) => { deletedNodes.push(nodeId) },
    deleteConnection: async (connectionId) => { deletedConnections.push(connectionId) },
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
