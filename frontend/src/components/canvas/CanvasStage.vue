<script setup lang="ts">
import { NDropdown } from 'naive-ui'
import { History, Keyboard, WandSparkles } from 'lucide-vue-next'
import { computed, nextTick, ref, type ComponentPublicInstance } from 'vue'
import CanvasEmptyGuide from './CanvasEmptyGuide.vue'
import CanvasConnectionContinuation from './CanvasConnectionContinuation.vue'
import CanvasConnectionLayer from './CanvasConnectionLayer.vue'
import CanvasConnectionTargetPorts from './CanvasConnectionTargetPorts.vue'
import CanvasGraphAccessPanel from './CanvasGraphAccessPanel.vue'
import CanvasMediaToolbar from './CanvasMediaToolbar.vue'
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
import { getGenerationMediaType } from '../../modules/canvas/node-registry'
import { resolveGenerationResultVariants, resolveResultLineage, resultLineageProvenance, resultVariantProvenance } from '../../modules/canvas/generation-lineage'
import { moveSelectionGenerationInput, resolveSelectionGenerationIntent, type SelectionGenerationMoveDirection } from '../../modules/canvas/selection-generation'
import { resolveCanvasNodeContinuationTrigger } from './canvas-node-continuation-trigger'
import { resolveCapturedFrameProvenance } from '../../modules/canvas/captured-frame-provenance'
import { createArrangeGenerationLineageCommand } from '../../modules/canvas/generation-lineage-arrangement'
import { resolveGenerationInputLineageBridges } from '../../modules/canvas/generation-input-lineage'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import type { GenerationResultProjection } from '../../modules/canvas/generation-result-projection'
import type { OwnedMediaActionTarget } from '../../modules/canvas/professional-action-registry'
import { useCanvasStoryboardGroups } from './composables/use-canvas-storyboard-groups'
const props = withDefaults(defineProps<{
  actionError?: string; capturePending?: boolean; contextOverlayOpen?: boolean; professionalActionsBlocked?: boolean; readonly?: boolean; resourcesOpen?: boolean
  generationRuntimePresentations?: ReadonlyMap<string, GenerationRuntimePresentation>; pendingGenerationResults?: readonly GenerationResultProjection[]
  mediaActionTarget?: OwnedMediaActionTarget | null; professionalActionIds?: readonly string[]
  viewportInsets?: Partial<ViewportInsets>
}>(), {
  actionError: '', capturePending: false, contextOverlayOpen: false, professionalActionsBlocked: false, readonly: false, resourcesOpen: false,
  generationRuntimePresentations: () => new Map(), pendingGenerationResults: () => [],
  mediaActionTarget: null, professionalActionIds: () => [],
  viewportInsets: () => ({}),
})
const emit = defineEmits<{
  captureVideoFrame: [nodeId: string, file: File, timeSeconds: number, aspectRatio: number]
  openResources: [opener: HTMLElement]
  openProfessionalActions: [opener: HTMLElement, query?: string]
  openRevisions: [opener: HTMLElement]
}>()
const graphPanelTriggerRef = ref<HTMLButtonElement | null>(null)
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
  getViewportInsets: () => props.viewportInsets,
  isProfessionalActionsBlocked: () => props.professionalActionsBlocked,
  isReadOnly: () => props.readonly,
  onGraphPanelClosed: restoreGraphPanelTriggerFocus,
  onOpenProfessionalActions: (opener) => emit('openProfessionalActions', opener),
})

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
  const node = canvasStore.findNodeById(target.nodeId)
  return node ? { ...surfaceNodeRectStyle(node), height: '0px' } : null
})
const continuationTrigger = computed(() => resolveCanvasNodeContinuationTrigger(canvasStore.nodes, canvasStore.selectedNodeIds, props.readonly || props.contextOverlayOpen))
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
      return node ? [{ key: `variant-${variant.connectionId}`, label: `V${variant.order}`, node, selected: variant.isSelected }] : []
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
  if (props.readonly || isStartingWorkflow.value || canvasStore.nodes.length) return
  const command = createWorkflowStarterCommand(starterId, workflowAnchor(), brief)
  if (!command) return
  isStartingWorkflow.value = true
  try {
    await canvasStore.dispatchCommand({
      source: 'toolbar',
      command,
    })
    await nextTick()
    stageRef.value?.focus({ preventScroll: true })
  } catch {
    // The Canvas store owns the visible persistence failure state.
  } finally {
    isStartingWorkflow.value = false
  }
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
  void canvasStore.setNodeContent(nodeId, content).catch(() => undefined)
}

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
      :busy="isStartingWorkflow"
      :readonly="readonly"
      @dismiss="keepCanvasBlank"
      @open-resources="emit('openResources', $event)"
      @start="startWorkflow"
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
      <CanvasPendingGenerationLayer :projections="pendingGenerationResults" :viewport="canvasStore.viewport" />
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
        :capture-pending="capturePending"
        :continuation-trigger="continuationTrigger"
        :nodes="canvasStore.nodes"
        :selected-node-ids="canvasStore.selectedNodeIds"
        :readonly="readonly"
        :surface-node-rect-style="surfaceNodeRectStyle"
        @commit-content="commitNodeContent"
        @continue-node="openNodeContinuation"
        @capture-frame="forwardCapturedVideoFrame"
        @media-metadata="adoptMediaAspectRatio"
        @request-upload="emit('openResources', $event)"
      />
      <CanvasMediaToolbar
        v-if="mediaToolbarStyle && mediaActionTarget"
        :available-action-ids="professionalActionIds"
        :style="mediaToolbarStyle"
        :target="mediaActionTarget"
        @fullscreen="fullscreenSelectedMedia"
        @open-action="openProfessionalActionFromMedia"
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
        v-if="selectionToolbarStyle && !readonly && !contextOverlayOpen"
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
        :style="selectionToolbarStyle"
        @duplicate="duplicateSelection('toolbar')"
        @group="groupSelection('toolbar')"
        @create-storyboard="createStoryboardGroup"
        @convert-storyboard="convertStoryboardGroup"
        @reorder-storyboard="reorderStoryboardGroup"
        @update-storyboard-settings="updateStoryboardGroup"
        @reorder-compose-source="reorderSelectionGenerationInput"
        @ungroup="ungroupSelection('toolbar')"
        @connect="connectSelection('toolbar')"
        @compose="composeAndReveal"
        @arrange="arrangeSelectionFromToolbar"
        @toggle-lock="toggleLockSelection('toolbar')"
        @delete="deleteSelection('toolbar')"
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
          @open-resources="emit('openResources', $event)"
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
          <WandSparkles :size="17" aria-hidden="true" />
        </button>
        <button
          v-if="!readonly"
          class="graph-access-trigger"
          type="button"
          aria-label="从画布操作打开修订历史"
          title="修订历史"
          @click="event => emit('openRevisions', event.currentTarget as HTMLElement)"
        >
          <History :size="17" aria-hidden="true" />
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
          <Keyboard :size="17" aria-hidden="true" />
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
