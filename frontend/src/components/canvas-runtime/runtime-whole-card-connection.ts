import { resolveVisibleAcquisitionConnectionPorts } from '../../modules/canvas/node-registry'
import type { CanvasNode } from '../../types/canvas'

function pointInsideRect(x: number, y: number, rect: DOMRect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

export function resolveRuntimeWholeCardConnectionTarget(
  nodes: readonly CanvasNode[],
  x: number,
  y: number,
  direction: 'input' | 'output',
  originNodeId: string,
) {
  const candidateElement = [...document.querySelectorAll<HTMLElement>('[data-runtime-node]')]
    .reverse()
    .find((element) => (
      element.dataset.runtimeNode !== originNodeId &&
      pointInsideRect(x, y, element.getBoundingClientRect())
    ))
  const candidateNodeId = candidateElement?.dataset.runtimeNode
  const origin = nodes.find((node) => node.id === originNodeId)
  const candidate = nodes.find((node) => node.id === candidateNodeId)
  if (!candidateElement || !candidate || !origin) return null
  const side: 'input' | 'output' = direction === 'output' ? 'input' : 'output'
  const ports = direction === 'output'
    ? resolveVisibleAcquisitionConnectionPorts(origin, candidate)
    : resolveVisibleAcquisitionConnectionPorts(candidate, origin)
  const rect = candidateElement.getBoundingClientRect()
  return {
    anchor: {
      x: side === 'input' ? rect.left : rect.right,
      y: Math.min(Math.max(y, rect.top + 18), rect.bottom - 18),
    },
    candidateElement,
    candidateNodeId: candidate.id,
    ports,
    side,
    state: ports ? 'compatible' as const : 'incompatible' as const,
  }
}
