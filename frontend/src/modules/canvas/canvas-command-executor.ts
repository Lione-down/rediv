import { toRaw } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import type { CanvasConnectionDraft, CanvasNodeDraft } from './persistence'
import {
  getInternalConnections,
  type CanvasCommandEnvelope,
  type DeleteSelectionCommand,
  type DuplicateNodesCommand,
  type MoveNodesCommand,
} from './canvas-commands'

interface CanvasCommandExecutorOptions {
  getNodes: () => CanvasNode[]
  getConnections: () => CanvasConnection[]
  createNode: (draft: CanvasNodeDraft) => Promise<CanvasNode>
  createConnection: (draft: CanvasConnectionDraft) => Promise<CanvasConnection>
  deleteNode: (nodeId: string) => Promise<void>
  deleteConnection: (connectionId: string) => Promise<void>
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
    const availableIds = new Set(options.getNodes().map((node) => node.id))
    for (const move of command.moves) {
      if (availableIds.has(move.nodeId)) options.queueNodeMove(move.nodeId, move.to.x, move.to.y)
    }
  }

  async function duplicateNodes(command: DuplicateNodesCommand) {
    const selectedIds = new Set(command.nodeIds)
    const sourceNodes = options.getNodes().filter((node) => selectedIds.has(node.id))
    if (!sourceNodes.length) return
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
    for (const connectionId of command.connectionIds) {
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
    for (const nodeId of command.nodeIds) await options.deleteNode(nodeId)
  }

  async function executeCommand(envelope: CanvasCommandEnvelope) {
    const { command } = envelope
    if (command.type === 'move-nodes') return moveNodes(command)
    if (command.type === 'duplicate-nodes') return duplicateNodes(command)
    return deleteSelection(command)
  }

  return { executeCommand }
}
