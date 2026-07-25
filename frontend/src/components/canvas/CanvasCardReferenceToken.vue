<script setup lang="ts">
import type { CanvasCardReference } from '../../modules/canvas/canvas-card-view-model'

defineProps<{
  reference: CanvasCardReference
}>()

const emit = defineEmits<{
  reorder: [direction: -1 | 1]
}>()

function handleKeydown(event: KeyboardEvent) {
  if (!event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
  event.preventDefault()
  emit('reorder', event.key === 'ArrowLeft' ? -1 : 1)
}
</script>

<template>
  <button
    type="button"
    class="canvas-card-reference-token"
    :data-reference-role="reference.role"
    :data-reference-order="reference.order"
    :aria-label="`${reference.displayName}，${reference.role}`"
    aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
    @keydown="handleKeydown"
  >
    <img
      v-if="reference.thumbnailUrl"
      :src="reference.thumbnailUrl"
      :alt="reference.displayName"
    />
    <span v-else class="canvas-card-reference-token__placeholder" aria-hidden="true" />
    <span class="canvas-card-reference-token__name">{{ reference.displayName }}</span>
    <small>{{ reference.role }}</small>
  </button>
</template>

<style scoped lang="scss">
.canvas-card-reference-token {
  display: inline-flex;
  max-width: 100%;
  height: 30px;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 3px;
  border: 1px solid color-mix(in oklch, var(--v2-accent) 28%, var(--border-subtle));
  border-radius: 999px;
  color: var(--v2-text-primary);
  background: color-mix(in oklch, var(--v2-accent-soft) 44%, var(--bg-panel-raised));
  font: inherit;
  font-size: 11px;
  cursor: default;
}

.canvas-card-reference-token img,
.canvas-card-reference-token__placeholder {
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg-panel-subtle);
}

.canvas-card-reference-token__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.canvas-card-reference-token small {
  flex: none;
  color: var(--v2-text-muted);
  font-size: 9px;
}

.canvas-card-reference-token:focus-visible {
  outline: 2px solid var(--v2-focus-ring, var(--accent-select));
  outline-offset: 2px;
}
</style>
