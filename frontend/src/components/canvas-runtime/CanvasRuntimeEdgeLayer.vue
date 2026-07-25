<script setup lang="ts">
import { computed } from 'vue'
import {
  projectRuntimeEdge,
  runtimeEdgePath,
  type RuntimeScreenPoint,
} from '../../modules/canvas-runtime/canvas-runtime-geometry'
import type { PersistedViewport } from '../../modules/canvas/persistence'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'

const props = defineProps<{
  connections: readonly CanvasConnection[]
  draft: { current: RuntimeScreenPoint; start: RuntimeScreenPoint } | null
  nodes: readonly CanvasNode[]
  portPositions: ReadonlyMap<string, RuntimeScreenPoint>
  selectedNodeId: string
  viewport: PersistedViewport
}>()

const edges = computed(() => {
  const nodesById = new Map(props.nodes.map((node) => [node.id, node]))
  return props.connections.flatMap((connection) => {
    const projection = projectRuntimeEdge(
      connection,
      nodesById,
      props.viewport,
      props.portPositions,
    )
    return projection ? [projection] : []
  })
})
</script>

<template>
  <svg class="runtime-edge-layer" aria-hidden="true">
    <path
      v-for="edge in edges"
      :key="edge.connection.id"
      :d="edge.path"
      data-runtime-edge-path
      :data-runtime-edge="edge.connection.id"
      :data-edge-state="selectedNodeId === edge.connection.from || selectedNodeId === edge.connection.to ? 'selected' : 'rest'"
    />
    <path
      v-if="draft"
      class="runtime-edge-layer__draft"
      :d="runtimeEdgePath(draft.start, draft.current)"
      data-runtime-draft-edge
    />
  </svg>
</template>

<style scoped lang="scss">
.runtime-edge-layer {
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

path {
  fill: none;
  stroke: var(--canvas-edge);
  stroke-linecap: round;
  stroke-width: 1.4;
  vector-effect: non-scaling-stroke;
}

path[data-edge-state='selected'] {
  stroke: color-mix(in oklab, var(--v2-accent) 72%, white);
  stroke-width: 2;
}

.runtime-edge-layer__draft {
  stroke: var(--v2-accent-hover);
  stroke-dasharray: 5 5;
  stroke-width: 2;
}
</style>
