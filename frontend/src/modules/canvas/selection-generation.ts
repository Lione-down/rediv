import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import type { InsertGraphCommand } from './canvas-commands'
import { resolveGenerationContext } from './generation-context'
import {
  createRegistryNodeDraft,
  getDefaultConnectionPorts,
  isNodeMutationSupported,
} from './node-registry'

export type SelectionGenerationMediaType = 'image' | 'video'

function uniqueSelection(nodes: readonly CanvasNode[]) {
  return nodes.length >= 2 && new Set(nodes.map((node) => node.id)).size === nodes.length
}

function generationPosition(nodes: readonly CanvasNode[]) {
  const right = Math.max(...nodes.map((node) => node.x + node.width))
  const top = Math.min(...nodes.map((node) => node.y))
  const bottom = Math.max(...nodes.map((node) => node.y + node.height))
  return { x: right + 96, y: (top + bottom - 220) / 2 }
}

export function createSelectionGenerationCommand(
  selectedNodes: readonly CanvasNode[],
  mediaType: SelectionGenerationMediaType,
  createId: () => string = createCanvasEntityId,
): InsertGraphCommand | null {
  if (
    !uniqueSelection(selectedNodes) ||
    selectedNodes.some((node) => (
      node.isLocked || node.parentNodeId || !isNodeMutationSupported(node)
    ))
  ) return null

  const generationNode: CanvasNode = {
    id: createId(),
    ...createRegistryNodeDraft('generation', mediaType, generationPosition(selectedNodes)),
  }
  const inputOrder = new Map<string, number>()
  const connections = selectedNodes.flatMap((source): CanvasConnection[] => {
    const ports = getDefaultConnectionPorts(source, generationNode)
    if (!ports || (ports.targetPort !== 'prompt' && ports.targetPort !== 'media')) return []
    const order = (inputOrder.get(ports.targetPort) ?? 0) + 1
    inputOrder.set(ports.targetPort, order)
    return [{
      id: createId(),
      from: source.id,
      to: generationNode.id,
      sourcePort: ports.sourcePort,
      targetPort: ports.targetPort,
      status: 'active',
      active: true,
      metadata: { input_order: order },
    }]
  })
  if (connections.length !== selectedNodes.length) return null

  const context = resolveGenerationContext(
    generationNode,
    [...selectedNodes, generationNode],
    connections,
  )
  if (context.provenance.length !== selectedNodes.length || context.provenance.some((item) => !item.isIncluded)) {
    return null
  }
  return { type: 'insert-graph', nodes: [generationNode], connections }
}

export function canCreateGenerationFromSelection(selectedNodes: readonly CanvasNode[]) {
  let index = 0
  return Boolean(createSelectionGenerationCommand(selectedNodes, 'image', () => `selection-preview-${index++}`))
}
