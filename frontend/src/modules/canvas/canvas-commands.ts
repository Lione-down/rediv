import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import type { InsertNodeIntoConnectionCommand } from './edge-insertion'
import {
  getDefaultConnectionPorts,
  isNodeGroupContainer,
  isNodeMutationSupported,
} from './node-registry'

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
  sourcePort: string
  targetPort: string
}

export interface ReconnectConnectionCommand {
  type: 'reconnect-connection'
  connectionId: string
  sourceNodeId: string
  targetNodeId: string
  sourcePort: string
  targetPort: string
}

export type CanvasAlignment = 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom'
export type CanvasDistribution = 'horizontal' | 'vertical'
export type CanvasArrangeOperation =
  | { kind: 'align'; alignment: CanvasAlignment }
  | { kind: 'distribute'; distribution: CanvasDistribution }
  | { kind: 'auto-arrange' }

export interface ArrangeNodesCommand {
  type: 'arrange-nodes'
  operation: CanvasArrangeOperation
  moves: CanvasNodeMove[]
}

export interface SetNodesLockedCommand {
  type: 'set-nodes-locked'
  nodeIds: string[]
  locked: boolean
}

export interface InsertGraphCommand {
  type: 'insert-graph'
  nodes: CanvasNode[]
  connections: CanvasConnection[]
}

export type CanvasCommand =
  | MoveNodesCommand
  | DuplicateNodesCommand
  | DeleteSelectionCommand
  | GroupNodesCommand
  | UngroupNodesCommand
  | ConnectNodesCommand
  | ReconnectConnectionCommand
  | ArrangeNodesCommand
  | SetNodesLockedCommand
  | InsertGraphCommand
  | InsertNodeIntoConnectionCommand

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
    if (!current || !isArrangeEligibleNode(current) || (current.x === origin.x && current.y === origin.y)) return []
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

export function isConnectionMutationSupported(
  nodes: readonly CanvasNode[],
  connection: CanvasConnection,
) {
  const source = nodes.find((node) => node.id === connection.from)
  const target = nodes.find((node) => node.id === connection.to)
  return Boolean(
    source && target && isNodeMutationSupported(source) && isNodeMutationSupported(target),
  )
}

export function canDeleteCanvasNode(
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
  nodeId: string,
) {
  const target = nodes.find((node) => node.id === nodeId)
  if (!target || target.isLocked || !isNodeMutationSupported(target)) return false
  if (target.parentNodeId) {
    const parent = nodes.find((node) => node.id === target.parentNodeId)
    if (!parent || parent.isLocked || !isNodeMutationSupported(parent)) return false
  }
  const children = nodes.filter((node) => node.parentNodeId === nodeId)
  if (children.some((node) => node.isLocked || !isNodeMutationSupported(node))) return false
  return connections
    .filter((connection) => connection.from === nodeId || connection.to === nodeId)
    .every((connection) => isConnectionMutationSupported(nodes, connection))
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
    targets.some((node) => !isArrangeEligibleNode(node))
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
  connections: readonly CanvasConnection[] = [],
): UngroupNodesCommand | null {
  const selectedIds = new Set(uniqueIds(nodeIds))
  const selectedNodes = nodes.filter((node) => selectedIds.has(node.id))
  if (
    selectedNodes.length !== selectedIds.size ||
    selectedNodes.some((node) => node.isLocked || !isNodeMutationSupported(node))
  ) return null
  const groupIds = uniqueIds(nodes.flatMap((node) => {
    if (!selectedIds.has(node.id)) return []
    if (isNodeGroupContainer(node)) return [node.id]
    return node.parentNodeId ? [node.parentNodeId] : []
  })).filter((groupId) => nodes.some((node) => (
    node.id === groupId && isNodeGroupContainer(node) && !node.isLocked
  )))
  if (!groupIds.length) return null
  const affectedChildren = nodes.filter((node) => node.parentNodeId && groupIds.includes(node.parentNodeId))
  if (affectedChildren.some((node) => node.isLocked || !isNodeMutationSupported(node))) return null
  const affectedConnections = connections.filter((connection) => (
    groupIds.includes(connection.from) || groupIds.includes(connection.to)
  ))
  if (affectedConnections.some((connection) => !isConnectionMutationSupported(nodes, connection))) return null
  return { type: 'ungroup-nodes', groupIds }
}

export function createConnectNodesCommand(
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
  sourceNodeId: string,
  targetNodeId: string,
  sourcePort?: string,
  targetPort?: string,
): ConnectNodesCommand | null {
  if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) return null
  const source = nodes.find((node) => node.id === sourceNodeId)
  const target = nodes.find((node) => node.id === targetNodeId)
  if (
    !source || !target || source.type === 'group' || target.type === 'group' ||
    source.parentNodeId || target.parentNodeId || source.isLocked || target.isLocked
  ) return null
  const resolvedPorts = getDefaultConnectionPorts(source, target, sourcePort, targetPort)
  if (!resolvedPorts) return null
  const duplicate = connections.some((connection) => (
    connection.from === sourceNodeId &&
    connection.to === targetNodeId &&
    (connection.sourcePort ?? 'out') === resolvedPorts.sourcePort &&
    (connection.targetPort ?? 'in') === resolvedPorts.targetPort
  ))
  return duplicate ? null : {
    type: 'connect-nodes', sourceNodeId, targetNodeId, ...resolvedPorts,
  }
}

export function createReconnectConnectionCommand(
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
  connectionId: string,
  sourceNodeId: string,
  targetNodeId: string,
  sourcePort: string,
  targetPort: string,
): ReconnectConnectionCommand | null {
  const current = connections.find((connection) => connection.id === connectionId)
  if (!current || !isConnectionMutationSupported(nodes, current)) return null
  const withoutCurrent = connections.filter((connection) => connection.id !== connectionId)
  const connect = createConnectNodesCommand(
    nodes, withoutCurrent, sourceNodeId, targetNodeId, sourcePort, targetPort,
  )
  if (!connect) return null
  if (
    current.from === connect.sourceNodeId && current.to === connect.targetNodeId &&
    current.sourcePort === connect.sourcePort && current.targetPort === connect.targetPort
  ) return null
  return {
    type: 'reconnect-connection', connectionId,
    sourceNodeId: connect.sourceNodeId, targetNodeId: connect.targetNodeId,
    sourcePort: connect.sourcePort, targetPort: connect.targetPort,
  }
}

export function isArrangeEligibleNode(node: CanvasNode) {
  return isNodeMutationSupported(node) && node.type !== 'group' && !node.parentNodeId && !node.isLocked
}

function getArrangeTargets(
  nodes: readonly CanvasNode[],
  nodeIds: readonly string[],
  minimum: number,
) {
  const requestedIds = new Set(uniqueIds(nodeIds))
  const targets = nodes.filter((node) => requestedIds.has(node.id))
  if (
    targets.length < minimum || targets.length !== requestedIds.size ||
    targets.some((node) => !isArrangeEligibleNode(node))
  ) return null
  return targets
}

function createArrangeCommand(
  operation: CanvasArrangeOperation,
  targets: readonly CanvasNode[],
  positions: ReadonlyMap<string, { x: number; y: number }>,
): ArrangeNodesCommand | null {
  const moves = targets.flatMap((node) => {
    const position = positions.get(node.id)
    if (!position || (position.x === node.x && position.y === node.y)) return []
    return [{
      nodeId: node.id,
      from: { nodeId: node.id, x: node.x, y: node.y },
      to: { nodeId: node.id, x: position.x, y: position.y },
    }]
  })
  return moves.length ? { type: 'arrange-nodes', operation, moves } : null
}

export function createAlignNodesCommand(
  nodes: readonly CanvasNode[],
  nodeIds: readonly string[],
  alignment: CanvasAlignment,
): ArrangeNodesCommand | null {
  const targets = getArrangeTargets(nodes, nodeIds, 2)
  if (!targets) return null
  const left = Math.min(...targets.map((node) => node.x))
  const right = Math.max(...targets.map((node) => node.x + node.width))
  const top = Math.min(...targets.map((node) => node.y))
  const bottom = Math.max(...targets.map((node) => node.y + node.height))
  const positions = new Map(targets.map((node) => {
    let x = node.x
    let y = node.y
    if (alignment === 'left') x = left
    else if (alignment === 'center-x') x = (left + right - node.width) / 2
    else if (alignment === 'right') x = right - node.width
    else if (alignment === 'top') y = top
    else if (alignment === 'center-y') y = (top + bottom - node.height) / 2
    else y = bottom - node.height
    return [node.id, { x, y }]
  }))
  return createArrangeCommand({ kind: 'align', alignment }, targets, positions)
}

export function createDistributeNodesCommand(
  nodes: readonly CanvasNode[],
  nodeIds: readonly string[],
  distribution: CanvasDistribution,
): ArrangeNodesCommand | null {
  const targets = getArrangeTargets(nodes, nodeIds, 3)
  if (!targets) return null
  const graphOrder = new Map(targets.map((node, index) => [node.id, index]))
  const isHorizontal = distribution === 'horizontal'
  const ordered = [...targets].sort((left, right) => {
    const leftCenter = isHorizontal ? left.x + left.width / 2 : left.y + left.height / 2
    const rightCenter = isHorizontal ? right.x + right.width / 2 : right.y + right.height / 2
    return leftCenter - rightCenter || graphOrder.get(left.id)! - graphOrder.get(right.id)!
  })
  const first = ordered[0]
  const last = ordered.at(-1)!
  const start = isHorizontal ? first.x + first.width / 2 : first.y + first.height / 2
  const end = isHorizontal ? last.x + last.width / 2 : last.y + last.height / 2
  const step = (end - start) / (ordered.length - 1)
  const positions = new Map(ordered.map((node, index) => [node.id, {
    x: isHorizontal ? start + step * index - node.width / 2 : node.x,
    y: isHorizontal ? node.y : start + step * index - node.height / 2,
  }]))
  return createArrangeCommand({ kind: 'distribute', distribution }, targets, positions)
}

export function createAutoArrangeNodesCommand(
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
  nodeIds: readonly string[],
): ArrangeNodesCommand | null {
  const targets = getArrangeTargets(nodes, nodeIds, 2)
  if (!targets) return null
  const order = new Map(targets.map((node, index) => [node.id, index]))
  const targetIds = new Set(targets.map((node) => node.id))
  const outgoing = new Map(targets.map((node) => [node.id, [] as string[]]))
  const indegree = new Map(targets.map((node) => [node.id, 0]))
  for (const connection of connections) {
    if (!targetIds.has(connection.from) || !targetIds.has(connection.to) || connection.from === connection.to) continue
    const targetsFromSource = outgoing.get(connection.from)!
    if (targetsFromSource.includes(connection.to)) continue
    targetsFromSource.push(connection.to)
    indegree.set(connection.to, indegree.get(connection.to)! + 1)
  }
  for (const targetsFromSource of outgoing.values()) {
    targetsFromSource.sort((left, right) => order.get(left)! - order.get(right)!)
  }
  const levels = new Map(targets.map((node) => [node.id, 0]))
  const queue = targets.filter((node) => indegree.get(node.id) === 0).map((node) => node.id)
  const visited = new Set<string>()
  while (queue.length) {
    queue.sort((left, right) => order.get(left)! - order.get(right)!)
    const nodeId = queue.shift()!
    visited.add(nodeId)
    for (const targetId of outgoing.get(nodeId)!) {
      levels.set(targetId, Math.max(levels.get(targetId)!, levels.get(nodeId)! + 1))
      indegree.set(targetId, indegree.get(targetId)! - 1)
      if (indegree.get(targetId) === 0) queue.push(targetId)
    }
  }
  const resolvedMaximum = Math.max(0, ...[...visited].map((nodeId) => levels.get(nodeId)!))
  for (const node of targets) {
    if (!visited.has(node.id)) levels.set(node.id, resolvedMaximum + 1)
  }
  const anchorX = Math.min(...targets.map((node) => node.x))
  const anchorY = Math.min(...targets.map((node) => node.y))
  const columnWidth = Math.max(...targets.map((node) => node.width)) + 96
  const positions = new Map<string, { x: number; y: number }>()
  const columns = new Map<number, CanvasNode[]>()
  for (const node of targets) {
    const level = levels.get(node.id)!
    columns.set(level, [...(columns.get(level) ?? []), node])
  }
  for (const [level, columnNodes] of [...columns.entries()].sort(([left], [right]) => left - right)) {
    let y = anchorY
    for (const node of columnNodes) {
      positions.set(node.id, { x: anchorX + level * columnWidth, y })
      y += node.height + 48
    }
  }
  return createArrangeCommand({ kind: 'auto-arrange' }, targets, positions)
}

export function createSetNodesLockedCommand(
  nodes: readonly CanvasNode[],
  nodeIds: readonly string[],
  locked: boolean,
): SetNodesLockedCommand | null {
  const requestedIds = new Set(uniqueIds(nodeIds))
  const targets = nodes.filter((node) => requestedIds.has(node.id))
  if (
    !targets.length || targets.length !== requestedIds.size ||
    targets.some((node) => !isNodeMutationSupported(node))
  ) return null
  const changedIds = targets.filter((node) => Boolean(node.isLocked) !== locked).map((node) => node.id)
  return changedIds.length ? { type: 'set-nodes-locked', nodeIds: changedIds, locked } : null
}
