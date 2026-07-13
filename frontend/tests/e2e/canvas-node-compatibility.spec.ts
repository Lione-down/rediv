import { expect, test } from '@playwright/test'
import { parseCanvasRecoverySnapshot } from '../../src/modules/canvas/canvas-recovery'
import { toCanvasDocumentNodeUpsert } from '../../src/modules/canvas/node-serialization'
import { mapCanvasNode } from '../../src/modules/canvas/mappers'
import { toNodeCreatePayload } from '../../src/modules/canvas/persistence'
import type { CanvasNodeDto } from '../../src/modules/canvas/types'

const unknownNode: CanvasNodeDto = {
  id: 'node-future',
  project_id: 'project-1',
  canvas_id: 'canvas-1',
  node_type: 'future-storyboard',
  content: {
    title: '未来分镜',
    serialization_version: 7,
    nested: { beats: ['开场', '转折'] },
  },
  position_x: -240,
  position_y: 180,
  width: 360,
  height: 220,
  z_index: 4,
  parent_node_id: null,
  is_locked: false,
  is_collapsed: false,
  status: 'active',
  created_at: '2026-07-13T00:00:00Z',
  updated_at: '2026-07-13T00:00:00Z',
}

test('unknown future node types preserve their identifier and serialized content', () => {
  const mapped = mapCanvasNode(unknownNode)
  const serialized = toNodeCreatePayload(mapped)

  expect(mapped.type).toBe('future-storyboard')
  expect(mapped.contentData).toEqual(unknownNode.content)
  expect(serialized.node_type).toBe('future-storyboard')
  expect(serialized.content).toEqual(unknownNode.content)
})

test('unsupported node serialization never injects a fallback title into raw content', () => {
  const rawContent = { serialization_version: 9, future_payload: { frames: 12 } }
  const mapped = mapCanvasNode({ ...unknownNode, content: rawContent })

  expect(mapped.title).toBe('不支持的节点')
  expect(toNodeCreatePayload(mapped).content).toEqual(rawContent)
  expect(toCanvasDocumentNodeUpsert(mapped).content).toEqual(rawContent)
})

test('local recovery accepts a bounded unknown node without rewriting the graph', () => {
  const snapshot = parseCanvasRecoverySnapshot(JSON.stringify({
    version: 1,
    projectId: 'project-1',
    canvasId: 'canvas-1',
    baseRevision: 0,
    clientMutationId: null,
    baseDocument: null,
    batchDocument: null,
    document: {
      node_upserts: [{
        id: unknownNode.id,
        node_type: unknownNode.node_type,
        content: unknownNode.content,
        position_x: unknownNode.position_x,
        position_y: unknownNode.position_y,
        width: unknownNode.width,
        height: unknownNode.height,
        z_index: unknownNode.z_index,
        parent_node_id: unknownNode.parent_node_id,
        is_locked: unknownNode.is_locked,
        is_collapsed: unknownNode.is_collapsed,
      }],
      connection_upserts: [],
    },
    payload: null,
    savedAt: '2026-07-13T00:00:00Z',
  }), { projectId: 'project-1', canvasId: 'canvas-1' })

  expect(snapshot.desiredDocument.node_upserts[0]).toEqual(expect.objectContaining({
    node_type: 'future-storyboard',
    content: unknownNode.content,
  }))
})
