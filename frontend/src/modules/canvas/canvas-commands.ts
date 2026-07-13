import type { CanvasConnection, CanvasNode } from '../../types/canvas'

export type CanvasCommandSource = 'pointer' | 'keyboard' | 'toolbar' | 'context-menu'

export interface CanvasNodePosition {
  nodeId: string
  x: number
  y: number
}

export interface CanvasNodeMove {
  nodeId: string
  from: CanvasNodePosition
  to: CanvasNodePosition
}

export interface MoveNodesCommand {
  type: 'move-nodes'
  moves: CanvasNodeMove[]
}

export interface DuplicateNodesCommand {
  type: 'duplicate-nodes'
  nodeIds: string[]
  offset: { x: number; y: number }
}

export interface DeleteSelectionCommand {
  type: 'delete-selection'
  nodeIds: string[]
  connectionIds: string[]
}

export type CanvasCommand = MoveNodesCommand | DuplicateNodesCommand | DeleteSelectionCommand

export interface CanvasCommandEnvelope {
  source: CanvasCommandSource
  command: CanvasCommand
}

function uniqueIds(ids: readonly string[]) {
  return [...new Set(ids.filter(Boolean))]
}

export function createMoveNodesCommand(
  origins: readonly CanvasNodePosition[],
  nodes: readonly CanvasNode[],
): MoveNodesCommand | null {
  const currentById = new Map(nodes.map((node) => [node.id, node]))
  const moves = origins.flatMap((origin) => {
    const current = currentById.get(origin.nodeId)
    if (!current || (current.x === origin.x && current.y === origin.y)) return []
    return [{
      nodeId: origin.nodeId,
      from: { ...origin },
      to: { nodeId: current.id, x: current.x, y: current.y },
    }]
  })
  return moves.length ? { type: 'move-nodes', moves } : null
}

export function createDuplicateNodesCommand(
  nodeIds: readonly string[],
  offset = { x: 32, y: 32 },
): DuplicateNodesCommand | null {
  const targets = uniqueIds(nodeIds)
  return targets.length ? { type: 'duplicate-nodes', nodeIds: targets, offset: { ...offset } } : null
}

export function createDeleteSelectionCommand(
  nodeIds: readonly string[],
  connectionIds: readonly string[],
): DeleteSelectionCommand | null {
  const nodeTargets = uniqueIds(nodeIds)
  const connectionTargets = uniqueIds(connectionIds)
  return nodeTargets.length || connectionTargets.length
    ? { type: 'delete-selection', nodeIds: nodeTargets, connectionIds: connectionTargets }
    : null
}

export function getInternalConnections(
  connections: readonly CanvasConnection[],
  nodeIds: readonly string[],
) {
  const selectedIds = new Set(nodeIds)
  return connections.filter(
    (connection) => selectedIds.has(connection.from) && selectedIds.has(connection.to),
  )
}
