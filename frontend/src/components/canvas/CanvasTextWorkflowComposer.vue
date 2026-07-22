<script setup lang="ts">
import { ArrowLeft, Send } from 'lucide-vue-next'
import { ref } from 'vue'
import type { CanvasCardWorkModeId } from './canvas-card-work-model'

const props = defineProps<{ mode: CanvasCardWorkModeId; title: string }>()
const emit = defineEmits<{ cancel: []; submit: [prompt: string] }>()
const prompt = ref('')

function submit() {
  const value = prompt.value.trim()
  if (value) emit('submit', value)
}
</script>

<template>
  <form class="canvas-text-workflow-composer" :aria-label="`${title} ${mode === 'text-to-video' ? '文生视频' : '文本工作流'}`" @submit.prevent="submit" @pointerdown.stop @click.stop>
    <header><button type="button" aria-label="返回文本卡片模式" @click="emit('cancel')"><ArrowLeft :size="14" aria-hidden="true" /></button><strong>{{ mode === 'text-to-video' ? '文生视频' : '文本工作流' }}</strong></header>
    <textarea v-model="prompt" autofocus aria-label="文本工作流提示词" maxlength="8000" placeholder="描述要生成的视频内容、镜头和氛围"></textarea>
    <button class="submit" type="submit" :disabled="!prompt.trim()"><Send :size="14" aria-hidden="true" />创建视频卡片</button>
  </form>
</template>

<style scoped lang="scss">
.canvas-text-workflow-composer { display: grid; box-sizing: border-box; width: 100%; height: 100%; gap: 7px; padding: 9px; border: 1px solid var(--v2-accent); border-radius: var(--v2-radius-md); background: var(--v2-surface-1); pointer-events: auto; }
header { display: flex; align-items: center; gap: 6px; color: var(--v2-text-primary); font-size: 11px; }
button { display: inline-flex; min-height: 28px; align-items: center; justify-content: center; gap: 5px; padding: 0 8px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-2); font: inherit; font-size: 10px; cursor: pointer; }
header button { width: 28px; padding: 0; }
textarea { box-sizing: border-box; width: 100%; min-height: 56px; resize: none; padding: 7px 8px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-canvas); font: inherit; font-size: 11px; }
.submit { justify-self: end; border-color: var(--v2-accent); color: var(--v2-text-on-accent); background: var(--v2-accent); }
button:disabled { cursor: not-allowed; opacity: .42; }
button:focus-visible, textarea:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
</style>
