import { request } from '../../api/request'
import type {
  CanvasArchivePayload,
  CanvasConnectionCreatePayload,
  CanvasConnectionDto,
  CanvasConnectionListResponse,
  CanvasCreatePayload,
  CanvasDuplicatePayload,
  CanvasDocumentResponse,
  CanvasDocumentPatchPayload,
  CanvasDocumentPatchResponse,
  CanvasListResponse,
  CanvasMetadataDto,
  CanvasMutationResponse,
  CanvasNodeCreatePayload,
  CanvasNodeDto,
  CanvasNodeListResponse,
  CanvasNodeUpdatePayload,
  CanvasRenamePayload,
  CanvasReorderPayload,
  CanvasViewportPayload,
} from './types'

function canvasCollectionPath(projectId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/canvases`
}

function canvasItemPath(projectId: string, canvasId: string) {
  return `${canvasCollectionPath(projectId)}/${encodeURIComponent(canvasId)}`
}

function canvasResourcePath(
  projectId: string,
  canvasId: string,
  resource: 'document' | 'viewport' | 'nodes' | 'connections',
) {
  return `${canvasItemPath(projectId, canvasId)}/${resource}`
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

export function fetchLegacyCanvasNodes(projectId: string) {
  return request.get<CanvasNodeListResponse>(projectPath(projectId, 'nodes'))
}

export function fetchCanvasDocument(projectId: string, canvasId: string) {
  return request.get<CanvasDocumentResponse>(canvasResourcePath(projectId, canvasId, 'document'))
}

export function patchCanvasDocument(
  projectId: string,
  canvasId: string,
  payload: CanvasDocumentPatchPayload,
) {
  return request.patch<CanvasDocumentPatchResponse>(
    canvasResourcePath(projectId, canvasId, 'document'),
    payload,
  )
}

export function updateCanvasViewport(projectId: string, canvasId: string, payload: CanvasViewportPayload) {
  return request.patch<CanvasMetadataDto>(canvasResourcePath(projectId, canvasId, 'viewport'), payload)
}

export function createCanvasNode(projectId: string, canvasId: string, payload: CanvasNodeCreatePayload) {
  return request.post<CanvasNodeDto>(canvasResourcePath(projectId, canvasId, 'nodes'), payload)
}

export function updateCanvasNode(
  projectId: string,
  canvasId: string,
  nodeId: string,
  payload: CanvasNodeUpdatePayload,
) {
  return request.put<CanvasNodeDto>(
    `${canvasResourcePath(projectId, canvasId, 'nodes')}/${encodeURIComponent(nodeId)}`,
    payload,
  )
}

export function deleteCanvasNode(projectId: string, canvasId: string, nodeId: string) {
  return request.delete(
    `${canvasResourcePath(projectId, canvasId, 'nodes')}/${encodeURIComponent(nodeId)}`,
  )
}

export function fetchLegacyCanvasConnections(projectId: string) {
  return request.get<CanvasConnectionListResponse>(
    projectPath(projectId, 'connections'),
  )
}

export function createCanvasConnection(
  projectId: string,
  canvasId: string,
  payload: CanvasConnectionCreatePayload,
) {
  return request.post<CanvasConnectionDto>(
    canvasResourcePath(projectId, canvasId, 'connections'),
    payload,
  )
}

export function deleteCanvasConnection(projectId: string, canvasId: string, connectionId: string) {
  return request.delete(
    `${canvasResourcePath(projectId, canvasId, 'connections')}/${encodeURIComponent(connectionId)}`,
  )
}
