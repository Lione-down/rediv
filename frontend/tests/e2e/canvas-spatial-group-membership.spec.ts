import { expect, test } from '@playwright/test'
import {
  createMoveNodeMembershipCommand,
  resolveSpatialGroupParent,
} from '../../src/modules/canvas/canvas-commands'
import type { CanvasNode } from '../../src/types/canvas'

function node(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  parentNodeId: string | null = null,
): CanvasNode {
  return {
    id,
    type: 'script',
    title: id,
    x,
    y,
    width,
    height,
    parentNodeId,
    contentData: { subtype: 'script', serialization_version: 1 },
  }
}

function group(id: string, x: number, y: number, width: number, height: number): CanvasNode {
  return {
    id,
    type: 'group',
    title: id,
    x,
    y,
    width,
    height,
    contentData: { subtype: 'group', serialization_version: 1 },
  }
}

test('full containment adds or removes one stable node from a spatial group', () => {
  const container = group('group-one', 100, 100, 500, 360)
  const child = node('child', 140, 150, 180, 120, container.id)
  const outsider = node('outsider', 680, 170, 180, 120)
  const nodes = [container, child, outsider]

  expect(resolveSpatialGroupParent(nodes, child.id, { x: 620, y: 150 })).toBeNull()
  expect(createMoveNodeMembershipCommand(
    nodes,
    child.id,
    { x: 620, y: 150 },
  )).toMatchObject({
    type: 'move-node-membership',
    move: { nodeId: child.id, from: { x: 140, y: 150 }, to: { x: 620, y: 150 } },
    fromParentNodeId: container.id,
    toParentNodeId: null,
  })

  expect(resolveSpatialGroupParent(nodes, outsider.id, { x: 350, y: 260 })).toBe(container.id)
  expect(createMoveNodeMembershipCommand(
    nodes,
    outsider.id,
    { x: 350, y: 260 },
  )).toMatchObject({
    fromParentNodeId: null,
    toParentNodeId: container.id,
  })
})

test('partial overlap stays outside and storyboard containers are not implicit spatial groups', () => {
  const container = group('group-one', 100, 100, 500, 360)
  const storyboard = {
    ...group('storyboard', 700, 100, 500, 360),
    contentData: { subtype: 'storyboard', serialization_version: 1 },
  }
  const outsider = node('outsider', 0, 0, 180, 120)
  const nodes = [container, storyboard, outsider]

  expect(resolveSpatialGroupParent(nodes, outsider.id, { x: 540, y: 200 })).toBeNull()
  expect(resolveSpatialGroupParent(nodes, outsider.id, { x: 760, y: 180 })).toBeNull()

  const member = node('member', 140, 150, 180, 120, container.id)
  expect(resolveSpatialGroupParent(
    [...nodes, member],
    member.id,
    { x: 540, y: 200 },
  )).toBe(container.id)
})
