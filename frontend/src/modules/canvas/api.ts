import { request } from '../../api/request'
import type {
  CanvasArchivePayload,
  CanvasConnectionCreatePayload,
  CanvasConnectionDto,
  CanvasConnectionListResponse,
  CanvasCreatePayload,
  CanvasDuplicatePayload,
  CanvasListResponse,
  CanvasMetadataDto,
  CanvasMutationResponse,
  CanvasNodeCreatePayload,
  CanvasNodeDto,
  CanvasNodeListResponse,
  CanvasNodeUpdatePayload,
  CanvasRenamePayload,
  CanvasReorderPayload,
} from './types'

function canvasCollectionPath(projectId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/canvases`
}

function canvasItemPath(projectId: string, canvasId: string) {
  return `${canvasCollectionPath(projectId)}/${encodeURIComponent(canvasId)}`
}

export function fetchCanvases(projectId: string) {
  return request.get<CanvasListResponse>(canvasCollectionPath(projectId))
}

export function fetchCanvas(projectId: string, canvasId: string) {
  return request.get<CanvasMetadataDto>(canvasItemPath(projectId, canvasId))
}

export function createCanvas(projectId: string, payload: CanvasCreatePayload) {
  return request.post<CanvasMutationResponse>(canvasCollectionPath(projectId), payload)
}

export function renameCanvas(projectId: string, canvasId: string, payload: CanvasRenamePayload) {
  return request.patch<CanvasMutationResponse>(canvasItemPath(projectId, canvasId), payload)
}

export function archiveCanvas(projectId: string, canvasId: string, payload: CanvasArchivePayload) {
  return request.patch<CanvasMutationResponse>(canvasItemPath(projectId, canvasId), payload)
}

export function reorderCanvases(projectId: string, payload: CanvasReorderPayload) {
  return request.patch<CanvasListResponse>(`${canvasCollectionPath(projectId)}/order`, payload)
}

export function duplicateCanvas(projectId: string, canvasId: string, payload: CanvasDuplicatePayload) {
  return request.post<CanvasMutationResponse>(`${canvasItemPath(projectId, canvasId)}/duplicate`, payload)
}

function projectPath(projectId: string, resource: 'nodes' | 'connections') {
  return `/projects/${encodeURIComponent(projectId)}/${resource}`
}

export function fetchCanvasNodes(projectId: string) {
  return request.get<CanvasNodeListResponse>(projectPath(projectId, 'nodes'))
}

export function createCanvasNode(projectId: string, payload: CanvasNodeCreatePayload) {
  return request.post<CanvasNodeDto>(projectPath(projectId, 'nodes'), payload)
}

export function updateCanvasNode(
  projectId: string,
  nodeId: string,
  payload: CanvasNodeUpdatePayload,
) {
  return request.put<CanvasNodeDto>(
    `${projectPath(projectId, 'nodes')}/${encodeURIComponent(nodeId)}`,
    payload,
  )
}

export function deleteCanvasNode(projectId: string, nodeId: string) {
  return request.delete(
    `${projectPath(projectId, 'nodes')}/${encodeURIComponent(nodeId)}`,
  )
}

export function fetchCanvasConnections(projectId: string) {
  return request.get<CanvasConnectionListResponse>(
    projectPath(projectId, 'connections'),
  )
}

export function createCanvasConnection(
  projectId: string,
  payload: CanvasConnectionCreatePayload,
) {
  return request.post<CanvasConnectionDto>(
    projectPath(projectId, 'connections'),
    payload,
  )
}

export function deleteCanvasConnection(projectId: string, connectionId: string) {
  return request.delete(
    `${projectPath(projectId, 'connections')}/${encodeURIComponent(connectionId)}`,
  )
}
