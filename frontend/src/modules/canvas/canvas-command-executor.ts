import { toRaw } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import type { CanvasConnectionDraft, CanvasNodeDraft } from './persistence'
import {
  createRegistryNodeDraft,
  isNodeGroupContainer,
} from './node-registry'
import {
  canDeleteCanvasNode,
  createConnectNodesCommand,
  createSetNodesLockedCommand,
  createGroupNodesCommand,
  createUngroupNodesCommand,
  isArrangeEligibleNode,
  type ArrangeNodesCommand,
  getInternalConnections,
  isConnectionMutationSupported,
  type CanvasCommandEnvelope,
  type ConnectNodesCommand,
  type DeleteSelectionCommand,
  type DuplicateNodesCommand,
  type GroupNodesCommand,
  type MoveNodesCommand,
  type SetNodesLockedCommand,
  type UngroupNodesCommand,
} from './canvas-commands'

interface CanvasCommandExecutorOptions {
  getNodes: () => CanvasNode[]
  getConnections: () => CanvasConnection[]
  createNode: (draft: CanvasNodeDraft) => Promise<CanvasNode>
  createConnection: (draft: CanvasConnectionDraft) => Promise<CanvasConnection>
  deleteNode: (nodeId: string) => Promise<void>
  deleteConnection: (connectionId: string) => Promise<void>
  updateNodeParent: (nodeId: string, parentNodeId: string | null) => Promise<void>
  updateNodeLocked: (nodeId: string, locked: boolean) => Promise<void>
  queueNodeMove: (nodeId: string, x: number, y: number) => void
  setSelection: (nodeIds: string[], primaryNodeId?: string) => void
  selectConnection: (connectionId: string) => void
}

function cloneNodeDraft(node: CanvasNode, offset: { x: number; y: number }): CanvasNodeDraft {
  return {
    type: node.type,
    title: `${node.title} 副本`,
    x: node.x + offset.x,
    y: node.y + offset.y,
    width: node.width,
    height: node.height,
    status: 'idle',
    content: node.content,
    contentData: node.contentData ? structuredClone(toRaw(node.contentData)) : undefined,
  }
}

export function createCanvasCommandExecutor(options: CanvasCommandExecutorOptions) {
  function moveNodes(command: MoveNodesCommand) {
    const nodesById = new Map(options.getNodes().map((node) => [node.id, node]))
    if (command.moves.some((move) => {
      const node = nodesById.get(move.nodeId)
      return node && !isArrangeEligibleNode(node)
    })) return
    for (const move of command.moves) {
      if (nodesById.has(move.nodeId)) options.queueNodeMove(move.nodeId, move.to.x, move.to.y)
    }
  }

  async function duplicateNodes(command: DuplicateNodesCommand) {
    const selectedIds = new Set(command.nodeIds)
    const sourceNodes = options.getNodes().filter((node) => selectedIds.has(node.id) && isArrangeEligibleNode(node))
    if (!sourceNodes.length || sourceNodes.length !== selectedIds.size) return
    const sourceConnections = getInternalConnections(options.getConnections(), sourceNodes.map((node) => node.id))
    const createdNodes = await Promise.all(
      sourceNodes.map((node) => options.createNode(cloneNodeDraft(node, command.offset))),
    )
    const duplicatedIds = new Map(sourceNodes.map((node, index) => [node.id, createdNodes[index].id]))
    await Promise.all(sourceConnections.map((connection) => options.createConnection({
      from: duplicatedIds.get(connection.from)!,
      to: duplicatedIds.get(connection.to)!,
      sourcePort: connection.sourcePort,
      targetPort: connection.targetPort,
      metadata: connection.metadata ? structuredClone(toRaw(connection.metadata)) : undefined,
      status: connection.status,
      active: connection.active,
    })))
    options.setSelection(createdNodes.map((node) => node.id), createdNodes.at(-1)?.id)
  }

  async function deleteSelection(command: DeleteSelectionCommand) {
    const nodes = options.getNodes()
    const connections = options.getConnections()
    const connectionsById = new Map(connections.map((connection) => [connection.id, connection]))
    const nodesById = new Map(nodes.map((node) => [node.id, node]))
    if (command.connectionIds.some((connectionId) => {
      const connection = connectionsById.get(connectionId)
      return connection && !isConnectionMutationSupported(nodes, connection)
    })) return
    if (command.nodeIds.some((nodeId) => (
      nodesById.has(nodeId) && !canDeleteCanvasNode(nodes, connections, nodeId)
    ))) return
    for (const connectionId of command.connectionIds) {
      const connection = options.getConnections().find((candidate) => candidate.id === connectionId)
      if (!connection || !isConnectionMutationSupported(options.getNodes(), connection)) continue
      options.selectConnection('')
      try {
        await options.deleteConnection(connectionId)
      } catch (error) {
        if (options.getConnections().some((connection) => connection.id === connectionId)) {
          options.selectConnection(connectionId)
        }
        throw error
      }
    }
    for (const nodeId of command.nodeIds) {
      if (!canDeleteCanvasNode(options.getNodes(), options.getConnections(), nodeId)) continue
      const children = options.getNodes().filter((node) => node.parentNodeId === nodeId)
      const detachedIds: string[] = []
      for (const child of children) {
        await options.updateNodeParent(child.id, null)
        detachedIds.push(child.id)
      }
      try {
        await options.deleteNode(nodeId)
      } catch (error) {
        for (const childId of detachedIds.reverse()) await options.updateNodeParent(childId, nodeId).catch(() => undefined)
        throw error
      }
    }
  }

  async function groupNodes(command: GroupNodesCommand) {
    const validated = createGroupNodesCommand(options.getNodes(), command.nodeIds, command.padding)
    if (!validated) return
    const selectedIds = new Set(validated.nodeIds)
    const targets = options.getNodes().filter((node) => selectedIds.has(node.id))
    const padding = validated.padding
    const left = Math.min(...targets.map((node) => node.x))
    const top = Math.min(...targets.map((node) => node.y))
    const right = Math.max(...targets.map((node) => node.x + node.width))
    const bottom = Math.max(...targets.map((node) => node.y + node.height))
    const groupCount = options.getNodes().filter(isNodeGroupContainer).length
    const groupDraft = createRegistryNodeDraft('group', 'group', { x: left - padding, y: top - padding })
    const group = await options.createNode({
      ...groupDraft,
      title: `组合 ${groupCount + 1}`,
      width: right - left + padding * 2,
      height: bottom - top + padding * 2,
      zIndex: Math.min(...targets.map((node) => node.zIndex ?? 0)) - 1,
      parentNodeId: null,
      isLocked: false,
      isCollapsed: false,
      status: 'idle',
    })
    const attachedIds: string[] = []
    try {
      for (const node of targets) {
        await options.updateNodeParent(node.id, group.id)
        attachedIds.push(node.id)
      }
    } catch (error) {
      for (const nodeId of attachedIds.reverse()) await options.updateNodeParent(nodeId, null).catch(() => undefined)
      await options.deleteNode(group.id).catch(() => undefined)
      throw error
    }
    options.setSelection([group.id], group.id)
  }

  async function ungroupNodes(command: UngroupNodesCommand) {
    const validated = createUngroupNodesCommand(
      options.getNodes(), command.groupIds, options.getConnections(),
    )
    if (!validated) return
    const groups = options.getNodes().filter((node) => validated.groupIds.includes(node.id) && isNodeGroupContainer(node))
    const releasedIds: string[] = []
    for (const group of groups) {
      const children = options.getNodes().filter((node) => node.parentNodeId === group.id)
      const detachedIds: string[] = []
      try {
        for (const child of children) {
          await options.updateNodeParent(child.id, null)
          detachedIds.push(child.id)
          releasedIds.push(child.id)
        }
        await options.deleteNode(group.id)
      } catch (error) {
        for (const nodeId of detachedIds.reverse()) await options.updateNodeParent(nodeId, group.id).catch(() => undefined)
        throw error
      }
    }
    if (releasedIds.length) options.setSelection(releasedIds, releasedIds.at(-1))
  }

  async function connectNodes(command: ConnectNodesCommand) {
    const validated = createConnectNodesCommand(
      options.getNodes(), options.getConnections(), command.sourceNodeId, command.targetNodeId,
      command.sourcePort, command.targetPort,
    )
    if (!validated) return
    await options.createConnection({
      from: validated.sourceNodeId,
      to: validated.targetNodeId,
      sourcePort: validated.sourcePort,
      targetPort: validated.targetPort,
    })
  }

  function arrangeNodes(command: ArrangeNodesCommand) {
    const eligibleIds = new Set(options.getNodes().filter(isArrangeEligibleNode).map((node) => node.id))
    if (!command.moves.length || command.moves.some((move) => !eligibleIds.has(move.nodeId))) return
    moveNodes({ type: 'move-nodes', moves: command.moves })
  }

  async function setNodesLocked(command: SetNodesLockedCommand) {
    const validated = createSetNodesLockedCommand(options.getNodes(), command.nodeIds, command.locked)
    if (!validated) return
    const changedIds: string[] = []
    try {
      for (const nodeId of validated.nodeIds) {
        await options.updateNodeLocked(nodeId, validated.locked)
        changedIds.push(nodeId)
      }
    } catch (error) {
      for (const nodeId of changedIds.reverse()) {
        await options.updateNodeLocked(nodeId, !validated.locked).catch(() => undefined)
      }
      throw error
    }
  }

  async function executeCommand(envelope: CanvasCommandEnvelope) {
    const { command } = envelope
    if (command.type === 'move-nodes') return moveNodes(command)
    if (command.type === 'duplicate-nodes') return duplicateNodes(command)
    if (command.type === 'delete-selection') return deleteSelection(command)
    if (command.type === 'group-nodes') return groupNodes(command)
    if (command.type === 'ungroup-nodes') return ungroupNodes(command)
    if (command.type === 'connect-nodes') return connectNodes(command)
    if (command.type === 'arrange-nodes') return arrangeNodes(command)
    return setNodesLocked(command)
  }

  return { executeCommand }
}
