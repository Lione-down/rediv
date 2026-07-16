import { isAxiosError } from 'axios'
import { computed, nextTick, ref, watch, type ComputedRef, type Ref } from 'vue'
import { resolveGenerationRequestContext } from '../../../modules/canvas/generation-parameters'
import { resolveResultLineage } from '../../../modules/canvas/generation-lineage'
import { getGenerationMediaType } from '../../../modules/canvas/node-registry'
import { useProjectResourceStore } from '../../../modules/canvas/project-resource-store'
import {
  createAssetInsertCommand,
  createGeneratedResultCommand,
  hasResultForTask,
} from '../../../modules/canvas/resource-commands'
import type {
  GenerationTask,
  ProjectAsset,
  ProjectResourceTab,
  ProjectTemplate,
} from '../../../modules/canvas/project-resource-types'
import { useAuthStore } from '../../../store/auth'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'
import { createVideoFrameCaptureAction } from './use-video-frame-capture'
import { useGenerationCapabilities } from './use-generation-capabilities'
import { useCanvasGenerationActions } from './use-canvas-generation-actions'
import { useCanvasGenerationRuntime } from './use-canvas-generation-runtime'

interface CanvasResourceExperienceOptions {
  canvasId: ComputedRef<string>
  isCompact: Ref<boolean>
  isReviewOnly: Ref<boolean>
  projectId: ComputedRef<string>
}

function errorMessage(error: unknown) {
  if (isAxiosError<{ detail?: unknown }>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
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

function isTerminalTask(task: GenerationTask): task is GenerationTask & {
  status: 'succeeded' | 'failed' | 'timed_out'
} {
  return task.status === 'succeeded' || task.status === 'failed' || task.status === 'timed_out'
}

function isStrictTaskSourceLink(
  task: GenerationTask,
  sourceNode: CanvasNode,
  projectId: string,
  canvasId: string,
) {
  return task.project_id === projectId && task.origin_canvas_id === canvasId &&
    task.canvas_node_id === sourceNode.id && task.media_type === getGenerationMediaType(sourceNode)
}

function isStrictTaskAssetLink(task: GenerationTask, asset: ProjectAsset, projectId: string, canvasId: string) {
  return task.status === 'succeeded' && Boolean(task.result_asset_id) &&
    asset.id === task.result_asset_id && asset.project_id === projectId &&
    asset.origin_canvas_id === canvasId && asset.canvas_node_id === task.canvas_node_id &&
    asset.source === 'generation' && asset.source_task_id === task.id && asset.type === task.media_type
}

export function useCanvasResourceExperience(options: CanvasResourceExperienceOptions) {
  const authStore = useAuthStore()
  const canvasStore = useCanvasStore()
  const resourceStore = useProjectResourceStore()
  const activeTab = ref<ProjectResourceTab>('assets')
  const panelWidth = ref(320)
  const isResourceOpen = ref(false)
  const isContextDrawerOpen = ref(false)
  const isUploading = ref(false)
  const isGenerating = ref(false)
  const actionError = ref('')
  const generationError = ref('')
  const generationSuccess = ref('')
  const foregroundResultNodeId = ref('')
  const { generationCapabilities, generationCapabilitiesError } = useGenerationCapabilities()
  const captureVideoFrame = createVideoFrameCaptureAction({
    actionError, canvasId: options.canvasId, canvasStore, formatError: errorMessage,
    isReviewOnly: options.isReviewOnly, isUploading, projectId: options.projectId, resourceStore,
  })
  let resourceOpener: HTMLElement | null = null
  let reconciliationTransition = Promise.resolve<unknown>(undefined)
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
  const latestTask = computed(() => {
    const nodeId = selectedNode.value?.id
    if (selectedRuntimePresentation.value) return selectedRuntimePresentation.value.task
    return nodeId
      ? latestTasksByNode(resourceStore.tasks).find((task) => task.canvas_node_id === nodeId) ?? null
      : null
  })
  const visibleError = computed(() => actionError.value || resourceStore.error)
  const visibleGenerationError = computed(() => generationError.value || generationCapabilitiesError.value)
  const isDesktopContextOpen = computed(() => (
    !options.isCompact.value && Boolean(selectedNode.value)
  ))

  function restoreResourceFocus() {
    const target = resourceOpener?.isConnected ? resourceOpener : document.querySelector<HTMLElement>('[aria-label="打开项目资源"]')
    resourceOpener = null
    void nextTick(() => target?.focus({ preventScroll: true }))
  }

  function openResources(opener?: HTMLElement) {
    if (opener) resourceOpener = opener
    actionError.value = ''
    isResourceOpen.value = true
    if (options.isCompact.value) isContextDrawerOpen.value = false
  }

  function closeResources(restoreFocus = true) {
    isResourceOpen.value = false
    if (restoreFocus) restoreResourceFocus()
  }

  function setPanelWidth(width: number) {
    panelWidth.value = Math.min(420, Math.max(280, Math.round(width)))
  }

  function insertionPoint() {
    const leftInset = !options.isCompact.value && isResourceOpen.value ? panelWidth.value + 32 : 0
    const rightInset = !options.isCompact.value && selectedNode.value ? 392 : 0
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
      await resourceStore.uploadAsset(options.projectId.value, options.canvasId.value, file, type)
    } catch (error) {
      actionError.value = errorMessage(error)
    } finally {
      isUploading.value = false
    }
  }

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

  async function reconcileCurrentResources() {
    const projectId = canvasStore.activeProjectId
    const canvasId = canvasStore.activeCanvasId
    if (
      !projectId || !canvasId || !canvasStore.hasLoaded ||
      resourceStore.projectId !== projectId
    ) return 0
    const assetsById = new Map(resourceStore.assets.map((asset) => [asset.id, asset]))
    const tasks = latestTasksByNode(resourceStore.tasks).filter((task) => (
      task.origin_canvas_id === canvasId && isTerminalTask(task)
    ))
    if (!tasks.length) return 0
    return canvasStore.reconcileGeneration(projectId, canvasId, async (actions) => {
      let reconciled = 0
      for (const task of tasks) {
        const sourceNode = task.canvas_node_id ? canvasStore.findNodeById(task.canvas_node_id) : null
        if (!sourceNode || !isStrictTaskSourceLink(task, sourceNode, projectId, canvasId)) continue
        if (task.status === 'succeeded') {
          if (sourceNode.contentData?.result_materialized_task_id === task.id) {
            reconciled += 1
            continue
          }
          const asset = task.result_asset_id ? assetsById.get(task.result_asset_id) : undefined
          if (!asset || !isStrictTaskAssetLink(task, asset, projectId, canvasId)) continue
          const alreadyMaterialized = hasResultForTask(canvasStore.nodes, task.id)
          actions.setNodeGenerationState(sourceNode.id, task.status, task.id, true)
          if (!alreadyMaterialized) {
            const selectedIds = [...canvasStore.selectedNodeIds]
            const primaryNodeId = canvasStore.selectedNodeId
            await actions.execute({
              source: 'toolbar',
              command: createGeneratedResultCommand(
                sourceNode,
                asset,
                task,
                canvasStore.nodes,
                generationRuntime.resolveTerminalResultPlacement(task),
              ),
            })
            canvasStore.setSelection(selectedIds, primaryNodeId)
          }
        } else {
          if (
            sourceNode.contentData?.generation_task_id === task.id &&
            sourceNode.contentData?.generation_status === task.status
          ) {
            reconciled += 1
            continue
          }
          if (task.result_asset_id) continue
          actions.setNodeGenerationState(sourceNode.id, task.status, task.id)
        }
        reconciled += 1
      }
      return reconciled
    })
  }

  function queueResourceReconciliation() {
    const result = reconciliationTransition.then(
      () => reconcileCurrentResources(),
      () => reconcileCurrentResources(),
    )
    reconciliationTransition = result.then(() => undefined, () => undefined)
    return result
  }

  const { generate, generateRecipe, updatePrompt, updateGenerationParameters } = useCanvasGenerationActions({
    canvasId: options.canvasId,
    projectId: options.projectId,
    isReviewOnly: options.isReviewOnly,
    selectedNode,
    selectedMediaType,
    generationCapabilities,
    isGenerating,
    generationError,
    generationSuccess,
    foregroundResultNodeId,
    formatError: errorMessage,
    queueResourceReconciliation,
    beginRuntimeRequest: generationRuntime.beginRequest,
    requestRuntimeRecoveryPolling: generationRuntime.requestRecoveryPolling,
    settleRuntimeRequest: generationRuntime.settleRequest,
  })

  function closeContext() {
    isContextDrawerOpen.value = false
    canvasStore.setSelection([], '')
  }

  let suppressNextCompactContextOpen = false
  function selectNodeForCanvasLocation(nodeId: string) { if (!canvasStore.findNodeById(nodeId)) return false; suppressNextCompactContextOpen = options.isCompact.value; canvasStore.selectNode(nodeId); return true }
  watch(options.projectId, (projectId) => {
    if (projectId) void resourceStore.loadProject(projectId).catch(() => undefined)
  }, { immediate: true })

  watch([
    () => canvasStore.activeProjectId,
    () => canvasStore.activeCanvasId,
    () => canvasStore.hasLoaded,
    () => resourceStore.projectId,
    () => resourceStore.tasks.map((task) => (
      `${task.id}:${task.status}:${task.updated_at}:${task.result_asset_id ?? ''}`
    )).join('|'),
    () => resourceStore.assets.map((asset) => `${asset.id}:${asset.updated_at}`).join('|'),
  ], () => {
    void queueResourceReconciliation().catch(() => undefined)
  }, { immediate: true, flush: 'post' })

  watch(() => selectedNode.value?.id, (nodeId) => {
    generationError.value = ''
    generationSuccess.value = ''
    if (!nodeId) isContextDrawerOpen.value = false
    else if (options.isCompact.value) {
      isResourceOpen.value = false
      if (suppressNextCompactContextOpen) { suppressNextCompactContextOpen = false; isContextDrawerOpen.value = false }
      else isContextDrawerOpen.value = true
    }
  })

  watch(options.isCompact, (isCompact) => {
    if (!isCompact) isContextDrawerOpen.value = false
  })

  return {
    resourceStore,
    activeTab,
    panelWidth,
    isResourceOpen,
    isContextDrawerOpen,
    isDesktopContextOpen,
    isUploading,
    isGenerating,
    selectedNode,
    selectedMediaType,
    selectedGenerationContext,
    selectedResultLineage,
    selectedQuota,
    selectedRuntimePresentation,
    generationRuntimePresentations: generationRuntime.presentations,
    pendingGenerationResults: generationRuntime.pendingResultProjections,
    latestTask,
    visibleError,
    generationError: visibleGenerationError,
    generationSuccess,
    foregroundResultNodeId,
    openResources,
    closeResources,
    restoreResourceFocus,
    closeContext,
    selectNodeForCanvasLocation,
    setPanelWidth,
    insertAsset,
    uploadAsset,
    captureVideoFrame,
    captureTemplate,
    instantiateTemplate,
    generate,
    generateRecipe,
    updatePrompt,
    updateGenerationParameters,
  }
}
