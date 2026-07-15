import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import type { ArrangeNodesCommand, CanvasNodeMove } from './canvas-commands'
import { resolveGenerationContext } from './generation-context'
import { resolveGenerationResultVariants, resolveResultLineage } from './generation-lineage'
import { isNodeMutationSupported } from './node-registry'

const COLUMN_GAP = 96
const ROW_GAP = 48

function isEligible(node: CanvasNode) {
  return isNodeMutationSupported(node) && node.type !== 'group' && !node.parentNodeId && !node.isLocked
}

function centeredStackPositions(nodes: readonly CanvasNode[], centerY: number) {
  const totalHeight = nodes.reduce((height, node) => height + node.height, 0) +
    Math.max(0, nodes.length - 1) * ROW_GAP
  let y = centerY - totalHeight / 2
  return nodes.map((node) => {
    const position = { node, y }
    y += node.height + ROW_GAP
    return position
  })
}

export function createArrangeGenerationLineageCommand(
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
  selectedNodeId: string,
): ArrangeNodesCommand | null {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const selectedNode = nodesById.get(selectedNodeId)
  if (!selectedNode) return null
  const generationNode = selectedNode.type === 'generation'
    ? selectedNode
    : (() => {
        const lineage = resolveResultLineage(selectedNode, nodes, connections)
        return lineage ? nodesById.get(lineage.generationNodeId) : undefined
      })()
  if (!generationNode || generationNode.type !== 'generation') return null

  const inputNodes = resolveGenerationContext(generationNode, nodes, connections).provenance
    .filter((entry) => entry.isIncluded)
    .flatMap((entry) => {
      const node = nodesById.get(entry.nodeId)
      return node ? [node] : []
    })
  const resultNodes = resolveGenerationResultVariants(generationNode, nodes, connections)
    .flatMap((variant) => {
      const node = nodesById.get(variant.nodeId)
      return node ? [node] : []
    })
  const family = [...inputNodes, generationNode, ...resultNodes]
  if (family.length < 2 || family.some((node) => !isEligible(node))) return null

  const centerY = generationNode.y + generationNode.height / 2
  const destinations = new Map<string, { x: number; y: number }>([[generationNode.id, {
    x: generationNode.x, y: generationNode.y,
  }]])
  for (const { node, y } of centeredStackPositions(inputNodes, centerY)) {
    destinations.set(node.id, { x: generationNode.x - COLUMN_GAP - node.width, y })
  }
  for (const { node, y } of centeredStackPositions(resultNodes, centerY)) {
    destinations.set(node.id, { x: generationNode.x + generationNode.width + COLUMN_GAP, y })
  }

  const moves: CanvasNodeMove[] = family.flatMap((node) => {
    const destination = destinations.get(node.id)
    if (!destination || (destination.x === node.x && destination.y === node.y)) return []
    return [{
      nodeId: node.id,
      from: { nodeId: node.id, x: node.x, y: node.y },
      to: { nodeId: node.id, ...destination },
    }]
  })
  return moves.length ? {
    type: 'arrange-nodes',
    operation: { kind: 'generation-lineage', generationNodeId: generationNode.id },
    moves,
  } : null
}
