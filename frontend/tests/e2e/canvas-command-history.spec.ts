import { expect, test } from '@playwright/test'
import { createCanvasCommandHistory } from '../../src/modules/canvas/canvas-command-history'
import type { CanvasCommandEnvelope } from '../../src/modules/canvas/canvas-commands'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

function node(id: string, x = 0): CanvasNode {
  return { id, type: 'text', title: id, x, y: 0, width: 240, height: 140 }
}

function move(nodeId: string, from: number, to: number): CanvasCommandEnvelope {
  return {
    source: 'keyboard',
    command: {
      type: 'move-nodes',
      moves: [{
        nodeId,
        from: { nodeId, x: from, y: 0 },
        to: { nodeId, x: to, y: 0 },
      }],
    },
  }
}

test('history restores pointer-preapplied positions and invalidates redo after new work', async () => {
  let nodes = [node('node-a', 20)]
  let connections: CanvasConnection[] = []
  const history = createCanvasCommandHistory({
    getNodes: () => nodes,
    getConnections: () => connections,
    executeCommand: async (envelope) => {
      if (envelope.command.type !== 'move-nodes') return
      for (const item of envelope.command.moves) {
        nodes = nodes.map((current) => current.id === item.nodeId
          ? { ...current, x: item.to.x, y: item.to.y }
          : current)
      }
    },
    applyGraph: async (nextNodes, nextConnections) => {
      nodes = nextNodes
      connections = nextConnections
    },
  })
  history.activate('user/project/canvas-a')

  await history.execute(move('node-a', 0, 20))
  expect(history.getState()).toEqual({ canUndo: true, canRedo: false, undoCount: 1, redoCount: 0 })
  await history.undo()
  expect(nodes[0].x).toBe(0)
  expect(history.getState().canRedo).toBe(true)

  await history.execute(move('node-a', 0, 40))
  expect(nodes[0].x).toBe(40)
  expect(history.getState()).toEqual({ canUndo: true, canRedo: false, undoCount: 1, redoCount: 0 })
})

test('history retains the latest 100 commands and isolates normal switch from forced reload', async () => {
  let nodes = [node('node-a')]
  let connections: CanvasConnection[] = []
  const history = createCanvasCommandHistory({
    getNodes: () => nodes,
    getConnections: () => connections,
    executeCommand: async (envelope) => {
      if (envelope.command.type !== 'move-nodes') return
      const target = envelope.command.moves[0]
      nodes = nodes.map((current) => current.id === target.nodeId ? { ...current, x: target.to.x } : current)
    },
    applyGraph: async (nextNodes, nextConnections) => {
      nodes = nextNodes
      connections = nextConnections
    },
  })

  history.activate('user/project/canvas-a')
  for (let index = 1; index <= 101; index += 1) await history.execute(move('node-a', index - 1, index))
  expect(history.getState().undoCount).toBe(100)
  for (let index = 0; index < 100; index += 1) await history.undo()
  expect(nodes[0].x).toBe(1)
  expect(await history.undo()).toBe(false)

  nodes = [node('node-b')]
  history.activate('user/project/canvas-b')
  expect(history.getState().undoCount).toBe(0)
  await history.execute(move('node-b', 0, 10))
  expect(history.getState().undoCount).toBe(1)

  nodes = [node('node-a', 101)]
  history.activate('user/project/canvas-a')
  expect(history.getState()).toEqual({ canUndo: false, canRedo: true, undoCount: 0, redoCount: 100 })
  history.activate('user/project/canvas-a', { reset: true })
  expect(history.getState()).toEqual({ canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 })
})
