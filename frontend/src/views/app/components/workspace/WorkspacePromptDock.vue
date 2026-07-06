<script setup lang="ts">
import { AlertTriangle, PanelsTopLeft, Play, WandSparkles } from 'lucide-vue-next'
import { NButton, NTag } from 'naive-ui'
import type { CanvasNode } from '../../../../types/canvas'

interface Props {
  selectedNode: CanvasNode | null
  selectedTitle: string
  isQuotaInsufficient: boolean
  isGenerating: boolean
  generationButtonLabel: string
  lastErrorMessage: string
  drawerOpen: boolean
  onTogglePanel: () => void
  onGenerate: () => void
}

const { drawerOpen } = defineProps<Props>()
</script>

<template>
  <footer
    v-show="!drawerOpen"
    class="prompt-dock"
    aria-label="Prompt 输入区"
  >
    <div class="dock-copy">
      <WandSparkles :size="18" />
      <span v-if="selectedNode">
        继续处理「{{ selectedTitle }}」节点的生成任务。
      </span>
      <span v-else>
        请选择一个节点后开始生成。
      </span>
    </div>
    <div class="dock-actions">
      <div v-if="isQuotaInsufficient" class="quota-warning">
        <n-tag type="warning" size="small" round>
          额度不足
        </n-tag>
      </div>
      <button class="panel-action focus-ring" type="button" @click="onTogglePanel">
        <PanelsTopLeft :size="16" />
        面板
      </button>
      <n-button
        class="generate-action focus-ring"
        strong
        :loading="isGenerating"
        :disabled="!selectedNode"
        @click="onGenerate"
      >
        <template #icon>
          <Play :size="17" />
        </template>
        {{ generationButtonLabel }}
      </n-button>
    </div>
    <div v-if="lastErrorMessage" class="dock-feedback dock-feedback-error">
      <AlertTriangle :size="15" />
      <span>{{ lastErrorMessage }}</span>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.prompt-dock {
  position: fixed;
  right: 340px;
  bottom: 18px;
  left: 88px;
  z-index: 12;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px 14px;
  min-height: 58px;
  padding: 9px 10px 9px var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: oklch(100% 0.004 92 / 0.88);
  box-shadow: var(--shadow-soft);
}

.dock-copy,
.dock-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dock-copy {
  min-width: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.dock-copy span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dock-actions {
  justify-content: flex-end;
}

.quota-warning {
  display: inline-flex;
}

.dock-feedback {
  grid-column: 1 / -1;
}

.generate-action {
  --n-border: none;
  --n-border-hover: none;
  --n-border-pressed: none;
  --n-border-focus: none;
  --n-color: var(--accent-generate);
  --n-color-hover: var(--accent-generate-hover);
  --n-color-pressed: var(--accent-generate-hover);
  --n-color-focus: var(--accent-generate-hover);
  --n-text-color: white;
  --n-text-color-hover: white;
  --n-text-color-pressed: white;
  --n-text-color-focus: white;
  --n-border-radius: var(--radius-sm);
  --n-padding: 0 14px;
  --n-height: 38px;
  --n-font-weight: 600;
}

.panel-action {
  display: inline-flex;
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

.panel-action:active {
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .panel-action {
    transition-duration: 0s;
  }

  .panel-action:active {
    transform: none;
  }
}

@media (max-width: 920px) {
  .prompt-dock {
    right: 12px;
    bottom: 86px;
    left: 12px;
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .dock-copy,
  .dock-actions {
    width: 100%;
  }

  .dock-actions {
    flex-wrap: wrap;
    justify-content: stretch;
  }

  .dock-actions > * {
    flex: 1;
  }

  .panel-action {
    display: inline-flex;
  }
}

@media (max-width: 560px) {
  .prompt-dock {
    bottom: 84px;
    padding: 10px;
    border-radius: 16px;
  }

  .dock-copy {
    font-size: 13px;
  }
}
</style>
