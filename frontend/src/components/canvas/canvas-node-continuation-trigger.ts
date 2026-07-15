import type { CanvasNode } from '../../types/canvas'
import { resolveConnectionContinuationOptions } from '../../modules/canvas/connection-continuation'
import { buildCanvasNodePresentation } from './canvas-node-presentation'

export interface CanvasNodeContinuationTrigger {
  node: CanvasNode
  portId: string
}

export function resolveCanvasNodeContinuationTrigger(
  nodes: readonly CanvasNode[],
  selectedNodeIds: readonly string[],
  isReadOnly: boolean,
): CanvasNodeContinuationTrigger | null {
  if (isReadOnly || selectedNodeIds.length !== 1) return null
  const node = nodes.find((candidate) => candidate.id === selectedNodeIds[0])
  if (!node || node.isLocked) return null
  const presentation = buildCanvasNodePresentation(node)
  if (presentation.isUnsupported) return null
  const port = presentation.outputPorts.find((candidate) => (
    resolveConnectionContinuationOptions(node, candidate.id, 'downstream').length > 0
  ))
  return port ? { node, portId: port.id } : null
}
