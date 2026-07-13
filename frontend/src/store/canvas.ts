import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import {
  fetchCanvasDocument,
  fetchLegacyCanvasConnections,
  fetchLegacyCanvasNodes,
  updateCanvasViewport,
} from '../modules/canvas/api'
import { mapCanvasConnection, mapCanvasNode } from '../modules/canvas/mappers'
import { createCanvasMutationActions } from '../modules/canvas/mutations'
import { createCanvasAutosave } from '../modules/canvas/canvas-autosave'
import { createCanvasHistoryActions } from '../modules/canvas/canvas-history-actions'
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
import type { CanvasGraphSaveState, CanvasMetadataDto } from '../modules/canvas/types'
import type { CanvasConnection, CanvasNode } from '../types/canvas'
import { useAuthStore } from './auth'

type CanvasMode = 'select' | 'hand' | 'text' | 'image' | 'generate'
type CanvasNodeStatus = CanvasNode['status']
type CanvasSelectionMode = 'replace' | 'toggle' | 'add'

interface DocumentLoadRequest {
  generation: number
  projectId: string
  canvasId: string
  revision: number
  promise: Promise<void>
}

interface DocumentContext {
  generation: number
  projectId: string
  canvasId: string
}
const DEFAULT_VIEWPORT: PersistedViewport = { zoom: 1, x: 0, y: 0 }
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
  let loadRequest: DocumentLoadRequest | null = null
  let viewportTimer: ReturnType<typeof setTimeout> | null = null
  let viewportInFlight: Promise<void> | null = null
  let confirmedViewport: PersistedViewport = { ...DEFAULT_VIEWPORT }
  let desiredViewport: PersistedViewport = { ...DEFAULT_VIEWPORT }
  const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedNodeId.value) || null)
  const selectedNodes = computed(() => {
    const selectedIds = new Set(selectedNodeIds.value)
    return nodes.value.filter((node) => selectedIds.has(node.id))
  })

  function bumpDataRevision() {
    dataRevision += 1
  }

  function captureDocumentContext(): DocumentContext {
    return {
      generation,
      projectId: activeProjectId.value,
      canvasId: activeCanvasId.value,
    }
  }

  function isCurrentDocument(context: DocumentContext) {
    return (
      context.generation === generation &&
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

  function setNodeStatus(nodeId: string, status: CanvasNodeStatus) {
    updateNode(nodeId, (node) => ({ ...node, status: status ?? 'idle' }))
  }

  function setNodeContent(nodeId: string, content: string) {
    updateNode(nodeId, (node) => ({
      ...node,
      content,
      contentData: { ...node.contentData, text: content },
    }))
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
  const canvasHistory = createCanvasHistoryActions(canvasMutations, nodes, connections)
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
    loadRequest = null
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

  function isCurrentLoad(request: DocumentLoadRequest) {
    return (
      request.generation === generation &&
      request.projectId === activeProjectId.value &&
      request.canvasId === activeCanvasId.value &&
      request.revision === dataRevision
    )
  }

  function adoptDocumentViewport(canvas: CanvasMetadataDto) {
    resetViewportPersistence({
      x: canvas.viewport_x,
      y: canvas.viewport_y,
      zoom: canvas.viewport_zoom,
    })
  }

  async function loadCanvas(projectId: string, canvasId: string, force = false): Promise<void> {
    const normalizedProjectId = projectId.trim()
    const normalizedCanvasId = canvasId.trim()
    if (
      normalizedProjectId !== activeProjectId.value ||
      normalizedCanvasId !== activeCanvasId.value
    ) {
      clearDocumentState(normalizedProjectId, normalizedCanvasId)
    }
    if (!normalizedProjectId || !normalizedCanvasId) return
    if (
      loadRequest?.projectId === normalizedProjectId &&
      loadRequest.canvasId === normalizedCanvasId &&
      loadRequest.generation === generation &&
      loadRequest.revision === dataRevision
    ) return loadRequest.promise
    if (!force && hasLoaded.value) return

    isLoading.value = true
    loadError.value = ''
    const request: DocumentLoadRequest = {
      generation,
      projectId: normalizedProjectId,
      canvasId: normalizedCanvasId,
      revision: dataRevision,
      promise: Promise.resolve(),
    }
    request.promise = (async () => {
      try {
        const response = await fetchCanvasDocument(normalizedProjectId, normalizedCanvasId)
        if (!isCurrentLoad(request)) return
        if (response.data.canvas.id !== normalizedCanvasId || response.data.canvas.project_id !== normalizedProjectId) {
          throw new Error('Canvas document identity mismatch')
        }
        nodes.value = response.data.nodes.map(mapCanvasNode)
        connections.value = response.data.connections.map(mapCanvasConnection)
        graphRevision.value = response.data.revision
        adoptDocumentViewport(response.data.canvas)
        canvasMutations.initializeConfirmedPositions()
        canvasAutosave.initialize(response.data.revision)
        canvasHistory.activate(normalizedProjectId, normalizedCanvasId, force)
        hasLoaded.value = true
        setSelection(selectedNodeIds.value, selectedNodeId.value)
      } catch (error) {
        if (!isCurrentLoad(request)) return
        loadError.value = getCanvasErrorMessage(error, '画布文档加载失败，请稍后重试。')
        throw error
      } finally {
        if (loadRequest === request) loadRequest = null
        if (request.generation === generation && request.projectId === activeProjectId.value && request.canvasId === activeCanvasId.value) {
          isLoading.value = false
        }
      }
    })()
    loadRequest = request
    return request.promise
  }

  async function loadProject(projectId: string, force = false): Promise<void> {
    const normalizedProjectId = projectId.trim()
    if (normalizedProjectId !== activeProjectId.value || activeCanvasId.value) {
      clearDocumentState(normalizedProjectId)
    }
    if (!normalizedProjectId || (!force && hasLoaded.value)) return
    isLoading.value = true
    loadError.value = ''
    const request: DocumentLoadRequest = {
      generation,
      projectId: normalizedProjectId,
      canvasId: '',
      revision: dataRevision,
      promise: Promise.resolve(),
    }
    request.promise = (async () => {
      try {
        const [nodeResponse, connectionResponse] = await Promise.all([
          fetchLegacyCanvasNodes(normalizedProjectId),
          fetchLegacyCanvasConnections(normalizedProjectId),
        ])
        if (!isCurrentLoad(request)) return
        nodes.value = nodeResponse.data.items.map(mapCanvasNode)
        connections.value = connectionResponse.data.items.map(mapCanvasConnection)
        canvasMutations.initializeConfirmedPositions()
        hasLoaded.value = true
      } catch (error) {
        if (!isCurrentLoad(request)) return
        loadError.value = getCanvasErrorMessage(error, '画布加载失败，请稍后重试。')
        throw error
      } finally {
        if (loadRequest === request) loadRequest = null
        if (isCurrentLoad(request)) isLoading.value = false
      }
    })()
    loadRequest = request
    return request.promise
  }

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

  async function flushPendingPersistence() {
    const results = await Promise.allSettled([
      canvasAutosave.flush(),
      persistPendingViewport(),
    ])
    const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
    if (failed) throw failed.reason
  }

  async function retryAutosave() {
    const results = await Promise.allSettled([
      canvasAutosave.retry(),
      persistPendingViewport(),
    ])
    const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
    if (failed) throw failed.reason
  }

  function preserveLocalRecovery() {
    canvasAutosave.preserveRecovery()
  }

  async function reloadActiveDocument(force = true) {
    if (activeCanvasId.value) return loadCanvas(activeProjectId.value, activeCanvasId.value, force)
    return loadProject(activeProjectId.value, force)
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
    retryAutosave, preserveLocalRecovery, discardLocalRecovery: canvasAutosave.discardRecovery,
    selectNode,
    selectConnection,
    setSelection,
    setMode,
    setNodeStatus,
    setNodeContent,
    findNodeById,
    createNode: canvasMutations.createNode,
    deleteNode: canvasMutations.deleteNode,
    createConnection: canvasMutations.createConnection,
    deleteConnection: canvasMutations.deleteConnection,
    queueNodeMove: canvasMutations.queueNodeMove,
    flushPendingMoves: canvasMutations.flushPendingMoves,
    dispatchCommand: canvasHistory.execute,
    undo: canvasHistory.undo, redo: canvasHistory.redo,
  }
})
