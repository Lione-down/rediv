import { expect, test } from '@playwright/test'
import { findFirstUnoccupiedPosition } from '../../src/modules/canvas/graph-placement'
import {
  canBranchFromImageResult,
  createGeneratedResultCommand,
  createResultGenerationBranchCommand,
} from '../../src/modules/canvas/resource-commands'
import type { Asset } from '../../src/types/asset'
import type { CanvasNode } from '../../src/types/canvas'
import type { GenerationTask } from '../../src/modules/canvas/project-resource-types'

const source: CanvasNode = {
  id: 'generation', type: 'generation', title: 'Generation', x: 100, y: 120,
  width: 340, height: 220, contentData: { subtype: 'image', serialization_version: 1 },
}

function asset(id: string, taskId: string): Asset {
  return {
    id, user_id: 'user', project_id: 'project', origin_canvas_id: 'canvas',
    canvas_node_id: source.id, type: 'image', url: `https://media.test/${id}.png`,
    content_text: null, source: 'generation', source_model: 'mock-image-v1',
    source_task_id: taskId, status: 'active', created_at: '2026-07-15T10:00:00Z',
    updated_at: '2026-07-15T10:00:00Z',
  }
}

function task(id: string, assetId: string): GenerationTask {
  return {
    id, user_id: 'user', project_id: 'project', origin_canvas_id: 'canvas',
    canvas_node_id: source.id, media_type: 'image', provider: 'mock', model: 'mock-image-v1',
    provider_request_id: `request-${id}`, status: 'succeeded', duration_ms: 100,
    result_asset_id: assetId, error_code: null, error_message: null,
    created_at: '2026-07-15T10:00:00Z', updated_at: '2026-07-15T10:00:00Z',
  }
}

test('generated variants fill deterministic non-overlapping slots around occupied graph nodes', () => {
  const first = createGeneratedResultCommand(source, asset('asset-1', 'task-1'), task('task-1', 'asset-1'), [source]).nodes[0]
  expect(first).toMatchObject({ x: 536, y: 120 })

  const blocker: CanvasNode = {
    id: 'blocker', type: 'note', title: 'Occupied', x: 520, y: 324,
    width: 320, height: 200, contentData: { subtype: 'annotation', serialization_version: 1 },
  }
  const second = createGeneratedResultCommand(
    source, asset('asset-2', 'task-2'), task('task-2', 'asset-2'), [source, first, blocker],
  ).nodes[0]
  expect(second.x).toBe(536)
  expect(second.y).toBeGreaterThan(first.y + first.height)
  expect(second.y).toBeGreaterThan(blocker.y + blocker.height)

  const repeated = createGeneratedResultCommand(
    source, asset('asset-2', 'task-2'), task('task-2', 'asset-2'), [source, first, blocker],
  ).nodes[0]
  expect(repeated).toMatchObject({ x: second.x, y: second.y })
})

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
