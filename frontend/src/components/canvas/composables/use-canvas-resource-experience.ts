import { isAxiosError } from 'axios'
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'
import { request } from '../../../api/request'
import { requestCanvasGeneration } from '../../../modules/canvas/generation-service'
import { resolveGenerationContext } from '../../../modules/canvas/generation-context'
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

interface CanvasResourceExperienceOptions {
  canvasId: ComputedRef<string>
  isCompact: Ref<boolean>
  isReviewOnly: Ref<boolean>
  projectId: ComputedRef<string>
}

interface GenerationRequestContext {
  authToken: string
  canvasId: string
  mediaType: 'image' | 'video'
  nodeId: string
  projectId: string
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
  let resourceOpener: HTMLElement | null = null
  let reconciliationTransition = Promise.resolve<unknown>(undefined)
  let pollingTimer: ReturnType<typeof setTimeout> | null = null
  let pollingAttempt = 0
  let pollingGeneration = 0

  function stopResourcePolling() {
    pollingGeneration += 1
    pollingAttempt = 0
    if (pollingTimer) clearTimeout(pollingTimer)
    pollingTimer = null
  }

  function hasPendingGeneration() {
    return latestTasksByNode(resourceStore.tasks).some((task) => (
      task.status === 'queued' || task.status === 'running'
    ))
  }

  function scheduleResourcePolling(force = false) {
    if (pollingTimer || (!force && !hasPendingGeneration())) return
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    const authToken = authStore.token
    if (!projectId || !canvasId || !authToken || resourceStore.projectId !== projectId) return
    const generation = pollingGeneration
    const delay = Math.min(1000 * (2 ** pollingAttempt), 8000)
    pollingTimer = setTimeout(async () => {
      pollingTimer = null
      if (generation !== pollingGeneration || authStore.token !== authToken || options.projectId.value !== projectId || options.canvasId.value !== canvasId) return
      pollingAttempt += 1
      await resourceStore.refreshIfCurrent(projectId).catch(() => undefined)
      await queueResourceReconciliation().catch(() => undefined)
      if (generation !== pollingGeneration) return
      if (hasPendingGeneration() && pollingAttempt < 10) scheduleResourcePolling(true)
      else stopResourcePolling()
    }, delay)
  }

  const selectedNode = computed(() => canvasStore.selectedNode)
  const selectedMediaType = computed(() => (
    selectedNode.value ? getGenerationMediaType(selectedNode.value) : null
  ))
  const selectedGenerationContext = computed(() => (
    selectedNode.value && selectedMediaType.value
      ? resolveGenerationContext(selectedNode.value, canvasStore.nodes, canvasStore.connections)
      : null
  ))
  const selectedQuota = computed(() => (
    selectedMediaType.value ? authStore.quotas[selectedMediaType.value] : 0
  ))
  const latestTask = computed(() => {
    const nodeId = selectedNode.value?.id
    return nodeId
      ? latestTasksByNode(resourceStore.tasks).find((task) => task.canvas_node_id === nodeId) ?? null
      : null
  })
  const visibleError = computed(() => actionError.value || resourceStore.error)
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

  function isExactGenerationContext(context: GenerationRequestContext) {
    return authStore.token === context.authToken &&
      canvasStore.activeProjectId === context.projectId &&
      canvasStore.activeCanvasId === context.canvasId
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
              command: createGeneratedResultCommand(sourceNode, asset, task),
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

  async function generate(prompt: string) {
    const sourceNode = selectedNode.value
    const mediaType = selectedMediaType.value
    if (!sourceNode || !mediaType || options.isReviewOnly.value || isGenerating.value) return
    const generationContext = resolveGenerationContext(
      { ...sourceNode, content: prompt },
      canvasStore.nodes,
      canvasStore.connections,
    )
    if (!generationContext.prompt) {
      generationError.value = '请填写提示词或连接至少一个有内容的脚本节点。'
      return
    }
    const context: GenerationRequestContext = {
      authToken: authStore.token,
      projectId: options.projectId.value,
      canvasId: options.canvasId.value,
      nodeId: sourceNode.id,
      mediaType,
    }
    if (authStore.quotas[mediaType] < 1) {
      generationError.value = `${mediaType} quota 不足，当前生成已阻止。`
      return
    }
    generationError.value = ''
    generationSuccess.value = ''
    isGenerating.value = true
    try {
      await canvasStore.setNodeContent(sourceNode.id, prompt)
      await canvasStore.setNodeGenerationState(sourceNode.id, 'running')
      await canvasStore.flushPendingPersistence()
      const response = await requestCanvasGeneration({
        mediaType,
        projectId: context.projectId,
        originCanvasId: context.canvasId,
        canvasNodeId: context.nodeId,
        prompt: generationContext.prompt,
        imageIds: generationContext.imageIds,
      }, authStore, request)
      if (!response.asset) throw new Error('生成已完成，但响应缺少结果资产。')
      resourceStore.upsertAsset(response.asset)
      resourceStore.upsertTask(response.generation_task)
      await queueResourceReconciliation()
      if (isExactGenerationContext(context)) {
        generationSuccess.value = `${mediaType === 'video' ? '视频' : '图片'}生成已完成，结果已写入项目资源。`
      }
    } catch (error) {
      const isCurrentAuthSession = authStore.token === context.authToken
      if (isCurrentAuthSession) {
        await resourceStore.refreshIfCurrent(context.projectId).catch(() => undefined)
        const reconciled = await queueResourceReconciliation().catch(() => 0)
        if (isExactGenerationContext(context)) {
          generationError.value = reconciled
            ? errorMessage(error)
            : '生成请求连接已中断，正在根据任务记录核对结果；请稍后刷新项目资源。'
          if (!reconciled) scheduleResourcePolling(true)
        }
      }
    } finally {
      isGenerating.value = false
    }
  }

  function updatePrompt(prompt: string) {
    if (!options.isReviewOnly.value && selectedNode.value) {
      void canvasStore.setNodeContent(selectedNode.value.id, prompt)
    }
  }

  function closeContext() {
    isContextDrawerOpen.value = false
    canvasStore.setSelection([], '')
  }

  watch(options.projectId, (projectId) => {
    stopResourcePolling()
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
    if (hasPendingGeneration()) scheduleResourcePolling()
    else if (pollingTimer) stopResourcePolling()
  }, { immediate: true, flush: 'post' })

  watch([options.canvasId, () => authStore.token], stopResourcePolling, { flush: 'sync' })

  watch(() => selectedNode.value?.id, (nodeId) => {
    generationError.value = ''
    generationSuccess.value = ''
    if (!nodeId) isContextDrawerOpen.value = false
    else if (options.isCompact.value) {
      isResourceOpen.value = false
      isContextDrawerOpen.value = true
    }
  })

  watch(options.isCompact, (isCompact) => {
    if (!isCompact) isContextDrawerOpen.value = false
  })

  if (getCurrentInstance()) onBeforeUnmount(stopResourcePolling)

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
    selectedQuota,
    latestTask,
    visibleError,
    generationError,
    generationSuccess,
    openResources,
    closeResources,
    restoreResourceFocus,
    closeContext,
    setPanelWidth,
    insertAsset,
    uploadAsset,
    captureTemplate,
    instantiateTemplate,
    generate,
    updatePrompt,
  }
}
