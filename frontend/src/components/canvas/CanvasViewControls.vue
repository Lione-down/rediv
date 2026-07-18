<script setup lang="ts">
import {
  GitBranch, Grid3X3, Library, Map, Scan, ScanSearch, SlidersHorizontal, Workflow,
} from 'lucide-vue-next'

defineProps<{
  areEdgesVisible: boolean
  canAutoArrange: boolean
  canFitSelection: boolean
  isGridEnabled: boolean
  isMinimapVisible: boolean
  readonly: boolean
  resourcesOpen: boolean
}>()

const emit = defineEmits<{
  autoArrange: []
  fitGraph: []
  fitSelection: []
  toggleResources: [opener: HTMLElement]
  toggleEdges: []
  toggleGrid: []
  toggleMinimap: []
}>()

function toggleResources(event: MouseEvent) {
  if (event.currentTarget instanceof HTMLElement) emit('toggleResources', event.currentTarget)
}
</script>

<template>
  <div class="view-controls" role="group" aria-label="画布视图控制">
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

  </div>
</template>

<style scoped lang="scss">
.view-controls,
.view-menu-panel {
  display: flex;
  align-items: center;
}

.view-controls {
  flex-direction: column;
  gap: 4px;
  color: var(--text-primary);
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
  top: -3px;
  left: calc(100% + 10px);
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--bg-panel);
  box-shadow: var(--shadow-floating, var(--shadow-soft));
}

button:disabled { opacity: 0.38; cursor: not-allowed; }
button:active:not(:disabled), summary:active { transform: scale(var(--v2-press-scale, 0.96)); }
button:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--v2-focus-ring, var(--accent-select));
  outline-offset: 2px;
}

@media (hover: hover) {
  button:not(:disabled):hover,
  summary:hover { color: var(--v2-accent, var(--accent-select)); background: var(--bg-panel-subtle); }
}

@media (prefers-reduced-motion: reduce) {
  button:active:not(:disabled), summary:active { transform: none; }
}
</style>
