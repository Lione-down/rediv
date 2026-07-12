<script setup lang="ts">
import { PanelsTopLeft } from 'lucide-vue-next'
interface Props {
  projectContext: string
  activeToolLabel: string
  isMobilePanelOpen: boolean
  onTogglePanel: () => void
}

defineProps<Props>()
</script>

<template>
  <div class="canvas-chrome">
    <div>
      <p class="eyebrow">当前项目</p>
      <h1>{{ projectContext }}</h1>
    </div>
    <div class="canvas-status">
      <span class="status-pill">{{ activeToolLabel }}模式</span>
      <button
        class="mobile-panel-toggle focus-ring"
        type="button"
        :aria-expanded="isMobilePanelOpen"
        aria-controls="workspace-side-panel"
        @click="onTogglePanel"
      >
        <PanelsTopLeft :size="16" />
        面板
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.canvas-chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: 14px 18px var(--space-3) calc(76px + 18px);
  border-bottom: 1px solid var(--border-subtle);
  background: oklch(100% 0.004 92 / 0.64);
}

.eyebrow {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--font-size-hint);
  line-height: var(--line-height-hint);
}

.canvas-chrome h1 {
  margin: 4px 0 0;
  font-size: var(--font-size-panel-heading);
  font-weight: var(--font-weight-panel-heading);
  line-height: var(--line-height-panel-heading);
}

.canvas-status {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.status-pill {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  border-radius: var(--radius-pill);
  padding: 0 10px;
  background: var(--bg-panel-subtle);
  color: var(--text-secondary);
  font-size: var(--font-size-hint);
}

.mobile-panel-toggle {
  display: none;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 0;
  border-radius: var(--radius-sm);
  padding: 0 var(--space-3);
  color: var(--text-secondary);
  background: var(--bg-panel-subtle);
  transition:
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.mobile-panel-toggle:active {
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .mobile-panel-toggle {
    transition-duration: 0s;
  }

  .mobile-panel-toggle:active {
    transform: none;
  }
}

@media (max-width: 920px) {
  .canvas-chrome {
    padding: 12px 14px 10px calc(76px + 14px);
  }

  .canvas-chrome h1 {
    font-size: 14px;
  }

  .status-pill {
    display: none;
  }

  .mobile-panel-toggle {
    display: inline-flex;
  }
}
</style>
