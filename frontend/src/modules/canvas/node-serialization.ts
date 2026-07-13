import type { CanvasNode } from '../../types/canvas'
import { resolveNodeDefinition } from './node-registry'
import type { CanvasDocumentNodeUpsert } from './types'

export function serializeCanvasNodeContent(
  node: Pick<CanvasNode, 'type' | 'contentData' | 'title' | 'content'>,
) {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  return definition.kind === 'unsupported'
    ? { ...node.contentData }
    : {
        ...node.contentData,
        title: node.title,
        ...(node.content ? { text: node.content } : {}),
      }
}

export function toCanvasDocumentNodeUpsert(node: CanvasNode): CanvasDocumentNodeUpsert {
  return {
    id: node.id,
    node_type: node.type,
    content: serializeCanvasNodeContent(node),
    position_x: node.x,
    position_y: node.y,
    width: Math.round(node.width),
    height: Math.round(node.height),
    z_index: Math.round(node.zIndex ?? 0),
    parent_node_id: node.parentNodeId ?? null,
    is_locked: Boolean(node.isLocked),
    is_collapsed: Boolean(node.isCollapsed),
  }
}
