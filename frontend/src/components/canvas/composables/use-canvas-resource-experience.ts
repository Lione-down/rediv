import { isAxiosError } from 'axios'
import { computed, nextTick, ref, watch, type ComputedRef, type Ref } from 'vue'
import { resolveGenerationRequestContext } from '../../../modules/canvas/generation-parameters'
import { resolveResultLineage } from '../../../modules/canvas/generation-lineage'
import { getGenerationMediaType } from '../../../modules/canvas/node-registry'
import { useProjectResourceStore } from '../../../modules/canvas/project-resource-store'
import {
  createAssetInsertCommand,
} from '../../../modules/canvas/resource-commands'
import type {
  GenerationTask,
  ProjectAsset,
  ProjectResourceTab,
  ProjectTemplate,
} from '../../../modules/canvas/project-resource-types'
import { useAuthStore } from '../../../store/auth'
import { useCanvasStore } from '../../../store/canvas'
import { createVideoFrameCaptureAction } from './use-video-frame-capture'
import { createCanvasImageGridSplitAction } from './use-canvas-image-grid-split'
import { useGenerationCapabilities } from './use-generation-capabilities'
import { useCanvasGenerationActions } from './use-canvas-generation-actions'
import { useCanvasGenerationRuntime } from './use-canvas-generation-runtime'
import { useCanvasStoryboardGroupGeneration } from './use-canvas-storyboard-group-generation'
import { useCanvasCardSourceResources } from './use-canvas-card-source-resources'
import type { PreparedCinematicGeneration } from '../../../modules/canvas/cinematic-skills'

interface CanvasResourceExperienceOptions {
  canvasId: ComputedRef<string>
  isCompact: Ref<boolean>
  isReviewOnly: Ref<boolean>
  projectId: ComputedRef<string>
}

export type CanvasResourceIntent = 'insert' | 'attach' | 'card-source'

function errorMessage(error: unknown) {
  if (isAxiosError<{ detail?: unknown }>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
      const payload = detail as Record<string, unknown>
      if (payload.code === 'provider_busy') {
        const retryAfter = typeof payload.retry_after_seconds === 'number' ? payload.retry_after_seconds : null
        return retryAfter
          ? `生成服务繁忙，请在 ${retryAfter} 秒后重试。`
          : '生成服务繁忙，请稍后重试。'
      }
      if (payload.code === 'generation_request_in_progress' || payload.code === 'generation_node_busy') {
        return '此节点已有生成任务正在执行。'
      }
      if (payload.code === 'generation_request_mismatch') {
        return '生成请求 ID 与原请求不一致，已安全阻止。'
      }
      if (typeof payload.message === 'string' && payload.message.trim()) return payload.message
    }
  }
  return error instanceof Error ? error.message : '操作失败，请稍后重试。'
}

function taskTime(task: GenerationTask) {
  const timestamp = Date.parse(task.created_at)
  return Number.isFinite(timestamp) ? timestamp : 0
}

function latestTasksByNode(tasks: readonly GenerationTask[]) {
  const ordered = [...tasks].sort((left, right) => (
    taskTime(right) - taskTime(left) || right.id.localeCompare(left.id)
  ))
  const latest = new Map<string, GenerationTask>()
  for (const task of ordered) {
    if (task.canvas_node_id && !latest.has(task.canvas_node_id)) {
      latest.set(task.canvas_node_id, task)
    }
  }
  return [...latest.values()]
}

export function useCanvasResourceExperience(options: CanvasResourceExperienceOptions) {
  const authStore = useAuthStore()
  const canvasStore = useCanvasStore()
  const resourceStore = useProjectResourceStore()
  const activeTab = ref<ProjectResourceTab>('assets')
  const panelWidth = ref(320)
  const isResourceOpen = ref(false)
  const resourceIntent = ref<CanvasResourceIntent>('insert')
  const isContextDrawerOpen = ref(false)
  const isUploading = ref(false)
  const actionError = ref('')
  const generationErrors = ref<ReadonlyMap<string, string>>(new Map())
  const generationSuccesses = ref<ReadonlyMap<string, string>>(new Map())
  const pendingDirectorPreflights = new Map<string, PreparedCinematicGeneration>()
  const {
    generationCapabilities,
    generationCapabilitiesError,
    isGenerationCapabilitiesLoading,
    reloadGenerationCapabilities,
  } = useGenerationCapabilities()
  const captureVideoFrame = createVideoFrameCaptureAction({
    actionError, canvasId: options.canvasId, canvasStore, formatError: errorMessage,
    isReviewOnly: options.isReviewOnly, isUploading, projectId: options.projectId, resourceStore,
  })
  const splitImageGrid = createCanvasImageGridSplitAction({
    actionError, canvasId: options.canvasId, canvasStore, formatError: errorMessage,
    isReviewOnly: options.isReviewOnly, isUploading, projectId: options.projectId, resourceStore,
  })
  let resourceOpener: HTMLElement | null = null
  const generationRuntime = useCanvasGenerationRuntime({ canvasId: options.canvasId, projectId: options.projectId })

  const selectedNode = computed(() => canvasStore.selectedNodeIds.length === 1 ? canvasStore.selectedNode : null)
  const selectedMediaType = computed(() => (
    selectedNode.value ? getGenerationMediaType(selectedNode.value) : null
  ))
  const selectedGenerationContext = computed(() => (
    selectedNode.value && selectedMediaType.value
      ? resolveGenerationRequestContext(
          selectedNode.value,
          selectedMediaType.value,
          canvasStore.nodes,
          canvasStore.connections,
          generationCapabilities.value,
        )
      : null
  ))
  const selectedResultLineage = computed(() => (
    selectedNode.value
      ? resolveResultLineage(selectedNode.value, canvasStore.nodes, canvasStore.connections)
      : null
  ))
  const selectedQuota = computed(() => (
    selectedMediaType.value ? authStore.quotas[selectedMediaType.value] : 0
  ))
  const selectedRuntimePresentation = computed(() => (
    selectedNode.value ? generationRuntime.presentations.value.get(selectedNode.value.id) ?? null : null
  ))
  const isGenerating = computed(() => (
    selectedNode.value ? generationRuntime.isNodeActive(selectedNode.value.id) : false
  ))
  const latestTask = computed(() => {
    const nodeId = selectedNode.value?.id
    if (selectedRuntimePresentation.value) return selectedRuntimePresentation.value.task
    return nodeId
      ? latestTasksByNode(resourceStore.tasks).find((task) => task.canvas_node_id === nodeId) ?? null
      : null
  })
  const visibleError = computed(() => actionError.value || resourceStore.error)
  const generationError = computed(() => (
    (selectedNode.value ? generationErrors.value.get(selectedNode.value.id) ?? '' : '') ||
    generationCapabilitiesError.value
  ))
  const generationSuccess = computed(() => (
    selectedNode.value ? generationSuccesses.value.get(selectedNode.value.id) ?? '' : ''
  ))
  const isDesktopContextOpen = ref(false)

  function restoreResourceFocus() {
    const target = resourceOpener?.isConnected ? resourceOpener : document.querySelector<HTMLElement>('[aria-label="打开项目资源"]')
    resourceOpener = null
    void nextTick(() => target?.focus({ preventScroll: true }))
  }

  function openResources(opener?: HTMLElement, intent: CanvasResourceIntent = 'insert', tab: ProjectResourceTab = 'assets') {
    if (opener) resourceOpener = opener
    actionError.value = ''
    resourceIntent.value = intent
    activeTab.value = tab
    isResourceOpen.value = true
    if (tab === 'tasks' && options.projectId.value) {
      void resourceStore.loadTaskHistory(options.projectId.value).catch(() => undefined)
    }
    if (options.isCompact.value) isContextDrawerOpen.value = false
  }

  watch(activeTab, (tab) => {
    if (tab === 'tasks' && isResourceOpen.value && options.projectId.value) {
      void resourceStore.loadTaskHistory(options.projectId.value).catch(() => undefined)
    }
  })

  function closeResources(restoreFocus = true) {
    isResourceOpen.value = false
    clearCardSourceTarget()
    if (restoreFocus) restoreResourceFocus()
  }

  function setPanelWidth(width: number) {
    panelWidth.value = Math.min(420, Math.max(280, Math.round(width)))
  }

  function insertionPoint() {
    const leftInset = !options.isCompact.value && isResourceOpen.value ? panelWidth.value + 32 : 0
    const rightInset = !options.isCompact.value && isDesktopContextOpen.value ? 392 : 0
    const screenX = leftInset + Math.max(0, window.innerWidth - leftInset - rightInset) / 2
    const screenY = window.innerHeight / 2
    const zoom = Math.max(0.1, canvasStore.viewport.zoom)
    return {
      x: Math.round((screenX - canvasStore.viewport.x) / zoom),
      y: Math.round((screenY - canvasStore.viewport.y) / zoom),
    }
  }

  async function insertAsset(asset: ProjectAsset) {
    if (options.isReviewOnly.value) return
    actionError.value = ''
    if (
      asset.project_id !== options.projectId.value ||
      resourceStore.projectId !== options.projectId.value
    ) {
      actionError.value = '项目资源上下文不匹配，请刷新后重试。'
      return
    }
    try {
      await canvasStore.dispatchCommand({
        source: 'toolbar',
        command: createAssetInsertCommand(asset, insertionPoint()),
      })
    } catch (error) {
      actionError.value = errorMessage(error)
    }
  }

  async function uploadAsset(file: File, type: 'image' | 'video' | 'audio') {
    if (options.isReviewOnly.value || isUploading.value) return
    actionError.value = ''
    isUploading.value = true
    try {
      return await resourceStore.uploadAsset(options.projectId.value, options.canvasId.value, file, type)
    } catch (error) {
      actionError.value = errorMessage(error)
    } finally {
      isUploading.value = false
    }
  }

  const {
    attachCardSourceAsset, cardSourceTargetNodeId, clearCardSourceTarget,
    openCardSourceResources, uploadCardSource,
  } = useCanvasCardSourceResources({
    actionError, closeResources, formatError: errorMessage, isReviewOnly: options.isReviewOnly,
    openResources: (opener) => openResources(opener, 'card-source', 'assets'),
    projectId: options.projectId, uploadAsset,
  })

  async function captureTemplate(name: string) {
    if (options.isReviewOnly.value) return
    actionError.value = ''
    const expectedProjectId = options.projectId.value
    const expectedCanvasId = options.canvasId.value
    try {
      await canvasStore.runScopedCanvasAction(
        expectedProjectId,
        expectedCanvasId,
        () => resourceStore.captureTemplate(expectedProjectId, expectedCanvasId, name),
      )
    } catch (error) {
      actionError.value = errorMessage(error)
    }
  }

  async function instantiateTemplate(template: ProjectTemplate) {
    if (options.isReviewOnly.value) return
    actionError.value = ''
    const expectedProjectId = options.projectId.value
    const expectedCanvasId = options.canvasId.value
    const retryKey = `canvas-template:${expectedCanvasId}:${template.id}`
    try {
      await canvasStore.commitScopedCanvasMutation(
        expectedProjectId,
        expectedCanvasId,
        async (baseRevision) => {
          const anchor = insertionPoint()
          return resourceStore.instantiateTemplate(
            expectedProjectId,
            expectedCanvasId,
            template.id,
            {
              baseRevision,
              anchorX: anchor.x,
              anchorY: anchor.y,
              retryKey,
            },
          )
        },
      )
      resourceStore.confirmTemplateInstantiation(retryKey)
    } catch (error) {
      actionError.value = errorMessage(error)
    }
  }

  function setNodeMessage(target: Ref<ReadonlyMap<string, string>>, nodeId: string, message: string) {
    const next = new Map(target.value)
    if (message) next.set(nodeId, message)
    else next.delete(nodeId)
    target.value = next
  }

  const { generate, generateNode, generateRecipe, updatePrompt, updateGenerationParameters } = useCanvasGenerationActions({
    canvasId: options.canvasId,
    projectId: options.projectId,
    isReviewOnly: options.isReviewOnly,
    selectedNode,
    selectedMediaType,
    generationCapabilities,
    isNodeGenerating: generationRuntime.isNodeActive,
    setGenerationError: (nodeId, message) => setNodeMessage(generationErrors, nodeId, message),
    setGenerationSuccess: (nodeId, message) => setNodeMessage(generationSuccesses, nodeId, message),
    formatError: errorMessage,
    beginRuntimeRequest: generationRuntime.beginRequest,
    requestRuntimeRecoveryPolling: generationRuntime.requestRecoveryPolling,
    settleRuntimeRequest: generationRuntime.settleRequest,
    consumeDirectorPreflight: (nodeId) => {
      const prepared = pendingDirectorPreflights.get(nodeId) ?? null
      pendingDirectorPreflights.delete(nodeId)
      return prepared
    },
  })

  const { generateStoryboardGroup, storyboardGenerationSummary } = useCanvasStoryboardGroupGeneration({
    canvas: canvasStore, generateNode, generationCapabilities, getImageQuota: () => authStore.quotas.image,
    isNodeGenerating: generationRuntime.isNodeActive, isReviewOnly: options.isReviewOnly,
  })

  function setDirectorPreflight(nodeId: string, prepared: PreparedCinematicGeneration) {
    const node = canvasStore.findNodeById(nodeId)
    if (!node || getGenerationMediaType(node) === null || options.isReviewOnly.value) return false
    pendingDirectorPreflights.set(nodeId, prepared)
    setNodeMessage(generationSuccesses, nodeId, 'Retake preflight 已准备；下一次显式 Send 将使用该 exact request。')
    return true
  }

  function closeContext() {
    isContextDrawerOpen.value = false
    isDesktopContextOpen.value = false
  }

  function openContext() {
    if (!selectedNode.value) return
    if (options.isCompact.value) {
      isResourceOpen.value = false
      isContextDrawerOpen.value = true
    } else {
      isDesktopContextOpen.value = true
    }
  }

  let suppressNextCompactContextOpen = false
  let shouldSuppressNextContextAutoOpen = false
  function suppressNextContextAutoOpen() { shouldSuppressNextContextAutoOpen = true }
  function selectNodeForCanvasLocation(nodeId: string) { if (!canvasStore.findNodeById(nodeId)) return false; suppressNextCompactContextOpen = options.isCompact.value; canvasStore.selectNode(nodeId); return true }
  watch(options.projectId, (projectId) => {
    pendingDirectorPreflights.clear()
    if (projectId) {
      void resourceStore.loadProject(projectId, { includeTaskHistory: false }).catch(() => undefined)
    }
  }, { immediate: true })

  watch(() => selectedNode.value?.id, (nodeId) => {
    if (nodeId && shouldSuppressNextContextAutoOpen) {
      shouldSuppressNextContextAutoOpen = false
      isContextDrawerOpen.value = false
      isDesktopContextOpen.value = false
      return
    }
    if (!nodeId) {
      isContextDrawerOpen.value = false
      isDesktopContextOpen.value = false
    }
    else if (options.isCompact.value) {
      isResourceOpen.value = false
      if (suppressNextCompactContextOpen) { suppressNextCompactContextOpen = false; isContextDrawerOpen.value = false }
      else isContextDrawerOpen.value = true
    } else isDesktopContextOpen.value = true
  })

  watch(options.isCompact, (isCompact) => {
    if (!isCompact) isContextDrawerOpen.value = false
  })

  return {
    resourceStore,
    activeTab,
    panelWidth,
    isResourceOpen,
    resourceIntent,
    cardSourceTargetNodeId,
    isContextDrawerOpen,
    isDesktopContextOpen,
    isUploading,
    isGenerating,
    generationCapabilities,
    generationCapabilitiesError,
    isGenerationCapabilitiesLoading,
    reloadGenerationCapabilities,
    selectedNode,
    selectedMediaType,
    selectedGenerationContext,
    selectedResultLineage,
    selectedQuota,
    selectedRuntimePresentation,
    generationRuntimePresentations: generationRuntime.presentations,
    generationJobResults: generationRuntime.generationJobResults,
    pendingGenerationResults: generationRuntime.pendingResultProjections,
    latestTask,
    visibleError,
    generationError,
    generationSuccess,
    storyboardGenerationSummary,
    openResources,
    openCardSourceResources,
    closeResources,
    restoreResourceFocus,
    closeContext,
    openContext,
    suppressNextContextAutoOpen,
    selectNodeForCanvasLocation,
    setPanelWidth,
    getInsertionPoint: insertionPoint,
    insertAsset,
    uploadAsset,
    uploadCardSource,
    attachCardSourceAsset,
    captureVideoFrame,
    splitImageGrid,
    captureTemplate,
    instantiateTemplate,
    generate,
    generateStoryboardGroup,
    setDirectorPreflight,
    generateRecipe,
    updatePrompt,
    updateGenerationParameters,
  }
}
