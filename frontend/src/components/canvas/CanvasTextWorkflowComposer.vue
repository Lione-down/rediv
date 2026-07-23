<script setup lang="ts">
import { ArrowLeft, Send } from 'lucide-vue-next'
import { ref } from 'vue'
import type { CanvasCardWorkModeId } from './canvas-card-work-model'
import type { TextGenerationModel } from '../../modules/canvas/script-authoring'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'

const props = withDefaults(defineProps<{
  busy?: boolean
  error?: string
  mode: CanvasCardWorkModeId
  models: readonly TextGenerationModel[]
  runtimePresentation?: GenerationRuntimePresentation | null
  title: string
}>(), {
  busy: false,
  error: '',
  runtimePresentation: null,
})
const emit = defineEmits<{ cancel: []; submit: [prompt: string, modelId: string] }>()
const prompt = ref('')
const modelId = ref('')

function submit() {
  const value = prompt.value.trim()
  if (value && modelId.value && !props.busy) emit('submit', value, modelId.value)
}
</script>

<template>
  <form class="canvas-text-workflow-composer" :aria-label="`${title} 文生视频`" @submit.prevent="submit" @pointerdown.stop @click.stop>
    <header><button type="button" aria-label="返回文本卡片模式" @click="emit('cancel')"><ArrowLeft :size="14" aria-hidden="true" /></button><strong>文生视频 · 结果写回当前卡片</strong></header>
    <label>模型
      <select v-model="modelId" aria-label="文本生成模型" :disabled="busy">
        <option value="" disabled>请选择模型</option>
        <option v-for="model in models" :key="model.id" :value="model.id">{{ model.label }}</option>
      </select>
    </label>
    <textarea v-model="prompt" autofocus aria-label="文本工作流提示词" maxlength="8000" placeholder="描述要生成的文本内容、镜头和氛围"></textarea>
    <p v-if="error" class="message error" role="alert">{{ error }}</p>
    <p v-else-if="runtimePresentation" class="message" aria-live="polite">{{ runtimePresentation.label }}</p>
    <button class="submit" type="submit" :disabled="busy || !prompt.trim() || !modelId"><Send :size="14" aria-hidden="true" />{{ busy ? '生成中' : '生成到当前卡片' }}</button>
  </form>
</template>

<style scoped lang="scss">
.canvas-text-workflow-composer { display: grid; box-sizing: border-box; width: 100%; gap: 8px; padding: 12px; border: 1px solid var(--v2-accent); border-radius: var(--v2-radius-md); background: var(--v2-surface-1); box-shadow: var(--v2-shadow-lg); pointer-events: auto; }
header { display: flex; align-items: center; gap: 6px; color: var(--v2-text-primary); font-size: 11px; }
button { display: inline-flex; min-height: 28px; align-items: center; justify-content: center; gap: 5px; padding: 0 8px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-2); font: inherit; font-size: 10px; cursor: pointer; }
header button { width: 28px; padding: 0; }
label { display: grid; grid-template-columns: 52px minmax(0, 1fr); align-items: center; color: var(--v2-text-secondary); font-size: 10px; }
select { min-height: 30px; padding: 0 8px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-canvas); font: inherit; font-size: 11px; }
textarea { box-sizing: border-box; width: 100%; min-height: 56px; resize: none; padding: 7px 8px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-canvas); font: inherit; font-size: 11px; }
.submit { justify-self: end; border-color: var(--v2-accent); color: var(--v2-text-on-accent); background: var(--v2-accent); }
.message { margin: 0; color: var(--v2-text-secondary); font-size: 10px; }
.message.error { color: var(--v2-danger); }
button:disabled { cursor: not-allowed; opacity: .42; }
button:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
</style>
