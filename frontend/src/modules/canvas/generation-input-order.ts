import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { getDefaultConnectionPorts } from './node-registry'

export type GenerationInputDirection = -1 | 1

function persistedOrder(connection: CanvasConnection) {
  const value = connection.metadata?.input_order
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null
}

function activeIncoming(nodeId: string, connections: readonly CanvasConnection[]) {
  return connections.filter((connection) => (
    connection.to === nodeId &&
    connection.active !== false &&
    (!connection.status || connection.status === 'active')
  ))
}

export function orderedGenerationInputConnections(
  generationNode: CanvasNode,
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const sourceIndex = new Map(connections.map((connection, index) => [connection.id, index]))
  return activeIncoming(generationNode.id, connections).flatMap((connection) => {
    const source = nodesById.get(connection.from)
    if (!source) return []
    const ports = getDefaultConnectionPorts(
      source, generationNode, connection.sourcePort, connection.targetPort,
    )
    if (!ports || (ports.targetPort !== 'prompt' && ports.targetPort !== 'media')) return []
    return [{ connection, targetPort: ports.targetPort, fallbackOrder: sourceIndex.get(connection.id) ?? 0 }]
  }).sort((left, right) => {
    if (left.targetPort !== right.targetPort) return left.targetPort.localeCompare(right.targetPort)
    const leftOrder = persistedOrder(left.connection)
    const rightOrder = persistedOrder(right.connection)
    if (leftOrder !== null || rightOrder !== null) {
      if (leftOrder === null) return 1
      if (rightOrder === null) return -1
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
    }
    return left.fallbackOrder - right.fallbackOrder
  })
}

export function reorderGenerationInputConnections(
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
  connectionId: string,
  direction: GenerationInputDirection,
): CanvasConnection[] | null {
  if (direction !== -1 && direction !== 1) return null
  const target = connections.find((connection) => connection.id === connectionId)
  if (!target) return null
  const generationNode = nodes.find((node) => node.id === target.to && node.type === 'generation')
  if (!generationNode) return null
  const ordered = orderedGenerationInputConnections(generationNode, nodes, connections)
  const current = ordered.find((item) => item.connection.id === connectionId)
  if (!current) return null
  const group = ordered.filter((item) => item.targetPort === current.targetPort)
  const currentIndex = group.findIndex((item) => item.connection.id === connectionId)
  const nextIndex = currentIndex + direction
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= group.length) return null
  ;[group[currentIndex], group[nextIndex]] = [group[nextIndex], group[currentIndex]]
  const orderById = new Map(group.map((item, index) => [item.connection.id, index + 1]))
  return connections.map((connection) => {
    const inputOrder = orderById.get(connection.id)
    if (!inputOrder) return connection
    return {
      ...connection,
      metadata: { ...(connection.metadata ?? {}), input_order: inputOrder },
    }
  })
}
