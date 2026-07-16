import { computed, getCurrentInstance, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue'
import {
  resolveGenerationRuntimePresentations,
  type LocalGenerationRuntimeRequest,
} from '../../../modules/canvas/generation-runtime-presentation'
import {
  resolveGenerationResultProjections,
  resolveTerminalGenerationResultPlacement,
} from '../../../modules/canvas/generation-result-projection'
import type { GenerationTask } from '../../../modules/canvas/project-resource-types'
import { useProjectResourceStore } from '../../../modules/canvas/project-resource-store'
import { useAuthStore } from '../../../store/auth'
import { useCanvasStore } from '../../../store/canvas'

interface CanvasGenerationRuntimeOptions {
  canvasId: ComputedRef<string>
  projectId: ComputedRef<string>
}

interface BeginGenerationRuntimeRequest {
  canvasId: string
  mediaType: 'image' | 'video'
  nodeId: string
  projectId: string
}

const QUICK_DISCOVERY_DELAY_MS = 250
const ACTIVE_POLL_DELAY_MS = 2_000
const MAX_ERROR_DELAY_MS = 8_000

function requestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useCanvasGenerationRuntime(options: CanvasGenerationRuntimeOptions) {
  const authStore = useAuthStore()
  const canvasStore = useCanvasStore()
  const resourceStore = useProjectResourceStore()
  const localRequests = ref<ReadonlyMap<string, LocalGenerationRuntimeRequest>>(new Map())
  let timer: ReturnType<typeof setTimeout> | null = null
  let pollingGeneration = 0
  let pollingErrorCount = 0

  const presentations = computed(() => resolveGenerationRuntimePresentations(
    canvasStore.nodes,
    resourceStore.tasks,
    localRequests.value,
    options.projectId.value,
    options.canvasId.value,
  ))
  const pendingResultProjections = computed(() => resolveGenerationResultProjections(
    canvasStore.nodes,
    resourceStore.tasks,
    localRequests.value,
    options.projectId.value,
    options.canvasId.value,
  ))

  function hasPollingWork() {
    return [...presentations.value.values()].some((presentation) => (
      presentation.phase === 'submitting' || presentation.phase === 'queued' || presentation.phase === 'running'
    ))
  }

  function stopPolling() {
    pollingGeneration += 1
    pollingErrorCount = 0
    if (timer) clearTimeout(timer)
    timer = null
  }

  function pollingContext() {
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    const authToken = authStore.token
    if (!projectId || !canvasId || !authToken || resourceStore.projectId !== projectId) return null
    return { projectId, canvasId, authToken }
  }

  function isCurrentContext(context: NonNullable<ReturnType<typeof pollingContext>>) {
    return authStore.token === context.authToken &&
      options.projectId.value === context.projectId && options.canvasId.value === context.canvasId &&
      resourceStore.projectId === context.projectId
  }

  function schedulePolling(forceQuickDiscovery = false) {
    const context = pollingContext()
    if (!context || (!forceQuickDiscovery && !hasPollingWork())) return
    if (timer && !forceQuickDiscovery) return
    if (timer) clearTimeout(timer)
    const generation = pollingGeneration
    const delay = forceQuickDiscovery
      ? QUICK_DISCOVERY_DELAY_MS
      : pollingErrorCount
        ? Math.min(ACTIVE_POLL_DELAY_MS * (2 ** (pollingErrorCount - 1)), MAX_ERROR_DELAY_MS)
        : ACTIVE_POLL_DELAY_MS
    timer = setTimeout(async () => {
      timer = null
      if (generation !== pollingGeneration || !isCurrentContext(context)) return
      try {
        await resourceStore.refreshTasksIfCurrent(context.projectId)
        pollingErrorCount = 0
      } catch {
        pollingErrorCount += 1
      }
      if (generation !== pollingGeneration || !isCurrentContext(context)) return
      if (hasPollingWork()) schedulePolling()
      else stopPolling()
    }, delay)
  }

  function beginRequest(context: BeginGenerationRuntimeRequest) {
    const knownTaskIds = resourceStore.tasks.filter((task) => (
      task.project_id === context.projectId && task.origin_canvas_id === context.canvasId &&
      task.canvas_node_id === context.nodeId && task.media_type === context.mediaType
    )).map((task) => task.id)
    const request: LocalGenerationRuntimeRequest = {
      id: requestId(),
      projectId: context.projectId,
      canvasId: context.canvasId,
      nodeId: context.nodeId,
      mediaType: context.mediaType,
      knownTaskIds,
      startedAt: Date.now(),
    }
    localRequests.value = new Map(localRequests.value).set(context.nodeId, request)
    schedulePolling(true)
    return request.id
  }

  function settleRequest(runtimeRequestId: string) {
    const entry = [...localRequests.value.entries()].find(([, request]) => request.id === runtimeRequestId)
    if (!entry) return
    const nextRequests = new Map(localRequests.value)
    nextRequests.delete(entry[0])
    localRequests.value = nextRequests
    if (hasPollingWork()) schedulePolling()
    else stopPolling()
  }

  function requestRecoveryPolling() {
    schedulePolling(true)
  }

  function resolveTerminalResultPlacement(task: GenerationTask) {
    return resolveTerminalGenerationResultPlacement(
      task,
      canvasStore.nodes,
      resourceStore.tasks,
      localRequests.value,
      options.projectId.value,
      options.canvasId.value,
    )
  }

  watch([
    options.projectId,
    options.canvasId,
    () => authStore.token,
  ], () => {
    localRequests.value = new Map()
    stopPolling()
  }, { flush: 'sync' })

  watch(() => [...presentations.value.values()].map((presentation) => presentation.key).join('|'), () => {
    if (hasPollingWork()) schedulePolling()
    else if (timer) stopPolling()
  }, { immediate: true, flush: 'post' })

  if (getCurrentInstance()) onBeforeUnmount(stopPolling)

  return {
    beginRequest,
    pendingResultProjections,
    presentations,
    requestRecoveryPolling,
    resolveTerminalResultPlacement,
    settleRequest,
  }
}
