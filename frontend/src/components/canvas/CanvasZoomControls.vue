<script setup lang="ts">
import { Link, Minus, Plus, Users } from 'lucide-vue-next'

defineProps<{ zoomPercent: number }>()

const emit = defineEmits<{
  setZoom: [percent: number]
  zoomIn: []
  zoomOut: []
}>()

function commitZoom(event: Event) {
  emit('setZoom', Number((event.target as HTMLInputElement).value))
}

function handleZoomKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  event.preventDefault()
  commitZoom(event)
  ;(event.target as HTMLInputElement).blur()
}
</script>

<template>
  <div class="zoom-controls" role="group" aria-label="缩放">
    <button type="button" aria-label="画布协作暂不可用" title="画布协作（暂不可用）" disabled>
      <Users :size="16" aria-hidden="true" />
    </button>
    <button type="button" aria-label="共享链接暂不可用" title="共享链接（暂不可用）" disabled>
      <Link :size="16" aria-hidden="true" />
    </button>
    <button type="button" aria-label="缩小画布" title="缩小画布 (Ctrl+-)" @click="emit('zoomOut')">
      <Minus :size="16" aria-hidden="true" />
    </button>
    <label class="zoom-entry">
      <span class="sr-only">缩放百分比，范围 10 到 800</span>
      <input
        type="number"
        inputmode="numeric"
        min="10"
        max="800"
        step="1"
        :value="zoomPercent"
        aria-label="缩放百分比"
        title="直接输入 10% 到 800%"
        @change="commitZoom"
        @keydown="handleZoomKeyDown"
      />
      <span aria-hidden="true">%</span>
    </label>
    <button type="button" aria-label="放大画布" title="放大画布 (Ctrl++)" @click="emit('zoomIn')">
      <Plus :size="16" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.zoom-controls {
  position: absolute;
  z-index: 7;
  bottom: 20px;
  left: 20px;
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 1px;
  padding: 2px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  background: var(--bg-panel);
  box-shadow: var(--shadow-soft);
}

button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: var(--radius-md);
  color: inherit;
  background: transparent;
  cursor: pointer;
  transition: color var(--v2-duration-fast, 120ms), background-color var(--v2-duration-fast, 120ms), transform var(--v2-duration-fast, 120ms);
}

.zoom-entry {
  display: flex;
  width: 64px;
  height: 40px;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.zoom-entry input {
  width: 38px;
  border: 0;
  outline: 0;
  color: var(--text-primary);
  background: transparent;
  font: inherit;
  font-variant-numeric: tabular-nums;
  text-align: right;
  appearance: textfield;
}

.zoom-entry input::-webkit-inner-spin-button { appearance: none; }
.zoom-entry:focus-within { border-radius: var(--radius-sm); outline: 2px solid var(--v2-focus-ring, var(--accent-select)); outline-offset: -2px; }
button:active { transform: scale(var(--v2-press-scale, 0.96)); }
button:disabled { color: var(--v2-text-muted); cursor: not-allowed; opacity: 0.42; }
button:focus-visible { outline: 2px solid var(--v2-focus-ring, var(--accent-select)); outline-offset: 2px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (hover: hover) {
  button:hover:not(:disabled) { color: var(--v2-accent, var(--accent-select)); background: var(--bg-panel-subtle); }
}

@media (max-width: 920px) {
  .zoom-controls { bottom: 14px; left: 14px; }
}

@media (max-width: 720px) {
  .zoom-controls { bottom: max(104px, calc(env(safe-area-inset-bottom) + 88px)); left: 12px; }
  .zoom-entry { width: 58px; }
}

@media (prefers-reduced-motion: reduce) {
  button { transition: none; }
  button:active { transform: none; }
}
</style>
