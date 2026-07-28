<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  CANVAS_PORT_HIT_TARGET_MIN_PX,
  CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX,
  CANVAS_PORT_VISUAL_WORLD_SIZE,
} from '../canvas/canvas-port-presentation'
import type { PersistedViewport } from '../../modules/canvas/persistence'
import type { CanvasNode } from '../../types/canvas'

const props = defineProps<{
  nodes: readonly CanvasNode[]
  selectedNodeIds: readonly string[]
  viewport: PersistedViewport
}>()

const emit = defineEmits<{
  interactionState: [state: 'idle' | 'card-drag' | 'port-drag']
  moveSelection: [payload: {
    deltaX: number
    deltaY: number
    nodeIds: string[]
  }]
  openContinuation: [payload: {
    nodeIds: string[]
    x: number
    y: number
  }]
  previewMove: [positions: Array<{ nodeId: string; x: number; y: number }> | null]
}>()

interface PointerDrag {
  pointerId: number
  startX: number
  startY: number
}

const moveDrag = ref<(PointerDrag & {
  origins: Array<{ nodeId: string; x: number; y: number }>
}) | null>(null)
const continuationDrag = ref<(PointerDrag & {
  currentX: number
  currentY: number
}) | null>(null)

const selectedNodes = computed(() => {
  const selectedIds = new Set(props.selectedNodeIds)
  return props.nodes.filter((node) => selectedIds.has(node.id) && node.type !== 'result')
})

const bounds = computed(() => {
  if (selectedNodes.value.length < 2) return null
  const left = Math.min(...selectedNodes.value.map((node) => node.x))
  const top = Math.min(...selectedNodes.value.map((node) => node.y))
  const right = Math.max(...selectedNodes.value.map((node) => node.x + Math.max(220, node.width)))
  const bottom = Math.max(...selectedNodes.value.map((node) => node.y + Math.max(140, node.height)))
  return { left, top, right, bottom }
})

const hullStyle = computed(() => {
  const value = bounds.value
  if (!value) return {}
  const padding = 12
  const identityClearance = 28 * props.viewport.zoom
  return {
    left: `${props.viewport.x + value.left * props.viewport.zoom - padding}px`,
    top: `${props.viewport.y + value.top * props.viewport.zoom - padding - identityClearance}px`,
    width: `${(value.right - value.left) * props.viewport.zoom + padding * 2}px`,
    height: `${(value.bottom - value.top) * props.viewport.zoom + padding * 2 + identityClearance}px`,
  }
})

const continuationStyle = computed(() => {
  const size = Math.max(
    CANVAS_PORT_HIT_TARGET_MIN_PX,
    CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX * props.viewport.zoom,
  )
  return {
    width: `${size}px`,
    height: `${size}px`,
  }
})

const continuationPortStyle = computed(() => ({
  width: `${CANVAS_PORT_VISUAL_WORLD_SIZE}px`,
  height: `${CANVAS_PORT_VISUAL_WORLD_SIZE}px`,
  fontSize: '12px',
}))

const previewStarts = computed(() => selectedNodes.value.map((node) => ({
  nodeId: node.id,
  x: props.viewport.x + (node.x + Math.max(220, node.width)) * props.viewport.zoom,
  y: props.viewport.y + (node.y + Math.max(140, node.height) / 2) * props.viewport.zoom,
})))

function previewPath(
  start: { x: number; y: number },
  end: { currentX: number; currentY: number },
) {
  const control = Math.max(54, Math.abs(end.currentX - start.x) * 0.42)
  return `M ${start.x} ${start.y} C ${start.x + control} ${start.y}, ${end.currentX - control} ${end.currentY}, ${end.currentX} ${end.currentY}`
}

function beginMove(event: PointerEvent) {
  if (event.button !== 0 || selectedNodes.value.some((node) => node.isLocked)) return
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)
  moveDrag.value = {
    origins: selectedNodes.value.map((node) => ({
      nodeId: node.id,
      x: node.x,
      y: node.y,
    })),
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
  }
  emit('interactionState', 'card-drag')
}

function moveSelection(event: PointerEvent) {
  const drag = moveDrag.value
  if (!drag || drag.pointerId !== event.pointerId) return
  const deltaX = (event.clientX - drag.startX) / props.viewport.zoom
  const deltaY = (event.clientY - drag.startY) / props.viewport.zoom
  emit('previewMove', drag.origins.map((origin) => ({
    nodeId: origin.nodeId,
    x: origin.x + deltaX,
    y: origin.y + deltaY,
  })))
}

function finishMove(event: PointerEvent) {
  const drag = moveDrag.value
  if (!drag || drag.pointerId !== event.pointerId) return
  const deltaX = (event.clientX - drag.startX) / props.viewport.zoom
  const deltaY = (event.clientY - drag.startY) / props.viewport.zoom
  moveDrag.value = null
  if (deltaX !== 0 || deltaY !== 0) {
    emit('moveSelection', {
      deltaX,
      deltaY,
      nodeIds: drag.origins.map((origin) => origin.nodeId),
    })
  }
  emit('previewMove', null)
  emit('interactionState', 'idle')
}

function cancelMove(event: PointerEvent) {
  if (moveDrag.value?.pointerId !== event.pointerId) return
  moveDrag.value = null
  emit('previewMove', null)
  emit('interactionState', 'idle')
}

function beginContinuation(event: PointerEvent) {
  if (event.button !== 0) return
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)
  continuationDrag.value = {
    currentX: event.clientX,
    currentY: event.clientY,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
  }
  emit('interactionState', 'port-drag')
}

function moveContinuation(event: PointerEvent) {
  const drag = continuationDrag.value
  if (!drag || drag.pointerId !== event.pointerId) return
  continuationDrag.value = {
    ...drag,
    currentX: event.clientX,
    currentY: event.clientY,
  }
}

function finishContinuation(event: PointerEvent) {
  const drag = continuationDrag.value
  if (!drag || drag.pointerId !== event.pointerId) return
  continuationDrag.value = null
  emit('openContinuation', {
    nodeIds: selectedNodes.value.map((node) => node.id),
    x: event.clientX,
    y: event.clientY,
  })
  emit('interactionState', 'idle')
}

function cancelContinuation(event: PointerEvent) {
  if (continuationDrag.value?.pointerId !== event.pointerId) return
  continuationDrag.value = null
  emit('interactionState', 'idle')
}

watch(() => [...props.selectedNodeIds], () => {
  if (moveDrag.value) emit('previewMove', null)
  moveDrag.value = null
  continuationDrag.value = null
})
</script>

<template>
  <div
    v-if="bounds"
    class="runtime-selection-hull"
    data-runtime-selection-hull
    :data-selected-count="selectedNodes.length"
    :style="hullStyle"
    :aria-label="`${selectedNodes.length} 个已框选节点，拖动选框可整体移动`"
    @pointerdown.stop="beginMove"
    @pointermove.stop="moveSelection"
    @pointerup.stop="finishMove"
    @pointercancel.stop="cancelMove"
  >
    <button
      type="button"
      class="runtime-selection-hull__continuation"
      data-selection-continuation
      :style="continuationStyle"
      :aria-label="`引用选中的 ${selectedNodes.length} 个节点创建下游内容`"
      @pointerdown.stop="beginContinuation"
      @pointermove.stop="moveContinuation"
      @pointerup.stop="finishContinuation"
      @pointercancel.stop="cancelContinuation"
    >
      <span
        class="runtime-selection-hull__port"
        data-selection-visible-port
        :style="continuationPortStyle"
        aria-hidden="true"
      >+</span>
    </button>
  </div>

  <svg
    v-if="continuationDrag"
    class="runtime-selection-preview"
    data-selection-preview
    aria-hidden="true"
  >
    <path
      v-for="start in previewStarts"
      :key="start.nodeId"
      :d="previewPath(start, continuationDrag)"
      data-selection-preview-edge
    />
  </svg>
</template>

<style scoped lang="scss">
@use './canvas-runtime-port' as runtime-port;

.runtime-selection-hull {
  position: fixed;
  z-index: 7;
  box-sizing: border-box;
  border: 1px dashed color-mix(in oklab, var(--v2-accent-hover) 76%, white);
  border-radius: 7px;
  background: color-mix(in oklab, var(--v2-accent) 4%, transparent);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--v2-accent) 11%, transparent);
  cursor: move;
  touch-action: none;
}

.runtime-selection-hull__continuation {
  position: absolute;
  top: 50%;
  right: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  cursor: crosshair;
  transform: translate(50%, -50%);
  touch-action: none;
}

.runtime-selection-hull__port {
  @include runtime-port.visual;

  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.runtime-selection-hull__continuation:focus-visible .runtime-selection-hull__port {
  outline: 2px solid var(--v2-focus-ring);
  outline-offset: 2px;
}

.runtime-selection-preview {
  position: fixed;
  z-index: 8;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.runtime-selection-preview path {
  fill: none;
  stroke: var(--v2-accent-hover);
  stroke-width: 2.5;
  stroke-linecap: round;
  filter: drop-shadow(0 0 7px color-mix(in oklab, var(--v2-accent-hover) 54%, transparent));
}
</style>
