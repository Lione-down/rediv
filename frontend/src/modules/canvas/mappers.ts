import type {
  CanvasConnection,
  CanvasNode,
  CanvasNodeStatus,
} from '../../types/canvas'
import type {
  CanvasConnectionDto,
  CanvasDocumentConnectionUpsert,
  CanvasDocumentNodeUpsert,
  CanvasNodeContentDto,
  CanvasNodeDto,
  CanvasRecoveryDocument,
} from './types'
import {
  generationStatusToNodeStatus,
  getPersistedGenerationStatus,
  resolveNodeDefinition,
} from './node-registry'

const nodeStatusMap: Record<string, CanvasNodeStatus> = {
  idle: 'idle',
  selected: 'selected',
  running: 'running',
  success: 'success',
  warning: 'warning',
}

function readString(content: CanvasNodeContentDto, key: string) {
  const value = content[key]
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function mapCanvasNode(dto: CanvasNodeDto | CanvasDocumentNodeUpsert): CanvasNode {
  const contentData = { ...dto.content }
  const definition = resolveNodeDefinition(dto.node_type, contentData)
  const persistedGenerationStatus = definition.capabilities.canGenerate
    ? getPersistedGenerationStatus(contentData)
    : null

  return {
    id: dto.id,
    type: dto.node_type,
    title: readString(contentData, 'title') ?? definition.label,
    x: dto.position_x,
    y: dto.position_y,
    width: dto.width,
    height: dto.height,
    zIndex: dto.z_index ?? 0,
    parentNodeId: dto.parent_node_id ?? null,
    isLocked: dto.is_locked ?? false,
    isCollapsed: dto.is_collapsed ?? false,
    status: persistedGenerationStatus
      ? generationStatusToNodeStatus(persistedGenerationStatus)
      : nodeStatusMap['status' in dto ? dto.status : 'idle'] ?? 'idle',
    content:
      readString(contentData, 'text') ??
      readString(contentData, 'prompt') ??
      readString(contentData, 'description'),
    contentData,
  }
}

export function mapCanvasConnection(
  dto: CanvasConnectionDto | CanvasDocumentConnectionUpsert,
): CanvasConnection {
  const status = 'status' in dto ? dto.status : 'active'
  return {
    id: dto.id,
    from: dto.source_node_id,
    to: dto.target_node_id,
    sourcePort: dto.source_port,
    targetPort: dto.target_port,
    status,
    metadata: { ...dto.metadata },
    active: status === 'active',
  }
}

export function mapCanvasRecoveryGraph(document: CanvasRecoveryDocument) {
  return {
    nodes: document.node_upserts.map(mapCanvasNode),
    connections: document.connection_upserts.map(mapCanvasConnection),
  }
}
