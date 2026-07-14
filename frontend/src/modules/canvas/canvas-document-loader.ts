import type { Ref } from 'vue'
import {
  fetchCanvasDocument,
  fetchLegacyCanvasConnections,
  fetchLegacyCanvasNodes,
} from './api'
import { mapCanvasConnection, mapCanvasNode } from './mappers'
import { getCanvasErrorMessage } from './persistence'
import type { CanvasMetadataDto } from './types'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'

interface CanvasDocumentLoadRequest {
  generation: number
  projectId: string
  canvasId: string
  revision: number
  promise: Promise<void>
}

export interface CanvasDocumentLoadState {
  request: CanvasDocumentLoadRequest | null
}

interface CanvasDocumentLoaderOptions {
  activeProjectId: Ref<string>
  activeCanvasId: Ref<string>
  graphRevision: Ref<number>
  nodes: Ref<CanvasNode[]>
  connections: Ref<CanvasConnection[]>
  hasLoaded: Ref<boolean>
  isLoading: Ref<boolean>
  loadError: Ref<string>
  loadState: CanvasDocumentLoadState
  getGeneration: () => number
  getDataRevision: () => number
  clearDocumentState: (projectId?: string, canvasId?: string) => void
  adoptDocumentViewport: (canvas: CanvasMetadataDto) => void
  initializeConfirmedPositions: () => void
  initializeAutosave: (revision: number) => void
  activateHistory: (projectId: string, canvasId: string, reset?: boolean) => void
  setSelection: (nodeIds: string[], primaryNodeId?: string) => void
  getSelectedNodeIds: () => string[]
  getSelectedNodeId: () => string
}

export function createCanvasDocumentLoader(options: CanvasDocumentLoaderOptions) {
  function isCurrentLoad(request: CanvasDocumentLoadRequest) {
    return request.generation === options.getGeneration() &&
      request.projectId === options.activeProjectId.value &&
      request.canvasId === options.activeCanvasId.value &&
      request.revision === options.getDataRevision()
  }

  async function loadCanvasDirect(projectId: string, canvasId: string, force = false): Promise<void> {
    const normalizedProjectId = projectId.trim()
    const normalizedCanvasId = canvasId.trim()
    if (
      normalizedProjectId !== options.activeProjectId.value ||
      normalizedCanvasId !== options.activeCanvasId.value
    ) options.clearDocumentState(normalizedProjectId, normalizedCanvasId)
    if (!normalizedProjectId || !normalizedCanvasId) return

    const activeRequest = options.loadState.request
    if (
      activeRequest?.projectId === normalizedProjectId &&
      activeRequest.canvasId === normalizedCanvasId &&
      activeRequest.generation === options.getGeneration() &&
      activeRequest.revision === options.getDataRevision()
    ) return activeRequest.promise
    if (!force && options.hasLoaded.value) return

    options.isLoading.value = true
    options.loadError.value = ''
    const request: CanvasDocumentLoadRequest = {
      generation: options.getGeneration(),
      projectId: normalizedProjectId,
      canvasId: normalizedCanvasId,
      revision: options.getDataRevision(),
      promise: Promise.resolve(),
    }
    request.promise = (async () => {
      try {
        const response = await fetchCanvasDocument(normalizedProjectId, normalizedCanvasId)
        if (!isCurrentLoad(request)) return
        if (
          response.data.canvas.id !== normalizedCanvasId ||
          response.data.canvas.project_id !== normalizedProjectId
        ) throw new Error('Canvas document identity mismatch')
        options.nodes.value = response.data.nodes.map(mapCanvasNode)
        options.connections.value = response.data.connections.map(mapCanvasConnection)
        options.graphRevision.value = response.data.revision
        options.adoptDocumentViewport(response.data.canvas)
        options.initializeConfirmedPositions()
        options.initializeAutosave(response.data.revision)
        options.activateHistory(normalizedProjectId, normalizedCanvasId, force)
        options.hasLoaded.value = true
        options.setSelection(options.getSelectedNodeIds(), options.getSelectedNodeId())
      } catch (error) {
        if (!isCurrentLoad(request)) return
        options.loadError.value = getCanvasErrorMessage(error, '画布文档加载失败，请稍后重试。')
        throw error
      } finally {
        if (options.loadState.request === request) options.loadState.request = null
        if (
          request.generation === options.getGeneration() &&
          request.projectId === options.activeProjectId.value &&
          request.canvasId === options.activeCanvasId.value
        ) options.isLoading.value = false
      }
    })()
    options.loadState.request = request
    return request.promise
  }

  async function loadProjectDirect(projectId: string, force = false): Promise<void> {
    const normalizedProjectId = projectId.trim()
    if (normalizedProjectId !== options.activeProjectId.value || options.activeCanvasId.value) {
      options.clearDocumentState(normalizedProjectId)
    }
    if (!normalizedProjectId || (!force && options.hasLoaded.value)) return
    options.isLoading.value = true
    options.loadError.value = ''
    const request: CanvasDocumentLoadRequest = {
      generation: options.getGeneration(),
      projectId: normalizedProjectId,
      canvasId: '',
      revision: options.getDataRevision(),
      promise: Promise.resolve(),
    }
    request.promise = (async () => {
      try {
        const [nodeResponse, connectionResponse] = await Promise.all([
          fetchLegacyCanvasNodes(normalizedProjectId),
          fetchLegacyCanvasConnections(normalizedProjectId),
        ])
        if (!isCurrentLoad(request)) return
        options.nodes.value = nodeResponse.data.items.map(mapCanvasNode)
        options.connections.value = connectionResponse.data.items.map(mapCanvasConnection)
        options.initializeConfirmedPositions()
        options.hasLoaded.value = true
      } catch (error) {
        if (!isCurrentLoad(request)) return
        options.loadError.value = getCanvasErrorMessage(error, '画布加载失败，请稍后重试。')
        throw error
      } finally {
        if (options.loadState.request === request) options.loadState.request = null
        if (isCurrentLoad(request)) options.isLoading.value = false
      }
    })()
    options.loadState.request = request
    return request.promise
  }

  return { loadCanvasDirect, loadProjectDirect }
}
