import { computed, getCurrentInstance, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue'
import {
  resolveGenerationJobRuntimePresentations,
  resolveGenerationRuntimePresentations,
  type LocalGenerationRuntimeRequest,
} from '../../../modules/canvas/generation-runtime-presentation'
import {
  resolveGenerationResultProjections,
  resolveTerminalGenerationResultPlacement,
} from '../../../modules/canvas/generation-result-projection'
import type { GenerationTask } from '../../../modules/canvas/project-resource-types'
import { createGenerationJobStore } from '../../../modules/canvas/generation-job-store'
import {
  hasGenerationJobPollingWork,
  syncGenerationJobs,
} from '../../../modules/canvas/generation-job-runtime'
import { request } from '../../../api/request'
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

export function useCanvasGenerationRuntime(options: CanvasGenerationRuntimeOptions) {
  const authStore = useAuthStore()
  const canvasStore = useCanvasStore()
  const resourceStore = useProjectResourceStore()
  const localRequests = ref<ReadonlyMap<string, LocalGenerationRuntimeRequest>>(new Map())
  const generationJobStore = createGenerationJobStore()
  const generationJobRevision = ref(0)
  let timer: ReturnType<typeof setTimeout> | null = null
  let pollingGeneration = 0
  let pollingErrorCount = 0
  const activeSyncKeys = new Set<string>()

  const generationJobSnapshot = computed(() => {
    generationJobRevision.value
    return generationJobStore.snapshot({
      projectId: options.projectId.value,
      canvasId: options.canvasId.value,
    })
  })
  const presentations = computed(() => {
    const next = resolveGenerationRuntimePresentations(
      canvasStore.nodes,
      resourceStore.tasks,
      localRequests.value,
      options.projectId.value,
      options.canvasId.value,
    )
    const compact = resolveGenerationJobRuntimePresentations(
      canvasStore.nodes,
      [...generationJobSnapshot.value.statuses.values()],
    )
    for (const [nodeId, presentation] of compact) next.set(nodeId, presentation)
    return next
  })
  const pendingResultProjections = computed(() => resolveGenerationResultProjections(
    canvasStore.nodes,
    resourceStore.tasks,
    localRequests.value,
    options.projectId.value,
    options.canvasId.value,
  ))

  function hasCompactPollingWork() {
    return hasGenerationJobPollingWork(
      canvasStore.nodes,
      generationJobSnapshot.value.statuses,
    )
  }

  function hasLegacyPollingWork() {
    return [...presentations.value.values()].some((presentation) => (
      presentation.source !== 'job' && !presentation.isTerminal
    ))
  }

  function hasPollingWork() {
    return hasCompactPollingWork() || hasLegacyPollingWork()
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
    if (!projectId || !canvasId || !authToken) return null
    return { projectId, canvasId, authToken }
  }

  function isCurrentContext(context: NonNullable<ReturnType<typeof pollingContext>>) {
    return authStore.token === context.authToken &&
      options.projectId.value === context.projectId && options.canvasId.value === context.canvasId
  }

  function schedulePolling(forceQuickDiscovery = false) {
    const context = pollingContext()
    if (!context || (!forceQuickDiscovery && !hasPollingWork())) return
    const syncKey = `${context.projectId}\u0000${context.canvasId}`
    if (activeSyncKeys.has(syncKey)) return
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
      activeSyncKeys.add(syncKey)
      try {
        const requests: Promise<unknown>[] = []
        if (hasCompactPollingWork()) {
          requests.push(syncGenerationJobs({
            projectId: context.projectId,
            canvasId: context.canvasId,
            nodes: canvasStore.nodes,
            store: generationJobStore,
            transport: request,
          }).then(() => {
            generationJobRevision.value += 1
          }))
        }
        if (hasLegacyPollingWork() && resourceStore.projectId === context.projectId) {
          requests.push(resourceStore.refreshTasksIfCurrent(context.projectId))
        }
        await Promise.all(requests)
        pollingErrorCount = 0
      } catch {
        pollingErrorCount += 1
      } finally {
        activeSyncKeys.delete(syncKey)
      }
      if (generation !== pollingGeneration || !isCurrentContext(context)) return
      if (hasPollingWork()) schedulePolling()
      else stopPolling()
    }, delay)
  }

  function isNodeActive(nodeId: string) {
    return presentations.value.get(nodeId)?.isTerminal === false
  }

  function beginRequest(context: BeginGenerationRuntimeRequest, clientRequestId: string) {
    if (isNodeActive(context.nodeId)) return null
    const knownTaskIds = resourceStore.tasks.filter((task) => (
      task.project_id === context.projectId && task.origin_canvas_id === context.canvasId &&
      task.canvas_node_id === context.nodeId && task.media_type === context.mediaType
    )).map((task) => task.id)
    const request: LocalGenerationRuntimeRequest = {
      id: clientRequestId,
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
    if (hasPollingWork()) schedulePolling(true)
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

  watch(() => canvasStore.nodes.map((node) => (
    `${node.id}:${String(node.contentData?.active_generation_job_id ?? '')}`
  )).join('|'), () => {
    if (hasPollingWork()) schedulePolling(true)
    else stopPolling()
  }, { immediate: true, flush: 'post' })

  watch(() => [...presentations.value.values()].map((presentation) => presentation.key).join('|'), () => {
    if (hasPollingWork()) schedulePolling()
    else if (timer) stopPolling()
  }, { immediate: true, flush: 'post' })

  if (getCurrentInstance()) onBeforeUnmount(stopPolling)

  return {
    beginRequest,
    generationJobResults: computed(() => generationJobSnapshot.value.results),
    pendingResultProjections,
    presentations,
    requestRecoveryPolling,
    resolveTerminalResultPlacement,
    settleRequest,
    isNodeActive,
  }
}
