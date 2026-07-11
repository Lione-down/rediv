import type { CanvasNode } from '../../types/canvas'

export interface Point {
  x: number
  y: number
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

export interface WorldRect {
  left: number
  top: number
  width: number
  height: number
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
  return (
    node.x <= rect.left + rect.width &&
    node.x + node.width >= rect.left &&
    node.y <= rect.top + rect.height &&
    node.y + node.height >= rect.top
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
export const MAX_ZOOM = 3

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

export function nodeInputAnchor(node: CanvasNode, viewport: ViewportState) {
  return worldToSurface({ x: node.x, y: node.y + node.height / 2 }, viewport)
}

export function nodeOutputAnchor(node: CanvasNode, viewport: ViewportState) {
  return worldToSurface({ x: node.x + node.width, y: node.y + node.height / 2 }, viewport)
}

export function buildConnectionPath(from: Point, to: Point) {
  return `M ${from.x} ${from.y} C ${from.x + 110} ${from.y}, ${to.x - 110} ${to.y}, ${to.x} ${to.y}`
}

export function calculateMinimapMetrics(nodes: CanvasNode[], viewport: WorldRect): MinimapMetrics {
  const padding = 64
  const nodeMinX = nodes.reduce((minimum, node) => Math.min(minimum, node.x), 0)
  const nodeMinY = nodes.reduce((minimum, node) => Math.min(minimum, node.y), 0)
  const nodeMaxX = nodes.reduce((maximum, node) => Math.max(maximum, node.x + node.width), 1280)
  const nodeMaxY = nodes.reduce((maximum, node) => Math.max(maximum, node.y + node.height), 720)
  const minX = Math.min(nodeMinX, viewport.left) - padding
  const minY = Math.min(nodeMinY, viewport.top) - padding
  const maxX = Math.max(nodeMaxX, viewport.left + viewport.width) + padding
  const maxY = Math.max(nodeMaxY, viewport.top + viewport.height) + padding
  const boundsWidth = Math.max(maxX - minX, 1)
  const boundsHeight = Math.max(maxY - minY, 1)
  const mapWidth = 160
  const mapHeight = 104
  const scale = Math.min(mapWidth / boundsWidth, mapHeight / boundsHeight)

  return {
    minX,
    minY,
    scale,
    offsetX: (mapWidth - boundsWidth * scale) / 2,
    offsetY: (mapHeight - boundsHeight * scale) / 2,
  }
}

export function minimapNodeStyle(node: CanvasNode, metrics: MinimapMetrics) {
  return {
    left: `${metrics.offsetX + (node.x - metrics.minX) * metrics.scale}px`,
    top: `${metrics.offsetY + (node.y - metrics.minY) * metrics.scale}px`,
    width: `${Math.max(node.width * metrics.scale, 12)}px`,
    height: `${Math.max(node.height * metrics.scale, 8)}px`,
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
