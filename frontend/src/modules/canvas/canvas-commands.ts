import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import type { InsertNodeIntoConnectionCommand } from './edge-insertion'
import type { GenerationNodeParameters } from './generation-parameters'
import type { CinematicSkillNodeSettings } from './cinematic-skills'
import type { CanvasCardConfigurationSnapshot } from './canvas-card-configuration'
import type { ScriptAuthoringLineage } from './script-authoring'
import type { ApplyCinematicSequenceCommand } from './cinematic-sequence-command'
import type { StoryboardAssetCommand } from './storyboard-asset-commands'
import type { UpdateScriptReferenceAssetsCommand } from './script-reference-assets'
import {
  reorderGenerationInputConnections,
  type GenerationInputDirection,
} from './generation-input-order'
import {
  getAuthoringConnectionPorts,
  isNodeGroupContainer,
  isNodeMutationSupported,
} from './node-registry'
import { resolveCanvasDragNodeIds } from './canvas-drag-resolution'
import type {
  ConvertStoryboardGroupCommand,
  CreateStoryboardGroupCommand,
  ReorderStoryboardGroupCommand,
  UpdateStoryboardGroupCommand,
} from './storyboard-commands'
import type {
  ApplyGenerationJobResultCommand,
  BindTextGenerationJobCommand,
  SetTextCardContentCommand,
} from './text-card-commands'

export { resolveCanvasDragNodeIds } from './canvas-drag-resolution'
export {
  createApplyGenerationJobResultCommand,
  createBindTextGenerationJobCommand,
  createSetTextCardContentCommand,
  readTextCardContentRevision,
} from './text-card-commands'
export type {
  ApplyGenerationJobResultCommand,
  BindTextGenerationJobCommand,
  SetTextCardContentCommand,
} from './text-card-commands'

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

export interface MoveNodeMembershipCommand {
  type: 'move-node-membership'
  move: CanvasNodeMove
  fromParentNodeId: string | null
  toParentNodeId: string | null
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
  | { kind: 'generation-lineage'; generationNodeId: string }

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

export interface RenameNodeCommand {
  type: 'rename-node'
  nodeId: string
  title: string
}

export interface InsertGraphCommand {
  type: 'insert-graph'
  nodes: CanvasNode[]
  connections: CanvasConnection[]
}

export interface ReorderGenerationInputCommand {
  type: 'reorder-generation-input'
  connectionId: string
  direction: GenerationInputDirection
}

export interface UpdateGenerationParametersCommand {
  type: 'update-generation-parameters'
  nodeId: string
  parameters: GenerationNodeParameters
  configuration?: CanvasCardConfigurationSnapshot
}

export interface UpdateCinematicSkillSettingsCommand {
  type: 'update-cinematic-skill-settings'
  nodeId: string
  settings: CinematicSkillNodeSettings
}

export interface SetCardConfigurationCommand {
  type: 'set-card-configuration'
  nodeId: string
  configuration: CanvasCardConfigurationSnapshot
  content?: string
}

export interface ApplyScriptAuthoringResultCommand {
  type: 'apply-script-authoring-result'
  nodeId: string
  expectedContent: string
  content: string
  lineage: ScriptAuthoringLineage
  storyProduction?: Record<string, unknown>
}

export type CanvasCommand =
  | MoveNodesCommand
  | MoveNodeMembershipCommand
  | DuplicateNodesCommand
  | DeleteSelectionCommand
  | GroupNodesCommand
  | UngroupNodesCommand
  | CreateStoryboardGroupCommand
  | UpdateStoryboardGroupCommand
  | ReorderStoryboardGroupCommand
  | ConvertStoryboardGroupCommand
  | ConnectNodesCommand
  | ReconnectConnectionCommand
  | ArrangeNodesCommand
  | SetNodesLockedCommand
  | RenameNodeCommand
  | SetTextCardContentCommand
  | BindTextGenerationJobCommand
  | ApplyGenerationJobResultCommand
  | InsertGraphCommand
  | ReorderGenerationInputCommand
  | UpdateGenerationParametersCommand
  | SetCardConfigurationCommand
  | UpdateCinematicSkillSettingsCommand
  | ApplyScriptAuthoringResultCommand
  | UpdateScriptReferenceAssetsCommand
  | ApplyCinematicSequenceCommand
  | StoryboardAssetCommand
  | InsertNodeIntoConnectionCommand

export interface CanvasCommandEnvelope {
  source: CanvasCommandSource
  command: CanvasCommand
}

export function createReorderGenerationInputCommand(
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
  connectionId: string,
  direction: GenerationInputDirection,
): ReorderGenerationInputCommand | null {
  return reorderGenerationInputConnections(nodes, connections, connectionId, direction)
    ? { type: 'reorder-generation-input', connectionId, direction }
    : null
}

function uniqueIds(ids: readonly string[]) {
  return [...new Set(ids.filter(Boolean))]
}

export function createMoveNodesCommand(
  origins: readonly CanvasNodePosition[],
  nodes: readonly CanvasNode[],
): MoveNodesCommand | null {
  const currentById = new Map(nodes.map((node) => [node.id, node]))
  const originById = new Map(origins.filter((origin) => currentById.has(origin.nodeId)).map((origin) => [origin.nodeId, origin]))
  const resolvedIds = resolveCanvasDragNodeIds(nodes, [...originById.keys()])
  if (!resolvedIds || resolvedIds.some((nodeId) => !originById.has(nodeId))) return null
  const moves = resolvedIds.flatMap((nodeId) => {
    const origin = originById.get(nodeId)!
    const current = currentById.get(origin.nodeId)
    if (!current || (current.x === origin.x && current.y === origin.y)) return []
    return [{
      nodeId: origin.nodeId,
      from: { ...origin },
      to: { nodeId: current.id, x: current.x, y: current.y },
    }]
  })
  if (resolvedIds.some((nodeId) => isNodeGroupContainer(currentById.get(nodeId)!))) {
    if (moves.length !== resolvedIds.length) return null
    const delta = { x: moves[0].to.x - moves[0].from.x, y: moves[0].to.y - moves[0].from.y }
    if (moves.some((move) => move.to.x - move.from.x !== delta.x || move.to.y - move.from.y !== delta.y)) return null
  }
  return moves.length ? { type: 'move-nodes', moves } : null
}

export function createMoveNodesByDeltaCommand(
  nodes: readonly CanvasNode[],
  nodeIds: readonly string[],
  delta: { x: number; y: number },
): MoveNodesCommand | null {
  if (
    !Number.isFinite(delta.x) ||
    !Number.isFinite(delta.y) ||
    (delta.x === 0 && delta.y === 0)
  ) return null
  const resolvedIds = resolveCanvasDragNodeIds(nodes, nodeIds)
  if (!resolvedIds) return null
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  return {
    type: 'move-nodes',
    moves: resolvedIds.map((nodeId) => {
      const node = nodesById.get(nodeId)!
      return {
        nodeId,
        from: { nodeId, x: node.x, y: node.y },
        to: { nodeId, x: node.x + delta.x, y: node.y + delta.y },
      }
    }),
  }
}

function isSpatialGroup(node: CanvasNode) {
  return (
    node.type === 'group' &&
    node.contentData?.subtype === 'group' &&
    !node.isLocked &&
    isNodeMutationSupported(node)
  )
}

export function resolveSpatialGroupParent(
  nodes: readonly CanvasNode[],
  nodeId: string,
  position: { x: number; y: number },
) {
  const target = nodes.find((node) => node.id === nodeId)
  if (!target || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return null
  const currentParent = target.parentNodeId ?? null
  if (currentParent && !nodes.some((node) => node.id === currentParent && isSpatialGroup(node))) {
    return currentParent
  }
  const targetRight = position.x + target.width
  const targetBottom = position.y + target.height
  const containingGroups = nodes.filter((candidate) => (
    candidate.id !== nodeId &&
    isSpatialGroup(candidate) &&
    position.x >= candidate.x &&
    position.y >= candidate.y &&
    targetRight <= candidate.x + candidate.width &&
    targetBottom <= candidate.y + candidate.height
  )).sort((left, right) => (
    (right.zIndex ?? 0) - (left.zIndex ?? 0) ||
    left.width * left.height - right.width * right.height ||
    left.id.localeCompare(right.id)
  ))
  if (containingGroups[0]) return containingGroups[0].id
  const currentGroup = currentParent
    ? nodes.find((node) => node.id === currentParent && isSpatialGroup(node))
    : null
  if (
    currentGroup &&
    position.x < currentGroup.x + currentGroup.width &&
    targetRight > currentGroup.x &&
    position.y < currentGroup.y + currentGroup.height &&
    targetBottom > currentGroup.y
  ) return currentGroup.id
  return null
}

export function createMoveNodeMembershipCommand(
  nodes: readonly CanvasNode[],
  nodeId: string,
  position: { x: number; y: number },
): MoveNodeMembershipCommand | null {
  const target = nodes.find((node) => node.id === nodeId)
  if (
    !target ||
    target.isLocked ||
    isNodeGroupContainer(target) ||
    !isNodeMutationSupported(target) ||
    !Number.isFinite(position.x) ||
    !Number.isFinite(position.y) ||
    (target.x === position.x && target.y === position.y)
  ) return null
  return {
    type: 'move-node-membership',
    move: {
      nodeId,
      from: { nodeId, x: target.x, y: target.y },
      to: { nodeId, x: position.x, y: position.y },
    },
    fromParentNodeId: target.parentNodeId ?? null,
    toParentNodeId: resolveSpatialGroupParent(nodes, nodeId, position),
  }
}

export function createDuplicateNodesCommand(
  nodeIds: readonly string[],
  offset = { x: 32, y: 32 },
): DuplicateNodesCommand | null {
  const targets = uniqueIds(nodeIds)
  return targets.length ? { type: 'duplicate-nodes', nodeIds: targets, offset: { ...offset } } : null
}

export function createRenameNodeCommand(
  nodes: readonly CanvasNode[],
  nodeId: string,
  title: string,
): RenameNodeCommand | null {
  const target = nodes.find((node) => node.id === nodeId)
  const normalizedTitle = title.trim()
  if (
    !target ||
    target.isLocked ||
    !isNodeMutationSupported(target) ||
    !normalizedTitle ||
    normalizedTitle === target.title
  ) return null
  return { type: 'rename-node', nodeId, title: normalizedTitle }
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
  const resolvedPorts = getAuthoringConnectionPorts(source, target, sourcePort, targetPort)
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
