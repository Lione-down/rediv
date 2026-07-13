import type { CanvasMetadataDto, CanvasMutationResponse } from './types'

interface CanvasConflictPayload {
  detail?: {
    code?: unknown
    current_order_revision?: unknown
  }
}

export function normalizeRouteIdentifier(value: unknown) {
  if (typeof value !== 'string' || value !== value.trim() || !value) return ''
  return value
}

export function activeCanvasesForProject(items: CanvasMetadataDto[], projectId: string) {
  return [...items]
    .filter((item) => item.project_id === projectId && item.status === 'active')
    .sort((left, right) => (
      left.sort_order - right.sort_order ||
      left.created_at.localeCompare(right.created_at) ||
      left.id.localeCompare(right.id)
    ))
}

export function resolveCanvasMetadata(
  items: CanvasMetadataDto[],
  projectId: string,
  canvasId?: string,
) {
  const activeItems = activeCanvasesForProject(items, projectId)
  if (canvasId) {
    const requestedCanvas = activeItems.find((item) => item.id === canvasId)
    if (requestedCanvas) return requestedCanvas
  }
  return activeItems[0] ?? null
}

export function mergeCanvasMutation(
  items: CanvasMetadataDto[],
  response: CanvasMutationResponse,
) {
  const nextItems = response.item.status === 'active'
    ? [...items.filter((item) => item.id !== response.item.id), response.item]
    : items.filter((item) => item.id !== response.item.id)
  return activeCanvasesForProject(nextItems, response.item.project_id)
}

export function getCanvasConflictRevision(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null
  const detail = (payload as CanvasConflictPayload).detail
  if (
    detail?.code !== 'stale_order_revision' ||
    typeof detail.current_order_revision !== 'number' ||
    !Number.isSafeInteger(detail.current_order_revision) ||
    detail.current_order_revision < 0
  ) {
    return null
  }
  return detail.current_order_revision
}

export function canvasRouteLocation(projectId: string, canvasId: string) {
  return {
    name: 'canvas-workspace',
    params: { projectId, canvasId },
    replace: true,
  } as const
}
