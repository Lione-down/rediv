<script setup lang="ts">
import { NDropdown } from 'naive-ui'
import { Keyboard } from 'lucide-vue-next'
import { nextTick, ref, type ComponentPublicInstance } from 'vue'
import CanvasGraphAccessPanel from './CanvasGraphAccessPanel.vue'
import CanvasSelectionToolbar from './CanvasSelectionToolbar.vue'
import CanvasToolDock from './CanvasToolDock.vue'
import CanvasViewControls from './CanvasViewControls.vue'
import { useCanvasStage } from './composables/use-canvas-stage'

const props = withDefaults(defineProps<{ readonly?: boolean; resourcesOpen?: boolean }>(), {
  readonly: false,
  resourcesOpen: false,
})

const emit = defineEmits<{
  openResources: [opener: HTMLElement]
}>()

const {
  canvasStore,
  canvasSurfaceRef,
  centerNodeInViewport,
  connectionPaths,
  connectionWorldTransform,
  closeContextMenu,
  contextMenu,
  contextMenuOptions,
  handleConnectionPointerDown,
  handleContextMenuSelect,
  handleMinimapPointerDown,
  minimapNodeStyle,
  minimapNodes,
  minimapRef,
  minimapViewportStyle,
  stageRef,
  statusBadgeStyle,
  statusIconMap,
  statusLabel,
  statusNodes,
  stageNotice,
  surfaceNodeRectStyle,
  temporaryConnectionPath,
  updateContextMenuShow,
  marqueeStyle,
  viewportCursor,
  retryProjectLoad,
  selectionToolbarStyle,
  deleteSelection,
  duplicateSelection,
  canConnectSelection,
  canDeleteSelection,
  canDuplicateSelection,
  canGroupSelection,
  canUngroupSelection,
  canAlignSelection,
  canAutoArrange,
  canDistributeSelection,
  closeGraphPanel,
  createNodeFromMenu,
  connectSelection,
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
} = useCanvasStage({ isReadOnly: () => props.readonly })

const graphPanelTriggerRef = ref<HTMLButtonElement | null>(null)

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
  void nextTick(() => graphPanelTriggerRef.value?.focus({ preventScroll: true }))
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
    <div
      :ref="setCanvasSurfaceRef"
      class="canvas-surface"
      :class="[`cursor-${viewportCursor}`, { 'is-grid-hidden': !isGridEnabled }]"
    >
      <svg v-show="areEdgesVisible" class="connection-layer" role="group" aria-label="画布连线">
        <g :transform="connectionWorldTransform">
          <g v-memo="[connectionPaths, canvasStore.selectedConnectionId]">
            <path
              v-for="connection in connectionPaths"
              :key="connection.id"
              class="connection-line"
              :class="{ active: connection.active, selected: canvasStore.selectedConnectionId === connection.id }"
              :d="connection.path"
              vector-effect="non-scaling-stroke"
            />
            <path
              v-for="connection in connectionPaths"
              :key="`hit-${connection.id}`"
              class="connection-hit"
              :class="{ selected: canvasStore.selectedConnectionId === connection.id }"
              :d="connection.path"
              aria-hidden="true"
              vector-effect="non-scaling-stroke"
              @pointerdown.stop="handleConnectionPointerDown(connection.id, $event)"
              @focus="canvasStore.selectConnection(connection.id)"
              @keydown.enter.prevent="canvasStore.selectConnection(connection.id)"
              @keydown.space.prevent="canvasStore.selectConnection(connection.id)"
            />
          </g>
        </g>
        <path v-if="temporaryConnectionPath" class="draft" :d="temporaryConnectionPath" />
      </svg>

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
      @locate-node="centerNodeInViewport"
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
