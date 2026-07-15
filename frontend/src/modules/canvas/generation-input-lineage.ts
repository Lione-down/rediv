import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { resolveGenerationContext } from './generation-context'
import { resolveResultLineage } from './generation-lineage'
import { getGenerationMediaType } from './node-registry'

export interface GenerationInputLineageBridge {
  connectionId: string
  generationNodeId: string
  generationTitle: string
  nodeId: string
  requestOrder: number
  variantCount: number
  variantOrder: number
}

export function resolveGenerationInputLineageBridges(
  generationNode: CanvasNode,
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
): GenerationInputLineageBridge[] {
  if (!getGenerationMediaType(generationNode)) return []
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  return resolveGenerationContext(generationNode, nodes, connections).mediaSources.flatMap((source) => {
    if (source.state !== 'included' || source.requestOrder === null) return []
    const sourceNode = nodesById.get(source.nodeId)
    if (!sourceNode || sourceNode.type !== 'result') return []
    const lineage = resolveResultLineage(sourceNode, nodes, connections)
    if (!lineage) return []
    return [{
      connectionId: source.connectionId,
      generationNodeId: lineage.generationNodeId,
      generationTitle: lineage.generationTitle,
      nodeId: source.nodeId,
      requestOrder: source.requestOrder,
      variantCount: lineage.variants.length,
      variantOrder: lineage.selectedVariantOrder,
    }]
  })
}
