<script setup lang="ts">
import { NDropdown } from 'naive-ui'
import type { ComponentPublicInstance } from 'vue'
import { useCanvasStage } from './composables/use-canvas-stage'

const {
  buildConnectionPath,
  canvasStore,
  canvasSurfaceRef,
  centerNodeInViewport,
  closeContextMenu,
  contextMenu,
  contextMenuOptions,
  handleContextMenuSelect,
  minimapNodeStyle,
  minimapViewportStyle,
  nodeInputAnchor,
  nodeOutputAnchor,
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
} = useCanvasStage()

function setStageRef(element: Element | ComponentPublicInstance | null) {
  stageRef.value = element instanceof HTMLElement ? element : null
}

function setCanvasSurfaceRef(element: Element | ComponentPublicInstance | null) {
  canvasSurfaceRef.value = element instanceof HTMLElement ? element : null
}
</script>

<template>
  <section :ref="setStageRef" class="workspace-stage" aria-label="Revid 无限画布工作区">
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
    <div :ref="setCanvasSurfaceRef" class="canvas-surface" :class="`cursor-${viewportCursor}`">
      <svg class="connection-layer" aria-hidden="true">
        <path
          v-for="connection in canvasStore.connections"
          :key="connection.id"
          :class="{ active: connection.active }"
          :d="buildConnectionPath(nodeOutputAnchor(connection.from), nodeInputAnchor(connection.to))"
        />
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

      <div class="minimap" aria-label="小地图">
        <button
          v-for="node in canvasStore.nodes"
          :key="node.id"
          type="button"
          class="minimap-node"
          :class="{ selected: canvasStore.selectedNodeIds.includes(node.id) }"
          :aria-label="`定位到 ${node.title}`"
          :style="minimapNodeStyle(node)"
          @click="centerNodeInViewport(node.id)"
        />
        <div class="minimap-viewport" :style="minimapViewportStyle"></div>
      </div>
    </div>
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
