import type { CanvasNode } from '../../types/canvas'
import { resolveNodeDefinition } from './node-registry'

export interface CanvasNodeLayoutSize {
  width: number
  height: number
}

export interface CanvasNodeLayoutRect extends CanvasNodeLayoutSize {
  left: number
  top: number
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
  if (node.type === 'generation') return 128
  const contentLength = (node.content ?? '').trim().length
  const contentHeight = contentLength > 160 ? 220 : contentLength > 80 ? 180 : 120
  return Math.min(node.height, contentHeight)
}

export function resolveCanvasNodeMediaLayoutAspectRatio(node: CanvasNode) {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  if (definition.kind === 'unsupported' || !definition.capabilities.canPreviewMedia) return null
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

export function resolveCanvasNodeLayoutRect(node: CanvasNode): CanvasNodeLayoutRect {
  return { left: node.x, top: node.y, ...resolveCanvasNodeLayoutSize(node) }
}

export function isPointInsideCanvasNodeLayout(node: CanvasNode, point: { x: number; y: number }) {
  const rect = resolveCanvasNodeLayoutRect(node)
  return point.x >= rect.left && point.x <= rect.left + rect.width &&
    point.y >= rect.top && point.y <= rect.top + rect.height
}

export function resolveCanvasNodeLayoutCenter(node: CanvasNode) {
  const rect = resolveCanvasNodeLayoutRect(node)
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}
