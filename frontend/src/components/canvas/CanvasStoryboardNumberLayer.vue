<script setup lang="ts">
import { computed } from 'vue'
import { resolveStoryboardGroup } from '../../modules/canvas/storyboard-group'
import type { CanvasNode } from '../../types/canvas'

const props = defineProps<{
  nodes: readonly CanvasNode[]
  surfaceNodeRectStyle: (node: CanvasNode) => Record<string, string>
}>()
const entries = computed(() => props.nodes.flatMap((node) => {
  if (node.type !== 'group') return []
  const resolved = resolveStoryboardGroup(props.nodes, node.id)
  if (!resolved?.content.show_numbers) return []
  const childrenById = new Map(resolved.children.map((child) => [child.id, child]))
  return resolved.content.ordered_child_ids.flatMap((childId, index) => {
    const child = childrenById.get(childId)
    return child ? [{ child, number: index + 1 }] : []
  })
}))
</script>

<template>
  <div class="storyboard-number-layer" aria-hidden="true">
    <div v-for="entry in entries" :key="entry.child.id" class="storyboard-number-anchor" :style="surfaceNodeRectStyle(entry.child)">
      <span class="storyboard-frame-number">{{ entry.number }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.storyboard-number-layer { position: absolute; z-index: 3; inset: 0; pointer-events: none; }
.storyboard-number-anchor { position: absolute; pointer-events: none; }
.storyboard-frame-number { position: absolute; right: 8px; bottom: 8px; display: grid; min-width: 26px; height: 26px; place-items: center; padding: 0 6px; border: 1px solid var(--v2-border-strong); border-radius: var(--v2-radius-pill); color: var(--v2-text-primary); background: var(--v2-surface-1); box-shadow: var(--v2-shadow-floating); font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }
</style>
