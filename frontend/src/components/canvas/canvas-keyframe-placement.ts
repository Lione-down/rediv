import type { CanvasNode } from '../../types/canvas'
import { canvasNodeWorldRect } from './canvas-geometry'

export function resolveKeyframeRailPlacement(node: CanvasNode, nodes: readonly CanvasNode[]): 'above' | 'below' {
  const rect = canvasNodeWorldRect(node, 'content')
  const overlapping = nodes
    .filter((candidate) => candidate.id !== node.id)
    .map((candidate) => canvasNodeWorldRect(candidate, 'content'))
    .filter((candidate) => candidate.left < rect.left + rect.width && candidate.left + candidate.width > rect.left)
  const nearestAbove = overlapping
    .filter((candidate) => candidate.top + candidate.height <= rect.top)
    .reduce((bottom, candidate) => Math.max(bottom, candidate.top + candidate.height), Number.NEGATIVE_INFINITY)
  const nearestBelow = overlapping
    .filter((candidate) => candidate.top >= rect.top + rect.height)
    .reduce((top, candidate) => Math.min(top, candidate.top), Number.POSITIVE_INFINITY)
  const spaceAbove = rect.top - nearestAbove
  const spaceBelow = nearestBelow - (rect.top + rect.height)
  return spaceAbove > spaceBelow ? 'above' : 'below'
}
