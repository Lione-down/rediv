import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { fetchCanvasConnections, fetchCanvasNodes } from '../modules/canvas/api'
import { mapCanvasConnection, mapCanvasNode } from '../modules/canvas/mappers'
import type { CanvasConnection, CanvasNode } from '../types/canvas'
import { useAuthStore } from './auth'

type CanvasMode = 'select' | 'hand' | 'text' | 'image' | 'generate'
type CanvasNodeStatus = CanvasNode['status']

interface CanvasErrorResponse {
  detail?: unknown
}

interface ProjectLoadRequest {
  generation: number
  projectId: string
  revision: number
  promise: Promise<void>
}

function getCanvasErrorMessage(error: unknown) {
  if (isAxiosError<CanvasErrorResponse>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }

    if (error.code === 'ECONNABORTED') {
      return '画布加载超时，请稍后重试。'
    }
  }

  return '画布加载失败，请稍后重试。'
}

export const useCanvasStore = defineStore('canvas', () => {
  const authStore = useAuthStore()
  const activeProjectId = ref('')
  const selectedNodeId = ref('')
  const mode = ref<CanvasMode>('select')
  const viewport = ref({ zoom: 1, x: 0, y: 0 })
  const nodes = ref<CanvasNode[]>([])
  const connections = ref<CanvasConnection[]>([])
  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const loadError = ref('')

  let generation = 0
  let dataRevision = 0
  let loadRequest: ProjectLoadRequest | null = null

  const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedNodeId.value) || null)

  function clearProjectState(projectId = '') {
    generation += 1
    dataRevision += 1
    loadRequest = null
    activeProjectId.value = projectId
    selectedNodeId.value = ''
    nodes.value = []
    connections.value = []
    hasLoaded.value = false
    isLoading.value = false
    loadError.value = ''
  }

  function isCurrentLoad(request: ProjectLoadRequest) {
    return (
      request.generation === generation &&
      request.projectId === activeProjectId.value &&
      request.revision === dataRevision
    )
  }

  async function loadProject(projectId: string, force = false): Promise<void> {
    const normalizedProjectId = projectId.trim()

    if (normalizedProjectId !== activeProjectId.value) {
      clearProjectState(normalizedProjectId)
    }

    if (!normalizedProjectId) {
      return
    }

    if (
      loadRequest?.projectId === normalizedProjectId &&
      loadRequest.generation === generation &&
      loadRequest.revision === dataRevision
    ) {
      return loadRequest.promise
    }

    if (!force && hasLoaded.value) {
      return
    }

    isLoading.value = true
    loadError.value = ''

    const request: ProjectLoadRequest = {
      generation,
      projectId: normalizedProjectId,
      revision: dataRevision,
      promise: Promise.resolve(),
    }

    request.promise = (async () => {
      try {
        const [nodeResponse, connectionResponse] = await Promise.all([
          fetchCanvasNodes(normalizedProjectId),
          fetchCanvasConnections(normalizedProjectId),
        ])

        if (!isCurrentLoad(request)) {
          return
        }

        nodes.value = nodeResponse.data.items.map(mapCanvasNode)
        connections.value = connectionResponse.data.items.map(mapCanvasConnection)
        hasLoaded.value = true

        if (!nodes.value.some((node) => node.id === selectedNodeId.value)) {
          selectedNodeId.value = ''
        }
      } catch (error) {
        if (!isCurrentLoad(request)) {
          return
        }

        loadError.value = getCanvasErrorMessage(error)
        throw error
      } finally {
        if (loadRequest === request) {
          loadRequest = null
        }

        if (request.generation === generation && request.projectId === activeProjectId.value) {
          isLoading.value = false
        }
      }
    })()

    loadRequest = request
    return request.promise
  }

  function selectNode(nodeId: string) {
    selectedNodeId.value = nodes.value.some((node) => node.id === nodeId) ? nodeId : ''
  }

  function setMode(nextMode: CanvasMode) {
    mode.value = nextMode
  }

  function updateNode(nodeId: string, updater: (node: CanvasNode) => CanvasNode) {
    const nodeIndex = nodes.value.findIndex((node) => node.id === nodeId)
    if (nodeIndex < 0) return

    dataRevision += 1
    nodes.value = nodes.value.map((node, index) => (index === nodeIndex ? updater(node) : node))
  }

  function setNodeStatus(nodeId: string, status: CanvasNodeStatus) {
    updateNode(nodeId, (node) => ({
      ...node,
      status: status ?? 'idle',
    }))
  }

  function setNodeContent(nodeId: string, content: string) {
    updateNode(nodeId, (node) => ({
      ...node,
      content,
      contentData: {
        ...node.contentData,
        text: content,
      },
    }))
  }

  function findNodeById(nodeId: string) {
    return nodes.value.find((node) => node.id === nodeId) ?? null
  }

  watch(
    () => authStore.token,
    (token, previousToken) => {
      if (token === previousToken) return

      const projectId = activeProjectId.value
      clearProjectState()

      if (token && projectId) {
        void loadProject(projectId).catch(() => undefined)
      }
    },
    { flush: 'sync' },
  )

  return {
    activeProjectId,
    selectedNodeId,
    selectedNode,
    mode,
    viewport,
    nodes,
    connections,
    hasLoaded,
    isLoading,
    loadError,
    loadProject,
    selectNode,
    setMode,
    setNodeStatus,
    setNodeContent,
    findNodeById,
  }
})
