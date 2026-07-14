<script setup lang="ts">
import {
  GitBranch, Grid3X3, Library, Map, Minus, Plus, Scan, ScanSearch, SlidersHorizontal, Workflow,
} from 'lucide-vue-next'

defineProps<{
  areEdgesVisible: boolean
  canAutoArrange: boolean
  canFitSelection: boolean
  isGridEnabled: boolean
  isMinimapVisible: boolean
  readonly: boolean
  resourcesOpen: boolean
  zoomPercent: number
}>()

const emit = defineEmits<{
  autoArrange: []
  fitGraph: []
  fitSelection: []
  setZoom: [percent: number]
  toggleResources: [opener: HTMLElement]
  toggleEdges: []
  toggleGrid: []
  toggleMinimap: []
  zoomIn: []
  zoomOut: []
}>()

function commitZoom(event: Event) {
  const input = event.target as HTMLInputElement
  emit('setZoom', Number(input.value))
}

function handleZoomKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  event.preventDefault()
  commitZoom(event)
  ;(event.target as HTMLInputElement).blur()
}

function toggleResources(event: MouseEvent) {
  if (event.currentTarget instanceof HTMLElement) emit('toggleResources', event.currentTarget)
}
</script>

<template>
  <div class="view-controls" role="toolbar" aria-label="画布视图控制">
    <button
      type="button"
      aria-label="打开项目资源"
      title="项目资源"
      :aria-expanded="resourcesOpen"
      @click="toggleResources"
    ><Library :size="17" aria-hidden="true" /></button>

    <details class="view-menu">
      <summary aria-label="打开视图选项" title="视图选项">
        <SlidersHorizontal :size="17" aria-hidden="true" />
      </summary>
      <div class="view-menu-panel" role="group" aria-label="视图选项">
        <button
          type="button"
          :aria-pressed="isGridEnabled"
          :aria-label="isGridEnabled ? '隐藏网格与吸附' : '显示网格与吸附'"
          :title="isGridEnabled ? '隐藏网格与吸附' : '显示网格与吸附'"
          @click="emit('toggleGrid')"
        ><Grid3X3 :size="17" aria-hidden="true" /></button>
        <button
          type="button"
          :aria-pressed="areEdgesVisible"
          :aria-label="areEdgesVisible ? '隐藏连线' : '显示连线'"
          :title="areEdgesVisible ? '隐藏连线' : '显示连线'"
          @click="emit('toggleEdges')"
        ><GitBranch :size="17" aria-hidden="true" /></button>
        <button
          type="button"
          :aria-pressed="isMinimapVisible"
          :aria-label="isMinimapVisible ? '隐藏小地图' : '显示小地图'"
          :title="isMinimapVisible ? '隐藏小地图' : '显示小地图'"
          @click="emit('toggleMinimap')"
        ><Map :size="17" aria-hidden="true" /></button>
        <button type="button" aria-label="适配全部节点" title="适配全部节点 (Ctrl+0)" @click="emit('fitGraph')">
          <Scan :size="17" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="适配所选节点"
          title="适配所选节点"
          :disabled="!canFitSelection"
          @click="emit('fitSelection')"
        ><ScanSearch :size="17" aria-hidden="true" /></button>
      </div>
    </details>

    <button
      v-if="!readonly"
      type="button"
      aria-label="自动排列节点"
      title="自动排列节点 (Alt+Shift+F)"
      :disabled="!canAutoArrange"
      @click="emit('autoArrange')"
    ><Workflow :size="17" aria-hidden="true" /></button>

    <div class="zoom-controls" role="group" aria-label="缩放">
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
  </div>
</template>

<style scoped lang="scss">
.view-controls,
.zoom-controls,
.view-menu-panel {
  display: flex;
  align-items: center;
}

.view-controls {
  position: absolute;
  z-index: 6;
  bottom: 20px;
  left: 20px;
  gap: 4px;
  min-height: 44px;
  padding: 2px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  background: var(--bg-panel);
  box-shadow: var(--shadow-soft);
}

.view-menu { position: relative; }
summary,
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
summary { list-style: none; }
summary::-webkit-details-marker { display: none; }
.view-menu[open] summary { color: var(--v2-accent, var(--accent-select)); background: var(--v2-accent-soft); }

.view-menu-panel {
  position: absolute;
  bottom: calc(100% + 10px);
  left: -2px;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--bg-panel);
  box-shadow: var(--shadow-floating, var(--shadow-soft));
}

.zoom-controls { gap: 1px; }
.zoom-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 40px;
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
.zoom-entry:focus-within {
  border-radius: var(--radius-sm);
  outline: 2px solid var(--v2-focus-ring, var(--accent-select));
  outline-offset: -2px;
}

button:disabled { opacity: 0.38; cursor: not-allowed; }
button:active:not(:disabled), summary:active { transform: scale(var(--v2-press-scale, 0.96)); }
button:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--v2-focus-ring, var(--accent-select));
  outline-offset: 2px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (hover: hover) {
  button:not(:disabled):hover,
  summary:hover { color: var(--v2-accent, var(--accent-select)); background: var(--bg-panel-subtle); }
}

@media (max-width: 920px) {
  .view-controls { right: auto; bottom: 14px; left: 14px; }
}

@media (max-width: 720px) {
  .view-controls { bottom: max(104px, calc(env(safe-area-inset-bottom) + 88px)); left: 12px; }
  .zoom-entry { width: 58px; }
}

@media (prefers-reduced-motion: reduce) {
  button:active:not(:disabled), summary:active { transform: none; }
}
</style>
