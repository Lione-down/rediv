import type { Ref } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import { createCanvasCommandExecutor } from './canvas-command-executor'
import type { CanvasConnectionDraft, CanvasNodeDraft } from './persistence'

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

  function queueNodeMove(nodeId: string, x: number, y: number) {
    if (!findNodeById(nodeId)) return
    mutateGraph(() => updateNode(nodeId, (node) => ({ ...node, x, y })))
  }

  async function flushPendingMoves() {
    // Move commands share the atomic graph autosave queue.
  }

  const commandExecutor = createCanvasCommandExecutor({
    getNodes: () => nodes.value,
    getConnections: () => connections.value,
    createNode,
    createConnection,
    deleteNode,
    deleteConnection,
    updateNodeParent,
    updateNodeLocked,
    queueNodeMove,
    setSelection,
    selectConnection,
  })

  return {
    resetMutationState,
    initializeConfirmedPositions,
    createNode,
    deleteNode,
    createConnection,
    deleteConnection,
    updateNodeParent,
    updateNodeLocked,
    queueNodeMove,
    flushPendingMoves,
    executeCommand: commandExecutor.executeCommand,
  }
}
