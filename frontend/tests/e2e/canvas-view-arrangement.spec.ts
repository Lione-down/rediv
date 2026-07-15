import { expect, test } from '@playwright/test'
import {
  CANVAS_GRID_SIZE,
  clampZoom,
  fitViewportToNodes,
  revealWorldRectViewport,
  snapDeltaToGrid,
} from '../../src/components/canvas/canvas-geometry'
import {
  createAlignNodesCommand,
  createAutoArrangeNodesCommand,
  createDistributeNodesCommand,
  createSetNodesLockedCommand,
  createUngroupNodesCommand,
} from '../../src/modules/canvas/canvas-commands'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

const nodes: CanvasNode[] = [
  { id: 'a', type: 'text', title: 'A', x: 100, y: 80, width: 200, height: 120 },
  { id: 'b', type: 'image', title: 'B', x: 420, y: 260, width: 160, height: 100 },
  { id: 'c', type: 'result', title: 'C', x: 760, y: 140, width: 220, height: 140 },
  { id: 'd', type: 'text', title: 'D', x: 1080, y: 360, width: 180, height: 120 },
]

test('fit geometry and grid snapping stay finite across the 10% to 800% contract', () => {
  expect(clampZoom(0.01)).toBe(0.1)
  expect(clampZoom(12)).toBe(8)
  expect(fitViewportToNodes([], { width: 1000, height: 600 })).toBeNull()

  const fitted = fitViewportToNodes(nodes.slice(0, 2), { width: 1000, height: 600 }, 50)
  expect(fitted?.zoom).toBeCloseTo(1.785714, 5)
  expect(fitted?.x).toBeCloseTo(-107.142857, 5)
  expect(fitted?.y).toBeCloseTo(-92.857143, 5)
  expect(snapDeltaToGrid({ x: 10, y: -10 }, { x: 19, y: -17 })).toEqual({ x: 14, y: -14 })
  expect(CANVAS_GRID_SIZE).toBe(24)
})

test('result reveal preserves zoom and applies only the minimum panel-safe translation', () => {
  const viewport = { x: 0, y: 0, zoom: 1 }
  const size = { width: 1440, height: 900 }
  const insets = { top: 96, right: 376, bottom: 96, left: 336 }
  expect(revealWorldRectViewport(
    { left: 400, top: 200, width: 320, height: 180 }, viewport, size, insets,
  )).toEqual(viewport)
  expect(revealWorldRectViewport(
    { left: 900, top: 700, width: 320, height: 180 }, viewport, size, insets,
  )).toEqual({ x: -180, y: -100, zoom: 1 })
  expect(revealWorldRectViewport(
    { left: 0, top: 0, width: 900, height: 700 }, { x: 12, y: 18, zoom: 1 }, size, insets,
  )).toEqual({ x: 250, y: 100, zoom: 1 })
})

test('align and distribute commands emit deterministic reversible moves', () => {
  const aligned = createAlignNodesCommand(nodes, ['c', 'a', 'b'], 'left')
  expect(aligned).toEqual({
    type: 'arrange-nodes',
    operation: { kind: 'align', alignment: 'left' },
    moves: [
      { nodeId: 'b', from: { nodeId: 'b', x: 420, y: 260 }, to: { nodeId: 'b', x: 100, y: 260 } },
      { nodeId: 'c', from: { nodeId: 'c', x: 760, y: 140 }, to: { nodeId: 'c', x: 100, y: 140 } },
    ],
  })

  const distributed = createDistributeNodesCommand(nodes, ['d', 'b', 'a', 'c'], 'horizontal')
  expect(distributed?.moves.map((move) => move.nodeId)).toEqual(['b', 'c'])
  expect(distributed?.moves.every((move) => move.from.nodeId === move.to.nodeId)).toBe(true)
})

test('auto-arrange is stable, graph-ordered, and non-overlapping', () => {
  const connections: CanvasConnection[] = [
    { id: 'ab', from: 'a', to: 'b' },
    { id: 'ac', from: 'a', to: 'c' },
    { id: 'bd', from: 'b', to: 'd' },
  ]
  const first = createAutoArrangeNodesCommand(nodes, connections, ['d', 'c', 'b', 'a'])
  const second = createAutoArrangeNodesCommand(nodes, connections, ['a', 'b', 'c', 'd'])
  expect(first).toEqual(second)
  expect(first?.operation).toEqual({ kind: 'auto-arrange' })

  const positions = new Map(nodes.map((node) => [node.id, { x: node.x, y: node.y }]))
  for (const move of first?.moves ?? []) positions.set(move.nodeId, move.to)
  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      const left = nodes[leftIndex]
      const right = nodes[rightIndex]
      const leftPosition = positions.get(left.id)!
      const rightPosition = positions.get(right.id)!
      const overlaps = !(
        leftPosition.x + left.width <= rightPosition.x || rightPosition.x + right.width <= leftPosition.x ||
        leftPosition.y + left.height <= rightPosition.y || rightPosition.y + right.height <= leftPosition.y
      )
      expect(overlaps, `${left.id} and ${right.id} must not overlap`).toBe(false)
    }
  }
})

test('arrangement rejects protected nodes and lock commands follow graph order', () => {
  const protectedNodes: CanvasNode[] = [
    nodes[0],
    { ...nodes[1], isLocked: true },
    { ...nodes[2], parentNodeId: 'group' },
  ]
  expect(createAlignNodesCommand(protectedNodes, ['a', 'b'], 'top')).toBeNull()
  expect(createAutoArrangeNodesCommand(protectedNodes, [], ['a', 'c'])).toBeNull()
  expect(createSetNodesLockedCommand(protectedNodes, ['c', 'a'], true)).toEqual({
    type: 'set-nodes-locked', nodeIds: ['a', 'c'], locked: true,
  })
  expect(createSetNodesLockedCommand(protectedNodes, ['b'], true)).toBeNull()
  expect(createUngroupNodesCommand([
    { ...nodes[0], id: 'group', type: 'group' },
    { ...nodes[1], parentNodeId: 'group', isLocked: true },
  ], ['b'])).toBeNull()
})
