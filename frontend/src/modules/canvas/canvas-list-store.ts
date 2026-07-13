import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../../store/auth'
import {
  archiveCanvas as requestCanvasArchive,
  createCanvas as requestCanvasCreation,
  duplicateCanvas as requestCanvasDuplication,
  fetchCanvases,
  renameCanvas as requestCanvasRename,
  reorderCanvases as requestCanvasReorder,
} from './api'
import {
  activeCanvasesForProject,
  getCanvasConflictRevision,
  mergeCanvasMutation,
  resolveCanvasMetadata,
} from './metadata'
import type { CanvasListResponse, CanvasMetadataDto, CanvasMutationResponse } from './types'

interface CanvasErrorResponse {
  detail?: unknown
}

interface LoadRequest {
  generation: number
  projectId: string
  promise: Promise<CanvasMetadataDto[]>
}

const LAST_CANVAS_KEY_PREFIX = 'revid:last-canvas'

function getCanvasErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<CanvasErrorResponse>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (error.code === 'ECONNABORTED') return '请求超时，请稍后重试。'
  }
  return fallback
}

function preferenceKey(userId: string, projectId: string) {
  return `${LAST_CANVAS_KEY_PREFIX}:${encodeURIComponent(userId)}:${encodeURIComponent(projectId)}`
}

export const useCanvasListStore = defineStore('canvas-list', () => {
  const authStore = useAuthStore()
  const projectId = ref('')
  const items = ref<CanvasMetadataDto[]>([])
  const orderRevision = ref(0)
  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const activeMutationCount = ref(0)
  const loadError = ref('')
  const mutationError = ref('')

  let generation = 0
  let loadRequest: LoadRequest | null = null
  let mutationTail: Promise<void> = Promise.resolve()

  const isMutating = computed(() => activeMutationCount.value > 0)

  function replaceList(nextProjectId: string, response: CanvasListResponse) {
    projectId.value = nextProjectId
    items.value = activeCanvasesForProject(response.items, nextProjectId)
    orderRevision.value = response.order_revision
    hasLoaded.value = true
  }

  async function loadCanvases(nextProjectId: string, force = false) {
    const normalizedProjectId = nextProjectId.trim()
    if (!normalizedProjectId) {
      resetCanvasList()
      return items.value
    }

    if (normalizedProjectId !== projectId.value) {
      generation += 1
      projectId.value = normalizedProjectId
      items.value = []
      orderRevision.value = 0
      hasLoaded.value = false
      loadError.value = ''
      mutationError.value = ''
    }

    const requestedGeneration = generation
    if (!force && hasLoaded.value) return items.value
    if (loadRequest?.generation === requestedGeneration && loadRequest.projectId === normalizedProjectId) {
      return loadRequest.promise
    }

    isLoading.value = true
    loadError.value = ''
    const promise = (async () => {
      try {
        const response = await fetchCanvases(normalizedProjectId)
        if (requestedGeneration === generation && normalizedProjectId === projectId.value) {
          replaceList(normalizedProjectId, response.data)
        }
        return items.value
      } catch (error) {
        if (requestedGeneration === generation) {
          loadError.value = getCanvasErrorMessage(error, '画布列表加载失败，请稍后重试。')
        }
        throw error
      }
    })()

    loadRequest = { generation: requestedGeneration, projectId: normalizedProjectId, promise }
    try {
      return await promise
    } finally {
      if (loadRequest?.promise === promise) {
        loadRequest = null
        isLoading.value = false
      }
    }
  }

  function rememberCanvas(nextProjectId: string, canvasId: string) {
    const userId = authStore.user?.id
    const canvas = resolveCanvasMetadata(items.value, nextProjectId, canvasId)
    if (!userId || !canvas || canvas.id !== canvasId || typeof window === 'undefined') return
    window.localStorage.setItem(preferenceKey(userId, nextProjectId), canvasId)
  }

  function preferredCanvasId(nextProjectId: string) {
    const userId = authStore.user?.id
    if (!userId || typeof window === 'undefined') return ''
    return window.localStorage.getItem(preferenceKey(userId, nextProjectId)) ?? ''
  }

  async function resolveCanvas(nextProjectId: string, requestedCanvasId?: string, usePreference = true) {
    await loadCanvases(nextProjectId)
    const preferredId = requestedCanvasId || (usePreference ? preferredCanvasId(nextProjectId) : '')
    const canvas = resolveCanvasMetadata(items.value, nextProjectId, preferredId)
    if (canvas) rememberCanvas(nextProjectId, canvas.id)
    return canvas
  }

  function assertGeneration(expectedGeneration: number) {
    if (expectedGeneration !== generation) {
      throw new Error('登录或画布项目状态已变化，请重新提交操作。')
    }
  }

  function enqueueMutation<T>(operation: (expectedGeneration: number) => Promise<T>) {
    const queuedGeneration = generation
    const run = mutationTail.catch(() => undefined).then(async () => {
      assertGeneration(queuedGeneration)
      activeMutationCount.value += 1
      mutationError.value = ''
      try {
        return await operation(queuedGeneration)
      } finally {
        activeMutationCount.value = Math.max(0, activeMutationCount.value - 1)
      }
    })
    mutationTail = run.then(() => undefined, () => undefined)
    return run
  }

  async function handleMutationError(
    error: unknown,
    nextProjectId: string,
    fallback: string,
    expectedGeneration: number,
  ) {
    assertGeneration(expectedGeneration)
    if (isAxiosError(error) && error.response?.status === 409) {
      const conflictRevision = getCanvasConflictRevision(error.response.data)
      if (conflictRevision !== null) orderRevision.value = conflictRevision
      await loadCanvases(nextProjectId, true).catch(() => undefined)
    }
    mutationError.value = getCanvasErrorMessage(error, fallback)
    throw error
  }

  function applyMutation(response: CanvasMutationResponse, expectedGeneration: number) {
    assertGeneration(expectedGeneration)
    items.value = mergeCanvasMutation(items.value, response)
    orderRevision.value = response.order_revision
    return response.item
  }

  async function ensureProject(nextProjectId: string, expectedGeneration: number) {
    await loadCanvases(nextProjectId)
    assertGeneration(expectedGeneration)
    if (projectId.value !== nextProjectId) throw new Error('画布项目上下文已变化，请重试。')
  }

  function createCanvas(nextProjectId: string, name: string) {
    return enqueueMutation(async (expectedGeneration) => {
      await ensureProject(nextProjectId, expectedGeneration)
      try {
        const response = await requestCanvasCreation(nextProjectId, {
          name,
          base_order_revision: orderRevision.value,
        })
        return applyMutation(response.data, expectedGeneration)
      } catch (error) {
        return handleMutationError(error, nextProjectId, '画布创建失败，请重试。', expectedGeneration)
      }
    })
  }

  function renameCanvas(nextProjectId: string, canvasId: string, name: string) {
    return enqueueMutation(async (expectedGeneration) => {
      await ensureProject(nextProjectId, expectedGeneration)
      try {
        const response = await requestCanvasRename(nextProjectId, canvasId, { name })
        return applyMutation(response.data, expectedGeneration)
      } catch (error) {
        return handleMutationError(error, nextProjectId, '画布重命名失败，请重试。', expectedGeneration)
      }
    })
  }

  function reorderCanvases(nextProjectId: string, orderedCanvasIds: string[]) {
    return enqueueMutation(async (expectedGeneration) => {
      await ensureProject(nextProjectId, expectedGeneration)
      try {
        const response = await requestCanvasReorder(nextProjectId, {
          base_order_revision: orderRevision.value,
          ordered_canvas_ids: orderedCanvasIds,
        })
        assertGeneration(expectedGeneration)
        replaceList(nextProjectId, response.data)
        return items.value
      } catch (error) {
        return handleMutationError(error, nextProjectId, '画布排序保存失败，请重试。', expectedGeneration)
      }
    })
  }

  function archiveCanvas(nextProjectId: string, canvasId: string) {
    return enqueueMutation(async (expectedGeneration) => {
      await ensureProject(nextProjectId, expectedGeneration)
      try {
        const response = await requestCanvasArchive(nextProjectId, canvasId, {
          status: 'archived',
          base_order_revision: orderRevision.value,
        })
        return applyMutation(response.data, expectedGeneration)
      } catch (error) {
        return handleMutationError(error, nextProjectId, '画布归档失败，请重试。', expectedGeneration)
      }
    })
  }

  function duplicateCanvas(nextProjectId: string, canvasId: string, name?: string) {
    return enqueueMutation(async (expectedGeneration) => {
      await ensureProject(nextProjectId, expectedGeneration)
      try {
        const response = await requestCanvasDuplication(nextProjectId, canvasId, {
          base_order_revision: orderRevision.value,
          ...(name ? { name } : {}),
        })
        return applyMutation(response.data, expectedGeneration)
      } catch (error) {
        return handleMutationError(error, nextProjectId, '画布复制失败，请重试。', expectedGeneration)
      }
    })
  }

  function resetCanvasList() {
    generation += 1
    loadRequest = null
    mutationTail = Promise.resolve()
    projectId.value = ''
    items.value = []
    orderRevision.value = 0
    hasLoaded.value = false
    isLoading.value = false
    activeMutationCount.value = 0
    loadError.value = ''
    mutationError.value = ''
  }

  watch(
    () => authStore.token,
    (token, previousToken) => {
      if (token !== previousToken) resetCanvasList()
    },
    { flush: 'sync' },
  )

  return {
    projectId,
    items,
    orderRevision,
    hasLoaded,
    isLoading,
    isMutating,
    loadError,
    mutationError,
    loadCanvases,
    resolveCanvas,
    rememberCanvas,
    createCanvas,
    renameCanvas,
    reorderCanvases,
    archiveCanvas,
    duplicateCanvas,
    resetCanvasList,
  }
})
