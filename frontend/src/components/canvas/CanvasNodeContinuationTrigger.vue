<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { CanvasNode } from '../../types/canvas'

const props = defineProps<{
  node: CanvasNode
  portId: string
  surfaceNodeRectStyle: (node: CanvasNode) => Record<string, string>
}>()
const emit = defineEmits<{ open: [nodeId: string, portId: string] }>()
function open() { emit('open', props.node.id, props.portId) }
</script>

<template>
  <div class="node-continuation-anchor" :style="surfaceNodeRectStyle(node)">
    <button
      type="button"
      aria-label="继续此节点"
      title="继续此节点"
      @pointerdown.stop
      @click.stop="open"
      @keydown.enter.stop.prevent="open"
      @keydown.space.stop.prevent="open"
    >
      <Plus :size="16" :stroke-width="2" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.node-continuation-anchor {
  position: absolute;
  z-index: 4;
  pointer-events: none;
}
button {
  position: absolute;
  top: 50%;
  right: -50px;
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  place-items: center;
  border: 1px solid var(--v2-border-standard, var(--border-standard));
  border-radius: var(--v2-radius-pill, 999px);
  color: var(--v2-text-secondary, var(--text-secondary));
  background: var(--v2-surface-3, var(--bg-panel-raised));
  box-shadow: var(--shadow-floating, var(--shadow-soft));
  cursor: pointer;
  pointer-events: auto;
  transform: translateY(-50%);
  transform-origin: center;
  transition: color 140ms ease, background-color 140ms ease, border-color 140ms ease, opacity 140ms ease, transform 140ms cubic-bezier(0.16, 1, 0.3, 1);
}
button::before { position: absolute; inset: -2px; content: ''; }
button:focus-visible { outline: 2px solid var(--v2-focus-ring, var(--accent-select)); outline-offset: 2px; }
button:active { transform: translateY(-50%) scale(0.96); }
@media (hover: hover) {
  button:hover {
    border-color: var(--v2-accent);
    color: var(--v2-accent);
    background: var(--v2-accent-soft);
    transform: translateY(-50%) scale(1.04);
  }
}
@media (prefers-reduced-motion: reduce) { button { transition: none; } }
</style>
