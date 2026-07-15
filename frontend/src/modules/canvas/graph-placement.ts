import type { CanvasNode } from '../../types/canvas'

interface GraphRect {
  x: number
  y: number
  width: number
  height: number
}

export function findFirstUnoccupiedPosition(
  origin: Pick<GraphRect, 'x' | 'y'>,
  size: Pick<GraphRect, 'width' | 'height'>,
  existingNodes: readonly CanvasNode[],
  excludedNodeIds: readonly string[] = [],
) {
  const excludedIds = new Set(excludedNodeIds)
  const occupiedNodes = existingNodes.filter((node) => !excludedIds.has(node.id))
  const verticalStep = size.height + 24
  const highestBottom = Math.max(origin.y, ...occupiedNodes.map((node) => node.y + node.height))
  const finalSlot = Math.max(0, Math.ceil((highestBottom + 24 - origin.y) / verticalStep))
  for (let slot = 0; slot <= finalSlot; slot += 1) {
    const candidate = { x: origin.x, y: origin.y + slot * verticalStep }
    const isOccupied = occupiedNodes.some((node) => (
      candidate.x < node.x + node.width && candidate.x + size.width > node.x &&
      candidate.y < node.y + node.height && candidate.y + size.height > node.y
    ))
    if (!isOccupied) return candidate
  }
  return { x: origin.x, y: origin.y }
}
