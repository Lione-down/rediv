import { expect, test } from '@playwright/test'
import {
  activeCanvasesForProject,
  getCanvasConflictRevision,
  mergeCanvasMutation,
  normalizeRouteIdentifier,
  resolveCanvasMetadata,
} from '../../src/modules/canvas/metadata'
import type { CanvasMetadataDto } from '../../src/modules/canvas/types'

const NOW = '2026-07-13T08:00:00Z'

function canvas(
  id: string,
  projectId: string,
  sortOrder: number,
  status: CanvasMetadataDto['status'] = 'active',
): CanvasMetadataDto {
  return {
    id,
    project_id: projectId,
    name: id,
    sort_order: sortOrder,
    status,
    viewport_x: 0,
    viewport_y: 0,
    viewport_zoom: 1,
    graph_revision: 0,
    created_at: NOW,
    updated_at: NOW,
    deleted_at: status === 'archived' ? NOW : null,
  }
}

test('route identifiers and Canvas membership fail closed', () => {
  const items = [
    canvas('second', 'project-a', 1),
    canvas('foreign', 'project-b', 0),
    canvas('archived', 'project-a', 0, 'archived'),
    canvas('first', 'project-a', 0),
  ]

  expect(normalizeRouteIdentifier('project-a')).toBe('project-a')
  expect(normalizeRouteIdentifier(' project-a')).toBe('')
  expect(normalizeRouteIdentifier(['project-a'])).toBe('')
  expect(activeCanvasesForProject(items, 'project-a').map((item) => item.id)).toEqual([
    'first',
    'second',
  ])
  expect(resolveCanvasMetadata(items, 'project-a', 'second')?.id).toBe('second')
  expect(resolveCanvasMetadata(items, 'project-a', 'foreign')?.id).toBe('first')
  expect(resolveCanvasMetadata(items, 'missing-project')).toBeNull()
})

test('mutation reconciliation trusts server items and stale revisions only', () => {
  const first = canvas('first', 'project-a', 0)
  const second = canvas('second', 'project-a', 1)
  const renamedSecond = { ...second, name: '分镜画布' }

  expect(mergeCanvasMutation([first, second], {
    item: renamedSecond,
    order_revision: 7,
  })).toEqual([first, renamedSecond])
  expect(mergeCanvasMutation([first, second], {
    item: { ...second, status: 'archived', deleted_at: NOW },
    order_revision: 8,
  })).toEqual([first])
  expect(getCanvasConflictRevision({
    detail: { code: 'stale_order_revision', current_order_revision: 9 },
  })).toBe(9)
  expect(getCanvasConflictRevision({
    detail: { code: 'last_active_canvas', current_order_revision: 9 },
  })).toBeNull()
  expect(getCanvasConflictRevision({
    detail: { code: 'stale_order_revision', current_order_revision: -1 },
  })).toBeNull()
})
