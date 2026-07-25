<script setup lang="ts">
import { AudioLines, Ban, Clapperboard } from 'lucide-vue-next'

const props = defineProps<{
  kind: 'audio' | 'video-composition'
  placementStyle: Record<string, string>
}>()

const title = props.kind === 'audio' ? '音频生成' : '视频合成'
const message = props.kind === 'audio'
  ? '当前没有兼容的音频生成模型。未修改 Canvas、history、quota、job 或 provider。'
  : '当前 backend 未提供可执行的视频合成模型。可保留此工作流卡片，但不会创建 job。'
</script>

<template>
  <section
    class="canvas-capability-card-composer"
    :data-capability-workflow="kind"
    :style="placementStyle"
    role="status"
  >
    <header>
      <AudioLines v-if="kind === 'audio'" :size="17" aria-hidden="true" />
      <Clapperboard v-else :size="17" aria-hidden="true" />
      <strong>{{ title }}</strong>
    </header>
    <p>{{ message }}</p>
    <button type="button" disabled>
      <Ban :size="15" aria-hidden="true" />
      当前不可用
    </button>
  </section>
</template>

<style scoped lang="scss">
.canvas-capability-card-composer {
  position: absolute;
  z-index: 13;
  display: grid;
  box-sizing: border-box;
  min-height: 132px;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-lg);
  color: var(--v2-text-primary);
  background: var(--v2-surface-3);
  box-shadow: var(--v2-shadow-floating);
  pointer-events: auto;
}

header,
button {
  display: flex;
  align-items: center;
  gap: 8px;
}

p {
  margin: 0;
  color: var(--v2-text-secondary);
  font-size: 12px;
  line-height: 1.7;
}

button {
  width: max-content;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-muted);
  background: var(--v2-surface-2);
  font: inherit;
  cursor: not-allowed;
  opacity: .7;
}
</style>
