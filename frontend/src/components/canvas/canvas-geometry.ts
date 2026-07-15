import type { CanvasNode } from '../../types/canvas'
import { resolveNodeDefinition, type NodePortDirection } from '../../modules/canvas/node-registry'
import { canvasNodeVisualSize } from './canvas-node-presentation'

export interface Point {
  x: number
  y: number
}

export interface CanvasNodePortAnchor extends Point {
  portId: string
}

export interface ViewportState {
  zoom: number
  x: number
  y: number
}

export interface ViewportSize {
  width: number
  height: number
}

export interface ViewportInsets {
  top: number
  right: number
  bottom: number
  left: number
}

export interface WorldRect {
  left: number
  top: number
  width: number
  height: number
}

export type CanvasNodeGeometryRole = 'content' | 'label' | 'selection' | 'composer'

export function canvasNodeWorldRect(node: CanvasNode, role: CanvasNodeGeometryRole): WorldRect {
  const size = canvasNodeVisualSize(node)
  if (role === 'label') return { left: node.x, top: node.y - 22, width: size.width, height: 18 }
  if (role === 'composer') return { left: node.x, top: node.y + size.height + 8, width: size.width, height: 76 }
  if (role === 'selection') return { left: node.x - 1, top: node.y - 1, width: size.width + 2, height: size.height + 2 }
  return { left: node.x, top: node.y, width: size.width, height: size.height }
}

export function rectFromPoints(start: Point, end: Point): WorldRect {
  return {
    left: Math.min(start.x, end.x),
    top: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

export function nodeIntersectsRect(node: CanvasNode, rect: WorldRect) {
  const size = canvasNodeVisualSize(node)
  return (
    node.x <= rect.left + rect.width &&
    node.x + size.width >= rect.left &&
    node.y <= rect.top + rect.height &&
    node.y + size.height >= rect.top
  )
}

export interface MinimapMetrics {
  minX: number
  minY: number
  scale: number
  offsetX: number
  offsetY: number
}

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 8
export const CANVAS_GRID_SIZE = 24

export function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

export function normalizeViewport(viewport: ViewportState): ViewportState {
  return {
    zoom: clampZoom(viewport.zoom || 1),
    x: viewport.x || 0,
    y: viewport.y || 0,
  }
}

export function getNodesBounds(nodes: readonly CanvasNode[]): WorldRect | null {
  if (!nodes.length) return null
  const left = Math.min(...nodes.map((node) => node.x))
  const top = Math.min(...nodes.map((node) => node.y))
  const right = Math.max(...nodes.map((node) => node.x + canvasNodeVisualSize(node).width))
  const bottom = Math.max(...nodes.map((node) => node.y + canvasNodeVisualSize(node).height))
  if (![left, top, right, bottom].every(Number.isFinite)) return null
  return { left, top, width: Math.max(right - left, 1), height: Math.max(bottom - top, 1) }
}

export function fitViewportToNodes(
  nodes: readonly CanvasNode[],
  size: ViewportSize,
  padding = 48,
  insets: Partial<ViewportInsets> = {},
): ViewportState | null {
  const bounds = getNodesBounds(nodes)
  if (!bounds || size.width <= 0 || size.height <= 0) return null
  const safePadding = Math.max(0, padding)
  const safeLeft = Math.max(0, insets.left ?? 0) + safePadding
  const safeTop = Math.max(0, insets.top ?? 0) + safePadding
  const safeRight = Math.max(safeLeft, size.width - Math.max(0, insets.right ?? 0) - safePadding)
  const safeBottom = Math.max(safeTop, size.height - Math.max(0, insets.bottom ?? 0) - safePadding)
  const availableWidth = Math.max(safeRight - safeLeft, 1)
  const availableHeight = Math.max(safeBottom - safeTop, 1)
  const zoom = clampZoom(Math.min(availableWidth / bounds.width, availableHeight / bounds.height))
  return normalizeViewport({
    zoom,
    x: (safeLeft + safeRight) / 2 - (bounds.left + bounds.width / 2) * zoom,
    y: (safeTop + safeBottom) / 2 - (bounds.top + bounds.height / 2) * zoom,
  })
}

export function snapDeltaToGrid(origin: Point, delta: Point, gridSize = CANVAS_GRID_SIZE): Point {
  const safeGridSize = Number.isFinite(gridSize) && gridSize > 0 ? gridSize : CANVAS_GRID_SIZE
  return {
    x: Math.round((origin.x + delta.x) / safeGridSize) * safeGridSize - origin.x,
    y: Math.round((origin.y + delta.y) / safeGridSize) * safeGridSize - origin.y,
  }
}

export function worldToSurface(point: Point, viewport: ViewportState): Point {
  return {
    x: point.x * viewport.zoom + viewport.x,
    y: point.y * viewport.zoom + viewport.y,
  }
}

export function surfaceToWorld(point: Point, viewport: ViewportState): Point {
  return {
    x: (point.x - viewport.x) / viewport.zoom,
    y: (point.y - viewport.y) / viewport.zoom,
  }
}

export function viewportWorldRect(viewport: ViewportState, size: ViewportSize): WorldRect {
  return {
    left: -viewport.x / viewport.zoom,
    top: -viewport.y / viewport.zoom,
    width: size.width / viewport.zoom,
    height: size.height / viewport.zoom,
  }
}

export function revealWorldRectViewport(
  rect: WorldRect,
  viewport: ViewportState,
  size: ViewportSize,
  insets: Partial<ViewportInsets> = {},
  padding = 24,
): ViewportState {
  const normalized = normalizeViewport(viewport)
  const safePadding = Math.max(0, padding)
  const safeLeft = Math.max(0, insets.left ?? 0) + safePadding
  const safeTop = Math.max(0, insets.top ?? 0) + safePadding
  const safeRight = Math.max(safeLeft, size.width - Math.max(0, insets.right ?? 0) - safePadding)
  const safeBottom = Math.max(safeTop, size.height - Math.max(0, insets.bottom ?? 0) - safePadding)
  const left = rect.left * normalized.zoom + normalized.x
  const top = rect.top * normalized.zoom + normalized.y
  const width = rect.width * normalized.zoom
  const height = rect.height * normalized.zoom
  const horizontalShift = width > safeRight - safeLeft
    ? (safeLeft + safeRight - width) / 2 - left
    : left < safeLeft ? safeLeft - left : left + width > safeRight ? safeRight - left - width : 0
  const verticalShift = height > safeBottom - safeTop
    ? (safeTop + safeBottom - height) / 2 - top
    : top < safeTop ? safeTop - top : top + height > safeBottom ? safeBottom - top - height : 0
  return normalizeViewport({
    zoom: normalized.zoom,
    x: normalized.x + horizontalShift,
    y: normalized.y + verticalShift,
  })
}

export function nodePortWorldAnchors(
  node: CanvasNode,
  direction: NodePortDirection,
): CanvasNodePortAnchor[] {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  if (definition.kind === 'unsupported') return []
  const ports = definition.ports.filter((port) => port.direction === direction)
  const size = canvasNodeVisualSize(node)
  return ports.map((port, index) => ({
    portId: port.id,
    x: direction === 'input' ? node.x : node.x + size.width,
    y: node.y + (size.height * (index + 1)) / (ports.length + 1),
  }))
}

export function nodeInputPortAnchors(node: CanvasNode) {
  return nodePortWorldAnchors(node, 'input')
}

export function nodePortWorldAnchor(
  node: CanvasNode,
  direction: NodePortDirection,
  portId?: string,
): Point {
  const anchors = nodePortWorldAnchors(node, direction)
  const exact = portId ? anchors.find((anchor) => anchor.portId === portId) : null
  const selected = exact ?? anchors[0]
  return selected ? { x: selected.x, y: selected.y } : {
    x: direction === 'input' ? node.x : node.x + node.width,
    y: node.y + node.height / 2,
  }
}

export function nodeInputAnchor(node: CanvasNode, viewport: ViewportState, portId?: string) {
  return worldToSurface(nodePortWorldAnchor(node, 'input', portId), viewport)
}

export function nodeOutputAnchor(node: CanvasNode, viewport: ViewportState, portId?: string) {
  return worldToSurface(nodePortWorldAnchor(node, 'output', portId), viewport)
}

export function buildConnectionPath(from: Point, to: Point) {
  return `M ${from.x} ${from.y} C ${from.x + 110} ${from.y}, ${to.x - 110} ${to.y}, ${to.x} ${to.y}`
}

export function calculateMinimapMetrics(
  nodes: CanvasNode[],
  viewport: WorldRect,
  mapSize: ViewportSize = { width: 160, height: 104 },
): MinimapMetrics {
  const padding = 64
  const nodeMinX = nodes.reduce((minimum, node) => Math.min(minimum, node.x), 0)
  const nodeMinY = nodes.reduce((minimum, node) => Math.min(minimum, node.y), 0)
  const nodeMaxX = nodes.reduce((maximum, node) => Math.max(maximum, node.x + canvasNodeVisualSize(node).width), 1280)
  const nodeMaxY = nodes.reduce((maximum, node) => Math.max(maximum, node.y + canvasNodeVisualSize(node).height), 720)
  const minX = Math.min(nodeMinX, viewport.left) - padding
  const minY = Math.min(nodeMinY, viewport.top) - padding
  const maxX = Math.max(nodeMaxX, viewport.left + viewport.width) + padding
  const maxY = Math.max(nodeMaxY, viewport.top + viewport.height) + padding
  const boundsWidth = Math.max(maxX - minX, 1)
  const boundsHeight = Math.max(maxY - minY, 1)
  const mapWidth = Math.max(mapSize.width, 1)
  const mapHeight = Math.max(mapSize.height, 1)
  const scale = Math.min(mapWidth / boundsWidth, mapHeight / boundsHeight)

  return {
    minX,
    minY,
    scale,
    offsetX: (mapWidth - boundsWidth * scale) / 2,
    offsetY: (mapHeight - boundsHeight * scale) / 2,
  }
}

export function minimapPointToWorld(point: Point, metrics: MinimapMetrics) {
  return {
    x: (point.x - metrics.offsetX) / metrics.scale + metrics.minX,
    y: (point.y - metrics.offsetY) / metrics.scale + metrics.minY,
  }
}

export function minimapNodeStyle(node: CanvasNode, metrics: MinimapMetrics) {
  const size = canvasNodeVisualSize(node)
  return {
    left: `${metrics.offsetX + (node.x - metrics.minX) * metrics.scale}px`,
    top: `${metrics.offsetY + (node.y - metrics.minY) * metrics.scale}px`,
    width: `${Math.max(size.width * metrics.scale, 12)}px`,
    height: `${Math.max(size.height * metrics.scale, 8)}px`,
  }
}

export function minimapViewportStyle(viewport: WorldRect, metrics: MinimapMetrics) {
  return {
    left: `${metrics.offsetX + (viewport.left - metrics.minX) * metrics.scale}px`,
    top: `${metrics.offsetY + (viewport.top - metrics.minY) * metrics.scale}px`,
    width: `${Math.max(viewport.width * metrics.scale, 18)}px`,
    height: `${Math.max(viewport.height * metrics.scale, 14)}px`,
  }
}
