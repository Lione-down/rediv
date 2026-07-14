import type { CanvasNode } from '../../types/canvas'
import { nodePortWorldAnchors, worldToSurface, type Point, type ViewportState } from './canvas-geometry'
import type { NodePortDirection } from '../../modules/canvas/node-registry'

export function findNearestConnectionTarget(
  point: Point,
  sourceNodeId: string,
  nodes: readonly CanvasNode[],
  viewport: ViewportState,
  targetDirection: NodePortDirection = 'input',
  hitRadius = 24,
) {
  let match: { node: CanvasNode; portId: string } | null = null
  let matchedDistance = Number.POSITIVE_INFINITY
  for (const node of nodes) {
    if (node.id === sourceNodeId) continue
    for (const anchor of nodePortWorldAnchors(node, targetDirection)) {
      const surfaceAnchor = worldToSurface(anchor, viewport)
      const distance = Math.hypot(surfaceAnchor.x - point.x, surfaceAnchor.y - point.y)
      if (distance <= hitRadius && distance < matchedDistance) {
        match = { node, portId: anchor.portId }
        matchedDistance = distance
      }
    }
  }
  return match
}
