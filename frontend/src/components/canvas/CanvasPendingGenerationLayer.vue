<script setup lang="ts">
import { Image as ImageIcon, Video as VideoIcon } from 'lucide-vue-next'
import type { CSSProperties } from 'vue'
import type { GenerationResultProjection } from '../../modules/canvas/generation-result-projection'
import { formatGenerationProgressPercent } from '../../modules/canvas/generation-runtime-presentation'
import type { ViewportState } from './canvas-geometry'
import { worldToSurface } from './canvas-geometry'

const props = defineProps<{
  projections: readonly GenerationResultProjection[]
  viewport: ViewportState
}>()

function projectionStyle(projection: GenerationResultProjection): CSSProperties {
  const position = worldToSurface(projection, props.viewport)
  return {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${projection.width}px`,
    height: `${projection.height}px`,
    transform: `scale(${props.viewport.zoom})`,
    transformOrigin: 'top left',
  }
}

function progressFillStyle(projection: GenerationResultProjection): CSSProperties {
  const percent = projection.presentation.progressPercent
  if (percent !== null) return { width: `${percent}%` }
  return projection.presentation.isIndeterminate ? { left: '12%', width: '24%' } : { width: '0' }
}
</script>

<template>
  <div class="pending-generation-layer" aria-hidden="true">
    <div
      v-for="projection in projections"
      :key="projection.key"
      class="pending-generation"
      :class="[`is-${projection.mediaType}`, `is-${projection.presentation.tone}`]"
      :style="projectionStyle(projection)"
      :data-world-x="projection.x"
      :data-world-y="projection.y"
      data-pending-generation
      aria-hidden="true"
    >
      <div class="pending-generation__media">
        <component :is="projection.mediaType === 'video' ? VideoIcon : ImageIcon" :size="36" stroke-width="1.5" />
        <strong>{{ projection.mediaType === 'video' ? '视频生成中' : '图片生成中' }}</strong>
      </div>
      <div class="pending-generation__status">
        <span>{{ projection.presentation.label }}</span>
        <span v-if="projection.presentation.progressPercent !== null" class="pending-generation__percent">
          {{ formatGenerationProgressPercent(projection.presentation.progressPercent) }}
        </span>
      </div>
      <div class="pending-generation__rail">
        <span
          class="pending-generation__fill"
          :class="{ 'is-indeterminate': projection.presentation.isIndeterminate }"
          :style="progressFillStyle(projection)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pending-generation-layer {
  position: absolute;
  z-index: 2;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.pending-generation {
  position: absolute;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 1fr 40px 3px;
  overflow: hidden;
  border: 1px dashed color-mix(in oklch, var(--warning) 58%, var(--border-subtle));
  border-radius: var(--v2-radius-md);
  color: var(--text-secondary);
  background: color-mix(in oklch, var(--canvas-node-surface) 88%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--warning) 10%, transparent);
  pointer-events: none;
}

.pending-generation__media {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  color: var(--text-muted);
}

.pending-generation__media strong {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.pending-generation__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 0 16px;
  border-top: 1px solid var(--border-subtle);
  color: var(--warning);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

.pending-generation__percent {
  flex: 0 0 auto;
  margin-left: 12px;
  font-variant-numeric: tabular-nums;
}

.pending-generation__rail {
  position: relative;
  overflow: hidden;
  background: color-mix(in oklch, var(--text-primary) 10%, transparent);
}

.pending-generation__fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--warning);
}

@media (prefers-reduced-motion: reduce) {
  .pending-generation,
  .pending-generation__fill { transition: none; animation: none; }
}
</style>
