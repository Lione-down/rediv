import type { CanvasNode } from '../../types/canvas'
import { nodeInputPortAnchors, worldToSurface, type Point, type ViewportState } from './canvas-geometry'

export function findNearestConnectionTarget(
  point: Point,
  sourceNodeId: string,
  nodes: readonly CanvasNode[],
  viewport: ViewportState,
  hitRadius = 24,
) {
  let match: { node: CanvasNode; targetPort: string } | null = null
  let matchedDistance = Number.POSITIVE_INFINITY
  for (const node of nodes) {
    if (node.id === sourceNodeId) continue
    for (const anchor of nodeInputPortAnchors(node)) {
      const surfaceAnchor = worldToSurface(anchor, viewport)
      const distance = Math.hypot(surfaceAnchor.x - point.x, surfaceAnchor.y - point.y)
      if (distance <= hitRadius && distance < matchedDistance) {
        match = { node, targetPort: anchor.portId }
        matchedDistance = distance
      }
    }
  }
  return match
}
