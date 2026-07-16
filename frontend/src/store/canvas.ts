import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { updateCanvasViewport } from '../modules/canvas/api'
import { createCanvasMutationActions } from '../modules/canvas/mutations'
import { createCanvasAutosave } from '../modules/canvas/canvas-autosave'
import {
  createCanvasDocumentLoader,
  type CanvasDocumentLoadState,
} from '../modules/canvas/canvas-document-loader'
import { createCanvasHistoryActions } from '../modules/canvas/canvas-history-actions'
import {
  createCanvasSerializedActions,
  type CanvasDocumentContext,
} from '../modules/canvas/canvas-serialized-actions'
import { applyGenerationNodeState } from '../modules/canvas/generation-node-state'
import type { PersistedGenerationStatus } from '../modules/canvas/node-registry'
import {
  isSameCanvasSelection,
  reduceCanvasSelection,
  type CanvasSelectionAction,
} from '../modules/canvas/canvas-selection'
import {
  getCanvasErrorMessage,
  isSamePersistedViewport,
  normalizePersistedViewport,
  VIEWPORT_DEBOUNCE_MS,
  type PersistedViewport,
} from '../modules/canvas/persistence'
import type {
  CanvasGraphSaveState,
  CanvasMetadataDto,
} from '../modules/canvas/types'
import type { CanvasConnection, CanvasNode } from '../types/canvas'
import { useAuthStore } from './auth'

type CanvasMode = 'select' | 'hand' | 'text' | 'image' | 'generate'
type CanvasNodeStatus = CanvasNode['status']
type CanvasSelectionMode = 'replace' | 'toggle' | 'add'

const DEFAULT_VIEWPORT: PersistedViewport = { zoom: 1, x: 0, y: 0 }

export function projectSelectedNodes(nodes: readonly CanvasNode[], selectedNodeIds: readonly string[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  return selectedNodeIds.flatMap((nodeId) => {
    const node = byId.get(nodeId)
    return node ? [node] : []
  })
}

export const useCanvasStore = defineStore('canvas', () => {
  const authStore = useAuthStore()
  const activeProjectId = ref('')
  const activeCanvasId = ref('')
  const graphRevision = ref(0)
  const selectedNodeId = ref('')
  const selectedNodeIds = ref<string[]>([])
  const selectedConnectionId = ref('')
  const selectionRevision = ref(0)
  const mode = ref<CanvasMode>('select')
  const viewport = ref<PersistedViewport>({ ...DEFAULT_VIEWPORT })
  const nodes = ref<CanvasNode[]>([])
  const connections = ref<CanvasConnection[]>([])
  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const loadError = ref('')
  const saveError = ref('')
  const saveErrorRevision = ref(0)
  const saveState = ref<CanvasGraphSaveState>('saved')
  const conflictRevision = ref<number | null>(null)
  const hasLocalRecovery = ref(false)
  const canRetryAutosave = ref(false)
  const isViewportSaving = ref(false)

  let generation = 0
  let dataRevision = 0
  const documentLoadState: CanvasDocumentLoadState = { request: null }
  let viewportTimer: ReturnType<typeof setTimeout> | null = null
  let viewportInFlight: Promise<void> | null = null
  let confirmedViewport: PersistedViewport = { ...DEFAULT_VIEWPORT }
  let desiredViewport: PersistedViewport = { ...DEFAULT_VIEWPORT }
  const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedNodeId.value) || null)
  const selectedNodes = computed(() => projectSelectedNodes(nodes.value, selectedNodeIds.value))

  function bumpDataRevision() {
    dataRevision += 1
  }

  function captureDocumentContext(): CanvasDocumentContext {
    return {
      authToken: authStore.token,
      generation,
      projectId: activeProjectId.value,
      canvasId: activeCanvasId.value,
    }
  }

  function isCurrentDocument(context: CanvasDocumentContext) {
    return (
      context.generation === generation &&
      context.authToken === authStore.token &&
      context.projectId === activeProjectId.value &&
      context.canvasId === activeCanvasId.value
    )
  }

  function reportSaveError(action: string, error: unknown) {
    saveError.value = getCanvasErrorMessage(error, `${action}失败，已恢复画布状态，请重试。`)
    saveState.value = 'error'
    saveErrorRevision.value += 1
  }

  function applySelectionAction(action: CanvasSelectionAction) {
    const current = {
      nodeIds: selectedNodeIds.value,
      primaryNodeId: selectedNodeId.value,
      connectionId: selectedConnectionId.value,
    }
    const next = reduceCanvasSelection({
      nodeIds: nodes.value.map((node) => node.id),
      connectionIds: connections.value.map((connection) => connection.id),
    }, current, action)
    if (isSameCanvasSelection(current, next)) return
    selectedNodeIds.value = next.nodeIds
    selectedNodeId.value = next.primaryNodeId
    selectedConnectionId.value = next.connectionId
    selectionRevision.value += 1
  }

  function setSelection(nodeIds: string[], primaryNodeId = '') {
    applySelectionAction({ type: 'set-nodes', nodeIds, primaryNodeId })
  }

  function selectNode(nodeId: string, selectionMode: CanvasSelectionMode = 'replace') {
    if (selectionMode === 'add') return applySelectionAction({ type: 'add-node', nodeId })
    if (selectionMode === 'toggle') return applySelectionAction({ type: 'toggle-node', nodeId })
    applySelectionAction({ type: 'set-nodes', nodeIds: [nodeId], primaryNodeId: nodeId })
  }

  function selectConnection(connectionId: string) {
    applySelectionAction({ type: 'select-connection', connectionId })
  }

  function setMode(nextMode: CanvasMode) {
    mode.value = nextMode
  }

  function updateNode(nodeId: string, updater: (node: CanvasNode) => CanvasNode) {
    const nodeIndex = nodes.value.findIndex((node) => node.id === nodeId)
    if (nodeIndex < 0) return
    bumpDataRevision()
    nodes.value = nodes.value.map((node, index) => (index === nodeIndex ? updater(node) : node))
  }

  function applyNodeStatus(nodeId: string, status: CanvasNodeStatus) {
    if (!findNodeById(nodeId)) return
    updateNode(nodeId, (node) => ({ ...node, status: status ?? 'idle' }))
    canvasAutosave.queue()
  }

  function applyNodeContent(nodeId: string, content: string) {
    if (!findNodeById(nodeId)) return
    updateNode(nodeId, (node) => ({
      ...node,
      content,
      contentData: { ...node.contentData, text: content },
    }))
    canvasAutosave.queue()
  }

  function setNodeMediaAspectRatio(nodeId: string, aspectRatio: number) {
    if (!Number.isFinite(aspectRatio) || aspectRatio < 0.1 || aspectRatio > 10) return
    const node = findNodeById(nodeId)
    const current = node?.contentData?.aspect_ratio
    if (!node || (typeof current === 'number' && Math.abs(current - aspectRatio) < 0.001)) return
    const width = node.contentData?.width
    const height = node.contentData?.height
    const hasMatchingDimensions = typeof width === 'number' && typeof height === 'number' &&
      width > 0 && height > 0 && Math.abs(width / height - aspectRatio) < 0.001
    if (hasMatchingDimensions) return
    updateNode(nodeId, (candidate) => ({ ...candidate,
      contentData: { ...candidate.contentData, aspect_ratio: aspectRatio } }))
    canvasAutosave.queue()
  }
  function applyNodeGenerationState(
    nodeId: string,
    status: PersistedGenerationStatus,
    taskId = '',
    isResultMaterialized = false,
  ) {
    if (!findNodeById(nodeId)) return
    updateNode(nodeId, (node) => applyGenerationNodeState(
      node, status, taskId, isResultMaterialized,
    ))
    canvasAutosave.queue()
  }

  function findNodeById(nodeId: string) {
    return nodes.value.find((node) => node.id === nodeId) ?? null
  }
  const canvasAutosave = createCanvasAutosave({
    getIdentity: () => {
      const userId = authStore.user?.id ?? ''
      if (!userId || !activeProjectId.value || !activeCanvasId.value) return null
      return { userId, projectId: activeProjectId.value, canvasId: activeCanvasId.value }
    },
    getNodes: () => nodes.value,
    getConnections: () => connections.value,
    onRecovery: (nextNodes, nextConnections) => { nodes.value = nextNodes; connections.value = nextConnections },
    onRevision: (revision) => {
      graphRevision.value = revision
    },
    onStatus: (status) => {
      const previousError = saveError.value
      saveState.value = status.state
      saveError.value = status.message
      conflictRevision.value = status.conflictRevision
      hasLocalRecovery.value = status.hasRecovery
      canRetryAutosave.value = status.canRetry
      if (status.message && status.message !== previousError) saveErrorRevision.value += 1
    },
  })
  const canvasMutations = createCanvasMutationActions({
    activeProjectId,
    activeCanvasId,
    selectedNodeId,
    selectedNodeIds,
    nodes,
    connections,
    bumpDataRevision,
    queueAutosave: canvasAutosave.queue,
    updateNode,
    findNodeById,
    setSelection,
    selectConnection,
  })
  const canvasHistory = createCanvasHistoryActions(canvasMutations, nodes, connections, canvasAutosave.adoptCommittedRevision)
  function resetViewportPersistence(next: PersistedViewport = DEFAULT_VIEWPORT) {
    if (viewportTimer) clearTimeout(viewportTimer)
    viewportTimer = null
    viewportInFlight = null
    isViewportSaving.value = false
    confirmedViewport = normalizePersistedViewport(next)
    desiredViewport = { ...confirmedViewport }
    viewport.value = { ...confirmedViewport }
  }

  function clearDocumentState(projectId = '', canvasId = '') {
    generation += 1
    bumpDataRevision()
    documentLoadState.request = null
    canvasAutosave.reset()
    canvasHistory.deactivate()
    canvasMutations.resetMutationState()
    activeProjectId.value = projectId
    activeCanvasId.value = canvasId
    graphRevision.value = 0
    selectedNodeId.value = ''
    selectedNodeIds.value = []
    selectedConnectionId.value = ''
    selectionRevision.value += 1
    nodes.value = []
    connections.value = []
    hasLoaded.value = false
    isLoading.value = false
    loadError.value = ''
    saveError.value = ''
    saveState.value = 'saved'
    conflictRevision.value = null
    hasLocalRecovery.value = false
    canRetryAutosave.value = false
    resetViewportPersistence()
  }

  function adoptDocumentViewport(canvas: CanvasMetadataDto) {
    resetViewportPersistence({
      x: canvas.viewport_x,
      y: canvas.viewport_y,
      zoom: canvas.viewport_zoom,
    })
  }

  const documentLoader = createCanvasDocumentLoader({
    activeProjectId,
    activeCanvasId,
    graphRevision,
    nodes,
    connections,
    hasLoaded,
    isLoading,
    loadError,
    loadState: documentLoadState,
    getGeneration: () => generation,
    getDataRevision: () => dataRevision,
    clearDocumentState,
    adoptDocumentViewport,
    initializeConfirmedPositions: canvasMutations.initializeConfirmedPositions,
    initializeAutosave: canvasAutosave.initialize,
    activateHistory: canvasHistory.activate,
    setSelection,
    getSelectedNodeIds: () => selectedNodeIds.value,
    getSelectedNodeId: () => selectedNodeId.value,
  })

  async function persistPendingViewport(): Promise<void> {
    if (viewportTimer) clearTimeout(viewportTimer)
    viewportTimer = null
    if (!activeProjectId.value || !activeCanvasId.value || !hasLoaded.value) return
    if (viewportInFlight) {
      await viewportInFlight
      return persistPendingViewport()
    }
    if (isSamePersistedViewport(desiredViewport, confirmedViewport)) return

    const context = captureDocumentContext()
    const requestedViewport = { ...desiredViewport }
    isViewportSaving.value = true
    const request = (async () => {
      try {
        const response = await updateCanvasViewport(context.projectId, context.canvasId, requestedViewport)
        if (!isCurrentDocument(context)) return
        confirmedViewport = normalizePersistedViewport({
          x: response.data.viewport_x,
          y: response.data.viewport_y,
          zoom: response.data.viewport_zoom,
        })
        if (saveState.value === 'saved') saveError.value = ''
      } catch (error) {
        if (isCurrentDocument(context)) reportSaveError('保存视口', error)
        throw error
      }
    })()
    viewportInFlight = request
    try {
      await request
    } finally {
      if (viewportInFlight === request) viewportInFlight = null
      if (isCurrentDocument(context)) isViewportSaving.value = false
    }
  }

  function updateViewport(nextViewport: PersistedViewport) {
    const normalized = normalizePersistedViewport(nextViewport)
    if (isSamePersistedViewport(normalized, viewport.value)) return
    viewport.value = normalized
    desiredViewport = normalized
    if (!activeCanvasId.value || !hasLoaded.value || isSamePersistedViewport(desiredViewport, confirmedViewport)) return
    if (viewportTimer) clearTimeout(viewportTimer)
    viewportTimer = setTimeout(() => void persistPendingViewport().catch(() => undefined), VIEWPORT_DEBOUNCE_MS)
  }

  async function flushPendingPersistenceDirect() {
    const results = await Promise.allSettled([
      canvasAutosave.flush(),
      persistPendingViewport(),
    ])
    const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
    if (failed) throw failed.reason
  }

  async function retryAutosaveDirect() {
    const results = await Promise.allSettled([
      canvasAutosave.retry(),
      persistPendingViewport(),
    ])
    const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
    if (failed) throw failed.reason
  }

  const serializedActions = createCanvasSerializedActions({
    runSerialized: canvasHistory.runSerialized,
    hasLoaded: () => hasLoaded.value,
    getGraphRevision: () => graphRevision.value,
    captureDocumentContext,
    isCurrentDocument,
    flushPendingPersistence: flushPendingPersistenceDirect,
    retryAutosave: retryAutosaveDirect,
    applyNodeStatus,
    applyNodeContent,
    applyNodeGenerationState,
  })
  const {
    flushPendingPersistence,
    retryAutosave,
    runScopedCanvasAction,
    commitScopedCanvasMutation,
    reconcileGeneration,
    setNodeStatus,
    setNodeContent, setNodeGenerationParameters,
    setNodeGenerationState,
  } = serializedActions

  function loadCanvas(projectId: string, canvasId: string, force = false) {
    return serializedActions.runDocumentLoad(
      () => documentLoader.loadCanvasDirect(projectId, canvasId, force),
    )
  }

  function loadProject(projectId: string, force = false) {
    return serializedActions.runDocumentLoad(
      () => documentLoader.loadProjectDirect(projectId, force),
    )
  }

  function preserveLocalRecovery() {
    canvasAutosave.preserveRecovery()
  }

  async function reloadActiveDocument(options: {
    force?: boolean
    flushCurrent?: boolean
  } = {}) {
    const { force = true, flushCurrent = true } = options
    return serializedActions.runDocumentLoad(
      () => activeCanvasId.value
        ? documentLoader.loadCanvasDirect(activeProjectId.value, activeCanvasId.value, force)
        : documentLoader.loadProjectDirect(activeProjectId.value, force),
      flushCurrent,
    )
  }

  watch(
    () => authStore.token,
    (token, previousToken) => {
      if (token === previousToken) return
      const projectId = activeProjectId.value
      const canvasId = activeCanvasId.value
      canvasHistory.clearAll()
      clearDocumentState()
      if (token && projectId && canvasId) void loadCanvas(projectId, canvasId).catch(() => undefined)
      else if (token && projectId) void loadProject(projectId).catch(() => undefined)
    },
    { flush: 'sync' },
  )

  watch(
    () => connections.value.map((connection) => connection.id),
    (connectionIds) => {
      if (selectedConnectionId.value && !connectionIds.includes(selectedConnectionId.value)) {
        selectConnection('')
      }
    },
  )

  return {
    activeProjectId,
    activeCanvasId,
    graphRevision,
    selectedNodeId,
    selectedNodeIds,
    selectedConnectionId,
    selectedNode,
    selectedNodes,
    mode,
    viewport,
    nodes,
    connections,
    hasLoaded,
    isLoading,
    loadError,
    saveError,
    saveErrorRevision,
    saveState,
    conflictRevision,
    hasLocalRecovery,
    canRetryAutosave,
    canUndo: canvasHistory.canUndo, canRedo: canvasHistory.canRedo,
    isViewportSaving,
    loadCanvas,
    loadProject,
    reloadActiveDocument,
    updateViewport,
    persistPendingViewport,
    flushPendingPersistence,
    runScopedCanvasAction,
    retryAutosave, restoreLocalRecovery: canvasAutosave.restoreRecovery, preserveLocalRecovery, discardLocalRecovery: canvasAutosave.discardRecovery,
    selectNode,
    selectConnection,
    setSelection,
    setMode,
    setNodeStatus,
    setNodeContent, setNodeGenerationParameters,
    setNodeMediaAspectRatio,
    setNodeGenerationState,
    findNodeById,
    createNode: (...args: Parameters<typeof canvasMutations.createNode>) => canvasHistory.runSerialized(
      () => canvasMutations.createNode(...args),
    ),
    deleteNode: (...args: Parameters<typeof canvasMutations.deleteNode>) => canvasHistory.runSerialized(
      () => canvasMutations.deleteNode(...args),
    ),
    createConnection: (...args: Parameters<typeof canvasMutations.createConnection>) => canvasHistory.runSerialized(
      () => canvasMutations.createConnection(...args),
    ),
    deleteConnection: (...args: Parameters<typeof canvasMutations.deleteConnection>) => canvasHistory.runSerialized(
      () => canvasMutations.deleteConnection(...args),
    ),
    queueNodeMove: (...args: Parameters<typeof canvasMutations.queueNodeMove>) => canvasHistory.runSerialized(
      () => canvasMutations.queueNodeMove(...args),
    ),
    flushPendingMoves: () => canvasHistory.runSerialized(canvasMutations.flushPendingMoves),
    dispatchCommand: canvasHistory.execute, adoptCommittedMutation: canvasHistory.adoptCommittedMutation,
    commitScopedCanvasMutation,
    reconcileGeneration,
    undo: canvasHistory.undo, redo: canvasHistory.redo,
  }
})
