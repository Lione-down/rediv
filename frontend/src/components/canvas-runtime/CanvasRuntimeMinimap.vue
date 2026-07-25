<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useCanvasMinimapPresentation } from '../canvas/composables/use-canvas-minimap-presentation'
import {
  minimapPointToWorld,
} from '../canvas/canvas-geometry'
import { resolveCanvasNodeLayoutCenter } from '../../modules/canvas/node-layout'
import type { PersistedViewport } from '../../modules/canvas/persistence'
import type { CanvasNode } from '../../types/canvas'

const props = defineProps<{
  nodes: readonly CanvasNode[]
  selectedNodeId: string
  viewport: PersistedViewport
}>()

const emit = defineEmits<{
  updateViewport: [viewport: PersistedViewport]
}>()

const root = ref<HTMLElement | null>(null)
const minimapSize = ref({ width: 160, height: 104 })
const viewportSize = ref({ width: window.innerWidth, height: window.innerHeight })
let resizeObserver: ResizeObserver | null = null

const { minimapMetrics, minimapNodes, minimapNodeStyle, minimapViewportStyle } =
  useCanvasMinimapPresentation({
    getMinimapSize: () => minimapSize.value,
    getNodes: () => [...props.nodes],
    getViewport: () => props.viewport,
    getViewportSize: () => viewportSize.value,
  })

function centerWorld(point: { x: number; y: number }) {
  emit('updateViewport', {
    ...props.viewport,
    x: viewportSize.value.width / 2 - point.x * props.viewport.zoom,
    y: viewportSize.value.height / 2 - point.y * props.viewport.zoom,
  })
}

function handlePointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  const rect = root.value?.getBoundingClientRect()
  if (!rect) return
  centerWorld(minimapPointToWorld({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }, minimapMetrics.value))
}

function centerNode(node: CanvasNode) {
  centerWorld(resolveCanvasNodeLayoutCenter(node))
}

function updateSize() {
  const element = root.value
  if (element) {
    minimapSize.value = {
      width: Math.max(1, element.clientWidth),
      height: Math.max(1, element.clientHeight),
    }
  }
  viewportSize.value = { width: window.innerWidth, height: window.innerHeight }
}

onMounted(() => {
  updateSize()
  resizeObserver = new ResizeObserver(updateSize)
  if (root.value) resizeObserver.observe(root.value)
  window.addEventListener('resize', updateSize)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', updateSize)
})
</script>

<template>
  <aside
    ref="root"
    class="runtime-minimap"
    aria-label="小地图"
    @pointerdown.stop="handlePointerDown"
  >
    <button
      v-for="node in minimapNodes"
      :key="node.id"
      type="button"
      data-minimap-node
      :data-selected="selectedNodeId === node.id ? 'true' : undefined"
      :aria-label="`定位到 ${node.title}`"
      :style="minimapNodeStyle(node)"
      @pointerdown.stop
      @click.stop="centerNode(node)"
    ></button>
    <span class="runtime-minimap__viewport" :style="minimapViewportStyle"></span>
  </aside>
</template>

<style scoped lang="scss">
.runtime-minimap {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 18;
  width: 160px;
  height: 104px;
  overflow: hidden;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-md);
  background: color-mix(in oklab, var(--v2-surface-1) 92%, transparent);
  box-shadow: var(--v2-shadow-md);
  cursor: crosshair;
}

button {
  position: absolute;
  box-sizing: border-box;
  min-width: 3px;
  min-height: 3px;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: var(--v2-text-muted);
  cursor: pointer;
}

button[data-selected='true'] {
  background: var(--v2-accent);
}

.runtime-minimap__viewport {
  position: absolute;
  box-sizing: border-box;
  border: 1px solid var(--v2-accent-hover);
  border-radius: 3px;
  pointer-events: none;
}
</style>
