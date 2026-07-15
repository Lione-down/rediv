<script setup lang="ts">
import { NDropdown } from 'naive-ui'
import { Keyboard } from 'lucide-vue-next'
import { computed, nextTick, ref, type ComponentPublicInstance } from 'vue'
import CanvasEmptyGuide from './CanvasEmptyGuide.vue'
import CanvasConnectionContinuation from './CanvasConnectionContinuation.vue'
import CanvasConnectionLayer from './CanvasConnectionLayer.vue'
import CanvasGraphAccessPanel from './CanvasGraphAccessPanel.vue'
import CanvasNodeSurfaceLayer from './CanvasNodeSurfaceLayer.vue'
import CanvasSelectionToolbar from './CanvasSelectionToolbar.vue'
import CanvasSelectionGenerationIntent from './CanvasSelectionGenerationIntent.vue'
import CanvasToolDock from './CanvasToolDock.vue'
import CanvasViewControls from './CanvasViewControls.vue'
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
import { resolveGenerationResultVariants, resolveResultLineage, resultLineageProvenance } from '../../modules/canvas/generation-lineage'
import { resolveSelectionGenerationIntent } from '../../modules/canvas/selection-generation'
import { resolveCanvasNodeContinuationTrigger } from './canvas-node-continuation-trigger'

const props = withDefaults(defineProps<{
  contextOverlayOpen?: boolean; readonly?: boolean; resourcesOpen?: boolean
  viewportInsets?: Partial<ViewportInsets>
}>(), {
  contextOverlayOpen: false, readonly: false, resourcesOpen: false,
  viewportInsets: () => ({}),
})

const emit = defineEmits<{
  openResources: [opener: HTMLElement]
}>()
const graphPanelTriggerRef = ref<HTMLButtonElement | null>(null)

function restoreGraphPanelTriggerFocus() {
  void nextTick(() => graphPanelTriggerRef.value?.focus({ preventScroll: true }))
}

const {
  canvasStore,
  canvasSurfaceRef,
  centerNodeInViewport,
  connectionPaths,
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
  isReadOnly: () => props.readonly,
  onGraphPanelClosed: restoreGraphPanelTriggerFocus,
})

const dismissedEmptyCanvasIds = ref<ReadonlySet<string>>(new Set())
const isStartingWorkflow = ref(false)
const canvasGridStyle = computed(() => getCanvasGridStyle(canvasStore.viewport))
const continuationTrigger = computed(() => resolveCanvasNodeContinuationTrigger(canvasStore.nodes, canvasStore.selectedNodeIds, props.readonly || props.contextOverlayOpen))
const selectionGenerationIntent = computed(() => resolveSelectionGenerationIntent(canvasStore.selectedNodes))
const selectedResultLineage = computed(() => {
  if (canvasStore.selectedNodeIds.length !== 1 || !canvasStore.selectedNode) return null
  return resolveResultLineage(canvasStore.selectedNode, canvasStore.nodes, canvasStore.connections)
})
const generationProvenance = computed(() => {
  if (canvasStore.selectedNodeIds.length !== 1) return []
  const selectedNode = canvasStore.selectedNode
  if (!selectedNode) return []
  if (getGenerationMediaType(selectedNode)) {
    return resolveGenerationContext(selectedNode, canvasStore.nodes, canvasStore.connections).provenance
  }
  return selectedResultLineage.value ? resultLineageProvenance(selectedResultLineage.value) : []
})
const provenanceSources = computed(() => generationProvenance.value.filter(
  (entry) => entry.kind !== 'result',
).flatMap((entry) => {
  const node = canvasStore.findNodeById(entry.nodeId)
  return node ? [{ ...entry, node }] : []
}))
const lineageNodes = computed(() => {
  const lineage = selectedResultLineage.value
  const selectedGeneration = canvasStore.selectedNodeIds.length === 1 && canvasStore.selectedNode
    ? canvasStore.selectedNode
    : null
  const variants = lineage?.variants ?? (selectedGeneration
    ? resolveGenerationResultVariants(selectedGeneration, canvasStore.nodes, canvasStore.connections)
    : [])
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

function workflowAnchor() {
  const surface = canvasSurfaceRef.value
  if (!surface) return { x: 0, y: 0 }
  return surfaceToWorld(
    { x: surface.clientWidth / 2, y: surface.clientHeight / 2 },
    normalizeViewport(canvasStore.viewport),
  )
}

async function startWorkflow(starterId: WorkflowStarterId) {
  if (props.readonly || isStartingWorkflow.value || canvasStore.nodes.length) return
  isStartingWorkflow.value = true
  try {
    await canvasStore.dispatchCommand({
      source: 'toolbar',
      command: createWorkflowStarterCommand(starterId, workflowAnchor()),
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

defineExpose({ openSelectedContinuation, revealNode })

function commitNodeContent(nodeId: string, content: string) {
  void canvasStore.setNodeContent(nodeId, content).catch(() => undefined)
}

function adoptMediaAspectRatio(nodeId: string, aspectRatio: number) {
  canvasStore.setNodeMediaAspectRatio(nodeId, aspectRatio)
}
</script>

<template>
  <section
    :ref="setStageRef"
    class="workspace-stage"
    aria-label="Revid 无限画布工作区"
    :aria-description="readonly ? '只读审阅模式' : '可编辑画布'"
    aria-keyshortcuts="Tab Control+Z Meta+Z Control+Shift+Z Meta+Shift+Z Control+D Meta+D Control+G Meta+G Control+Shift+G Meta+Shift+G Control+L Meta+L Control+0 Meta+0 Control++ Meta++ Control+- Meta+- Alt+Shift+F Delete Backspace Escape ?"
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
      @start="startWorkflow"
    />
    <div
      :ref="setCanvasSurfaceRef"
      class="canvas-surface"
      :class="[`cursor-${viewportCursor}`, { 'is-grid-hidden': !isGridEnabled }]"
      :style="canvasGridStyle"
    >
      <CanvasConnectionLayer
        :paths="connectionPaths"
        :provenance="generationProvenance"
        :readonly="readonly"
        :visible="areEdgesVisible"
      />
      <svg v-if="temporaryConnectionPath" class="connection-layer draft-layer" aria-hidden="true">
        <path class="draft" :d="temporaryConnectionPath" />
      </svg>
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
        :continuation-trigger="continuationTrigger"
        :nodes="canvasStore.nodes"
        :selected-node-ids="canvasStore.selectedNodeIds"
        :readonly="readonly"
        :surface-node-rect-style="surfaceNodeRectStyle"
        @commit-content="commitNodeContent"
        @continue-node="openNodeContinuation"
        @media-metadata="adoptMediaAspectRatio"
      />

      <CanvasSelectionGenerationIntent
        v-if="!readonly && canvasStore.selectedNodes.length >= 2"
        :nodes="canvasStore.selectedNodes"
        :surface-node-rect-style="surfaceNodeRectStyle"
      />

      <div
        v-for="source in provenanceSources"
        :key="`generation-source-${source.connectionId}`"
        class="generation-source-provenance"
        :class="source.isIncluded ? 'is-included' : 'is-excluded'"
        :style="surfaceNodeRectStyle(source.node)"
        aria-hidden="true"
      >
        <span>{{ source.kind === 'text' ? 'T' : 'R' }}{{ source.isIncluded ? source.order : '×' }}</span>
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
        v-if="selectionToolbarStyle && !readonly"
        :count="canvasStore.selectedNodeIds.length"
        :can-connect="canConnectSelection"
        :can-compose="canComposeGenerationSelection"
        :compose-asset-image-count="selectionGenerationIntent?.assetImageCount ?? 0"
        :compose-image-count="selectionGenerationIntent?.imageCount ?? 0"
        :compose-result-count="selectionGenerationIntent?.resultCount ?? 0"
        :compose-text-count="selectionGenerationIntent?.textCount ?? 0"
        :compose-video-mode="selectionGenerationIntent?.videoMode ?? 'text-to-video'"
        :can-delete="canDeleteSelection"
        :can-duplicate="canDuplicateSelection"
        :can-group="canGroupSelection"
        :can-align="canAlignSelection"
        :can-auto-arrange="canAutoArrange && canvasStore.selectedNodes.length >= 2"
        :can-distribute="canDistributeSelection"
        :can-ungroup="canUngroupSelection"
        :has-locked="hasLockedSelection"
        :style="selectionToolbarStyle"
        @duplicate="duplicateSelection('toolbar')"
        @group="groupSelection('toolbar')"
        @ungroup="ungroupSelection('toolbar')"
        @connect="connectSelection('toolbar')"
        @compose="composeAndReveal"
        @arrange="arrangeSelectionFromToolbar"
        @toggle-lock="toggleLockSelection('toolbar')"
        @delete="deleteSelection('toolbar')"
      />

      <div v-if="isMinimapVisible" :ref="setMinimapRef" class="minimap" aria-label="小地图" @pointerdown.stop="handleMinimapPointerDown">
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
    <CanvasViewControls
      :are-edges-visible="areEdgesVisible"
      :can-auto-arrange="canAutoArrange"
      :can-fit-selection="canvasStore.selectedNodes.length > 0"
      :is-grid-enabled="isGridEnabled"
      :is-minimap-visible="isMinimapVisible"
      :readonly="readonly"
      :resources-open="resourcesOpen"
      :zoom-percent="zoomPercent"
      @auto-arrange="autoArrange('toolbar')"
      @fit-graph="fitGraph"
      @fit-selection="fitSelection"
      @set-zoom="setZoomPercent"
      @toggle-resources="emit('openResources', $event)"
      @toggle-edges="toggleEdges"
      @toggle-grid="toggleGrid"
      @toggle-minimap="toggleMinimap"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
    />
    <CanvasToolDock
      v-if="!readonly"
      :open="isNodeMenuOpen"
      @select="createNodeFromMenu"
      @update:open="updateNodeMenuOpen"
    />
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
    <CanvasGraphAccessPanel
      v-if="isGraphPanelOpen"
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
