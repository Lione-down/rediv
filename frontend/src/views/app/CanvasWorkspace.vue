<script setup lang="ts">
import { CircleCheck, CircleHelp, History, LoaderCircle } from 'lucide-vue-next'
import { darkTheme, NConfigProvider, NDrawer, NDrawerContent } from 'naive-ui'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { v2CanvasNaiveTheme } from '../../assets/styles/v2-canvas-naive-theme'
import CanvasAssetPanel from '../../components/canvas/CanvasAssetPanel.vue'
import CanvasContextPanel from '../../components/canvas/CanvasContextPanel.vue'
import CanvasIdentityBar from '../../components/canvas/CanvasIdentityBar.vue'
import CanvasProfessionalActionPalette from '../../components/canvas/CanvasProfessionalActionPalette.vue'
import CanvasRevisionPanel from '../../components/canvas/CanvasRevisionPanel.vue'
import CanvasResultCompareTray from '../../components/canvas/CanvasResultCompareTray.vue'
import CanvasStage from '../../components/canvas/CanvasStage.vue'
import CanvasStoryboardView from '../../components/canvas/CanvasStoryboardView.vue'
import CanvasViewModeSwitch, { type CanvasViewMode } from '../../components/canvas/CanvasViewModeSwitch.vue'
import AccountSessionMenu from '../../components/layout/account-session-menu.vue'
import { resolveCanvasNodeContinuationTrigger } from '../../components/canvas/canvas-node-continuation-trigger'
import { resolveGenerationResultVariants } from '../../modules/canvas/generation-lineage'
import { useCanvasNodeActions } from '../../components/canvas/composables/use-canvas-node-actions'
import { useCanvasPersistenceLifecycle } from '../../components/canvas/composables/use-canvas-persistence-lifecycle'
import { useCanvasProfessionalActions } from '../../components/canvas/composables/use-canvas-professional-actions'
import { useCanvasImageOperations } from '../../components/canvas/composables/use-canvas-image-operations'
import { useCanvasScriptGeneration } from '../../components/canvas/composables/use-canvas-script-generation'
import { useCanvasResourceExperience } from '../../components/canvas/composables/use-canvas-resource-experience'
import { useCanvasStoryboardRecipes } from '../../components/canvas/composables/use-canvas-storyboard-recipes'
import { useCanvasListStore } from '../../modules/canvas/canvas-list-store'
import { useCanvasRevisionStore } from '../../modules/canvas/canvas-revision-store'
import { canvasRouteLocation, normalizeRouteIdentifier } from '../../modules/canvas/metadata'
import { useProjectStore } from '../../modules/project/store'
import { useAuthStore } from '../../store/auth'
import { useCanvasStore } from '../../store/canvas'
import { createArrangeGenerationLineageCommand } from '../../modules/canvas/generation-lineage-arrangement'
import { resolveGenerationInputLineageBridges } from '../../modules/canvas/generation-input-lineage'
import { projectCanvasStoryboard } from '../../modules/canvas/storyboard-projection'
import { createReorderStoryboardGroupCommand } from '../../modules/canvas/storyboard-commands'
import { resolveOwnedMediaActionTarget } from '../../modules/canvas/professional-action-registry'
import type { ScriptAuthoringIntent } from '../../modules/canvas/script-authoring'
import type { ProjectAsset } from '../../modules/canvas/project-resource-types'

type MoveDirection = -1 | 1
interface CanvasStageHandle { arrangeSelectedProvenanceTrace: () => boolean; closeTransientInteractions: () => void; fitSelectedProvenanceTrace: () => boolean; openSelectedContinuation: () => void; revealNode: (nodeId: string) => boolean }
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()
const canvasListStore = useCanvasListStore()
const canvasDocumentStore = useCanvasStore()
const canvasRevisionStore = useCanvasRevisionStore()
const CanvasWorkflowBatchOverlay = defineAsyncComponent(() => import('../../components/canvas/CanvasWorkflowBatchOverlay.vue'))
const CanvasVideoEditPreflightOverlay = defineAsyncComponent(() => import('../../components/canvas/CanvasVideoEditPreflightOverlay.vue'))
const CanvasAudioGenerationPreflightOverlay = defineAsyncComponent(() => import('../../components/canvas/CanvasAudioGenerationPreflightOverlay.vue'))
const CanvasAgentSkillPreflightOverlay = defineAsyncComponent(() => import('../../components/canvas/CanvasAgentSkillPreflightOverlay.vue'))
useCanvasPersistenceLifecycle()
const isReviewOnly = ref(false)
const isCompact = ref(false)
const viewMode = ref<CanvasViewMode>('workflow')
const isRevisionPanelOpen = ref(false)
const isResultCompareOpen = ref(false)
const workflowBatchOpen = ref(false)
const videoEditPreflightOpen = ref(false)
const audioGenerationPreflightOpen = ref(false)
const agentSkillPreflightOpen = ref(false)
const scriptAuthoringIntent = ref<ScriptAuthoringIntent | null>(null)
const revisionTriggerRef = ref<HTMLButtonElement | null>(null)
const canvasStageRef = ref<CanvasStageHandle | null>(null)
const isStageContextSurfaceOpen = ref(false)
let revisionPanelOpener: HTMLElement | null = null
let videoEditPreflightOpener: HTMLElement | null = null
let reviewMediaQuery: MediaQueryList | null = null
let compactMediaQuery: MediaQueryList | null = null
const projectId = computed(() => normalizeRouteIdentifier(route.params.projectId))
const canvasId = computed(() => normalizeRouteIdentifier(route.params.canvasId))
const activeCanvas = computed(() => (
  canvasListStore.items.find((canvas) => canvas.id === canvasId.value) ?? null
))
const projectName = computed(() => (
  projectStore.items.find((project) => project.id === projectId.value)?.name ?? 'Revid 项目'
))
const accountName = computed(() => authStore.user?.nickname || authStore.user?.username || '个人空间')
const syncLabel = computed(() => {
  if (canvasDocumentStore.saveState === 'conflict') {
    return `保存冲突 · server r${canvasDocumentStore.conflictRevision ?? canvasDocumentStore.graphRevision}`
  }
  if (canvasDocumentStore.saveState === 'error') {
    return canvasDocumentStore.canRetryAutosave
      ? '画布未保存，点击重试'
      : canvasDocumentStore.saveError || '检测到本地恢复副本'
  }
  if (canvasDocumentStore.saveState === 'saving') return '正在保存画布'
  if (canvasDocumentStore.isViewportSaving) return '正在保存视口'
  if (canvasListStore.isMutating) return '正在保存画布'
  if (canvasListStore.mutationError) return '画布需要恢复'
  return `画布已同步 · r${canvasDocumentStore.graphRevision}`
})
const syncTone = computed(() => {
  if (canvasDocumentStore.saveState === 'conflict') return 'conflict'
  if (canvasListStore.mutationError || canvasDocumentStore.saveState === 'error') return 'error'
  if (
    canvasListStore.isMutating || canvasDocumentStore.isViewportSaving ||
    canvasDocumentStore.saveState === 'saving'
  ) return 'saving'
  return 'saved'
})
const hasDetectedRecovery = computed(() => (
  canvasDocumentStore.hasLocalRecovery &&
  canvasDocumentStore.saveState === 'error' &&
  !canvasDocumentStore.canRetryAutosave
))
const syncIcon = computed(() => {
  if (syncTone.value === 'error' || syncTone.value === 'conflict') return CircleHelp
  if (syncTone.value === 'saving') return LoaderCircle
  return CircleCheck
})
const {
  resourceStore,
  activeTab,
  panelWidth,
  isResourceOpen,
  resourceIntent,
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
  generationRuntimePresentations, pendingGenerationResults,
  latestTask,
  visibleError,
  generationError,
  generationSuccess,
  foregroundResultNodeId,
  openResources,
  closeResources,
  restoreResourceFocus,
  closeContext,
  selectNodeForCanvasLocation,
  setPanelWidth,
  getInsertionPoint,
  insertAsset,
  uploadAsset,
  captureVideoFrame,
  splitImageGrid,
  captureTemplate,
  instantiateTemplate,
  generate,
  generateRecipe,
  updatePrompt,
  updateGenerationParameters,
} = useCanvasResourceExperience({ projectId, canvasId, isCompact, isReviewOnly })
const scriptGeneration = useCanvasScriptGeneration({
  canvasId,
  generationCapabilities,
  isReviewOnly,
  projectId,
})
const composerAttachments = ref<ProjectAsset[]>([])
const scriptCapability = computed(() => generationCapabilities.value?.text ?? null)
const composerCapabilityError = computed(() => {
  if (isGenerationCapabilitiesLoading.value) return ''
  if (generationCapabilitiesError.value) return generationCapabilitiesError.value
  if (generationCapabilities.value && !generationCapabilities.value.text) {
    return '脚本模型未就绪，请重启本地服务后重试。'
  }
  return ''
})

function openComposerResources(opener: HTMLElement) {
  activateContextSurface('resources')
  openResources(opener, 'attach')
}

function openCanvasResources(opener: HTMLElement, tab: 'assets' | 'templates' | 'tasks' = 'assets') {
  activateContextSurface('resources')
  openResources(opener, 'insert', tab)
}

function attachComposerAsset(asset: ProjectAsset) {
  if (asset.project_id !== projectId.value) return
  if (composerAttachments.value.some((item) => item.id === asset.id)) {
    closeResources()
    return
  }
  composerAttachments.value = [...composerAttachments.value, asset].slice(0, 8)
  closeResources()
}

watch([projectId, canvasId], () => { composerAttachments.value = [] })

function removeComposerAttachment(assetId: string) {
  composerAttachments.value = composerAttachments.value.filter((asset) => asset.id !== assetId)
}

async function submitMainComposerScript(brief: string) {
  scriptAuthoringIntent.value = 'script_draft'
  await scriptGeneration.generate({
    intent: 'script_draft',
    locale: scriptCapability.value?.defaultLocale ?? 'zh-CN',
    value: brief,
    replace: false,
    referenceAssetIds: composerAttachments.value.map((asset) => asset.id),
  })
  if (scriptGeneration.success.value) scriptAuthoringIntent.value = null
}
const { branchFromResult, branchVisualRecipe, reorderGenerationInput } = useCanvasNodeActions({ isReviewOnly, selectedNode, revealNode: (nodeId) => canvasStageRef.value?.revealNode(nodeId) })
const { createCinematicShotGraph, createShotGraph, createStoryboardRecipe, createVisualAssetRecipe } = useCanvasStoryboardRecipes({
  assets: () => resourceStore.assets,
  branchVisualRecipe,
  canvasId,
  generateVisualRecipe: generateRecipe,
  projectId,
  userId: () => authStore.user?.id ?? '',
})
const { createImageOperation } = useCanvasImageOperations({
  assets: () => resourceStore.assets, canvasId, generationCapabilities, projectId,
  revealNode: (nodeId) => canvasStageRef.value?.revealNode(nodeId),
  userId: () => authStore.user?.id ?? '',
})
function openWorkflowBatch() {
  activateContextSurface('workflow-batch')
  workflowBatchOpen.value = true
}
function closeWorkflowBatch() {
  workflowBatchOpen.value = false
}
function openVideoEditPreflight(opener?: HTMLElement) {
  activateContextSurface('video-preflight')
  videoEditPreflightOpener = opener ?? null
  videoEditPreflightOpen.value = true
}
function closeVideoEditPreflight() {
  videoEditPreflightOpen.value = false
  const focusTarget = canRestoreFocus(videoEditPreflightOpener)
    ? videoEditPreflightOpener
    : null
  videoEditPreflightOpener = null
  void nextTick(() => focusTarget?.focus({ preventScroll: true }))
}
function openAudioGenerationPreflight() {
  activateContextSurface('audio-preflight')
  audioGenerationPreflightOpen.value = true
}
function closeAudioGenerationPreflight() {
  audioGenerationPreflightOpen.value = false
}
function openAgentSkillPreflight() {
  activateContextSurface('agent-skill')
  agentSkillPreflightOpen.value = true
}
function closeAgentSkillPreflight() {
  agentSkillPreflightOpen.value = false
}
function openScriptAuthoring(intent: ScriptAuthoringIntent) {
  activateContextSurface('context')
  scriptAuthoringIntent.value = null
  if (isCompact.value) isContextDrawerOpen.value = true
  void nextTick(() => { scriptAuthoringIntent.value = intent })
}
const professionalActionsBlocked = computed(() => (
  isRevisionPanelOpen.value || isResultCompareOpen.value || isResourceOpen.value ||
  isContextDrawerOpen.value || workflowBatchOpen.value || videoEditPreflightOpen.value || audioGenerationPreflightOpen.value || agentSkillPreflightOpen.value || viewMode.value !== 'workflow'
))
const {
  actions: professionalActions,
  availableActionIds: professionalActionIds,
  close: closeProfessionalActions,
  error: professionalActionError,
  execute: executeProfessionalAction,
  isOpen: professionalActionsOpen,
  open: openProfessionalActions,
  query: professionalActionQuery,
} = useCanvasProfessionalActions({
  assets: () => resourceStore.assets,
  canvasId,
  createShotGraph,
  createCinematicShotGraph,
  createImageOperation,
  createStoryboardRecipe,
  getInsertionPoint,
  imageOperationCapabilities: () => generationCapabilities.value?.image.operations ?? null,
  isBlocked: () => professionalActionsBlocked.value,
  isBusy: () => isUploading.value || isGenerating.value,
  isReadOnly: () => isReviewOnly.value || canvasRevisionStore.restoringRevision !== null,
  isWorkflowView: () => viewMode.value === 'workflow',
  openAgentSkillPreflight,
  openAudioGenerationPreflight,
  openScriptAuthoring,
  projectId,
  openWorkflowBatch,
  openVideoEditPreflight,
  splitImageGrid,
  userId: () => authStore.user?.id ?? '',
})
type CanvasContextSurface =
  | 'agent-skill'
  | 'audio-preflight'
  | 'compare'
  | 'context'
  | 'professional'
  | 'resources'
  | 'revision'
  | 'stage'
  | 'video-preflight'
  | 'workflow-batch'

function activateContextSurface(next: CanvasContextSurface) {
  if (next !== 'stage') canvasStageRef.value?.closeTransientInteractions()
  if (next !== 'professional') closeProfessionalActions()
  if (next !== 'resources') closeResources(false)
  if (next !== 'context') isContextDrawerOpen.value = false
  if (next !== 'revision') {
    isRevisionPanelOpen.value = false
    revisionPanelOpener = null
  }
  if (next !== 'compare') isResultCompareOpen.value = false
  if (next !== 'workflow-batch') workflowBatchOpen.value = false
  if (next !== 'video-preflight') {
    videoEditPreflightOpen.value = false
    videoEditPreflightOpener = null
  }
  if (next !== 'audio-preflight') audioGenerationPreflightOpen.value = false
  if (next !== 'agent-skill') agentSkillPreflightOpen.value = false
}

function openProfessionalActionsExclusive(opener: HTMLElement, initialQuery = '') {
  activateContextSurface('professional')
  openProfessionalActions(opener, initialQuery)
}
const isDesktopContextVisible = computed(() => (
  isDesktopContextOpen.value &&
  !isStageContextSurfaceOpen.value &&
  !professionalActionsOpen.value &&
  !isRevisionPanelOpen.value &&
  !isResultCompareOpen.value &&
  !workflowBatchOpen.value &&
  !videoEditPreflightOpen.value &&
  !audioGenerationPreflightOpen.value &&
  !agentSkillPreflightOpen.value
))
const EMPTY_PROFESSIONAL_ACTION_IDS: readonly string[] = Object.freeze([])
const mediaActionTarget = computed(() => {
  const selectedNodeIds = canvasDocumentStore.selectedNodeIds
  const selectedNode = selectedNodeIds.length === 1
    ? canvasDocumentStore.findNodeById(selectedNodeIds[0])
    : null
  return resolveOwnedMediaActionTarget({
    assets: resourceStore.assets,
    projectId: projectId.value,
    selectedNodes: selectedNode ? [selectedNode] : [],
    userId: authStore.user?.id ?? '',
  })
})
const mediaProfessionalActionIds = computed(() => (
  mediaActionTarget.value ? professionalActionIds.value : EMPTY_PROFESSIONAL_ACTION_IDS
))
const storyboardItems = computed(() => projectCanvasStoryboard({
  nodes: canvasDocumentStore.nodes,
  connections: canvasDocumentStore.connections,
  runtimePresentations: generationRuntimePresentations.value,
}))

const canvasViewportInsets = computed(() => ({ top: 96, right: isCompact.value && isContextDrawerOpen.value ? 376 : 16, bottom: 96, left: 16 }))
async function captureSelectedVideoFrame(nodeId: string, file: File, timeSeconds: number, aspectRatio: number) {
  const insertedNodeId = await captureVideoFrame(nodeId, file, timeSeconds, aspectRatio)
  if (insertedNodeId) await nextTick(() => canvasStageRef.value?.revealNode(insertedNodeId))
}
const selectedContinuationTrigger = computed(() => resolveCanvasNodeContinuationTrigger(canvasDocumentStore.nodes, canvasDocumentStore.selectedNodeIds, isReviewOnly.value || canvasRevisionStore.restoringRevision !== null))
const canFitProvenanceTrace = computed(() => Boolean(
  selectedResultLineage.value || (selectedNode.value && selectedMediaType.value && (
    selectedGenerationContext.value?.provenance.length ||
    resolveGenerationResultVariants(selectedNode.value, canvasDocumentStore.nodes, canvasDocumentStore.connections).length
  )),
))
const selectedGenerationInputLineage = computed(() => (
  selectedNode.value && selectedMediaType.value
    ? resolveGenerationInputLineageBridges(
        selectedNode.value, canvasDocumentStore.nodes, canvasDocumentStore.connections,
      )
    : []
))
const selectedGenerationVariants = computed(() => (
  selectedNode.value && selectedMediaType.value
    ? resolveGenerationResultVariants(selectedNode.value, canvasDocumentStore.nodes, canvasDocumentStore.connections)
    : []
))
const canArrangeProvenanceTrace = computed(() => Boolean(
  !isReviewOnly.value && selectedNode.value && createArrangeGenerationLineageCommand(
    canvasDocumentStore.nodes, canvasDocumentStore.connections, selectedNode.value.id,
  ),
))
let isDrawerContinuationPending = false
let isDrawerTraceArrangePending = false
let isDrawerTraceFitPending = false
let drawerLocateNodeId = ''

function continueFromContextDrawer() { isDrawerContinuationPending = true; isContextDrawerOpen.value = false }
function arrangeTraceFromContextDrawer() { isDrawerTraceArrangePending = true; isContextDrawerOpen.value = false }
function fitTraceFromContextDrawer() { isDrawerTraceFitPending = true; isContextDrawerOpen.value = false }
function locateNodeFromContext(nodeId: string) {
  if (isCompact.value) { drawerLocateNodeId = nodeId; isContextDrawerOpen.value = false; return }
  if (selectNodeForCanvasLocation(nodeId)) void nextTick(() => canvasStageRef.value?.revealNode(nodeId))
}
function handleContextDrawerAfterLeave() {
  if (isDrawerContinuationPending) { isDrawerContinuationPending = false; canvasStageRef.value?.openSelectedContinuation() }
  if (isDrawerTraceArrangePending) { isDrawerTraceArrangePending = false; canvasStageRef.value?.arrangeSelectedProvenanceTrace() }
  if (isDrawerTraceFitPending) { isDrawerTraceFitPending = false; canvasStageRef.value?.fitSelectedProvenanceTrace() }
  if (drawerLocateNodeId) {
    const nodeId = drawerLocateNodeId
    drawerLocateNodeId = ''
    if (selectNodeForCanvasLocation(nodeId)) void nextTick(() => canvasStageRef.value?.revealNode(nodeId))
  }
}

const comparisonVariants = computed(() => selectedResultLineage.value?.variants ?? selectedGenerationVariants.value)
const comparisonOriginTitle = computed(() => selectedResultLineage.value?.generationTitle ?? selectedNode.value?.title ?? '')
const comparisonItems = computed(() => comparisonVariants.value.flatMap((variant) => {
  const node = canvasDocumentStore.findNodeById(variant.nodeId)
  return node ? [{ node, order: variant.order, isSelected: variant.isSelected }] : []
}))
const compareTrayStyle = computed(() => ({ '--compare-left': isResourceOpen.value && !isCompact.value ? `${panelWidth.value + 16}px` : '16px', '--compare-right': isDesktopContextOpen.value ? '376px' : '16px' }))

function openResultComparison() {
  if (comparisonItems.value.length <= 1) return
  activateContextSurface('compare')
  isResultCompareOpen.value = true
}

function closeResultComparison() { isResultCompareOpen.value = false }

function setViewMode(mode: CanvasViewMode) {
  if (viewMode.value === mode) return
  if (mode === 'storyboard') {
    canvasStageRef.value?.closeTransientInteractions()
    closeResources(false)
    closeResultComparison()
    isRevisionPanelOpen.value = false
  }
  viewMode.value = mode
}

function selectStoryboardNode(nodeId: string) {
  if (canvasDocumentStore.findNodeById(nodeId)) canvasDocumentStore.selectNode(nodeId)
}

function reorderStoryboardItem(groupId: string, nodeId: string, direction: -1 | 1) {
  if (isReviewOnly.value) return
  const command = createReorderStoryboardGroupCommand(canvasDocumentStore.nodes, groupId, nodeId, direction)
  if (command) void canvasDocumentStore.dispatchCommand({ source: 'toolbar', command }).catch(() => undefined)
}

function selectComparedResult(nodeId: string) {
  isResultCompareOpen.value = false
  canvasDocumentStore.selectNode(nodeId)
  void nextTick(() => canvasStageRef.value?.revealNode(nodeId))
}
function updateResponsiveBoundaries() {
  isReviewOnly.value = reviewMediaQuery?.matches ?? false
  isCompact.value = compactMediaQuery?.matches ?? false
}

async function loadWorkspaceContext(nextProjectId: string, nextCanvasId: string) {
  if (!nextProjectId || !nextCanvasId) return
  await Promise.allSettled([
    canvasListStore.loadCanvases(nextProjectId),
    projectStore.loadProjects(),
    canvasDocumentStore.loadCanvas(nextProjectId, nextCanvasId),
  ])
}

async function navigateToCanvas(nextCanvasId: string) {
  const nextCanvas = canvasListStore.items.find((canvas) => canvas.id === nextCanvasId)
  if (!projectId.value || !nextCanvas) return
  if (nextCanvas.id === canvasId.value) {
    canvasListStore.rememberCanvas(projectId.value, nextCanvas.id)
    return
  }
  await router.push(canvasRouteLocation(projectId.value, nextCanvas.id))
  canvasListStore.rememberCanvas(projectId.value, nextCanvas.id)
}

async function createCanvas(name: string) {
  const created = await canvasListStore.createCanvas(projectId.value, name)
  await navigateToCanvas(created.id)
}

async function renameCanvas(targetCanvasId: string, name: string) {
  await canvasListStore.renameCanvas(projectId.value, targetCanvasId, name)
}

async function moveCanvas(targetCanvasId: string, direction: MoveDirection) {
  const currentIndex = canvasListStore.items.findIndex((canvas) => canvas.id === targetCanvasId)
  const nextIndex = currentIndex + direction
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= canvasListStore.items.length) return
  const orderedIds = canvasListStore.items.map((canvas) => canvas.id)
  ;[orderedIds[currentIndex], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[currentIndex]]
  await canvasListStore.reorderCanvases(projectId.value, orderedIds)
}

async function duplicateCanvas(targetCanvasId: string, name: string) {
  const duplicated = await canvasListStore.duplicateCanvas(projectId.value, targetCanvasId, name)
  await navigateToCanvas(duplicated.id)
}

async function archiveCanvas(targetCanvasId: string) {
  await canvasListStore.archiveCanvas(projectId.value, targetCanvasId)
  const fallback = canvasListStore.items[0]
  if (fallback && targetCanvasId === canvasId.value) await navigateToCanvas(fallback.id)
}

async function retryCanvasList() {
  await canvasListStore.loadCanvases(projectId.value, true)
  const resolved = canvasListStore.items.find((canvas) => canvas.id === canvasId.value) ?? canvasListStore.items[0]
  if (resolved) await navigateToCanvas(resolved.id)
}

async function retryCanvasState(event?: MouseEvent) {
  if (hasDetectedRecovery.value) {
    openRevisionPanel(event)
    return
  }
  const operations: Promise<unknown>[] = [canvasListStore.loadCanvases(projectId.value, true)]
  if (canvasDocumentStore.saveState === 'error') operations.push(canvasDocumentStore.retryAutosave())
  else operations.push(canvasDocumentStore.reloadActiveDocument())
  await Promise.allSettled(operations)
}

function openRevisionPanel(event?: Event | HTMLElement) {
  const opener = event instanceof HTMLElement ? event : event?.currentTarget
  if (!isRevisionPanelOpen.value) {
    activateContextSurface('revision')
    revisionPanelOpener = opener instanceof HTMLElement ? opener : null
  }
  isRevisionPanelOpen.value = true
}

function canRestoreFocus(element: HTMLElement | null) {
  if (!element?.isConnected || element.getAttribute('aria-disabled') === 'true') return false
  return !(element instanceof HTMLButtonElement && element.disabled)
}

function closeRevisionPanel() {
  isRevisionPanelOpen.value = false
  const focusTarget = canRestoreFocus(revisionPanelOpener)
    ? revisionPanelOpener
    : revisionTriggerRef.value
  revisionPanelOpener = null
  void nextTick(() => focusTarget?.focus({ preventScroll: true }))
}

function retryProjectResources() {
  void resourceStore.refresh().catch(() => undefined)
}

function updateResourceDrawer(show: boolean) {
  if (!show) closeResources(false)
}

function updateContextDrawer(show: boolean) {
  if (!show) closeContext()
}

function dismissContextDrawer() {
  isContextDrawerOpen.value = false
}

watch([projectId, canvasId], ([nextProjectId, nextCanvasId]) => {
  isResultCompareOpen.value = false
  viewMode.value = 'workflow'
  void loadWorkspaceContext(nextProjectId, nextCanvasId)
}, { immediate: true })

watch([projectId, canvasId], ([nextProjectId, nextCanvasId]) => {
  if (nextProjectId && nextCanvasId) canvasListStore.rememberCanvas(nextProjectId, nextCanvasId)
}, { immediate: true })

watch(() => canvasDocumentStore.saveState, (state) => {
  if (state === 'conflict') openRevisionPanel()
})

watch(foregroundResultNodeId, (nodeId) => {
  if (nodeId) void nextTick(() => canvasStageRef.value?.revealNode(nodeId))
})

onMounted(() => {
  reviewMediaQuery = window.matchMedia('(max-width: 767px)')
  compactMediaQuery = window.matchMedia('(max-width: 1023px)')
  updateResponsiveBoundaries()
  reviewMediaQuery.addEventListener('change', updateResponsiveBoundaries)
  compactMediaQuery.addEventListener('change', updateResponsiveBoundaries)
})

onBeforeUnmount(() => {
  reviewMediaQuery?.removeEventListener('change', updateResponsiveBoundaries)
  compactMediaQuery?.removeEventListener('change', updateResponsiveBoundaries)
  reviewMediaQuery = null
  compactMediaQuery = null
})
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="v2CanvasNaiveTheme">
    <div
      class="v2-canvas-theme canvas-workspace"
      :class="{
        'is-review-only': isReviewOnly,
        'is-storyboard-mode': viewMode === 'storyboard',
        'has-resource-panel': isResourceOpen && !isCompact,
        'has-context-panel': isDesktopContextOpen,
      }"
      :style="{ '--resource-panel-width': `${panelWidth}px` }"
    >
      <a class="skip-link" href="#canvas-main">跳到画布内容</a>

      <div v-show="viewMode === 'workflow'" class="canvas-layer" :aria-hidden="viewMode !== 'workflow'">
        <CanvasStage
          ref="canvasStageRef"
          :action-error="visibleError"
          :capture-pending="isUploading"
          :readonly="isReviewOnly || canvasRevisionStore.restoringRevision !== null"
          :context-overlay-open="isContextDrawerOpen && isCompact"
          :professional-actions-blocked="professionalActionsOpen || professionalActionsBlocked"
          :professional-action-ids="mediaProfessionalActionIds"
          :media-action-target="mediaActionTarget"
          :generation-runtime-presentations="generationRuntimePresentations" :pending-generation-results="pendingGenerationResults"
          :resources-open="isResourceOpen"
          :composer-attachments="composerAttachments"
          :composer-busy="scriptGeneration.active.value"
          :composer-capability-error="composerCapabilityError"
          :composer-capability-loading="isGenerationCapabilitiesLoading"
          :composer-model-id="scriptCapability?.model ?? ''"
          :composer-model-label="scriptCapability?.modelLabel ?? ''"
          :viewport-insets="canvasViewportInsets"
          @activate-context-surface="activateContextSurface('stage')"
          @context-surface-state="isStageContextSurfaceOpen = $event"
          @open-composer-resources="openComposerResources"
          @open-resources="openCanvasResources"
          @open-video-edit-preflight="openVideoEditPreflight"
          @open-professional-actions="openProfessionalActionsExclusive"
          @open-revisions="openRevisionPanel"
          @capture-video-frame="captureSelectedVideoFrame"
          @remove-composer-attachment="removeComposerAttachment"
          @retry-capabilities="reloadGenerationCapabilities"
          @submit-script="submitMainComposerScript"
        />
      </div>

      <CanvasProfessionalActionPalette
        v-if="professionalActionsOpen"
        :actions="professionalActions"
        :error="professionalActionError"
        :query="professionalActionQuery"
        @close="closeProfessionalActions"
        @select="executeProfessionalAction"
        @update:query="professionalActionQuery = $event"
      />

      <CanvasWorkflowBatchOverlay
        v-if="workflowBatchOpen"
        :canvas-id="canvasId"
        :capabilities="generationCapabilities"
        :is-review-only="isReviewOnly"
        :project-id="projectId"
        @close="closeWorkflowBatch"
      />

      <CanvasVideoEditPreflightOverlay
        v-if="videoEditPreflightOpen"
        :assets="resourceStore.assets"
        :canvas-id="canvasId"
        :is-review-only="isReviewOnly"
        :project-id="projectId"
        @close="closeVideoEditPreflight"
      />

      <CanvasAudioGenerationPreflightOverlay
        v-if="audioGenerationPreflightOpen"
        :assets="resourceStore.assets"
        :capabilities="generationCapabilities"
        :canvas-id="canvasId"
        :is-review-only="isReviewOnly"
        :project-id="projectId"
        @close="closeAudioGenerationPreflight"
      />

      <CanvasAgentSkillPreflightOverlay
        v-if="agentSkillPreflightOpen"
        :canvas-id="canvasId"
        :is-review-only="isReviewOnly"
        :project-id="projectId"
        @close="closeAgentSkillPreflight"
      />

      <header class="route-chrome" aria-label="Canvas route controls">
        <CanvasIdentityBar
          :project-name="projectName"
          :active-canvas="activeCanvas"
          :canvases="canvasListStore.items"
          :can-edit="!isReviewOnly && canvasRevisionStore.restoringRevision === null"
          :is-loading="canvasListStore.isLoading"
          :is-mutating="canvasListStore.isMutating"
          :mutation-error="canvasListStore.mutationError"
          :on-switch="navigateToCanvas"
          :on-create="createCanvas"
          :on-rename="renameCanvas"
          :on-move="moveCanvas"
          :on-duplicate="duplicateCanvas"
          :on-archive="archiveCanvas"
          :on-retry="retryCanvasList"
        />

        <div class="route-status">
          <button
            ref="revisionTriggerRef"
            type="button"
            class="revision-trigger"
            aria-label="打开修订历史"
            title="修订历史"
            :aria-expanded="isRevisionPanelOpen"
            @click="openRevisionPanel"
          >
            <History :size="17" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="sync-status"
            :class="`is-${syncTone}`"
            :disabled="!canvasListStore.mutationError && !canvasDocumentStore.canRetryAutosave && !hasDetectedRecovery"
            :aria-label="hasDetectedRecovery ? `${syncLabel}，打开恢复选项` : (canvasListStore.mutationError || canvasDocumentStore.canRetryAutosave ? `${syncLabel}，重试同步` : syncLabel)"
            @click="retryCanvasState"
          >
            <component :is="syncIcon" :size="16" aria-hidden="true" />
            <span>{{ syncLabel }}</span>
          </button>
          <AccountSessionMenu :compact="isCompact" :display-name="accountName" />
        </div>
      </header>

      <CanvasViewModeSwitch class="workspace-view-switch" :model-value="viewMode" @update:model-value="setViewMode" />

      <div v-if="viewMode === 'storyboard'" class="storyboard-shell">
        <CanvasStoryboardView :items="storyboardItems" :nodes="canvasDocumentStore.nodes" :readonly="isReviewOnly" @reorder="reorderStoryboardItem" @select="selectStoryboardNode" />
      </div>

      <CanvasRevisionPanel
        v-if="isRevisionPanelOpen"
        :project-id="projectId"
        :canvas-id="canvasId"
        :readonly="isReviewOnly"
        @close="closeRevisionPanel"
      />

      <div v-if="isResourceOpen && !isCompact" class="resource-panel-shell">
        <CanvasAssetPanel
          v-model:active-tab="activeTab"
          :assets="resourceStore.assets"
          :asset-action="resourceIntent"
          :error="visibleError"
          :is-loading="resourceStore.isLoading"
          :is-uploading="isUploading"
          mode="panel"
          :panel-width="panelWidth"
          :readonly="isReviewOnly"
          :tasks="resourceStore.tasks"
          :templates="resourceStore.templates"
          @attach-asset="attachComposerAsset"
          @capture-template="captureTemplate"
          @close="closeResources"
          @insert-asset="insertAsset"
          @instantiate-template="instantiateTemplate"
          @resize="setPanelWidth"
          @retry="retryProjectResources"
          @upload="uploadAsset"
        />
      </div>

      <div v-if="selectedNode && isDesktopContextVisible" class="context-panel-shell">
        <CanvasContextPanel
          :allow-generation-execution="viewMode === 'workflow'"
          :can-arrange-trace="viewMode === 'workflow' && canArrangeProvenanceTrace"
          :can-fit-trace="viewMode === 'workflow' && canFitProvenanceTrace"
          :error="generationError"
          :is-generating="isGenerating"
          :latest-task="latestTask"
          :runtime-presentation="selectedRuntimePresentation"
          :generation-context="selectedGenerationContext"
          :generation-input-lineage="selectedGenerationInputLineage"
          :generation-tasks="resourceStore.tasks"
          :media-type="selectedMediaType"
          :project-id="projectId"
          :canvas-id="canvasId"
          :result-lineage="selectedResultLineage"
          mode="panel"
          :node="selectedNode"
          :output-variant-count="selectedGenerationVariants.length"
          :quota="selectedQuota"
          :readonly="isReviewOnly"
          :success="generationSuccess"
          :script-authoring-active="scriptGeneration.active.value"
          :script-authoring-capability="scriptGeneration.capability.value"
          :script-authoring-capability-error="composerCapabilityError"
          :script-authoring-capability-loading="isGenerationCapabilitiesLoading"
          :script-authoring-error="scriptGeneration.error.value"
          :script-authoring-intent="scriptAuthoringIntent"
          :script-authoring-success="scriptGeneration.success.value"
          :script-quota="authStore.quotas.text"
          @cancel-script-authoring="scriptGeneration.cancel"
          @generate-script="scriptGeneration.generate"
          @retry-script-capability="reloadGenerationCapabilities"
          @branch-generation="branchFromResult"
          @visual-recipe="createVisualAssetRecipe"
          @arrange-trace="canvasStageRef?.arrangeSelectedProvenanceTrace()"
          @close="closeContext"
          @compare-results="openResultComparison"
          @fit-trace="canvasStageRef?.fitSelectedProvenanceTrace()"
          @generate="generate"
          @locate-node="locateNodeFromContext"
          @reorder-input="reorderGenerationInput"
          @retry-recipe="generateRecipe"
          @update-prompt="updatePrompt"
          @update-parameters="updateGenerationParameters"
        />
      </div>

      <CanvasResultCompareTray
        v-if="isResultCompareOpen && comparisonItems.length > 1"
        :items="comparisonItems"
        :origin-title="comparisonOriginTitle"
        :style="compareTrayStyle"
        @close="closeResultComparison"
        @select="selectComparedResult"
      />

      <NDrawer
        :show="isResourceOpen && isCompact"
        placement="left"
        :width="isReviewOnly ? '100%' : 420"
        @after-leave="restoreResourceFocus"
        @update:show="updateResourceDrawer"
      >
        <NDrawerContent body-content-style="height: 100%; padding: 0;">
          <div class="v2-canvas-theme drawer-theme">
            <CanvasAssetPanel
              v-model:active-tab="activeTab"
              :assets="resourceStore.assets"
              :asset-action="resourceIntent"
              autofocus
              :error="visibleError"
              :is-loading="resourceStore.isLoading"
              :is-uploading="isUploading"
              mode="drawer"
              :readonly="isReviewOnly"
              :tasks="resourceStore.tasks"
              :templates="resourceStore.templates"
              @attach-asset="attachComposerAsset"
              @capture-template="captureTemplate"
              @close="closeResources"
              @insert-asset="insertAsset"
              @instantiate-template="instantiateTemplate"
              @retry="retryProjectResources"
              @upload="uploadAsset"
            />
          </div>
        </NDrawerContent>
      </NDrawer>

      <NDrawer
        :show="isContextDrawerOpen && isCompact && Boolean(selectedNode)"
        placement="right"
        :width="isReviewOnly ? '100%' : 360"
        @update:show="updateContextDrawer"
        @after-leave="handleContextDrawerAfterLeave"
      >
        <NDrawerContent body-content-style="height: 100%; padding: 0;">
          <div class="v2-canvas-theme drawer-theme">
            <CanvasContextPanel
              :allow-generation-execution="viewMode === 'workflow'"
              v-if="selectedNode"
              :can-arrange-trace="viewMode === 'workflow' && canArrangeProvenanceTrace"
              :can-continue="viewMode === 'workflow' && Boolean(selectedContinuationTrigger)"
              :can-fit-trace="viewMode === 'workflow' && canFitProvenanceTrace"
              :error="generationError"
              :is-generating="isGenerating"
              :latest-task="latestTask"
              :runtime-presentation="selectedRuntimePresentation"
              :generation-context="selectedGenerationContext"
              :generation-input-lineage="selectedGenerationInputLineage"
              :generation-tasks="resourceStore.tasks"
              :media-type="selectedMediaType"
              :project-id="projectId"
              :canvas-id="canvasId"
              :result-lineage="selectedResultLineage"
              mode="drawer"
              :node="selectedNode"
              :output-variant-count="selectedGenerationVariants.length"
              :quota="selectedQuota"
              :readonly="isReviewOnly"
              :success="generationSuccess"
              :script-authoring-active="scriptGeneration.active.value"
              :script-authoring-capability="scriptGeneration.capability.value"
              :script-authoring-capability-error="composerCapabilityError"
              :script-authoring-capability-loading="isGenerationCapabilitiesLoading"
              :script-authoring-error="scriptGeneration.error.value"
              :script-authoring-intent="scriptAuthoringIntent"
              :script-authoring-success="scriptGeneration.success.value"
              :script-quota="authStore.quotas.text"
              @cancel-script-authoring="scriptGeneration.cancel"
              @generate-script="scriptGeneration.generate"
              @retry-script-capability="reloadGenerationCapabilities"
              @branch-generation="branchFromResult"
              @visual-recipe="createVisualAssetRecipe"
              @arrange-trace="arrangeTraceFromContextDrawer"
              @close="dismissContextDrawer"
              @continue-node="continueFromContextDrawer"
              @compare-results="openResultComparison"
              @fit-trace="fitTraceFromContextDrawer"
              @generate="generate"
              @locate-node="locateNodeFromContext"
              @reorder-input="reorderGenerationInput"
              @retry-recipe="generateRecipe"
              @update-prompt="updatePrompt"
              @update-parameters="updateGenerationParameters"
            />
          </div>
        </NDrawerContent>
      </NDrawer>

      <main id="canvas-main" class="canvas-main" tabindex="-1" aria-label="Canvas 主内容">
        <p class="canvas-context">
          <span>{{ activeCanvas?.name || '画布' }}</span>
          <span aria-hidden="true">/</span>
          <span>Canvas document · r{{ canvasDocumentStore.graphRevision }}</span>
        </p>
      </main>

      <div v-if="isReviewOnly" class="review-boundary" role="status">
        <strong>浏览审阅模式</strong>
        <span>可平移、缩放和检查内容，编辑与画布管理操作已关闭。</span>
      </div>
    </div>
  </NConfigProvider>
</template>

<style scoped lang="scss" src="./canvas-workspace.scss"></style>
