<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { createReconnectConnectionCommand } from '../../modules/canvas/canvas-commands'
import { useCanvasStore } from '../../store/canvas'
import type { CanvasConnection } from '../../types/canvas'
import { buildConnectionPath, normalizeViewport, surfaceToWorld, type Point } from './canvas-geometry'
import { findNearestConnectionTarget } from './canvas-connection-target'

export interface CanvasConnectionPath {
  active?: boolean
  connection: CanvasConnection
  id: string
  path: string
  source: Point
  target: Point
}

const props = defineProps<{
  paths: CanvasConnectionPath[]
  readonly: boolean
  visible: boolean
}>()

interface RerouteDraft {
  connection: CanvasConnection
  endpoint: 'source' | 'target'
  pointerId: number
  current: Point
}

const canvasStore = useCanvasStore()
const layerRef = ref<SVGSVGElement | null>(null)
const rerouteDraft = ref<RerouteDraft | null>(null)
const viewport = computed(() => normalizeViewport(canvasStore.viewport))
const selectedPath = computed(() => props.paths.find(
  (path) => path.id === canvasStore.selectedConnectionId,
) ?? null)
const handleRadius = computed(() => 6 / viewport.value.zoom)
const draftPath = computed(() => {
  const draft = rerouteDraft.value
  if (!draft) return ''
  const path = props.paths.find((candidate) => candidate.id === draft.connection.id)
  if (!path) return ''
  return draft.endpoint === 'source'
    ? buildConnectionPath(draft.current, path.target)
    : buildConnectionPath(path.source, draft.current)
})

function selectConnection(connectionId: string) {
  canvasStore.selectConnection(connectionId)
}

function connectionLabel(connection: CanvasConnection) {
  const source = canvasStore.findNodeById(connection.from)?.title ?? '来源节点'
  const target = canvasStore.findNodeById(connection.to)?.title ?? '目标节点'
  return `选择连线：${source} 到 ${target}`
}

function selectConnectionFromPointer(connectionId: string, event: PointerEvent) {
  selectConnection(connectionId)
  ;(event.currentTarget as SVGElement | null)?.blur()
}

function toSurfacePoint(event: PointerEvent) {
  const rect = layerRef.value?.getBoundingClientRect()
  if (!rect || event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom) return null
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function stopReroute() {
  rerouteDraft.value = null
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  window.removeEventListener('pointercancel', handlePointerCancel)
  window.removeEventListener('keydown', handleKeyDown, true)
}

function startReroute(path: CanvasConnectionPath, endpoint: 'source' | 'target', event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (props.readonly || event.button !== 0) return
  selectConnection(path.id)
  rerouteDraft.value = {
    connection: path.connection,
    endpoint,
    pointerId: event.pointerId,
    current: endpoint === 'source' ? path.source : path.target,
  }
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
  window.addEventListener('pointercancel', handlePointerCancel)
  window.addEventListener('keydown', handleKeyDown, true)
}

function handlePointerMove(event: PointerEvent) {
  const draft = rerouteDraft.value
  if (!draft || event.pointerId !== draft.pointerId) return
  const point = toSurfacePoint(event)
  if (point) draft.current = surfaceToWorld(point, viewport.value)
}

function handlePointerUp(event: PointerEvent) {
  const draft = rerouteDraft.value
  if (!draft || event.pointerId !== draft.pointerId) return
  const point = toSurfacePoint(event)
  if (point) {
    const isSource = draft.endpoint === 'source'
    const target = findNearestConnectionTarget(
      point,
      isSource ? draft.connection.to : draft.connection.from,
      canvasStore.nodes,
      viewport.value,
      isSource ? 'output' : 'input',
    )
    if (target) {
      const command = createReconnectConnectionCommand(
        canvasStore.nodes,
        canvasStore.connections,
        draft.connection.id,
        isSource ? target.node.id : draft.connection.from,
        isSource ? draft.connection.to : target.node.id,
        isSource ? target.portId : draft.connection.sourcePort ?? 'out',
        isSource ? draft.connection.targetPort ?? 'in' : target.portId,
      )
      if (command) void canvasStore.dispatchCommand({ source: 'pointer', command }).catch(() => undefined)
    }
  }
  stopReroute()
}

function handlePointerCancel(event: PointerEvent) {
  if (rerouteDraft.value?.pointerId === event.pointerId) stopReroute()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  stopReroute()
}

onBeforeUnmount(stopReroute)
</script>

<template>
  <svg v-show="visible" ref="layerRef" class="connection-layer" role="group" aria-label="画布连线">
    <defs>
      <marker id="canvas-edge-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" class="connection-arrow" />
      </marker>
    </defs>
    <g :transform="`translate(${viewport.x} ${viewport.y}) scale(${viewport.zoom})`">
      <g v-for="path in paths" :key="path.id">
        <path
          class="connection-hit"
          :d="path.path"
          role="button"
          tabindex="0"
          :aria-label="connectionLabel(path.connection)"
          @pointerdown.stop="selectConnectionFromPointer(path.id, $event)"
          @keydown.enter.prevent="selectConnection(path.id)"
          @keydown.space.prevent="selectConnection(path.id)"
        />
        <path
          class="connection-line"
          :class="{ active: path.active, selected: canvasStore.selectedConnectionId === path.id }"
          :d="path.path"
          marker-end="url(#canvas-edge-arrow)"
          vector-effect="non-scaling-stroke"
        />
      </g>
      <path v-if="draftPath" class="draft" :d="draftPath" vector-effect="non-scaling-stroke" />
      <template v-if="selectedPath && !readonly">
        <circle
          class="connection-handle is-source"
          :cx="selectedPath.source.x"
          :cy="selectedPath.source.y"
          :r="handleRadius"
          role="button"
          aria-label="改接连线来源"
          tabindex="0"
          @pointerdown="startReroute(selectedPath, 'source', $event)"
        />
        <circle
          class="connection-handle is-target"
          :cx="selectedPath.target.x"
          :cy="selectedPath.target.y"
          :r="handleRadius"
          role="button"
          aria-label="改接连线目标"
          tabindex="0"
          @pointerdown="startReroute(selectedPath, 'target', $event)"
        />
      </template>
    </g>
  </svg>
</template>

<style scoped lang="scss">
.connection-layer { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.connection-line, .draft { fill: none; stroke: var(--canvas-edge, var(--border-strong)); stroke-width: 1.6; pointer-events: none; }
.connection-line.selected, .draft { stroke: var(--accent-select); stroke-width: 2.4; }
.connection-hit { fill: none; stroke: transparent; stroke-width: 16; outline: none; pointer-events: stroke; cursor: pointer; }
.connection-hit:focus-visible { stroke: color-mix(in oklch, var(--accent-select) 18%, transparent); outline: none; }
.connection-arrow { fill: var(--border-strong); pointer-events: none; }
.connection-handle { fill: var(--bg-panel); stroke: var(--accent-select); stroke-width: 2; vector-effect: non-scaling-stroke; pointer-events: all; cursor: crosshair; }
.connection-handle:focus-visible { outline: none; stroke: white; stroke-width: 3; }
@media (prefers-reduced-motion: reduce) { .connection-line, .connection-handle { transition: none; } }
</style>
