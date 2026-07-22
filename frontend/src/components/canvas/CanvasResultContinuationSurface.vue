<script setup lang="ts">
import { GitBranch, Image, Video } from 'lucide-vue-next'
import type { ResultBranchMediaType } from '../../modules/canvas/resource-commands'

defineEmits<{
  branch: [mediaType: ResultBranchMediaType]
}>()
</script>

<template>
  <section
    class="canvas-result-continuation"
    role="region"
    aria-label="以此结果继续创作"
    @pointerdown.stop
  >
    <div class="canvas-result-continuation__summary">
      <GitBranch :size="16" aria-hidden="true" />
      <span><strong>以此结果继续</strong><small>作为参考图</small></span>
    </div>
    <div class="canvas-result-continuation__actions" role="group" aria-label="续创类型">
      <button type="button" aria-label="以此结果创建图片生成" @click.stop="$emit('branch', 'image')">
        <Image :size="15" aria-hidden="true" />图片
      </button>
      <button type="button" aria-label="以此结果创建视频生成" @click.stop="$emit('branch', 'video')">
        <Video :size="15" aria-hidden="true" />视频
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.canvas-result-continuation {
  position: absolute;
  z-index: 8;
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-sm);
  background: color-mix(in oklch, var(--v2-surface-2) 96%, transparent);
  box-shadow: var(--v2-shadow-floating);
  pointer-events: auto;
  backdrop-filter: blur(10px);
}

.canvas-result-continuation__summary,
.canvas-result-continuation__summary span,
.canvas-result-continuation__actions {
  display: flex;
  min-width: 0;
  align-items: center;
}

.canvas-result-continuation__summary { gap: 8px; color: var(--v2-text-secondary); }
.canvas-result-continuation__summary span { display: grid; gap: 1px; }
.canvas-result-continuation__summary strong { color: var(--v2-text-primary); font-size: 11px; font-weight: 600; white-space: nowrap; }
.canvas-result-continuation__summary small { color: var(--v2-text-muted); font-size: 9px; white-space: nowrap; }
.canvas-result-continuation__actions { gap: 5px; }

.canvas-result-continuation__actions button {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  gap: 5px;
  padding: 0 9px;
  border: 1px solid var(--v2-border-subtle);
  border-radius: var(--v2-radius-xs);
  color: var(--v2-text-secondary);
  background: var(--v2-surface-1);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.canvas-result-continuation__actions button:hover {
  color: var(--v2-text-primary);
  border-color: var(--v2-border-strong);
  background: var(--v2-accent-soft);
}

.canvas-result-continuation__actions button:focus-visible {
  outline: 2px solid var(--v2-focus-ring);
  outline-offset: 1px;
}
</style>
