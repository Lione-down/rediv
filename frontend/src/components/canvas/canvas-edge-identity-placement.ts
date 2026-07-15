import type { CanvasNode } from '../../types/canvas'
import { canvasNodeWorldRect, worldToSurface, type Point, type ViewportState } from './canvas-geometry'

export interface CanvasEdgeIdentityPlacement {
  isDisplaced: boolean
  origin: Point
  position: Point
}

const IDENTITY_WIDTH = 300
const IDENTITY_HEIGHT = 40
const NODE_CLEARANCE = 8
const VERTICAL_OFFSETS = [0, -72, 72, -128, 128, -184, 184]

function overlapsNode(
  position: Point,
  node: CanvasNode,
  viewport: ViewportState,
) {
  const worldRect = canvasNodeWorldRect(node, 'content')
  const nodeTopLeft = worldToSurface({ x: worldRect.left, y: worldRect.top - 22 }, viewport)
  const nodeRight = nodeTopLeft.x + worldRect.width * viewport.zoom
  const nodeBottom = nodeTopLeft.y + (worldRect.height + 22) * viewport.zoom
  const identityLeft = position.x - IDENTITY_WIDTH / 2 - NODE_CLEARANCE
  const identityRight = position.x + IDENTITY_WIDTH / 2 + NODE_CLEARANCE
  const identityTop = position.y - IDENTITY_HEIGHT / 2 - NODE_CLEARANCE
  const identityBottom = position.y + IDENTITY_HEIGHT / 2 + NODE_CLEARANCE
  return identityLeft < nodeRight && identityRight > nodeTopLeft.x
    && identityTop < nodeBottom && identityBottom > nodeTopLeft.y
}

export function resolveCanvasEdgeIdentityPlacement(
  midpoint: Point,
  nodes: readonly CanvasNode[],
  viewport: ViewportState,
): CanvasEdgeIdentityPlacement {
  const origin = worldToSurface(midpoint, viewport)
  const position = VERTICAL_OFFSETS
    .map((offset) => ({ x: origin.x, y: origin.y + offset }))
    .find((candidate) => !nodes.some((node) => overlapsNode(candidate, node, viewport))) ?? origin
  return {
    origin,
    position,
    isDisplaced: position.x !== origin.x || position.y !== origin.y,
  }
}
