import type { CanvasNode } from '../../types/canvas'
import { resolveNodeDefinition, type NodePortDirection } from './node-registry'

export interface CanvasNodeLayoutSize {
  width: number
  height: number
}

export interface CanvasNodeLayoutRect extends CanvasNodeLayoutSize {
  left: number
  top: number
}

export interface CanvasCardRect {
  left: number
  top: number
  width: number
  height: number
}

export interface CanvasCardPortAnchor {
  portId: string
  x: number
  y: number
}

export interface CanvasCardGeometry {
  visible: CanvasCardRect
  title: CanvasCardRect
  selection: CanvasCardRect
  composer: CanvasCardRect
  ports: {
    input: CanvasCardPortAnchor[]
    output: CanvasCardPortAnchor[]
  }
}

export interface CanvasAttachedSurfacePlacementInput {
  nodeSurfaceRect: CanvasCardRect
  stageRect: CanvasCardRect
  insets?: Partial<{ top: number; right: number; bottom: number; left: number }>
  surfaceHeight: number
  preferredWidth: number
  gap: number
}

export interface CanvasAttachedSurfacePlacement {
  left: number
  top: number
  width: number
  anchorX: number
  placement: 'above' | 'below'
}

function readString(content: Record<string, unknown> | undefined, key: string) {
  const value = content?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function readAspectRatio(content: Record<string, unknown> | undefined) {
  const direct = content?.aspect_ratio
  if (typeof direct === 'number' && Number.isFinite(direct) && direct >= 0.1 && direct <= 10) return direct
  const width = content?.width
  const height = content?.height
  if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
    const ratio = width / height
    return Number.isFinite(ratio) && ratio >= 0.1 && ratio <= 10 ? ratio : null
  }
  return null
}

export function resolveCanvasAuthoringCardVisualHeight(node: CanvasNode) {
  if (node.type !== 'script' && node.type !== 'note' && node.type !== 'generation') return null
  if (resolveNodeDefinition(node.type, node.contentData).kind !== 'canonical') return null
  if (node.type === 'generation') {
    if (typeof node.contentData?.materialized_result_node_id === 'string') return null
    return Math.min(node.height, 160)
  }
  const contentLength = (node.content ?? '').trim().length
  const contentHeight = contentLength > 160 ? 220 : contentLength > 80 ? 190 : 160
  return Math.min(node.height, contentHeight)
}

export function resolveCanvasNodeMediaLayoutAspectRatio(node: CanvasNode) {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  const isMaterializedProjection = typeof node.contentData?.materialized_result_node_id === 'string'
  if (definition.kind === 'unsupported' || (!definition.capabilities.canPreviewMedia && !isMaterializedProjection)) return null
  const subtype = readString(node.contentData, 'subtype')
  if (subtype !== 'image' && subtype !== 'video' && subtype !== 'audio') return null
  const hasMediaSurface = Boolean(
    readString(node.contentData, 'url') ||
    readString(node.contentData, 'preview_url') ||
    readString(node.contentData, 'thumbnail_url'),
  )
  return hasMediaSurface ? readAspectRatio(node.contentData) : null
}

export function resolveCanvasNodeLayoutSize(node: CanvasNode): CanvasNodeLayoutSize {
  const authoringHeight = resolveCanvasAuthoringCardVisualHeight(node)
  if (authoringHeight !== null) return { width: node.width, height: authoringHeight }
  const ratio = resolveCanvasNodeMediaLayoutAspectRatio(node)
  if (!ratio) return { width: node.width, height: node.height }
  const longEdge = Math.max(node.width, Math.min(node.height, node.width))
  return ratio >= 1
    ? { width: longEdge, height: longEdge / ratio }
    : { width: longEdge * ratio, height: longEdge }
}

function resolvePortAnchors(
  node: CanvasNode,
  visible: CanvasCardRect,
  direction: NodePortDirection,
) {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  if (definition.kind === 'unsupported') return []
  return definition.ports
    .filter((port) => port.direction === direction)
    .map((port) => ({
      portId: port.id,
      x: direction === 'input' ? visible.left : visible.left + visible.width,
      y: visible.top + visible.height / 2,
    }))
}

export function resolveCanvasCardGeometry(node: CanvasNode): CanvasCardGeometry {
  const size = resolveCanvasNodeLayoutSize(node)
  const visible = { left: node.x, top: node.y, width: size.width, height: size.height }
  return {
    visible,
    title: { left: visible.left, top: visible.top - 22, width: visible.width, height: 18 },
    selection: {
      left: visible.left - 1,
      top: visible.top - 1,
      width: visible.width + 2,
      height: visible.height + 2,
    },
    composer: {
      left: visible.left,
      top: visible.top + visible.height + 8,
      width: visible.width,
      height: 76,
    },
    ports: {
      input: resolvePortAnchors(node, visible, 'input'),
      output: resolvePortAnchors(node, visible, 'output'),
    },
  }
}

export function resolveCanvasNodeLayoutRect(node: CanvasNode): CanvasNodeLayoutRect {
  return resolveCanvasCardGeometry(node).visible
}

export function isPointInsideCanvasNodeLayout(node: CanvasNode, point: { x: number; y: number }) {
  const rect = resolveCanvasCardGeometry(node).visible
  return point.x >= rect.left && point.x <= rect.left + rect.width &&
    point.y >= rect.top && point.y <= rect.top + rect.height
}

export function resolveCanvasNodeLayoutCenter(node: CanvasNode) {
  const rect = resolveCanvasCardGeometry(node).visible
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

export function resolveCanvasCardPortAnchors(
  node: CanvasNode,
  direction: NodePortDirection,
) {
  const geometry = resolveCanvasCardGeometry(node)
  return direction === 'input' ? geometry.ports.input : geometry.ports.output
}

export function resolveCanvasAttachedSurfacePlacement(
  input: CanvasAttachedSurfacePlacementInput,
): CanvasAttachedSurfacePlacement {
  const { nodeSurfaceRect, stageRect } = input
  const safeLeft = stageRect.left + Math.max(0, input.insets?.left ?? 0) + 16
  const safeTop = stageRect.top + Math.max(0, input.insets?.top ?? 0) + 12
  const safeRight = Math.max(
    safeLeft,
    stageRect.left + stageRect.width - Math.max(0, input.insets?.right ?? 0) - 16,
  )
  const safeBottom = Math.max(
    safeTop,
    stageRect.top + stageRect.height - Math.max(0, input.insets?.bottom ?? 0) - 12,
  )
  const width = Math.min(Math.max(0, input.preferredWidth), Math.max(0, safeRight - safeLeft))
  const nodeCenterX = nodeSurfaceRect.left + nodeSurfaceRect.width / 2
  const desiredLeft = nodeCenterX - width / 2
  const left = Math.min(Math.max(desiredLeft, safeLeft), safeRight - width)
  const belowTop = nodeSurfaceRect.top + nodeSurfaceRect.height + input.gap
  const aboveTop = nodeSurfaceRect.top - input.gap - input.surfaceHeight
  const placement = belowTop + input.surfaceHeight > safeBottom && aboveTop >= safeTop
    ? 'above'
    : 'below'
  return {
    left,
    top: placement === 'above' ? aboveTop : belowTop,
    width,
    anchorX: nodeCenterX - left,
    placement,
  }
}
