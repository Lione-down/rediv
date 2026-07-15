import { expect, test } from '@playwright/test'
import { createGeneratedResultCommand } from '../../src/modules/canvas/resource-commands'
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
