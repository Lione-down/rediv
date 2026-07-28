import { expect, test } from '@playwright/test'
import { findFirstUnoccupiedPosition } from '../../src/modules/canvas/graph-placement'
import {
  canBranchFromImageResult,
  createResultGenerationBranchCommand,
} from '../../src/modules/canvas/resource-commands'
import type { CanvasNode } from '../../src/types/canvas'

test('placement scans beyond tall occupied bounds instead of assuming one slot per node', () => {
  const tallNode: CanvasNode = {
    id: 'tall', type: 'note', title: 'Tall blocker', x: 500, y: 100, width: 340, height: 900,
    contentData: { subtype: 'annotation', serialization_version: 1 },
  }
  expect(findFirstUnoccupiedPosition(
    { x: 500, y: 100 }, { width: 340, height: 220 }, [tallNode],
  )).toEqual({ x: 500, y: 1076 })
})

test('image result branch is guarded, typed, ordered, and collision-aware', () => {
  const result: CanvasNode = {
    id: 'result', type: 'result', title: 'Result', x: 520, y: 120, width: 360, height: 280,
    contentData: { subtype: 'image', serialization_version: 1, asset_id: 'asset-result' },
  }
  const blocker: CanvasNode = {
    id: 'blocker', type: 'note', title: 'Occupied', x: 976, y: 120, width: 340, height: 220,
    contentData: { subtype: 'annotation', serialization_version: 1 },
  }
  expect(canBranchFromImageResult(result)).toBe(true)
  const command = createResultGenerationBranchCommand(result, 'video', [result, blocker])!
  expect(command.nodes[0]).toMatchObject({ type: 'generation', x: 976, y: 364, contentData: { subtype: 'video' } })
  expect(command.connections).toEqual([expect.objectContaining({
    from: 'result', to: command.nodes[0].id, sourcePort: 'out', targetPort: 'media',
    metadata: { input_order: 1 },
  })])
  expect(createResultGenerationBranchCommand({ ...result, isLocked: true }, 'image')).toBeNull()
  expect(createResultGenerationBranchCommand({ ...result, contentData: { ...result.contentData, subtype: 'video' } }, 'image')).toBeNull()
  expect(createResultGenerationBranchCommand({ ...result, contentData: { subtype: 'image', serialization_version: 1 } }, 'video')).toBeNull()
})
