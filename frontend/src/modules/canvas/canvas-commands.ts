import type { CanvasConnection, CanvasNode } from '../../types/canvas'

export type CanvasCommandSource = 'pointer' | 'keyboard' | 'toolbar' | 'context-menu' | 'accessibility'

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

export interface GroupNodesCommand {
  type: 'group-nodes'
  nodeIds: string[]
  padding: number
}

export interface UngroupNodesCommand {
  type: 'ungroup-nodes'
  groupIds: string[]
}

export interface ConnectNodesCommand {
  type: 'connect-nodes'
  sourceNodeId: string
  targetNodeId: string
  sourcePort: 'out'
  targetPort: 'in'
}

export type CanvasCommand =
  | MoveNodesCommand
  | DuplicateNodesCommand
  | DeleteSelectionCommand
  | GroupNodesCommand
  | UngroupNodesCommand
  | ConnectNodesCommand

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

export function createGroupNodesCommand(
  nodes: readonly CanvasNode[],
  nodeIds: readonly string[],
  padding = 24,
): GroupNodesCommand | null {
  const requestedIds = new Set(uniqueIds(nodeIds))
  const targets = nodes.filter((node) => requestedIds.has(node.id))
  if (
    targets.length < 2 ||
    targets.length !== requestedIds.size ||
    targets.some((node) => node.type === 'group' || node.parentNodeId || node.isLocked)
  ) return null
  return {
    type: 'group-nodes',
    nodeIds: targets.map((node) => node.id),
    padding: Math.max(0, padding),
  }
}

export function createUngroupNodesCommand(
  nodes: readonly CanvasNode[],
  nodeIds: readonly string[],
): UngroupNodesCommand | null {
  const selectedIds = new Set(uniqueIds(nodeIds))
  const groupIds = uniqueIds(nodes.flatMap((node) => {
    if (!selectedIds.has(node.id)) return []
    if (node.type === 'group') return [node.id]
    return node.parentNodeId ? [node.parentNodeId] : []
  })).filter((groupId) => nodes.some((node) => node.id === groupId && node.type === 'group'))
  return groupIds.length ? { type: 'ungroup-nodes', groupIds } : null
}

export function createConnectNodesCommand(
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
  sourceNodeId: string,
  targetNodeId: string,
  sourcePort: 'out' = 'out',
  targetPort: 'in' = 'in',
): ConnectNodesCommand | null {
  if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) return null
  const source = nodes.find((node) => node.id === sourceNodeId)
  const target = nodes.find((node) => node.id === targetNodeId)
  if (
    !source || !target || source.type === 'group' || target.type === 'group' ||
    source.parentNodeId || target.parentNodeId || source.isLocked || target.isLocked
  ) return null
  const duplicate = connections.some((connection) => (
    connection.from === sourceNodeId &&
    connection.to === targetNodeId &&
    (connection.sourcePort ?? 'out') === sourcePort &&
    (connection.targetPort ?? 'in') === targetPort
  ))
  return duplicate ? null : {
    type: 'connect-nodes', sourceNodeId, targetNodeId, sourcePort, targetPort,
  }
}
