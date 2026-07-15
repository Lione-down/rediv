<script setup lang="ts">
import { computed } from 'vue'
import { resolveSelectionGenerationIntent } from '../../modules/canvas/selection-generation'
import type { CanvasNode } from '../../types/canvas'

const props = defineProps<{
  nodes: CanvasNode[]
  surfaceNodeRectStyle: (node: CanvasNode) => Record<string, string>
}>()

const sources = computed(() => {
  const intent = resolveSelectionGenerationIntent(props.nodes)
  if (!intent) return []
  const byId = new Map(props.nodes.map((node) => [node.id, node]))
  return intent.inputs.flatMap((input) => {
    const node = byId.get(input.nodeId)
    return node ? [{ ...input, node }] : []
  })
})
</script>

<template>
  <div
    v-for="source in sources"
    :key="source.nodeId"
    class="selection-generation-intent"
    :class="`is-${source.kind}`"
    :style="surfaceNodeRectStyle(source.node)"
    aria-hidden="true"
  >
    <span>{{ source.kind === 'text' ? 'T' : 'R' }}{{ source.order }}</span>
  </div>
</template>

<style scoped lang="scss">
.selection-generation-intent {
  position: absolute;
  z-index: 3;
  border-radius: var(--v2-radius-md);
  pointer-events: none;
}

span {
  position: absolute;
  top: -9px;
  left: -9px;
  display: grid;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  place-items: center;
  border: 1px solid color-mix(in oklch, var(--accent-select) 55%, var(--border-subtle));
  border-radius: var(--radius-pill);
  color: var(--text-primary);
  background: var(--v2-surface-3);
  box-shadow: 0 0 0 3px var(--bg-canvas);
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.is-reference span {
  color: var(--v2-text-on-accent);
  background: color-mix(in oklch, var(--accent-select) 82%, var(--v2-surface-3));
}
</style>
