<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { createReconnectConnectionCommand } from '../../modules/canvas/canvas-commands'
import { useCanvasStore } from '../../store/canvas'
import type { CanvasConnection } from '../../types/canvas'
import type { CanvasGenerationProvenance } from '../../modules/canvas/generation-lineage'
import { buildConnectionPath, normalizeViewport, surfaceToWorld, type Point } from './canvas-geometry'
import { findCompatibleConnectionTarget } from './canvas-connection-target'
import {
  createEdgeInsertionCommand,
  resolveEdgeInsertionOptions,
} from '../../modules/canvas/edge-insertion'
import CanvasEdgeInsertionMenu from './CanvasEdgeInsertionMenu.vue'
import { resolveCanvasConnectionPresentation } from './canvas-connection-presentation'
import { resolveCanvasEdgeIdentityPlacement } from './canvas-edge-identity-placement'

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
  provenance?: CanvasGenerationProvenance[]
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
const isInsertionMenuOpen = ref(false)
const viewport = computed(() => normalizeViewport(canvasStore.viewport))
const provenanceByConnectionId = computed(() => new Map(
  (props.provenance ?? []).map((entry) => [entry.connectionId, entry]),
))
const selectedPath = computed(() => props.paths.find(
  (path) => path.id === canvasStore.selectedConnectionId,
) ?? null)
const handleRadius = computed(() => 6 / viewport.value.zoom)
const selectedEdgeContext = computed(() => {
  const path = selectedPath.value
  if (!path) return null
  const source = canvasStore.findNodeById(path.connection.from)
  const target = canvasStore.findNodeById(path.connection.to)
  if (!source || !target) return null
  const midpoint = { x: (path.source.x + path.target.x) / 2, y: (path.source.y + path.target.y) / 2 }
  const placement = resolveCanvasEdgeIdentityPlacement(midpoint, canvasStore.nodes, viewport.value)
  return {
    path,
    source,
    target,
    midpoint,
    placement,
    surface: placement.position,
    presentation: resolveCanvasConnectionPresentation(
      path.connection,
      source,
      target,
      canvasStore.nodes,
      canvasStore.connections,
    ),
  }
})
const insertionContext = computed(() => {
  const context = selectedEdgeContext.value
  if (!context || props.readonly) return null
  const { path, source, target, midpoint, surface } = context
  const options = resolveEdgeInsertionOptions(source, target, path.connection)
  if (!options.length) return null
  return { path, source, target, options, midpoint, surface }
})
const selectedEdgeStyle = computed(() => {
  const context = selectedEdgeContext.value
  if (!context) return null
  return {
    left: `clamp(162px, ${context.surface.x}px, calc(100% - 162px))`,
    top: `clamp(24px, ${context.surface.y}px, calc(100% - 24px))`,
  }
})
const insertionMenuStyle = computed(() => {
  const context = insertionContext.value
  if (!context) return null
  const width = layerRef.value?.clientWidth ?? 0
  const height = layerRef.value?.clientHeight ?? 0
  return {
    left: `${Math.max(12, Math.min(context.surface.x + 16, width - 272))}px`,
    top: `${Math.max(12, Math.min(context.surface.y + 16, height - 300))}px`,
  }
})
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
  isInsertionMenuOpen.value = false
  canvasStore.selectConnection(connectionId)
}

function connectionLabel(connection: CanvasConnection) {
  const source = canvasStore.findNodeById(connection.from)?.title ?? '来源节点'
  const target = canvasStore.findNodeById(connection.to)?.title ?? '目标节点'
  const provenance = provenanceByConnectionId.value.get(connection.id)
  const kindLabel = provenance?.kind === 'text' ? '提示词' : provenance?.kind === 'media' ? '参考图' : '结果变体'
  const provenanceLabel = provenance?.kind === 'result'
    ? `，${kindLabel} ${provenance.order}，生成结果`
    : provenance
      ? `，${kindLabel} ${provenance.order}，${provenance.isIncluded ? '已参与生成' : '未参与生成'}`
      : ''
  return `选择连线：${source} 到 ${target}${provenanceLabel}`
}

function isSelectedResultProvenance(connectionId: string) {
  const provenance = provenanceByConnectionId.value.get(connectionId)
  return provenance?.kind === 'result' && provenance.isSelected
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
    const target = findCompatibleConnectionTarget(
      point,
      isSource ? draft.connection.to : draft.connection.from,
      isSource ? draft.connection.targetPort ?? 'in' : draft.connection.sourcePort ?? 'out',
      isSource ? 'input' : 'output',
      canvasStore.nodes, viewport.value,
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

function openInsertionMenu() {
  if (insertionContext.value) isInsertionMenuOpen.value = true
}

function closeInsertionMenu() {
  isInsertionMenuOpen.value = false
}

async function insertNode(optionKey: string) {
  const context = insertionContext.value
  const option = context?.options.find((item) => item.key === optionKey)
  closeInsertionMenu()
  if (!context || !option) return
  await canvasStore.dispatchCommand({
    source: 'pointer',
    command: createEdgeInsertionCommand(
      context.source, context.target, context.path.connection, option, context.midpoint,
    ),
  })
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
          :class="{
            active: path.active,
            selected: canvasStore.selectedConnectionId === path.id,
            provenance: provenanceByConnectionId.has(path.id),
            'provenance-excluded': provenanceByConnectionId.get(path.id)?.isIncluded === false,
            'provenance-result': provenanceByConnectionId.get(path.id)?.kind === 'result',
            'provenance-selected-result': isSelectedResultProvenance(path.id),
          }"
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
  <svg
    v-if="selectedEdgeContext?.placement.isDisplaced"
    class="edge-identity-leader"
    aria-hidden="true"
  >
    <line
      :x1="selectedEdgeContext.placement.origin.x"
      :y1="selectedEdgeContext.placement.origin.y"
      :x2="selectedEdgeContext.placement.position.x"
      :y2="selectedEdgeContext.placement.position.y"
      vector-effect="non-scaling-stroke"
    />
  </svg>
  <section
    v-if="selectedEdgeContext"
    class="selected-edge-identity"
    :style="selectedEdgeStyle"
    role="group"
    :aria-label="selectedEdgeContext.presentation.accessibleLabel"
  >
    <strong>{{ selectedEdgeContext.presentation.roleLabel }}</strong>
    <span v-if="selectedEdgeContext.presentation.stateLabel" class="edge-identity-state">{{ selectedEdgeContext.presentation.stateLabel }}</span>
    <span class="edge-identity-title" :title="selectedEdgeContext.presentation.sourceTitle">{{ selectedEdgeContext.presentation.sourceTitle }}</span>
    <span class="edge-identity-arrow" aria-hidden="true">→</span>
    <span class="edge-identity-title" :title="selectedEdgeContext.presentation.targetTitle">{{ selectedEdgeContext.presentation.targetTitle }}</span>
    <button
      v-if="insertionContext && !isInsertionMenuOpen"
      type="button"
      class="edge-insertion-trigger"
      aria-label="在连线中插入节点"
      @click.stop="openInsertionMenu"
    >+</button>
  </section>
  <CanvasEdgeInsertionMenu
    v-if="isInsertionMenuOpen && insertionContext"
    :options="insertionContext.options"
    :edge-label="`${insertionContext.source.title} → ${insertionContext.target.title}`"
    :style="insertionMenuStyle"
    @cancel="closeInsertionMenu"
    @select="insertNode"
  />
</template>

<style scoped lang="scss">
.connection-layer { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.connection-line, .draft { fill: none; stroke: var(--canvas-edge, var(--border-strong)); stroke-width: 1.6; pointer-events: none; }
.connection-line.selected, .draft { stroke: var(--accent-select); stroke-width: 2.4; }
.connection-line.provenance { stroke: var(--accent-select); stroke-width: 2.2; }
.connection-line.provenance-excluded { stroke: var(--v2-text-muted); stroke-width: 1.6; stroke-dasharray: 3 5; }
.connection-line.provenance-result { stroke: color-mix(in oklch, var(--accent-select) 58%, var(--border-strong)); stroke-width: 1.8; }
.connection-line.provenance-selected-result { stroke: var(--accent-select); stroke-width: 2.6; }
.connection-hit { fill: none; stroke: transparent; stroke-width: 16; outline: none; pointer-events: stroke; cursor: pointer; }
.connection-hit:focus-visible { stroke: color-mix(in oklch, var(--accent-select) 18%, transparent); outline: none; }
.connection-arrow { fill: var(--border-strong); pointer-events: none; }
.edge-identity-leader { position: absolute; inset: 0; z-index: 5; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.edge-identity-leader line { stroke: color-mix(in oklch, var(--accent-select) 44%, var(--border-strong)); stroke-width: 1; stroke-dasharray: 2 3; }
.connection-handle { fill: var(--bg-panel); stroke: var(--accent-select); stroke-width: 2; vector-effect: non-scaling-stroke; pointer-events: all; cursor: crosshair; }
.connection-handle:focus-visible { outline: none; stroke: white; stroke-width: 3; }
.selected-edge-identity { position: absolute; z-index: 6; display: flex; width: max-content; max-width: min(300px, calc(100% - 24px)); min-height: 32px; align-items: center; gap: 5px; padding: 4px 5px 4px 8px; overflow: hidden; border: 1px solid color-mix(in oklch, var(--accent-select) 36%, var(--border-subtle)); border-radius: var(--radius-lg); color: var(--v2-text-secondary); background: var(--bg-panel); box-shadow: var(--shadow-soft); font-size: 10px; line-height: 1.25; pointer-events: none; transform: translate(-50%, -50%); animation: edge-identity-in 120ms cubic-bezier(0.16, 1, 0.3, 1); }
.selected-edge-identity strong { flex: none; padding: 3px 5px; border-radius: var(--radius-sm); color: var(--v2-text-primary); background: color-mix(in oklch, var(--accent-select) 16%, transparent); font-size: 9px; font-weight: 650; white-space: nowrap; }
.edge-identity-state { flex: none; color: var(--v2-text-muted); font-size: 9px; white-space: nowrap; }
.edge-identity-title { min-width: 0; max-width: 92px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.edge-identity-arrow { flex: none; color: var(--accent-select); }
.edge-insertion-trigger { position: relative; display: grid; flex: none; width: 24px; height: 24px; padding: 0; place-items: center; border: 1px solid var(--accent-select); border-radius: 50%; color: var(--v2-text-primary); background: var(--bg-panel); font-family: inherit; font-size: 15px; font-weight: 600; line-height: 1; pointer-events: auto; cursor: pointer; transition: transform 120ms cubic-bezier(0.16, 1, 0.3, 1), background-color 120ms ease-out; }
.edge-insertion-trigger::before { position: absolute; width: 40px; height: 40px; content: ''; }
.edge-insertion-trigger:active { transform: scale(0.96); }
.edge-insertion-trigger:focus-visible { outline: 2px solid var(--v2-focus-ring, var(--accent-select)); outline-offset: 2px; }
@media (hover: hover) { .edge-insertion-trigger:hover { color: white; background: var(--accent-select); } }
@keyframes edge-identity-in { from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
@media (prefers-reduced-motion: reduce) { .connection-line, .connection-handle, .edge-insertion-trigger { transition: none; } .selected-edge-identity { animation: none; } }
</style>
