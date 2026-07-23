<script setup lang="ts">
import { NDropdown } from 'naive-ui'
import { History, Keyboard, WandSparkles } from 'lucide-vue-next'
import { computed, nextTick, ref, watch, type ComponentPublicInstance } from 'vue'
import CanvasEmptyGuide from './CanvasEmptyGuide.vue'
import CanvasConnectionContinuation from './CanvasConnectionContinuation.vue'
import CanvasConnectionLayer from './CanvasConnectionLayer.vue'
import CanvasConnectionTargetPorts from './CanvasConnectionTargetPorts.vue'
import CanvasGraphAccessPanel from './CanvasGraphAccessPanel.vue'
import CanvasMediaToolbar from './CanvasMediaToolbar.vue'
import CanvasResultContinuationSurface from './CanvasResultContinuationSurface.vue'
import CanvasNodeSurfaceLayer from './CanvasNodeSurfaceLayer.vue'
import CanvasPendingGenerationLayer from './CanvasPendingGenerationLayer.vue'
import CanvasStoryboardNumberLayer from './CanvasStoryboardNumberLayer.vue'
import CanvasSelectionAggregate from './CanvasSelectionAggregate.vue'
import CanvasSelectionToolbar from './CanvasSelectionToolbar.vue'
import CanvasSelectionGenerationIntent from './CanvasSelectionGenerationIntent.vue'
import CanvasToolDock from './CanvasToolDock.vue'
import CanvasViewControls from './CanvasViewControls.vue'
import CanvasZoomControls from './CanvasZoomControls.vue'
import { getCanvasGridStyle } from './canvas-grid-presentation'
import {
  createWorkflowStarterCommand,
  type WorkflowStarterId,
} from './canvas-workflow-starters'
import {
  canvasNodeWorldRect,
  nodePortWorldAnchor,
  normalizeViewport,
  revealWorldRectViewport,
  surfaceToWorld,
  worldToSurface,
  type ViewportInsets,
} from './canvas-geometry'
import { useCanvasStage } from './composables/use-canvas-stage'
import { resolveGenerationContext } from '../../modules/canvas/generation-context'
import type { GenerationNodeParameters, ResolvedGenerationRequestContext } from '../../modules/canvas/generation-parameters'
import type { ScriptAuthoringCapabilities, ScriptAuthoringIntent, TextWorkflowMode } from '../../modules/canvas/script-authoring'
import type { ScriptGenerationSubmission } from './composables/use-canvas-script-generation'
import { getAuthoringConnectionPorts, getGenerationMediaType } from '../../modules/canvas/node-registry'
import { resolveGenerationResultVariants, resolveResultLineage, resultLineageProvenance, resultVariantProvenance } from '../../modules/canvas/generation-lineage'
import { moveSelectionGenerationInput, resolveSelectionGenerationIntent, type SelectionGenerationMoveDirection } from '../../modules/canvas/selection-generation'
import { resolveCanvasNodeContinuationTrigger } from './canvas-node-continuation-trigger'
import {
  CANVAS_CARD_WORK_SURFACE_HEIGHT_PX,
  CANVAS_CARD_WORK_SURFACE_WITH_REFERENCES_HEIGHT_PX,
  CANVAS_MEDIA_TOOLBAR_HEIGHT_PX,
  resolveCanvasMediaToolbarHorizontalPlacement,
  resolveCanvasMediaToolbarVerticalPlacement,
} from './canvas-media-toolbar-geometry'
import { resolveCapturedFrameProvenance } from '../../modules/canvas/captured-frame-provenance'
import { createArrangeGenerationLineageCommand } from '../../modules/canvas/generation-lineage-arrangement'
import { resolveGenerationInputLineageBridges } from '../../modules/canvas/generation-input-lineage'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import type { GenerationResultProjection } from '../../modules/canvas/generation-result-projection'
import type { OwnedMediaActionTarget } from '../../modules/canvas/professional-action-registry'
import type { ProjectAsset } from '../../modules/canvas/project-resource-types'
import type { CanvasNode } from '../../types/canvas'
import {
  createAddScriptReferenceAssetCommand,
  createUpdateScriptReferenceAssetsCommand,
} from '../../modules/canvas/script-reference-assets'
import { resolveCanvasCardWorkModel, type CanvasCardWorkModeId } from './canvas-card-work-model'
import { canBranchFromImageResult, type ResultBranchMediaType } from '../../modules/canvas/resource-commands'
import { createConnectNodesCommand, createRenameNodeCommand, createSetTextCardContentCommand } from '../../modules/canvas/canvas-commands'
import { useCanvasStoryboardGroups } from './composables/use-canvas-storyboard-groups'
const props = withDefaults(defineProps<{
  actionError?: string; capturePending?: boolean; contextOverlayOpen?: boolean; professionalActionsBlocked?: boolean; readonly?: boolean; resourcesOpen?: boolean
  cardWorkBusy?: boolean; cardWorkCanGenerate?: boolean; cardWorkError?: string; cardWorkHasSource?: boolean; cardWorkModelLabel?: string; cardWorkParameterSummary?: readonly string[]; cardWorkSourceCount?: number
  cardWorkGenerationContext?: ResolvedGenerationRequestContext | null
  composerAttachments?: readonly ProjectAsset[]; composerBusy?: boolean; composerCapabilityError?: string; composerCapabilityLoading?: boolean; composerModelId?: string; composerModelLabel?: string
  generationRuntimePresentations?: ReadonlyMap<string, GenerationRuntimePresentation>; pendingGenerationResults?: readonly GenerationResultProjection[]
  mediaActionTarget?: OwnedMediaActionTarget | null; professionalActionIds?: readonly string[]
  scriptAuthoringActive?: boolean; scriptAuthoringCapability?: ScriptAuthoringCapabilities | null; scriptAuthoringCapabilityError?: string; scriptAuthoringCapabilityLoading?: boolean; scriptAuthoringError?: string; scriptAuthoringIntent?: ScriptAuthoringIntent | null; scriptAuthoringSuccess?: string; scriptQuota?: number
  textGenerationErrors?: ReadonlyMap<string, string>
  textGenerationPendingNodeIds?: ReadonlySet<string>
  storyboardGenerationSummary?: string
  viewportInsets?: Partial<ViewportInsets>
}>(), {
  actionError: '', capturePending: false, contextOverlayOpen: false, professionalActionsBlocked: false, readonly: false, resourcesOpen: false,
  cardWorkBusy: false, cardWorkCanGenerate: false, cardWorkError: '', cardWorkHasSource: false, cardWorkModelLabel: '', cardWorkParameterSummary: () => [], cardWorkSourceCount: 0,
  cardWorkGenerationContext: null,
  composerAttachments: () => [], composerBusy: false, composerCapabilityError: '', composerCapabilityLoading: false, composerModelId: '', composerModelLabel: '',
  generationRuntimePresentations: () => new Map(), pendingGenerationResults: () => [],
  mediaActionTarget: null, professionalActionIds: () => [],
  scriptAuthoringActive: false, scriptAuthoringCapability: null, scriptAuthoringCapabilityError: '', scriptAuthoringCapabilityLoading: false, scriptAuthoringError: '', scriptAuthoringIntent: null, scriptAuthoringSuccess: '', scriptQuota: 0,
  textGenerationErrors: () => new Map(),
  textGenerationPendingNodeIds: () => new Set(),
  storyboardGenerationSummary: '',
  viewportInsets: () => ({}),
})
const emit = defineEmits<{
  activateContextSurface: []
  cardGenerate: [nodeId: string, prompt: string, mode: CanvasCardWorkModeId]
  cardOpenAssets: [nodeId: string, opener: HTMLElement]
  cardUpload: [nodeId: string, file: File]
  cardUpdateParameters: [parameters: GenerationNodeParameters]
  cancelScriptAuthoring: []
  openAudioGenerationPreflight: []
  captureVideoFrame: [nodeId: string, file: File, timeSeconds: number, aspectRatio: number]
  contextSurfaceState: [open: boolean]
  materializedCardPointerSelect: []
  openComposerResources: [opener: HTMLElement]
  openResources: [opener: HTMLElement, tab?: 'assets' | 'templates' | 'tasks']
  openVideoEditPreflight: [opener: HTMLElement]
  openProfessionalActions: [opener: HTMLElement, query?: string]
  openNodeDetails: []
  openRevisions: [opener: HTMLElement]
  removeComposerAttachment: [assetId: string]
  retryCapabilities: []
  branchResult: [mediaType: ResultBranchMediaType]
  submitScript: [brief: string]
  generateStoryboardGroup: [groupId: string]
  generateScript: [submission: ScriptGenerationSubmission]
  generateTextCard: [nodeId: string, prompt: string, mode: CanvasCardWorkModeId, modelId: string]
  retryScriptCapability: []
}>()
const graphPanelTriggerRef = ref<HTMLButtonElement | null>(null)
const textAuthoringNodeId = ref('')
const textWorkflow = ref<{ nodeId: string; mode: CanvasCardWorkModeId } | null>(null)
const cardReferenceTargetNodeId = ref('')
let cardReferenceCandidateSnapshot = ''
function restoreGraphPanelTriggerFocus() {
  void nextTick(() => graphPanelTriggerRef.value?.focus({ preventScroll: true }))
}
function forwardCapturedVideoFrame(nodeId: string, file: File, timeSeconds: number, aspectRatio: number) { emit('captureVideoFrame', nodeId, file, timeSeconds, aspectRatio) }

const {
  canvasStore,
  canvasSurfaceRef,
  cancelActiveInteraction,
  centerNodeInViewport,
  connectionPaths,
  connectionTargetPorts,
  connectionTargetStates,
  hiddenPresentationNodeIds,
  presentationConnections,
  presentationNodes,
  closeConnectionContinuation,
  connectionContinuation,
  continuationStyle,
  closeContextMenu,
  contextMenu,
  contextMenuOptions,
  handleContextMenuSelect,
  handleMinimapPointerDown,
  minimapNodeStyle,
  minimapNodes,
  minimapRef,
  minimapViewportStyle,
  openConnectionContinuation,
  stageRef,
  stageSize,
  statusBadgeStyle,
  statusIconMap,
  statusLabel,
  statusNodes,
  stageNotice,
  surfaceNodeRectStyle,
  temporaryConnectionPath,
  selectConnectionContinuation,
  updateContextMenuShow,
  marqueeStyle,
  viewportCursor,
  retryProjectLoad,
  selectNodeBehindOverlay,
  selectionAggregateHullStyle,
  selectionToolbarStyle,
  deleteSelection,
  duplicateSelection,
  canConnectSelection,
  canComposeGenerationSelection,
  canDeleteSelection,
  canDuplicateSelection,
  canGroupSelection,
  canUngroupSelection,
  canAlignSelection,
  canAutoArrange,
  canDistributeSelection,
  commandFeedback,
  closeGraphPanel,
  createNodeFromMenu,
  connectSelection,
  composeGenerationSelection,
  groupSelection,
  isGraphPanelOpen,
  isNodeMenuOpen,
  toggleGraphPanel,
  updateNodeMenuOpen,
  ungroupSelection,
  arrangeSelectionFromToolbar,
  autoArrange,
  toggleLockSelection,
  hasLockedSelection,
  areEdgesVisible,
  fitGraph,
  fitNodes,
  fitSelection,
  isGridEnabled,
  isMinimapVisible,
  setZoomPercent,
  toggleEdges,
  toggleGrid,
  toggleMinimap,
  zoomIn,
  zoomOut,
  zoomPercent,
} = useCanvasStage({
  getGenerationRuntimePresentations: () => props.generationRuntimePresentations,
  getMediaToolbarNodeId: () => props.mediaActionTarget?.nodeId ?? null,
  getViewportInsets: () => props.viewportInsets,
  isProfessionalActionsBlocked: () => props.professionalActionsBlocked,
  isReadOnly: () => props.readonly,
  onGraphPanelClosed: restoreGraphPanelTriggerFocus,
  onMaterializedCardPointerSelect: () => emit('materializedCardPointerSelect'),
  onOpenContextSurface: () => emit('activateContextSurface'),
  onOpenProfessionalActions: (opener) => emit('openProfessionalActions', opener),
})
const isStageContextSurfaceOpen = computed(() => (
  isNodeMenuOpen.value || isGraphPanelOpen.value || contextMenu.value.show
))
watch(isStageContextSurfaceOpen, (open) => emit('contextSurfaceState', open), { immediate: true })

const dismissedEmptyCanvasIds = ref<ReadonlySet<string>>(new Set())
const emptyMinimapRequestedCanvasIds = ref<ReadonlySet<string>>(new Set())
const isStartingWorkflow = ref(false)
const canvasGridStyle = computed(() => getCanvasGridStyle(canvasStore.viewport))
const mediaToolbarStyle = computed(() => {
  const target = props.mediaActionTarget
  if (
    !target || props.readonly || props.contextOverlayOpen ||
    canvasStore.selectedNodeIds.length !== 1 || canvasStore.selectedNodeIds[0] !== target.nodeId
  ) return null
  const node = presentationNodes.value.find((candidate) => candidate.id === target.nodeId) ??
    canvasStore.findNodeById(target.nodeId)
  if (!node) return null
  const style = surfaceNodeRectStyle(node)
  const left = Number.parseFloat(style.left)
  const nodeWidth = Number.parseFloat(style.width)
  const top = Number.parseFloat(style.top)
  const nodeHeight = Number.parseFloat(style.height)
  const toolbarHorizontal = resolveCanvasMediaToolbarHorizontalPlacement({
    insetLeft: props.viewportInsets.left,
    insetRight: props.viewportInsets.right,
    nodeLeft: left,
    nodeWidth,
    viewportWidth: stageRef.value?.clientWidth ?? window.innerWidth,
  })
  const showsAttachedWorkSurface = resolveCanvasCardWorkModel(node, {
    isReadOnly: props.readonly,
    isSelected: true,
  }).showsAttachedWorkSurface
  const context = props.cardWorkGenerationContext
  const hasReferenceRail = context?.mediaType === 'video' && context.capabilities?.contract_version === 6
    ? Boolean(context.videoReferences?.length)
    : Boolean(context?.mediaSources.some((source) => source.state === 'included'))
  const toolbarVertical = resolveCanvasMediaToolbarVerticalPlacement({
    composerHeight: showsAttachedWorkSurface
      ? hasReferenceRail
        ? CANVAS_CARD_WORK_SURFACE_WITH_REFERENCES_HEIGHT_PX
        : CANVAS_CARD_WORK_SURFACE_HEIGHT_PX
      : undefined,
    composerTop: showsAttachedWorkSurface
      ? top + nodeHeight + 16 * canvasStore.viewport.zoom
      : undefined,
    insetBottom: props.viewportInsets.bottom,
    insetTop: props.viewportInsets.top,
    nodeHeight,
    nodeTop: top,
    viewportHeight: stageRef.value?.clientHeight ?? window.innerHeight,
  })
  if (!toolbarVertical) return null
  return {
    ...style,
    left: `${toolbarHorizontal.left}px`,
    top: `${toolbarVertical.top}px`,
    width: `${toolbarHorizontal.width}px`,
    height: `${CANVAS_MEDIA_TOOLBAR_HEIGHT_PX}px`,
    '--canvas-media-toolbar-translate-y': '0px',
  }
})
const continuationTrigger = computed(() => resolveCanvasNodeContinuationTrigger(canvasStore.nodes, canvasStore.selectedNodeIds, props.readonly || props.contextOverlayOpen))
const resultContinuation = computed(() => {
  if (props.readonly || props.contextOverlayOpen || canvasStore.selectedNodeIds.length !== 1) return null
  const node = canvasStore.selectedNode
  return node && canBranchFromImageResult(node) ? node : null
})
const selectionGenerationIntent = computed(() => resolveSelectionGenerationIntent(canvasStore.selectedNodes))
const {
  canCreateStoryboardGroup,
  storyboardControls,
  convertStoryboardGroup,
  createStoryboardGroup,
  reorderStoryboardGroup,
  updateStoryboardGroup,
} = useCanvasStoryboardGroups()
const selectionGenerationSources = computed(() => {
  const intent = selectionGenerationIntent.value
  if (!intent) return []
  const byId = new Map(canvasStore.selectedNodes.map((node) => [node.id, node]))
  return intent.inputs.flatMap((input) => {
    const node = byId.get(input.nodeId)
    return node ? [{
      nodeId: node.id,
      role: `${input.kind === 'text' ? 'T' : 'R'}${input.order}`,
      title: node.title,
      canMoveUp: moveSelectionGenerationInput(canvasStore.selectedNodes, node.id, 'up') !== null,
      canMoveDown: moveSelectionGenerationInput(canvasStore.selectedNodes, node.id, 'down') !== null,
    }] : []
  })
})
const capturedFrameProvenance = computed(() => resolveCapturedFrameProvenance(canvasStore.selectedNode, canvasStore.nodes))
const capturedFrameSourceNode = computed(() => capturedFrameProvenance.value ? canvasStore.findNodeById(capturedFrameProvenance.value.sourceNodeId) : null)
const selectedResultLineage = computed(() => {
  if (canvasStore.selectedNodeIds.length !== 1 || !canvasStore.selectedNode) return null
  return resolveResultLineage(canvasStore.selectedNode, canvasStore.nodes, canvasStore.connections)
})
const selectedVersionStack = computed(() => {
  const lineage = selectedResultLineage.value
  const node = canvasStore.selectedNode
  return lineage && node && lineage.variants.length > 1 && node.type === 'result' &&
    (node.contentData?.subtype === 'image' || node.contentData?.subtype === 'video')
    ? { count: lineage.variants.length, node }
    : null
})
const selectedVersionStackStyle = computed(() => selectedVersionStack.value
  ? surfaceNodeRectStyle(selectedVersionStack.value.node)
  : null)
const selectedGenerationVariants = computed(() => {
  if (canvasStore.selectedNodeIds.length !== 1 || !canvasStore.selectedNode) return []
  return resolveGenerationResultVariants(canvasStore.selectedNode, canvasStore.nodes, canvasStore.connections)
})
const generationProvenance = computed(() => {
  if (canvasStore.selectedNodeIds.length !== 1) return []
  const selectedNode = canvasStore.selectedNode
  if (!selectedNode) return []
  if (getGenerationMediaType(selectedNode)) {
    return [
      ...resolveGenerationContext(selectedNode, canvasStore.nodes, canvasStore.connections).provenance,
      ...resultVariantProvenance(selectedGenerationVariants.value),
    ]
  }
  return selectedResultLineage.value ? resultLineageProvenance(selectedResultLineage.value) : []
})
const generationInputLineageByConnectionId = computed(() => {
  const selectedNode = canvasStore.selectedNode
  const generationNode = selectedNode && getGenerationMediaType(selectedNode)
    ? selectedNode
    : selectedResultLineage.value
      ? canvasStore.findNodeById(selectedResultLineage.value.generationNodeId)
      : null
  return new Map((generationNode
    ? resolveGenerationInputLineageBridges(generationNode, canvasStore.nodes, canvasStore.connections)
    : []
  ).map((bridge) => [bridge.connectionId, bridge]))
})
const provenanceSources = computed(() => generationProvenance.value.filter(
  (entry) => entry.kind !== 'result',
).flatMap((entry) => {
  const node = canvasStore.findNodeById(entry.nodeId)
  return node ? [{ ...entry, node, inputLineage: generationInputLineageByConnectionId.value.get(entry.connectionId) ?? null }] : []
}))
const lineageNodes = computed(() => {
  const lineage = selectedResultLineage.value
  const variants = lineage?.variants ?? selectedGenerationVariants.value
  const generationNode = lineage ? canvasStore.findNodeById(lineage.generationNodeId) : null
  return [
    ...(generationNode ? [{ key: `generation-${generationNode.id}`, label: 'G', node: generationNode, selected: false }] : []),
    ...variants.flatMap((variant) => {
      const node = canvasStore.findNodeById(variant.nodeId)
      return node && !hiddenPresentationNodeIds.value.has(node.id)
        ? [{ key: `variant-${variant.connectionId}`, label: `V${variant.order}`, node, selected: variant.isSelected }]
        : []
    }),
  ]
})
const isEmptyGuideVisible = computed(() => (
  canvasStore.hasLoaded && !canvasStore.isLoading && !canvasStore.loadError &&
  canvasStore.nodes.length === 0 &&
  !dismissedEmptyCanvasIds.value.has(canvasStore.activeCanvasId)
))
const isVisibleMinimap = computed(() => (
  isMinimapVisible.value && (
    canvasStore.nodes.length > 0 ||
    emptyMinimapRequestedCanvasIds.value.has(canvasStore.activeCanvasId)
  )
))

function toggleVisibleMinimap() {
  if (canvasStore.nodes.length > 0) {
    toggleMinimap()
    return
  }
  const canvasId = canvasStore.activeCanvasId
  if (!canvasId) return
  const next = new Set(emptyMinimapRequestedCanvasIds.value)
  if (isVisibleMinimap.value) next.delete(canvasId)
  else {
    if (!isMinimapVisible.value) toggleMinimap()
    next.add(canvasId)
  }
  emptyMinimapRequestedCanvasIds.value = next
}

function openProfessionalActionsFromRail(event: MouseEvent) {
  if (event.currentTarget instanceof HTMLElement) emit('openProfessionalActions', event.currentTarget)
}

function openProfessionalActionFromMedia(opener: HTMLElement, actionId: string) {
  emit('openProfessionalActions', opener, actionId)
}

function fullscreenSelectedMedia() {
  const target = props.mediaActionTarget
  const surface = target
    ? Array.from(canvasSurfaceRef.value?.querySelectorAll<HTMLElement>('.canvas-node-surface[data-node-id]') ?? [])
      .find((candidate) => candidate.dataset.nodeId === target.nodeId)
    : null
  const viewport = surface?.querySelector<HTMLElement>('.canvas-node-media__viewport')
  if (viewport?.requestFullscreen) void viewport.requestFullscreen().catch(() => undefined)
}

function workflowAnchor() {
  const surface = canvasSurfaceRef.value
  if (!surface) return { x: 0, y: 0 }
  return surfaceToWorld(
    { x: surface.clientWidth / 2, y: surface.clientHeight / 2 },
    normalizeViewport(canvasStore.viewport),
  )
}

async function startWorkflow(starterId: WorkflowStarterId, brief = '') {
  if (props.readonly || props.composerBusy || isStartingWorkflow.value || canvasStore.nodes.length) return ''
  const command = createWorkflowStarterCommand(
    starterId,
    workflowAnchor(),
    brief,
    props.composerAttachments.map((asset) => asset.id),
  )
  if (!command) return ''
  isStartingWorkflow.value = true
  try {
    await canvasStore.dispatchCommand({
      source: 'toolbar',
      command,
    })
    await nextTick()
    stageRef.value?.focus({ preventScroll: true })
    return command.nodes.at(-1)?.id ?? ''
  } catch {
    // The Canvas store owns the visible persistence failure state.
    return ''
  } finally {
    isStartingWorkflow.value = false
  }
}

async function submitComposer(starterId: WorkflowStarterId, brief = '') {
  const sourceNodeId = await startWorkflow(starterId, brief)
  if (starterId === 'script' && brief.trim() && sourceNodeId) emit('submitScript', brief.trim())
}

function keepCanvasBlank() {
  const canvasId = canvasStore.activeCanvasId
  if (!canvasId || props.readonly) return
  dismissedEmptyCanvasIds.value = new Set([...dismissedEmptyCanvasIds.value, canvasId])
  void nextTick(() => stageRef.value?.focus({ preventScroll: true }))
}

function setStageRef(element: Element | ComponentPublicInstance | null) {
  stageRef.value = element instanceof HTMLElement ? element : null
}

function setCanvasSurfaceRef(element: Element | ComponentPublicInstance | null) {
  canvasSurfaceRef.value = element instanceof HTMLElement ? element : null
}

function setMinimapRef(element: Element | ComponentPublicInstance | null) {
  minimapRef.value = element instanceof HTMLElement ? element : null
}

function closeGraphAccessPanel() {
  closeGraphPanel()
  restoreGraphPanelTriggerFocus()
}

function selectAndLocateNode(nodeId: string) {
  closeGraphPanel()
  canvasStore.selectNode(nodeId)
  centerNodeInViewport(nodeId)
}

function revealNode(nodeId: string) {
  const node = canvasStore.findNodeById(nodeId)
  const surface = canvasSurfaceRef.value
  if (!node || !surface) return false
  const current = normalizeViewport(canvasStore.viewport)
  const next = revealWorldRectViewport(
    canvasNodeWorldRect(node, 'content'), current,
    { width: surface.clientWidth, height: surface.clientHeight }, props.viewportInsets,
  )
  if (next.x === current.x && next.y === current.y) return false
  canvasStore.updateViewport(next)
  return true
}

async function composeAndReveal(mediaType: 'image' | 'video') {
  const nodeId = await composeGenerationSelection('toolbar', mediaType)
  if (!nodeId) return
  await nextTick()
  revealNode(nodeId)
}

async function handleTextCardMode(nodeId: string, mode: CanvasCardWorkModeId) {
  if (props.readonly) return
  canvasStore.selectNode(nodeId)
  if (mode === 'direct-write') {
    textWorkflow.value = null
    textAuthoringNodeId.value = nodeId
    await nextTick()
    canvasSurfaceRef.value?.querySelector<HTMLTextAreaElement>(`.canvas-node-surface[data-node-id="${nodeId}"] textarea`)?.focus()
    return
  }
  textAuthoringNodeId.value = ''
  const isAllowed = props.scriptAuthoringCapability?.models.some((model) => (
    model.workflowModes.includes(mode as TextWorkflowMode)
  ))
  textWorkflow.value = isAllowed ? { nodeId, mode } : null
}

function submitTextWorkflow(
  nodeId: string,
  prompt: string,
  mode: CanvasCardWorkModeId,
  modelId: string,
) {
  if (props.readonly || textWorkflow.value?.nodeId !== nodeId || textWorkflow.value.mode !== mode) return
  const isAllowed = props.scriptAuthoringCapability?.models.some((model) => (
    model.id === modelId && model.workflowModes.includes(mode as TextWorkflowMode)
  ))
  if (!isAllowed) return
  canvasStore.selectNode(nodeId)
  textWorkflow.value = null
  emit('generateTextCard', nodeId, prompt, mode, modelId)
}

watch(() => canvasStore.selectedNodeId, (nodeId) => {
  if (textAuthoringNodeId.value && nodeId !== textAuthoringNodeId.value) textAuthoringNodeId.value = ''
  if (textWorkflow.value && nodeId !== textWorkflow.value.nodeId) textWorkflow.value = null
})

function openNodeContinuation(nodeId: string, portId: string) {
  const node = canvasStore.findNodeById(nodeId)
  if (!node) return
  const anchor = nodePortWorldAnchor(node, 'output', portId)
  const viewport = normalizeViewport(canvasStore.viewport)
  openConnectionContinuation(
    nodeId, portId, 'downstream', worldToSurface(anchor, viewport),
    { x: anchor.x + 32, y: anchor.y }, true,
  )
}
async function selectForegroundContinuation(key: string) {
  const nodeId = await selectConnectionContinuation(key)
  if (!nodeId) return
  await nextTick()
  revealNode(nodeId)
}
function openSelectedContinuation() { const trigger = resolveCanvasNodeContinuationTrigger(canvasStore.nodes, canvasStore.selectedNodeIds, props.readonly); if (trigger) openNodeContinuation(trigger.node.id, trigger.portId) }

function fitSelectedProvenanceTrace() {
  const selectedNode = canvasStore.selectedNode
  if (!selectedNode) return false
  const generationNodeId = getGenerationMediaType(selectedNode)
    ? selectedNode.id
    : selectedResultLineage.value?.generationNodeId
  if (!generationNodeId) return false
  const nodeIds = new Set([generationNodeId, ...generationProvenance.value.map((entry) => entry.nodeId)])
  return fitNodes(canvasStore.nodes.filter((node) => nodeIds.has(node.id)), true, props.viewportInsets)
}

function arrangeSelectedProvenanceTrace() {
  if (props.readonly || !canvasStore.selectedNode) return false
  const command = createArrangeGenerationLineageCommand(
    canvasStore.nodes, canvasStore.connections, canvasStore.selectedNode.id,
  )
  if (!command) return false
  void canvasStore.dispatchCommand({ source: 'toolbar', command }).catch(() => undefined)
  return true
}

function closeTransientInteractions() {
  cancelActiveInteraction()
  closeContextMenu()
  closeGraphPanel()
  updateNodeMenuOpen(false)
}

defineExpose({ arrangeSelectedProvenanceTrace, closeTransientInteractions, fitSelectedProvenanceTrace, openSelectedContinuation, revealNode })

function commitNodeContent(nodeId: string, content: string) {
  if (props.readonly) return
  const command = createSetTextCardContentCommand(canvasStore.nodes, nodeId, content)
  if (command) {
    void canvasStore.dispatchCommand({ source: 'keyboard', command }).catch(() => undefined)
    return
  }
  const target = canvasStore.findNodeById(nodeId)
  if (target?.type === 'script' && target.contentData?.subtype === 'script' && !target.isLocked) {
    void canvasStore.setNodeContent(nodeId, content).catch(() => undefined)
  }
}

function renameNode(nodeId: string, title: string) {
  if (props.readonly) return
  const command = createRenameNodeCommand(canvasStore.nodes, nodeId, title)
  if (!command) return
  void canvasStore.dispatchCommand({ source: 'keyboard', command }).catch(() => undefined)
}

async function attachCardReference(targetNodeId: string, sourceNodeId: string) {
  if (props.readonly) return
  const target = canvasStore.findNodeById(targetNodeId)
  const source = canvasStore.findNodeById(sourceNodeId)
  if (!target || !source || target.isLocked) return
  const ports = getAuthoringConnectionPorts(source, target)
  if (!ports) return
  await canvasStore.dispatchCommand({
    source: 'toolbar',
    command: {
      type: 'connect-nodes',
      sourceNodeId,
      targetNodeId,
      sourcePort: ports.sourcePort,
      targetPort: ports.targetPort,
    },
  }).catch(() => undefined)
  canvasStore.selectNode(targetNodeId)
  cancelCardReferenceMode()
  await nextTick()
  stageRef.value?.focus({ preventScroll: true })
}

function resolveCardReferenceCandidateSnapshot(targetNodeId: string) {
  const target = presentationNodes.value.find((node) => node.id === targetNodeId)
  if (!target) return ''
  const isScriptTarget = target.type === 'script' && target.contentData?.subtype === 'script'
  return presentationNodes.value.flatMap((candidate) => {
    const assetId = candidate.contentData?.asset_id
    if (
      candidate.id === target.id || (!isScriptTarget && (typeof assetId !== 'string' || !assetId.trim())) ||
      !createConnectNodesCommand(
        presentationNodes.value,
        presentationConnections.value,
        candidate.id,
        target.id,
      )
    ) return []
    return [JSON.stringify({
      assetId: assetId ?? null,
      content: isScriptTarget ? candidate.content ?? candidate.contentData?.text ?? null : null,
      id: candidate.id,
      sourceTaskId: candidate.contentData?.source_task_id ?? null,
      url: candidate.contentData?.url ?? null,
    })]
  }).sort().join('|')
}

function canStartCardReferenceMode(target: CanvasNode | null | undefined) {
  return Boolean(target && !target.isLocked && (
    getGenerationMediaType(target) !== null ||
    (target.type === 'script' && target.contentData?.subtype === 'script')
  ))
}

function startCardReferenceMode(targetNodeId: string) {
  const target = canvasStore.findNodeById(targetNodeId)
  if (props.readonly || !canStartCardReferenceMode(target)) return
  cardReferenceCandidateSnapshot = resolveCardReferenceCandidateSnapshot(targetNodeId)
  cardReferenceTargetNodeId.value = targetNodeId
}

async function attachScriptRoleReference(targetNodeId: string, sourceNodeId: string) {
  if (props.readonly) return
  const command = createAddScriptReferenceAssetCommand(canvasStore.nodes, targetNodeId, sourceNodeId)
  if (!command) return
  await canvasStore.dispatchCommand({ source: 'toolbar', command }).catch(() => undefined)
  canvasStore.selectNode(targetNodeId)
  await nextTick()
  canvasSurfaceRef.value?.querySelector<HTMLButtonElement>(
    `.canvas-node-surface[data-node-id="${targetNodeId}"] .script-empty-state button[aria-expanded]`,
  )?.focus({ preventScroll: true })
}

async function clearScriptRoleReferences(targetNodeId: string) {
  if (props.readonly) return
  const command = createUpdateScriptReferenceAssetsCommand(canvasStore.nodes, targetNodeId, [])
  if (!command) return
  await canvasStore.dispatchCommand({ source: 'toolbar', command }).catch(() => undefined)
  canvasStore.selectNode(targetNodeId)
  cancelCardReferenceMode()
}

function cancelCardReferenceMode() {
  cardReferenceTargetNodeId.value = ''
  cardReferenceCandidateSnapshot = ''
}

function forwardCardGenerate(nodeId: string, prompt: string, mode: CanvasCardWorkModeId) {
  if (cardReferenceTargetNodeId.value === nodeId) cancelCardReferenceMode()
  emit('cardGenerate', nodeId, prompt, mode)
}

function handleCardReferenceKeydown(event: KeyboardEvent) {
  if (!cardReferenceTargetNodeId.value) return
  const key = event.key.toLowerCase()
  if (key === 'escape') {
    event.preventDefault()
    event.stopPropagation()
    cancelCardReferenceMode()
    return
  }
  if ((event.ctrlKey || event.metaKey) && (key === 'z' || key === 'y')) {
    cancelCardReferenceMode()
  }
}

function handleCardReferencePointerDown(event: PointerEvent) {
  if (
    event.target instanceof Element &&
    event.target.closest('.canvas-card-work-surface') &&
    selectNodeBehindOverlay(event)
  ) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  if (!cardReferenceTargetNodeId.value || !(event.target instanceof Element)) return
  if (event.target.closest('.canvas-card-reference-candidate, .canvas-card-work-surface')) return
  event.preventDefault()
  event.stopPropagation()
  cancelCardReferenceMode()
}

watch([
  () => canvasStore.nodes.map((node) => node.id).join('|'),
  () => props.readonly,
  () => props.resourcesOpen,
  () => props.contextOverlayOpen,
], () => {
  const target = cardReferenceTargetNodeId.value
  const targetNode = target ? canvasStore.findNodeById(target) : null
  if (target && (
    props.readonly || props.resourcesOpen || props.contextOverlayOpen || !targetNode ||
    !canStartCardReferenceMode(targetNode)
  )) {
    cancelCardReferenceMode()
  }
})
watch(() => {
  const target = cardReferenceTargetNodeId.value
  return target ? resolveCardReferenceCandidateSnapshot(target) : ''
}, (snapshot) => {
  if (cardReferenceTargetNodeId.value && snapshot !== cardReferenceCandidateSnapshot) {
    cancelCardReferenceMode()
  }
})
watch(() => {
  const target = cardReferenceTargetNodeId.value
  return target ? props.generationRuntimePresentations.get(target)?.phase ?? '' : ''
}, (phase) => {
  if (phase === 'failed' || phase === 'timed_out') cancelCardReferenceMode()
})
watch(() => canvasStore.activeCanvasId, cancelCardReferenceMode)

function adoptMediaAspectRatio(nodeId: string, aspectRatio: number) {
  canvasStore.setNodeMediaAspectRatio(nodeId, aspectRatio)
}
function reorderSelectionGenerationInput(nodeId: string, direction: SelectionGenerationMoveDirection) {
  const nextIds = moveSelectionGenerationInput(canvasStore.selectedNodes, nodeId, direction)
  if (nextIds) canvasStore.setSelection(nextIds, canvasStore.selectedNode?.id ?? '')
}

</script>

<template>
  <section
    :ref="setStageRef"
    class="workspace-stage"
    aria-label="Revid 无限画布工作区"
    :aria-description="readonly ? '只读审阅模式' : '可编辑画布'"
    aria-keyshortcuts="/ Tab Control+Z Meta+Z Control+Shift+Z Meta+Shift+Z Control+D Meta+D Control+G Meta+G Control+Shift+G Meta+Shift+G Control+L Meta+L Control+0 Meta+0 Control++ Meta++ Control+- Meta+- Alt+Shift+F Delete Backspace Escape ?"
    tabindex="0"
    @keydown.capture="handleCardReferenceKeydown"
    @pointerdown.capture="handleCardReferencePointerDown"
  >
    <p
      v-if="commandFeedback"
      :key="commandFeedback.id"
      class="canvas-command-feedback"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ commandFeedback.message }}
    </p>
    <p v-if="actionError" class="canvas-command-feedback is-error" role="alert" aria-live="assertive" aria-atomic="true">{{ actionError }}</p>
    <div
      v-if="stageNotice"
      class="canvas-state"
      :class="`is-${stageNotice.kind}`"
      :role="stageNotice.kind === 'error' ? 'alert' : 'status'"
      aria-live="polite"
    >
      <strong>{{ stageNotice.title }}</strong>
      <span>{{ stageNotice.detail }}</span>
      <button v-if="stageNotice.canRetry" type="button" @click="retryProjectLoad">重新加载</button>
    </div>
    <CanvasEmptyGuide
      v-if="isEmptyGuideVisible"
      :attachments="composerAttachments"
      :busy="isStartingWorkflow || composerBusy"
      :capability-error="composerCapabilityError"
      :capability-loading="composerCapabilityLoading"
      :model-id="composerModelId"
      :model-label="composerModelLabel"
      :readonly="readonly"
      @dismiss="keepCanvasBlank"
      @open-resources="emit('openComposerResources', $event)"
      @remove-attachment="emit('removeComposerAttachment', $event)"
      @retry-capabilities="emit('retryCapabilities')"
      @start="submitComposer"
    />
    <div
      :ref="setCanvasSurfaceRef"
      class="canvas-surface"
      :class="[`cursor-${viewportCursor}`, { 'is-grid-hidden': !isGridEnabled }]"
      :style="canvasGridStyle"
    >
      <CanvasConnectionLayer
        :draft-path="temporaryConnectionPath"
        :paths="connectionPaths"
        :provenance="generationProvenance"
        :readonly="readonly"
        :visible="areEdgesVisible"
      />
      <CanvasPendingGenerationLayer :nodes="canvasStore.nodes" :projections="pendingGenerationResults" :viewport="canvasStore.viewport" />
      <div
        v-if="selectedVersionStack && selectedVersionStackStyle"
        class="canvas-media-version-stack"
        :aria-label="`${selectedVersionStack.count} 个生成结果版本`"
        :style="selectedVersionStackStyle"
      />
      <CanvasConnectionContinuation
        v-if="connectionContinuation"
        :options="connectionContinuation.options"
        :origin-title="canvasStore.findNodeById(connectionContinuation.originNodeId)?.title ?? '当前节点'"
        :direction="connectionContinuation.direction"
        :style="continuationStyle"
        @cancel="closeConnectionContinuation"
        @select="selectForegroundContinuation"
      />

      <CanvasNodeSurfaceLayer
        :card-work-busy="cardWorkBusy"
        :card-work-can-generate="cardWorkCanGenerate"
        :card-work-error="cardWorkError"
        :generation-context="cardWorkGenerationContext"
        :card-work-has-source="cardWorkHasSource"
        :card-work-model-label="cardWorkModelLabel"
        :card-work-parameter-summary="cardWorkParameterSummary"
        :card-work-source-count="cardWorkSourceCount"
        :capture-pending="capturePending"
        :connections="presentationConnections"
        :generation-runtime-presentations="generationRuntimePresentations"
        :hidden-node-ids="hiddenPresentationNodeIds"
        :continuation-trigger="continuationTrigger"
        :nodes="presentationNodes"
        :selected-node-ids="canvasStore.selectedNodeIds"
        :readonly="readonly"
        :reference-source-nodes="canvasStore.nodes"
        :reference-target-node-id="cardReferenceTargetNodeId"
        :script-authoring-active="scriptAuthoringActive"
        :script-authoring-capability="scriptAuthoringCapability"
        :script-authoring-capability-error="scriptAuthoringCapabilityError"
        :script-authoring-capability-loading="scriptAuthoringCapabilityLoading"
        :script-authoring-error="scriptAuthoringError"
        :script-authoring-intent="scriptAuthoringIntent"
        :script-authoring-success="scriptAuthoringSuccess"
        :script-quota="scriptQuota"
        :stage-size="stageSize"
        :surface-node-rect-style="surfaceNodeRectStyle"
        :text-authoring-node-id="textAuthoringNodeId"
        :text-generation-errors="textGenerationErrors"
        :text-generation-pending-node-ids="textGenerationPendingNodeIds"
        :text-workflow-mode="textWorkflow?.mode ?? ''"
        :text-workflow-node-id="textWorkflow?.nodeId ?? ''"
        :viewport-insets="viewportInsets"
        @card-generate="forwardCardGenerate"
        @card-open-assets="(nodeId, opener) => emit('cardOpenAssets', nodeId, opener)"
        @card-reference="attachCardReference"
        @card-reference-cancel="cancelCardReferenceMode"
        @card-reference-start="startCardReferenceMode"
        @card-script-role-reference-clear="clearScriptRoleReferences"
        @card-script-role-reference-select="attachScriptRoleReference"
        @card-upload="(nodeId, file) => emit('cardUpload', nodeId, file)"
        @card-update-parameters="emit('cardUpdateParameters', $event)"
        @cancel-script-authoring="emit('cancelScriptAuthoring')"
        @commit-content="commitNodeContent"
        @continue-node="openNodeContinuation"
        @capture-frame="forwardCapturedVideoFrame"
        @media-metadata="adoptMediaAspectRatio"
        @rename-node="renameNode"
        @generate-script="emit('generateScript', $event)"
        @retry-script-capability="emit('retryScriptCapability')"
        @text-mode="(nodeId, mode) => handleTextCardMode(nodeId, mode)"
        @text-workflow-cancel="textWorkflow = null"
        @text-workflow-submit="submitTextWorkflow"
      />
      <CanvasMediaToolbar
        v-if="mediaToolbarStyle && mediaActionTarget"
        :available-action-ids="professionalActionIds"
        :style="mediaToolbarStyle"
        :target="mediaActionTarget"
        @fullscreen="fullscreenSelectedMedia"
        @inspect="emit('openNodeDetails')"
        @open-action="openProfessionalActionFromMedia"
      />
      <CanvasResultContinuationSurface
        v-if="resultContinuation"
        :style="surfaceNodeRectStyle(resultContinuation, 'composer')"
        @branch="emit('branchResult', $event)"
      />
      <CanvasStoryboardNumberLayer :nodes="canvasStore.nodes" :surface-node-rect-style="surfaceNodeRectStyle" />

      <CanvasSelectionGenerationIntent
        v-if="!readonly && canvasStore.selectedNodes.length >= 2"
        :nodes="canvasStore.selectedNodes"
        :surface-node-rect-style="surfaceNodeRectStyle"
      />

      <CanvasSelectionAggregate
        v-if="selectionAggregateHullStyle && !readonly && !contextOverlayOpen"
        :count="canvasStore.selectedNodeIds.length"
        :intent="selectionGenerationIntent"
        :sources="selectionGenerationSources"
        :style="selectionAggregateHullStyle"
        @compose="composeAndReveal"
        @reorder-source="reorderSelectionGenerationInput"
      />

      <div
        v-if="capturedFrameSourceNode"
        class="captured-frame-source-provenance"
        :style="surfaceNodeRectStyle(capturedFrameSourceNode)"
        aria-hidden="true"
      >
        <span>源视频</span>
      </div>

      <div
        v-for="source in provenanceSources"
        :key="`generation-source-${source.connectionId}`"
        class="generation-source-provenance"
        :class="source.isIncluded ? 'is-included' : 'is-excluded'"
        :style="surfaceNodeRectStyle(source.node)"
        aria-hidden="true"
      >
        <span>{{ source.kind === 'text' ? 'T' : 'R' }}{{ source.isIncluded ? source.order : '×' }}<template v-if="source.inputLineage"> · V{{ source.inputLineage.variantOrder }}</template></span>
      </div>

      <div
        v-for="item in lineageNodes"
        :key="item.key"
        class="result-lineage-node"
        :class="{ 'is-selected-variant': item.selected }"
        :style="surfaceNodeRectStyle(item.node)"
        aria-hidden="true"
      >
        <span>{{ item.label }}</span>
      </div>

      <div
        v-for="target in connectionTargetStates"
        :key="`connection-target-${target.node.id}`"
        class="connection-target-overlay"
        :class="target.isCompatible ? 'is-compatible' : 'is-incompatible'"
        :style="surfaceNodeRectStyle(target.node)"
        aria-hidden="true"
      />
      <CanvasConnectionTargetPorts :ports="connectionTargetPorts" />
      <div
        v-for="node in statusNodes"
        :key="`${node.id}-${node.status}`"
        class="node-status-overlay"
        :class="`is-${node.status}`"
        :style="surfaceNodeRectStyle(node)"
        aria-hidden="true"
      >
        <div class="node-status-badge" :style="statusBadgeStyle()">
          <component :is="statusIconMap[node.status]" :size="14" class="status-icon" />
          <span>{{ statusLabel(node.status) }}</span>
        </div>
      </div>

      <div v-if="marqueeStyle" class="selection-marquee" :style="marqueeStyle" aria-hidden="true"></div>

      <CanvasSelectionToolbar
        v-if="selectionToolbarStyle && !mediaToolbarStyle && !readonly && !contextOverlayOpen"
        :count="canvasStore.selectedNodeIds.length"
        :can-connect="canConnectSelection"
        :can-compose="canComposeGenerationSelection"
        :compose-asset-image-count="selectionGenerationIntent?.assetImageCount ?? 0"
        :compose-image-count="selectionGenerationIntent?.imageCount ?? 0"
        :compose-result-count="selectionGenerationIntent?.resultCount ?? 0"
        :compose-sources="selectionGenerationSources"
        :compose-text-count="selectionGenerationIntent?.textCount ?? 0"
        :compose-video-mode="selectionGenerationIntent?.videoMode ?? 'text-to-video'"
        :can-delete="canDeleteSelection"
        :can-duplicate="canDuplicateSelection"
        :can-group="canGroupSelection"
        :can-create-storyboard="canCreateStoryboardGroup"
        :can-align="canAlignSelection"
        :can-auto-arrange="canAutoArrange && canvasStore.selectedNodes.length >= 2"
        :can-distribute="canDistributeSelection"
        :can-ungroup="canUngroupSelection"
        :has-locked="hasLockedSelection"
        :storyboard-controls="storyboardControls"
        :storyboard-generation-summary="storyboardGenerationSummary"
        :style="selectionToolbarStyle"
        @duplicate="duplicateSelection('toolbar')"
        @group="groupSelection('toolbar')"
        @create-storyboard="createStoryboardGroup"
        @convert-storyboard="convertStoryboardGroup"
        @reorder-storyboard="reorderStoryboardGroup"
        @update-storyboard-settings="updateStoryboardGroup"
        @generate-storyboard-group="emit('generateStoryboardGroup', $event)"
        @reorder-compose-source="reorderSelectionGenerationInput"
        @ungroup="ungroupSelection('toolbar')"
        @connect="connectSelection('toolbar')"
        @compose="composeAndReveal"
        @arrange="arrangeSelectionFromToolbar"
        @toggle-lock="toggleLockSelection('toolbar')"
        @delete="deleteSelection('toolbar')"
        @inspect="emit('openNodeDetails')"
      />

      <div v-if="isVisibleMinimap" :ref="setMinimapRef" class="minimap" aria-label="小地图" @pointerdown.stop="handleMinimapPointerDown">
        <div v-memo="[minimapNodes, canvasStore.selectedNodeIds, minimapViewportStyle]" class="minimap-content">
          <button
            v-for="node in minimapNodes"
            :key="node.id"
            type="button"
            class="minimap-node"
            :class="{ selected: canvasStore.selectedNodeIds.includes(node.id) }"
            :aria-label="`定位到 ${node.title}`"
            :style="minimapNodeStyle(node)"
            @pointerdown.stop
            @click.stop="centerNodeInViewport(node.id)"
          />
          <div class="minimap-viewport" :style="minimapViewportStyle"></div>
        </div>
      </div>
    </div>
    <div class="canvas-navigation-controls" role="toolbar" aria-label="画布视图控制">
      <div class="canvas-action-rail" role="toolbar" aria-label="画布主要操作">
        <CanvasToolDock
          v-if="!readonly"
          :open="isNodeMenuOpen"
          @open-resources="(opener, tab) => emit('openResources', opener, tab)"
          @open-video-edit-preflight="emit('openVideoEditPreflight', $event)"
          @select="createNodeFromMenu"
          @update:open="updateNodeMenuOpen"
        />
        <CanvasViewControls
          :are-edges-visible="areEdgesVisible"
          :can-auto-arrange="canAutoArrange"
          :can-fit-selection="canvasStore.selectedNodes.length > 0"
          :is-grid-enabled="isGridEnabled"
          :is-minimap-visible="isVisibleMinimap"
          :readonly="readonly"
          :resources-open="resourcesOpen"
          @auto-arrange="autoArrange('toolbar')"
          @fit-graph="fitGraph"
          @fit-selection="fitSelection"
          @toggle-resources="emit('openResources', $event)"
          @toggle-edges="toggleEdges"
          @toggle-grid="toggleGrid"
          @toggle-minimap="toggleVisibleMinimap"
        />
        <button
          v-if="!readonly"
          class="professional-actions-trigger"
          type="button"
          aria-label="打开专业创作指令"
          title="专业创作指令 (/)"
          :disabled="professionalActionsBlocked"
          @click="openProfessionalActionsFromRail"
        >
          <span data-rail-visual><WandSparkles :size="17" aria-hidden="true" /></span>
        </button>
        <button
          v-if="!readonly"
          class="graph-access-trigger"
          type="button"
          aria-label="从画布操作打开修订历史"
          title="修订历史"
          @click="event => emit('openRevisions', event.currentTarget as HTMLElement)"
        >
          <span data-rail-visual><History :size="17" aria-hidden="true" /></span>
        </button>
        <button
          ref="graphPanelTriggerRef"
          class="graph-access-trigger"
          type="button"
          aria-label="打开画布内容与快捷键"
          title="画布内容与快捷键 (?)"
          :aria-expanded="isGraphPanelOpen"
          @click="toggleGraphPanel"
        >
          <span data-rail-visual><Keyboard :size="17" aria-hidden="true" /></span>
        </button>
      </div>
      <CanvasZoomControls
        :zoom-percent="zoomPercent"
        @set-zoom="setZoomPercent"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
      />
    </div>
    <CanvasGraphAccessPanel
      v-if="isGraphPanelOpen"
      :generation-runtime-presentations="generationRuntimePresentations"
      :readonly="readonly"
      @close="closeGraphAccessPanel"
      @locate-node="selectAndLocateNode"
    />
    <NDropdown
      trigger="manual"
      placement="bottom-start"
      :show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :options="contextMenuOptions"
      @clickoutside="closeContextMenu"
      @select="handleContextMenuSelect"
      @update:show="updateContextMenuShow"
    />
  </section>
</template>

<style scoped lang="scss" src="./canvas-stage.scss"></style>
