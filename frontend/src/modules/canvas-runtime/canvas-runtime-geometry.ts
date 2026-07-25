import type { PersistedViewport } from '../canvas/persistence'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'

export interface RuntimeScreenPoint {
  x: number
  y: number
}

export interface RuntimeEdgeProjection {
  connection: CanvasConnection
  end: RuntimeScreenPoint
  path: string
  start: RuntimeScreenPoint
}

export const VISIBLE_ACQUISITION_PORT_KEY = '__visible__'

export function runtimeNodeSize(node: CanvasNode) {
  return {
    width: Math.max(220, node.width),
    height: Math.max(140, node.height),
  }
}

export function runtimePortWorldPoint(
  node: CanvasNode,
  direction: 'input' | 'output',
  _logicalPortId?: string,
): RuntimeScreenPoint {
  const size = runtimeNodeSize(node)
  return {
    x: node.x + (direction === 'input' ? 0 : size.width),
    y: node.y + size.height / 2,
  }
}

export function runtimeWorldToScreen(
  point: RuntimeScreenPoint,
  viewport: PersistedViewport,
): RuntimeScreenPoint {
  return {
    x: viewport.x + point.x * viewport.zoom,
    y: viewport.y + point.y * viewport.zoom,
  }
}

export function runtimePortScreenPoint(
  node: CanvasNode,
  direction: 'input' | 'output',
  viewport: PersistedViewport,
  logicalPortId?: string,
) {
  return runtimeWorldToScreen(runtimePortWorldPoint(node, direction, logicalPortId), viewport)
}

export function runtimeEdgePath(start: RuntimeScreenPoint, end: RuntimeScreenPoint) {
  const controlDistance = Math.max(52, Math.abs(end.x - start.x) * 0.42)
  return [
    `M ${start.x} ${start.y}`,
    `C ${start.x + controlDistance} ${start.y}`,
    `${end.x - controlDistance} ${end.y}`,
    `${end.x} ${end.y}`,
  ].join(' ')
}

export function projectRuntimeEdge(
  connection: CanvasConnection,
  nodesById: ReadonlyMap<string, CanvasNode>,
  viewport: PersistedViewport,
  _elasticPortPositions: ReadonlyMap<string, RuntimeScreenPoint> = new Map(),
): RuntimeEdgeProjection | null {
  const source = nodesById.get(connection.from)
  const target = nodesById.get(connection.to)
  if (!source || !target) return null
  const start = runtimePortScreenPoint(source, 'output', viewport, connection.sourcePort)
  const end = runtimePortScreenPoint(target, 'input', viewport, connection.targetPort)
  return {
    connection,
    end,
    path: runtimeEdgePath(start, end),
    start,
  }
}
