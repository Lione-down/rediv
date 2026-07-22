import type { CanvasNode } from '../../types/canvas'
import { nodePortWorldAnchors, worldToSurface, type Point, type ViewportState } from './canvas-geometry'
import { getAuthoringConnectionPorts, type NodePortDirection } from '../../modules/canvas/node-registry'
import { CANVAS_PORT_HIT_TARGET_PX } from './canvas-port-presentation'

export function findNearestConnectionTarget(
  point: Point,
  sourceNodeId: string,
  nodes: readonly CanvasNode[],
  viewport: ViewportState,
  targetDirection: NodePortDirection = 'input',
  hitRadius = CANVAS_PORT_HIT_TARGET_PX / 2,
  isCompatible: (node: CanvasNode, portId: string) => boolean = () => true,
) {
  let match: { node: CanvasNode; portId: string; distance: number; anchor: Point } | null = null
  let matchedDistance = Number.POSITIVE_INFINITY
  for (const node of nodes) {
    if (node.id === sourceNodeId || node.isLocked) continue
    for (const anchor of nodePortWorldAnchors(node, targetDirection)) {
      if (!isCompatible(node, anchor.portId)) continue
      const surfaceAnchor = worldToSurface(anchor, viewport)
      const distance = Math.hypot(surfaceAnchor.x - point.x, surfaceAnchor.y - point.y)
      if (distance <= hitRadius && distance < matchedDistance) {
        match = { node, portId: anchor.portId, distance, anchor: surfaceAnchor }
        matchedDistance = distance
      }
    }
  }
  return match
}

export function findCompatibleConnectionTarget(
  point: Point,
  originNodeId: string,
  originPort: string,
  originDirection: NodePortDirection,
  nodes: readonly CanvasNode[],
  viewport: ViewportState,
  hitRadius = CANVAS_PORT_HIT_TARGET_PX / 2,
) {
  const originNode = nodes.find((node) => node.id === originNodeId)
  if (!originNode) return null
  const isOutput = originDirection === 'output'
  return findNearestConnectionTarget(
    point, originNodeId, nodes, viewport, isOutput ? 'input' : 'output', hitRadius,
    (node, portId) => Boolean(isOutput
      ? getAuthoringConnectionPorts(originNode, node, originPort, portId)
      : getAuthoringConnectionPorts(node, originNode, portId, originPort)),
  )
}

export function resolveCompatibleConnectionDraftPosition(
  point: Point,
  originNodeId: string,
  originPort: string,
  originDirection: NodePortDirection,
  nodes: readonly CanvasNode[],
  viewport: ViewportState,
) {
  const anchor = findCompatibleConnectionTarget(
    point, originNodeId, originPort, originDirection, nodes, viewport,
  )?.anchor ?? point
  return { currentX: anchor.x, currentY: anchor.y }
}
