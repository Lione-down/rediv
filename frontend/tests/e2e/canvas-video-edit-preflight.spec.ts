import { expect, test } from '@playwright/test'
import {
  preflightVideoEdit,
  resolveVideoEditTemplate,
} from '../../src/modules/canvas/video-edit-preflight'
import type { Asset } from '../../src/types/asset'
import type { CanvasNode } from '../../src/types/canvas'

const PROJECT_ID = 'project-video-edit'
const CANVAS_ID = 'canvas-video-edit'
const USER_ID = 'user-video-edit'

function videoAsset(id: string, url: string, overrides: Partial<Asset> = {}): Asset {
  return {
    id, user_id: USER_ID, project_id: PROJECT_ID, origin_canvas_id: CANVAS_ID, canvas_node_id: null,
    type: 'video', url, content_text: id, source: 'upload', source_model: null, source_task_id: null,
    status: 'active', created_at: '', updated_at: '', ...overrides,
  }
}

function videoNode(id: string, assetId: string, url: string, overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id, type: 'result', title: id, x: 0, y: 0, width: 320, height: 180,
    contentData: { subtype: 'video', serialization_version: 1, asset_id: assetId, project_id: PROJECT_ID, origin_canvas_id: CANVAS_ID, url },
    ...overrides,
  }
}

function preflight(overrides: Partial<Parameters<typeof preflightVideoEdit>[0]> = {}) {
  const first = videoNode('video-first', 'asset-first', 'https://media.revid.test/first.mp4')
  const second = videoNode('video-second', 'asset-second', 'https://media.revid.test/second.mp4')
  return preflightVideoEdit({
    assets: [
      videoAsset('asset-first', 'https://media.revid.test/first.mp4'),
      videoAsset('asset-second', 'https://media.revid.test/second.mp4'),
    ],
    canvasId: CANVAS_ID,
    nodes: [first, second],
    operation: { kind: 'trim', start_seconds: 1.25, end_seconds: 4.5 },
    projectId: PROJECT_ID,
    selectedNodeIds: [first.id],
    template: { id: 'video-edit-preflight', version: 1 },
    userId: USER_ID,
    ...overrides,
  })
}

test('video edit template/preflight is exact, source-ordered, preview-only, and export fail-closed', () => {
  expect(resolveVideoEditTemplate('video-edit-preflight', 1)).toMatchObject({
    contract_version: 1, id: 'video-edit-preflight', execution_mode: 'preview-only',
  })
  expect(resolveVideoEditTemplate('video-edit-preflight', 2)).toBeNull()

  const trim = preflight()
  expect(trim).toMatchObject({
    contract_version: 1, canvas_id: CANVAS_ID, project_id: PROJECT_ID, executable: true,
    operation: { kind: 'trim', start_seconds: 1.25, end_seconds: 4.5 },
    preview: { mode: 'single-native', source_count: 1 },
    export: { available: false, code: 'backend_export_unavailable' },
  })
  expect(trim.sources.map((source) => [source.node_id, source.asset_id, source.order])).toEqual([
    ['video-first', 'asset-first', 1],
  ])

  const concat = preflight({
    operation: { kind: 'concat' },
    selectedNodeIds: ['video-second', 'video-first'],
  })
  expect(concat).toMatchObject({ executable: true, preview: { mode: 'sequence-native', source_count: 2 } })
  expect(concat.sources.map((source) => [source.node_id, source.order])).toEqual([
    ['video-second', 1], ['video-first', 2],
  ])
})

test('video edit preflight fails closed for scope, selection, temporal, and ownership drift', () => {
  expect(preflight({ selectedNodeIds: [] }).errors.map((error) => error.code)).toEqual(['missing_selection'])
  expect(preflight({ selectedNodeIds: ['video-first', 'video-first'] }).errors.map((error) => error.code)).toEqual(['duplicate_selection'])
  expect(preflight({ operation: { kind: 'trim', start_seconds: 4, end_seconds: 4 } }).errors.map((error) => error.code)).toEqual(['invalid_trim_range'])
  expect(preflight({ operation: { kind: 'concat' } }).errors.map((error) => error.code)).toEqual(['invalid_source_count'])
  expect(preflight({ canvasId: '' }).errors.map((error) => error.code)).toEqual(['invalid_canvas_scope'])
  expect(preflight({ template: { id: 'foreign-template', version: 1 } }).errors.map((error) => error.code)).toEqual(['invalid_template'])

  const foreignOwner = preflight({ assets: [videoAsset('asset-first', 'https://media.revid.test/first.mp4', { user_id: 'other-user' })] })
  expect(foreignOwner.errors.map((error) => error.code)).toEqual(['asset_not_owned'])

  const mismatchedUrl = preflight({ assets: [videoAsset('asset-first', 'https://media.revid.test/other.mp4')] })
  expect(mismatchedUrl.errors.map((error) => error.code)).toEqual(['asset_url_mismatch'])
})
