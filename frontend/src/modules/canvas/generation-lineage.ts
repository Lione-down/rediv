import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { resolveGenerationContext, type GenerationInputProvenance } from './generation-context'
import { getDefaultConnectionPorts, resolveNodeDefinition } from './node-registry'

export interface ResultVariantLineage {
  connectionId: string
  isSelected: boolean
  nodeId: string
  order: number
  title: string
}

export interface ResolvedResultLineage {
  generationNodeId: string
  generationTitle: string
  inputProvenance: GenerationInputProvenance[]
  model: string | null
  selectedVariantOrder: number
  taskId: string | null
  variants: ResultVariantLineage[]
}

export type CanvasGenerationProvenance = GenerationInputProvenance | {
  connectionId: string
  isIncluded: true
  isSelected: boolean
  kind: 'result'
  nodeId: string
  order: number
}

function active(connection: CanvasConnection) {
  return connection.active !== false && (!connection.status || connection.status === 'active')
}

function canonical(node: CanvasNode, type: 'generation' | 'result') {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  return node.type === type && definition.kind === 'canonical'
}

function isTypedResultEdge(connection: CanvasConnection, source: CanvasNode, target: CanvasNode) {
  const ports = getDefaultConnectionPorts(source, target, connection.sourcePort, connection.targetPort)
  return ports?.sourcePort === 'out' && ports.targetPort === 'in'
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function resolveGenerationResultVariants(
  generationNode: CanvasNode,
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
  selectedResultNodeId?: string,
): ResultVariantLineage[] {
  if (!canonical(generationNode, 'generation')) return []
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  return connections.flatMap((connection) => {
    if (!active(connection) || connection.from !== generationNode.id) return []
    const target = nodesById.get(connection.to)
    if (!target || !canonical(target, 'result') || !isTypedResultEdge(connection, generationNode, target)) return []
    return [{
      connectionId: connection.id,
      isSelected: target.id === selectedResultNodeId,
      nodeId: target.id,
      order: 0,
      title: target.title,
    }]
  }).map((variant, index) => ({ ...variant, order: index + 1 }))
}

export function resolveResultLineage(
  resultNode: CanvasNode,
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
): ResolvedResultLineage | null {
  if (!canonical(resultNode, 'result')) return null
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const incoming = connections.filter((connection) => {
    if (!active(connection) || connection.to !== resultNode.id) return false
    const source = nodesById.get(connection.from)
    return Boolean(source && canonical(source, 'generation') && isTypedResultEdge(connection, source, resultNode))
  })
  if (incoming.length !== 1) return null

  const sourceConnection = incoming[0]
  const generationNode = nodesById.get(sourceConnection.from)!
  const resultTaskId = readString(resultNode.contentData?.source_task_id)
  const edgeTaskId = readString(sourceConnection.metadata?.source_task_id)
  if (resultTaskId && edgeTaskId && resultTaskId !== edgeTaskId) return null

  const variants = resolveGenerationResultVariants(generationNode, nodes, connections, resultNode.id)
  const selectedVariant = variants.find((variant) => variant.isSelected)
  if (!selectedVariant) return null

  return {
    generationNodeId: generationNode.id,
    generationTitle: generationNode.title,
    inputProvenance: resolveGenerationContext(generationNode, nodes, connections).provenance,
    model: readString(resultNode.contentData?.source_model),
    selectedVariantOrder: selectedVariant.order,
    taskId: resultTaskId ?? edgeTaskId,
    variants,
  }
}

export function resultLineageProvenance(lineage: ResolvedResultLineage): CanvasGenerationProvenance[] {
  return [
    ...lineage.inputProvenance,
    ...lineage.variants.map((variant) => ({
      connectionId: variant.connectionId,
      isIncluded: true as const,
      isSelected: variant.isSelected,
      kind: 'result' as const,
      nodeId: variant.nodeId,
      order: variant.order,
    })),
  ]
}
