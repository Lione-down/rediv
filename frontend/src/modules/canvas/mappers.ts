import type {
  CanvasConnection,
  CanvasNode,
  CanvasNodeStatus,
  CanvasNodeType,
} from '../../types/canvas'
import type { CanvasConnectionDto, CanvasNodeContentDto, CanvasNodeDto } from './types'

const nodeTypes = new Set<CanvasNodeType>([
  'text',
  'image',
  'video',
  'model',
  'result',
  'refine',
  'composite',
  'group',
])

const nodeStatusMap: Record<string, CanvasNodeStatus> = {
  idle: 'idle',
  selected: 'selected',
  running: 'running',
  success: 'success',
  warning: 'warning',
}

const nodeTypeLabels: Record<CanvasNodeType, string> = {
  text: '文本节点',
  image: '图片节点',
  video: '视频节点',
  model: '模型节点',
  result: '结果节点',
  refine: '优化节点',
  composite: '合成节点',
  group: '组合',
}

function readString(content: CanvasNodeContentDto, key: string) {
  const value = content[key]
  return typeof value === 'string' && value.trim() ? value : undefined
}

function mapNodeType(nodeType: string): CanvasNodeType {
  return nodeTypes.has(nodeType as CanvasNodeType)
    ? (nodeType as CanvasNodeType)
    : 'text'
}

export function mapCanvasNode(dto: CanvasNodeDto): CanvasNode {
  const type = mapNodeType(dto.node_type)
  const contentData = { ...dto.content }

  return {
    id: dto.id,
    type,
    title: readString(contentData, 'title') ?? nodeTypeLabels[type],
    x: dto.position_x,
    y: dto.position_y,
    width: dto.width,
    height: dto.height,
    zIndex: dto.z_index ?? 0,
    parentNodeId: dto.parent_node_id ?? null,
    isLocked: dto.is_locked ?? false,
    isCollapsed: dto.is_collapsed ?? false,
    status: nodeStatusMap[dto.status] ?? 'idle',
    content:
      readString(contentData, 'text') ??
      readString(contentData, 'prompt') ??
      readString(contentData, 'description'),
    contentData,
  }
}

export function mapCanvasConnection(dto: CanvasConnectionDto): CanvasConnection {
  return {
    id: dto.id,
    from: dto.source_node_id,
    to: dto.target_node_id,
    sourcePort: dto.source_port,
    targetPort: dto.target_port,
    status: dto.status,
    metadata: { ...dto.metadata },
    active: dto.status === 'active',
  }
}
