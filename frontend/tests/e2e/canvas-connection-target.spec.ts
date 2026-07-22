import { expect, test } from '@playwright/test'
import { findNearestConnectionTarget } from '../../src/components/canvas/canvas-connection-target'
import { nodePortWorldAnchor } from '../../src/components/canvas/canvas-geometry'
import { getAuthoringConnectionPorts } from '../../src/modules/canvas/node-registry'
import type { CanvasNode } from '../../src/types/canvas'

const source: CanvasNode = {
  id: 'script-source', type: 'script', title: 'Source', x: 0, y: 0, width: 320, height: 200,
  contentData: { subtype: 'script', serialization_version: 1 },
}
const incompatible: CanvasNode = {
  id: 'result-nearest', type: 'result', title: 'Nearest incompatible', x: 500, y: 0, width: 320, height: 180,
  contentData: { subtype: 'image', serialization_version: 1 },
}
const compatible: CanvasNode = {
  id: 'generation-compatible', type: 'generation', title: 'Compatible', x: 512, y: 0, width: 340, height: 220,
  contentData: { subtype: 'image', serialization_version: 1 },
}

function compatibleInput(node: CanvasNode, portId: string) {
  return Boolean(getAuthoringConnectionPorts(source, node, 'out', portId))
}

test('nearest compatible target wins over a closer incompatible port', () => {
  const nearestAnchor = nodePortWorldAnchor(incompatible, 'input', 'in')
  const compatibleAnchor = nodePortWorldAnchor(compatible, 'input', 'prompt')
  compatible.y += nearestAnchor.y - compatibleAnchor.y

  const resolveTarget = findNearestConnectionTarget as unknown as (
    ...args: [...Parameters<typeof findNearestConnectionTarget>, (node: CanvasNode, portId: string) => boolean]
  ) => ReturnType<typeof findNearestConnectionTarget>
  const target = resolveTarget(
    nearestAnchor, source.id, [source, incompatible, compatible], { x: 0, y: 0, zoom: 1 }, 'input', 24,
    compatibleInput,
  )

  expect(target).toMatchObject({
    node: { id: compatible.id }, portId: 'prompt', distance: 12,
    anchor: nodePortWorldAnchor(compatible, 'input', 'prompt'),
  })
})

test('no compatible target returns null instead of claiming an incompatible port', () => {
  const nearestAnchor = nodePortWorldAnchor(incompatible, 'input', 'in')
  const resolveTarget = findNearestConnectionTarget as unknown as (
    ...args: [...Parameters<typeof findNearestConnectionTarget>, (node: CanvasNode, portId: string) => boolean]
  ) => ReturnType<typeof findNearestConnectionTarget>

  expect(resolveTarget(
    nearestAnchor, source.id, [source, incompatible], { x: 0, y: 0, zoom: 1 }, 'input', 24,
    compatibleInput,
  )).toBeNull()
})

test('default compatible target acquisition uses an exact forty CSS pixel diameter', () => {
  const anchor = nodePortWorldAnchor(compatible, 'input', 'prompt')
  expect(findNearestConnectionTarget(
    { x: anchor.x + 20, y: anchor.y }, source.id, [source, compatible], { x: 0, y: 0, zoom: 1 }, 'input',
  )).toMatchObject({ node: { id: compatible.id }, portId: 'prompt', distance: 20 })
  expect(findNearestConnectionTarget(
    { x: anchor.x + 20.01, y: anchor.y }, source.id, [source, compatible], { x: 0, y: 0, zoom: 1 }, 'input',
  )).toBeNull()
})
