import type { Ref } from 'vue'
import {
  createCanvasConnection,
  createCanvasNode,
  deleteCanvasConnection,
  deleteCanvasNode,
  updateCanvasNode,
} from './api'
import { mapCanvasConnection, mapCanvasNode } from './mappers'
import {
  createTemporaryId,
  isTemporaryId,
  MOVE_DEBOUNCE_MS,
  toNodeCreatePayload,
} from './persistence'
import type { CanvasConnectionDraft, CanvasNodeDraft, PendingMove } from './persistence'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'

interface ProjectContext {
  generation: number
  projectId: string
}

interface CanvasMutationOptions {
  activeProjectId: Ref<string>
  selectedNodeId: Ref<string>
  nodes: Ref<CanvasNode[]>
  connections: Ref<CanvasConnection[]>
  bumpDataRevision: () => void
  captureProjectContext: () => ProjectContext
  isCurrentProject: (context: ProjectContext) => boolean
  reportSaveError: (action: string, error: unknown) => void
  updateNode: (nodeId: string, updater: (node: CanvasNode) => CanvasNode) => void
  findNodeById: (nodeId: string) => CanvasNode | null
}

export function createCanvasMutationActions(options: CanvasMutationOptions) {
  const {
    activeProjectId,
    selectedNodeId,
    nodes,
    connections,
    bumpDataRevision,
    captureProjectContext,
    isCurrentProject,
    reportSaveError,
    updateNode,
    findNodeById,
  } = options
  const nodeOwners = new Map<string, symbol>()
  const connectionOwners = new Map<string, symbol>()
  const nodeCreateRequests = new Map<string, Promise<string>>()
  const connectionCreateRequests = new Map<string, Promise<string>>()
  const pendingMoves = new Map<string, PendingMove>()

  function resetMutationState() {
    for (const move of pendingMoves.values()) {
      if (move.timer) clearTimeout(move.timer)
    }
    nodeOwners.clear()
    connectionOwners.clear()
    nodeCreateRequests.clear()
    connectionCreateRequests.clear()
    pendingMoves.clear()
  }

  function initializeConfirmedPositions() {
    for (const move of pendingMoves.values()) {
      if (move.timer) clearTimeout(move.timer)
    }
    pendingMoves.clear()
    for (const node of nodes.value) {
      pendingMoves.set(node.id, {
        confirmed: { x: node.x, y: node.y },
        desired: { x: node.x, y: node.y },
        version: 0,
        requestedVersion: 0,
        timer: null,
        inFlight: null,
      })
    }
  }

  function requireProjectId() {
    if (!activeProjectId.value) throw new Error('请先选择项目。')
    return activeProjectId.value
  }

  function rekeyNode(tempId: string, serverNode: CanvasNode) {
    const localNode = findNodeById(tempId)
    const move = pendingMoves.get(tempId)
    const reconciledNode = localNode ? { ...serverNode, x: localNode.x, y: localNode.y } : serverNode

    nodes.value = nodes.value.map((node) => (node.id === tempId ? reconciledNode : node))
    connections.value = connections.value.map((connection) => ({
      ...connection,
      from: connection.from === tempId ? serverNode.id : connection.from,
      to: connection.to === tempId ? serverNode.id : connection.to,
    }))
    if (selectedNodeId.value === tempId) selectedNodeId.value = serverNode.id

    if (!move) {
      pendingMoves.set(serverNode.id, {
        confirmed: { x: serverNode.x, y: serverNode.y },
        desired: { x: serverNode.x, y: serverNode.y },
        version: 0,
        requestedVersion: 0,
        timer: null,
        inFlight: null,
      })
      return
    }

    if (move.timer) clearTimeout(move.timer)
    pendingMoves.delete(tempId)
    pendingMoves.set(serverNode.id, move)
    move.confirmed = { x: serverNode.x, y: serverNode.y }
    if (
      move.version <= move.requestedVersion &&
      (move.desired.x !== serverNode.x || move.desired.y !== serverNode.y)
    ) {
      move.version = move.requestedVersion + 1
    }
    if (move.version > move.requestedVersion) {
      move.timer = setTimeout(() => void persistNodeMove(serverNode.id, move), MOVE_DEBOUNCE_MS)
    }
  }

  async function createNode(draft: CanvasNodeDraft): Promise<CanvasNode> {
    const projectId = requireProjectId()
    const context = captureProjectContext()
    const tempId = createTemporaryId('node')
    const owner = Symbol(tempId)
    const optimisticNode: CanvasNode = { id: tempId, ...draft }

    bumpDataRevision()
    nodeOwners.set(tempId, owner)
    nodes.value = [...nodes.value, optimisticNode]
    pendingMoves.set(tempId, {
      confirmed: { x: draft.x, y: draft.y },
      desired: { x: draft.x, y: draft.y },
      version: 0,
      requestedVersion: 0,
      timer: null,
      inFlight: null,
    })

    const request = (async () => {
      try {
        const response = await createCanvasNode(projectId, toNodeCreatePayload(draft))
        const serverNode = mapCanvasNode(response.data)
        if (isCurrentProject(context) && nodeOwners.get(tempId) === owner) {
          rekeyNode(tempId, serverNode)
          nodeOwners.delete(tempId)
          bumpDataRevision()
        }
        return serverNode.id
      } catch (error) {
        if (isCurrentProject(context) && nodeOwners.get(tempId) === owner) {
          nodes.value = nodes.value.filter((node) => node.id !== tempId)
          connections.value = connections.value.filter(
            (connection) => connection.from !== tempId && connection.to !== tempId,
          )
          pendingMoves.delete(tempId)
          nodeOwners.delete(tempId)
          bumpDataRevision()
          reportSaveError('创建节点', error)
        }
        throw error
      } finally {
        nodeCreateRequests.delete(tempId)
      }
    })()

    nodeCreateRequests.set(tempId, request)
    const serverId = await request
    return findNodeById(serverId) ?? optimisticNode
  }

  async function resolveNodeId(nodeId: string) {
    return nodeCreateRequests.get(nodeId) ?? nodeId
  }

  async function persistNodeMove(nodeId: string, move: PendingMove): Promise<void> {
    if (move.timer) clearTimeout(move.timer)
    move.timer = null

    if (move.version <= move.requestedVersion) {
      if (move.inFlight) await move.inFlight
      return
    }

    const requestedVersion = move.version
    const position = { ...move.desired }
    move.requestedVersion = requestedVersion
    const context = captureProjectContext()
    const projectId = requireProjectId()
    const previousRequest = move.inFlight
    const request = (previousRequest?.catch(() => undefined) ?? Promise.resolve()).then(async () => {
      let persistedNodeId = nodeId
      try {
        if (!isCurrentProject(context)) return
        persistedNodeId = await resolveNodeId(nodeId)
        if (!isCurrentProject(context)) return
        const response = await updateCanvasNode(projectId, persistedNodeId, {
          position_x: position.x,
          position_y: position.y,
        })
        if (!isCurrentProject(context) || pendingMoves.get(persistedNodeId) !== move) return
        move.confirmed = { x: response.data.position_x, y: response.data.position_y }
      } catch (error) {
        const activeMove = pendingMoves.get(persistedNodeId)
        if (isCurrentProject(context) && activeMove === move && move.version === requestedVersion) {
          updateNode(persistedNodeId, (node) => ({ ...node, ...move.confirmed }))
          move.desired = { ...move.confirmed }
          reportSaveError('移动节点', error)
        }
        throw error
      }
    })

    move.inFlight = request
    try {
      await request
    } finally {
      if (move.inFlight === request) move.inFlight = null
    }
  }

  function queueNodeMove(nodeId: string, x: number, y: number) {
    const node = findNodeById(nodeId)
    if (!node) return

    const move = pendingMoves.get(nodeId) ?? {
      confirmed: { x: node.x, y: node.y },
      desired: { x: node.x, y: node.y },
      version: 0,
      requestedVersion: 0,
      timer: null,
      inFlight: null,
    }
    pendingMoves.set(nodeId, move)
    move.version += 1
    move.desired = { x, y }
    if (move.timer) clearTimeout(move.timer)
    updateNode(nodeId, (currentNode) => ({ ...currentNode, x, y }))
    move.timer = setTimeout(() => void persistNodeMove(nodeId, move).catch(() => undefined), MOVE_DEBOUNCE_MS)
  }

  async function flushPendingMoves(nodeId?: string) {
    const entries = nodeId
      ? ([[nodeId, pendingMoves.get(nodeId)]] as const)
      : Array.from(pendingMoves.entries())
    const requests = entries.flatMap(([id, move]) => (move ? [persistNodeMove(id, move)] : []))
    const results = await Promise.allSettled(requests)
    const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
    if (failed) throw failed.reason
  }

  async function deleteNode(nodeId: string) {
    const projectId = requireProjectId()
    const context = captureProjectContext()
    const nodeIndex = nodes.value.findIndex((node) => node.id === nodeId)
    if (nodeIndex < 0) return

    await flushPendingMoves(nodeId).catch(() => undefined)
    const nodeSnapshot = nodes.value[nodeIndex]
    const connectionSnapshots = connections.value
      .map((connection, index) => ({ connection, index }))
      .filter(({ connection }) => connection.from === nodeId || connection.to === nodeId)
    const owner = Symbol(nodeId)
    nodeOwners.set(nodeId, owner)
    nodes.value = nodes.value.filter((node) => node.id !== nodeId)
    connections.value = connections.value.filter(
      (connection) => connection.from !== nodeId && connection.to !== nodeId,
    )
    if (selectedNodeId.value === nodeId) selectedNodeId.value = ''
    bumpDataRevision()

    let persistedNodeId = nodeId
    let wasCreated = !isTemporaryId(nodeId)
    try {
      persistedNodeId = await resolveNodeId(nodeId)
      wasCreated = true
      await deleteCanvasNode(projectId, persistedNodeId)
      if (isCurrentProject(context) && nodeOwners.get(nodeId) === owner) {
        nodeOwners.delete(nodeId)
        pendingMoves.delete(nodeId)
      }
    } catch (error) {
      if (!wasCreated) return
      if (isCurrentProject(context) && nodeOwners.get(nodeId) === owner) {
        nodes.value.splice(Math.min(nodeIndex, nodes.value.length), 0, { ...nodeSnapshot, id: persistedNodeId })
        for (const { connection, index } of connectionSnapshots) {
          connections.value.splice(Math.min(index, connections.value.length), 0, {
            ...connection,
            from: connection.from === nodeId ? persistedNodeId : connection.from,
            to: connection.to === nodeId ? persistedNodeId : connection.to,
          })
        }
        nodeOwners.delete(nodeId)
        bumpDataRevision()
        reportSaveError('删除节点', error)
      }
      throw error
    }
  }

  async function createConnection(draft: CanvasConnectionDraft): Promise<CanvasConnection> {
    const duplicate = connections.value.find(
      (connection) =>
        connection.from === draft.from &&
        connection.to === draft.to &&
        (connection.sourcePort ?? 'out') === (draft.sourcePort ?? 'out') &&
        (connection.targetPort ?? 'in') === (draft.targetPort ?? 'in'),
    )
    if (duplicate) return duplicate

    const projectId = requireProjectId()
    const context = captureProjectContext()
    const tempId = createTemporaryId('connection')
    const owner = Symbol(tempId)
    const optimisticConnection: CanvasConnection = { id: tempId, ...draft }
    connectionOwners.set(tempId, owner)
    connections.value = [...connections.value, optimisticConnection]
    bumpDataRevision()

    const request = (async () => {
      try {
        const [sourceNodeId, targetNodeId] = await Promise.all([
          resolveNodeId(draft.from),
          resolveNodeId(draft.to),
        ])
        const response = await createCanvasConnection(projectId, {
          source_node_id: sourceNodeId,
          source_port: draft.sourcePort ?? 'out',
          target_node_id: targetNodeId,
          target_port: draft.targetPort ?? 'in',
          metadata: { ...draft.metadata },
        })
        const serverConnection = mapCanvasConnection(response.data)
        if (isCurrentProject(context) && connectionOwners.get(tempId) === owner) {
          connections.value = connections.value.map((connection) =>
            connection.id === tempId ? serverConnection : connection,
          )
          connectionOwners.delete(tempId)
          bumpDataRevision()
        }
        return serverConnection.id
      } catch (error) {
        if (isCurrentProject(context) && connectionOwners.get(tempId) === owner) {
          connections.value = connections.value.filter((connection) => connection.id !== tempId)
          connectionOwners.delete(tempId)
          bumpDataRevision()
          reportSaveError('创建连线', error)
        }
        throw error
      } finally {
        connectionCreateRequests.delete(tempId)
      }
    })()

    connectionCreateRequests.set(tempId, request)
    const serverId = await request
    return connections.value.find((connection) => connection.id === serverId) ?? optimisticConnection
  }

  async function deleteConnection(connectionId: string) {
    const projectId = requireProjectId()
    const context = captureProjectContext()
    const index = connections.value.findIndex((connection) => connection.id === connectionId)
    if (index < 0) return

    const snapshot = connections.value[index]
    const owner = Symbol(connectionId)
    connectionOwners.set(connectionId, owner)
    connections.value.splice(index, 1)
    bumpDataRevision()

    let persistedConnectionId = connectionId
    let wasCreated = !isTemporaryId(connectionId)
    try {
      persistedConnectionId = await (connectionCreateRequests.get(connectionId) ?? connectionId)
      wasCreated = true
      await deleteCanvasConnection(projectId, persistedConnectionId)
      if (isCurrentProject(context) && connectionOwners.get(connectionId) === owner) {
        connectionOwners.delete(connectionId)
      }
    } catch (error) {
      if (!wasCreated) return
      if (isCurrentProject(context) && connectionOwners.get(connectionId) === owner) {
        connections.value.splice(Math.min(index, connections.value.length), 0, {
          ...snapshot,
          id: persistedConnectionId,
        })
        connectionOwners.delete(connectionId)
        bumpDataRevision()
        reportSaveError('删除连线', error)
      }
      throw error
    }
  }

  return {
    resetMutationState,
    initializeConfirmedPositions,
    createNode,
    deleteNode,
    createConnection,
    deleteConnection,
    queueNodeMove,
    flushPendingMoves,
  }
}
