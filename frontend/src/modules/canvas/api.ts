import { request } from '../../api/request'
import type {
  CanvasConnectionCreatePayload,
  CanvasConnectionDto,
  CanvasConnectionListResponse,
  CanvasNodeCreatePayload,
  CanvasNodeDto,
  CanvasNodeListResponse,
  CanvasNodeUpdatePayload,
} from './types'

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
