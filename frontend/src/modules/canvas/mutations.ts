import { toRaw, type Ref } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import { createCanvasCommandExecutor } from './canvas-command-executor'
import { mapCanvasConnection, mapCanvasNode } from './mappers'
import type { CanvasConnectionDraft, CanvasNodeDraft } from './persistence'
import type { CanvasDocumentPatchResponse } from './types'
import type {
  ReorderGenerationInputCommand,
  UpdateCinematicSkillSettingsCommand,
  UpdateGenerationParametersCommand,
} from './canvas-commands'
import { reorderGenerationInputConnections } from './generation-input-order'

interface CanvasMutationOptions {
  activeProjectId: Ref<string>
  activeCanvasId: Ref<string>
  selectedNodeId: Ref<string>
  selectedNodeIds: Ref<string[]>
  nodes: Ref<CanvasNode[]>
  connections: Ref<CanvasConnection[]>
  bumpDataRevision: () => void
  queueAutosave: () => void
  updateNode: (nodeId: string, updater: (node: CanvasNode) => CanvasNode) => void
  findNodeById: (nodeId: string) => CanvasNode | null
  setSelection: (nodeIds: string[], primaryNodeId?: string) => void
  selectConnection: (connectionId: string) => void
}

function cloneGraphEntity<T extends object>(value: T): T {
  return JSON.parse(JSON.stringify(toRaw(value))) as T
}

export function createCanvasMutationActions(options: CanvasMutationOptions) {
  const {
    activeProjectId,
    activeCanvasId,
    selectedNodeId,
    selectedNodeIds,
    nodes,
    connections,
    bumpDataRevision,
    queueAutosave,
    updateNode,
    findNodeById,
    setSelection,
    selectConnection,
  } = options

  function requireDocumentIdentity() {
    if (!activeProjectId.value) throw new Error('请先选择项目。')
    if (!activeCanvasId.value) throw new Error('请先选择画布。')
  }

  function mutateGraph(mutation: () => void) {
    requireDocumentIdentity()
    mutation()
    bumpDataRevision()
    queueAutosave()
  }

  function resetMutationState() {
    // Graph save state is owned by the Canvas-scoped autosave controller.
  }

  function initializeConfirmedPositions() {
    // Position confirmation is part of the atomic document snapshot.
  }

  async function createNode(draft: CanvasNodeDraft): Promise<CanvasNode> {
    const created: CanvasNode = { id: createCanvasEntityId(), ...draft }
    mutateGraph(() => {
      nodes.value = [...nodes.value, created]
    })
    return created
  }

  async function deleteNode(nodeId: string) {
    if (!findNodeById(nodeId)) return
    mutateGraph(() => {
      nodes.value = nodes.value.filter((node) => node.id !== nodeId)
      connections.value = connections.value.filter(
        (connection) => connection.from !== nodeId && connection.to !== nodeId,
      )
      selectedNodeIds.value = selectedNodeIds.value.filter((id) => id !== nodeId)
      if (selectedNodeId.value === nodeId) selectedNodeId.value = selectedNodeIds.value.at(-1) ?? ''
    })
  }

  async function updateNodeState(
    nodeId: string,
    apply: (node: CanvasNode) => CanvasNode,
  ) {
    if (!findNodeById(nodeId)) return
    mutateGraph(() => updateNode(nodeId, apply))
  }

  function updateNodeParent(nodeId: string, parentNodeId: string | null) {
    return updateNodeState(nodeId, (node) => ({ ...node, parentNodeId }))
  }

  function updateNodeLocked(nodeId: string, locked: boolean) {
    return updateNodeState(nodeId, (node) => ({ ...node, isLocked: locked }))
  }

  function updateNodeFields(nodeId: string, updates: Partial<Omit<CanvasNode, 'id'>>) {
    const clonedUpdates = cloneGraphEntity(updates)
    return updateNodeState(nodeId, (node) => ({ ...node, ...clonedUpdates }))
  }

  async function createConnection(draft: CanvasConnectionDraft): Promise<CanvasConnection> {
    const duplicate = connections.value.find((connection) => (
      connection.from === draft.from && connection.to === draft.to &&
      (connection.sourcePort ?? 'out') === (draft.sourcePort ?? 'out') &&
      (connection.targetPort ?? 'in') === (draft.targetPort ?? 'in')
    ))
    if (duplicate) return duplicate
    const created: CanvasConnection = { id: createCanvasEntityId(), ...draft }
    mutateGraph(() => {
      connections.value = [...connections.value, created]
    })
    return created
  }

  async function deleteConnection(connectionId: string) {
    if (!connections.value.some((connection) => connection.id === connectionId)) return
    mutateGraph(() => {
      connections.value = connections.value.filter((connection) => connection.id !== connectionId)
      selectConnection('')
    })
  }

  async function updateConnection(connectionId: string, draft: CanvasConnectionDraft) {
    if (!connections.value.some((connection) => connection.id === connectionId)) return
    mutateGraph(() => {
      connections.value = connections.value.map((connection) => connection.id === connectionId
        ? { id: connectionId, ...cloneGraphEntity(draft) }
        : connection)
    })
  }

  function queueNodeMove(nodeId: string, x: number, y: number) {
    if (!findNodeById(nodeId)) return
    mutateGraph(() => updateNode(nodeId, (node) => ({ ...node, x, y })))
  }

  async function flushPendingMoves() {
    // Move commands share the atomic graph autosave queue.
  }

  function applyGraph(nextNodes: CanvasNode[], nextConnections: CanvasConnection[]) {
    mutateGraph(() => {
      nodes.value = nextNodes
      connections.value = nextConnections
      setSelection(selectedNodeIds.value, selectedNodeId.value)
    })
  }

  function applyCommittedMutation(mutation: CanvasDocumentPatchResponse) {
    requireDocumentIdentity()
    const hasForeignScope = [
      ...mutation.node_upserts,
      ...mutation.connection_upserts,
    ].some((item) => (
      item.project_id !== activeProjectId.value || item.canvas_id !== activeCanvasId.value
    ))
    if (hasForeignScope) throw new Error('服务器画布变更与当前画布不匹配。')
    const mappedNodes = mutation.node_upserts.map(mapCanvasNode)
    const mappedConnections = mutation.connection_upserts.map(mapCanvasConnection)
    const nextNodesById = new Map(nodes.value.map((node) => [node.id, node]))
    const nextConnectionsById = new Map(connections.value.map((connection) => [connection.id, connection]))
    for (const nodeId of mutation.node_deletes) nextNodesById.delete(nodeId)
    for (const node of mappedNodes) nextNodesById.set(node.id, node)
    for (const connectionId of mutation.connection_deletes) nextConnectionsById.delete(connectionId)
    for (const connection of mappedConnections) nextConnectionsById.set(connection.id, connection)
    const nextNodes = [...nextNodesById.values()]
    const nextConnections = [...nextConnectionsById.values()]
    const nextNodeIds = new Set(nextNodes.map((node) => node.id))
    if (
      nextNodes.some((node) => node.parentNodeId && !nextNodeIds.has(node.parentNodeId)) ||
      nextConnections.some((connection) => (
        !nextNodeIds.has(connection.from) || !nextNodeIds.has(connection.to)
      ))
    ) throw new Error('服务器画布变更包含无效的图关系。')
    nodes.value = nextNodes
    connections.value = nextConnections
    bumpDataRevision()
    setSelection(selectedNodeIds.value, selectedNodeId.value)
  }

  function insertGraph(nextNodes: CanvasNode[], nextConnections: CanvasConnection[]) {
    const insertedNodes = nextNodes.map(cloneGraphEntity)
    const insertedConnections = nextConnections.map(cloneGraphEntity)
    const insertedNodeIds = insertedNodes.map((node) => node.id)
    const insertedConnectionIds = insertedConnections.map((connection) => connection.id)
    const existingNodeIds = new Set(nodes.value.map((node) => node.id))
    const existingConnectionIds = new Set(connections.value.map((connection) => connection.id))
    if (
      new Set(insertedNodeIds).size !== insertedNodeIds.length ||
      new Set(insertedConnectionIds).size !== insertedConnectionIds.length ||
      insertedNodeIds.some((id) => !id || existingNodeIds.has(id)) ||
      insertedConnectionIds.some((id) => !id || existingConnectionIds.has(id))
    ) throw new Error('插入图段包含重复的实体 ID。')
    const finalNodeIds = new Set([...nodes.value, ...insertedNodes].map((node) => node.id))
    if (insertedNodes.some((node) => node.parentNodeId && !finalNodeIds.has(node.parentNodeId))) {
      throw new Error('插入图段包含无效的父子关系。')
    }
    if (insertedConnections.some((connection) => (
      !finalNodeIds.has(connection.from) || !finalNodeIds.has(connection.to)
    ))) throw new Error('插入图段包含无效的连接端点。')
    mutateGraph(() => {
      nodes.value = [...nodes.value, ...insertedNodes]
      connections.value = [...connections.value, ...insertedConnections]
    })
  }

  function insertNodeIntoConnection(
    node: CanvasNode,
    upstream: CanvasConnection,
    downstream: CanvasConnection,
  ) {
    const original = connections.value.find((connection) => connection.id === upstream.id)
    if (
      !original || nodes.value.some((item) => item.id === node.id) ||
      connections.value.some((connection) => connection.id === downstream.id)
    ) throw new Error('插入节点与当前图实体冲突。')
    mutateGraph(() => {
      nodes.value = [...nodes.value, cloneGraphEntity(node)]
      connections.value = connections.value.map((connection) => (
        connection.id === upstream.id ? cloneGraphEntity(upstream) : connection
      ))
      connections.value = [...connections.value, cloneGraphEntity(downstream)]
    })
  }

  function reorderGenerationInput(command: ReorderGenerationInputCommand) {
    const reordered = reorderGenerationInputConnections(
      nodes.value, connections.value, command.connectionId, command.direction,
    )
    if (!reordered) return
    mutateGraph(() => { connections.value = reordered })
  }

  function updateGenerationParameters(command: UpdateGenerationParametersCommand) {
    if (!findNodeById(command.nodeId)) return
    mutateGraph(() => updateNode(command.nodeId, (node) => ({
      ...node,
      contentData: {
        ...node.contentData,
        generation_parameters: cloneGraphEntity(command.parameters),
      },
    })))
  }

  function updateCinematicSkillSettings(command: UpdateCinematicSkillSettingsCommand) {
    if (!findNodeById(command.nodeId)) return
    mutateGraph(() => updateNode(command.nodeId, (node) => ({
      ...node,
      contentData: {
        ...node.contentData,
        cinematic_skill: cloneGraphEntity(command.settings),
      },
    })))
  }

  const commandExecutor = createCanvasCommandExecutor({
    getNodes: () => nodes.value,
    getConnections: () => connections.value,
    createNode,
    createConnection,
    deleteNode,
    deleteConnection,
    updateConnection,
    updateNodeParent,
    updateNodeLocked,
    updateNodeState: updateNodeFields,
    queueNodeMove,
    setSelection,
    selectConnection,
    insertGraph,
    insertNodeIntoConnection,
    reorderGenerationInput,
    updateGenerationParameters,
    updateCinematicSkillSettings,
  })

  return {
    resetMutationState,
    initializeConfirmedPositions,
    createNode,
    deleteNode,
    createConnection,
    deleteConnection,
    updateConnection,
    updateNodeParent,
    updateNodeLocked,
    queueNodeMove,
    flushPendingMoves,
    applyGraph,
    applyCommittedMutation,
    insertNodeIntoConnection,
    executeCommand: commandExecutor.executeCommand,
  }
}
