<script setup lang="ts">
import { AlertTriangle, CircleCheck, Info, LoaderCircle, Play, Sparkles, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import type { ProjectGenerationTask } from '../../modules/canvas/project-resource-types'
import type { CanvasNode } from '../../types/canvas'

const props = withDefaults(defineProps<{
  error?: string
  isGenerating?: boolean
  latestTask?: ProjectGenerationTask | null
  mediaType?: 'image' | 'video' | null
  mode: 'panel' | 'drawer'
  node: CanvasNode
  quota?: number
  readonly?: boolean
  success?: string
}>(), {
  error: '',
  isGenerating: false,
  latestTask: null,
  mediaType: null,
  quota: 0,
  readonly: false,
  success: '',
})

const emit = defineEmits<{
  close: []
  generate: [prompt: string]
  updatePrompt: [prompt: string]
}>()

const prompt = ref(props.node.content?.trim() || '')
const canGenerate = computed(() => Boolean(props.mediaType && prompt.value.trim() && props.quota > 0 && !props.isGenerating))
const generationLabel = computed(() => props.mediaType === 'video' ? '视频' : '图片')
const statusLabel = computed(() => {
  if (props.isGenerating) return '生成中'
  if (props.success) return '已完成'
  if (props.latestTask?.status === 'succeeded') return '已完成'
  if (props.latestTask?.status === 'failed') return '失败'
  if (props.latestTask?.status === 'timed_out') return '已超时'
  if (props.latestTask?.status === 'running') return '生成中'
  if (props.latestTask?.status === 'queued') return '排队中'
  return props.mediaType ? '准备就绪' : '只读详情'
})

watch(() => props.node.id, () => {
  prompt.value = props.node.content?.trim() || ''
}, { flush: 'sync' })

watch(() => props.node.content, (content) => {
  if (document.activeElement?.getAttribute('aria-label') !== '生成提示词') prompt.value = content?.trim() || ''
})

function updatePrompt(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value
  prompt.value = value
  emit('updatePrompt', value)
}

function requestGeneration() {
  if (!canGenerate.value) return
  emit('generate', prompt.value.trim())
}
</script>

<template>
  <aside class="context-panel" :class="`is-${mode}`" :aria-label="`节点详情 ${node.title}`">
    <header>
      <div><Sparkles v-if="mediaType" :size="18" aria-hidden="true" /><Info v-else :size="18" aria-hidden="true" /><span><strong>{{ node.title }}</strong><small>{{ node.type }} · {{ String(node.contentData?.subtype || node.type) }}</small></span></div>
      <button type="button" aria-label="关闭节点详情" title="关闭节点详情" @click="emit('close')"><X :size="18" aria-hidden="true" /></button>
    </header>

    <section v-if="mediaType" class="generation-editor" role="region" aria-label="生成任务编辑器">
      <div class="section-heading"><span>{{ generationLabel }}生成</span><span>剩余 {{ quota }}</span></div>
      <label v-if="!readonly" class="prompt-field">
        <span>生成提示词</span>
        <textarea :value="prompt" rows="6" maxlength="4000" aria-label="生成提示词" @input="updatePrompt"></textarea>
      </label>
      <div v-else class="review-prompt"><span>生成提示词</span><p>{{ prompt || '未填写提示词' }}</p></div>

      <button
        v-if="!readonly"
        type="button"
        class="generate-button"
        :disabled="!canGenerate"
        :aria-label="`开始${generationLabel}生成`"
        @click="requestGeneration"
      >
        <LoaderCircle v-if="isGenerating" :size="17" class="is-spinning" aria-hidden="true" />
        <Play v-else :size="17" aria-hidden="true" />
        {{ isGenerating ? `${generationLabel}生成中` : `开始${generationLabel}生成` }}
      </button>

      <p class="generation-status" role="status" aria-label="生成状态">
        <LoaderCircle v-if="isGenerating" :size="15" class="is-spinning" aria-hidden="true" />
        <CircleCheck v-else-if="statusLabel === '已完成'" :size="15" aria-hidden="true" />
        <span>{{ statusLabel }}</span>
        <small v-if="latestTask">{{ latestTask.id }}</small>
      </p>
      <p v-if="error" class="feedback is-error" role="alert"><AlertTriangle :size="15" aria-hidden="true" />{{ error }}。结果未扣费，可在确认服务恢复后手动重试。</p>
      <p v-else-if="success" class="feedback is-success"><CircleCheck :size="15" aria-hidden="true" />{{ success }}</p>
      <p v-else-if="latestTask?.error_message" class="feedback is-error" role="alert"><AlertTriangle :size="15" aria-hidden="true" />{{ latestTask.error_message }}</p>
    </section>

    <section v-else class="node-review" aria-label="节点内容">
      <dl><div><dt>节点类型</dt><dd>{{ node.type }}</dd></div><div><dt>状态</dt><dd>{{ node.status || 'idle' }}</dd></div><div><dt>位置</dt><dd>{{ Math.round(node.x) }}, {{ Math.round(node.y) }}</dd></div></dl>
      <div class="review-prompt"><span>内容</span><p>{{ node.content || '此节点没有文本内容。' }}</p></div>
    </section>
  </aside>
</template>

<style scoped lang="scss">
.context-panel { display: flex; width: 360px; max-width: 100vw; height: 100%; flex-direction: column; overflow: hidden; border: 1px solid var(--v2-border-standard); color: var(--v2-text-primary); background: var(--v2-surface-2); box-shadow: var(--v2-shadow-floating); }
.context-panel.is-panel { border-radius: var(--v2-radius-md); }
.context-panel.is-drawer { border-width: 0 0 0 1px; }
header, header > div, header span, .section-heading, .generation-status, .feedback, dl > div { display: flex; }
header { min-height: 56px; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 10px 8px 16px; border-bottom: 1px solid var(--v2-border-subtle); }
header > div { min-width: 0; align-items: center; gap: 9px; }
header span { min-width: 0; flex-direction: column; }
header strong, header small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
header strong { font-size: 13px; }
header small { color: var(--v2-text-secondary); font-size: 11px; }
button { min-width: 40px; min-height: 40px; border: 0; border-radius: var(--v2-radius-md); color: inherit; background: transparent; cursor: pointer; transition: color var(--v2-duration-fast), background-color var(--v2-duration-fast), transform var(--v2-duration-fast); }
button:active:not(:disabled) { transform: scale(var(--v2-press-scale)); }
button:focus-visible, textarea:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
button:disabled { opacity: .42; cursor: not-allowed; }
.generation-editor, .node-review { min-height: 0; flex: 1; overflow: auto; padding: 16px; }
.section-heading { align-items: center; justify-content: space-between; margin-bottom: 14px; color: var(--v2-text-secondary); font-size: 12px; }
.prompt-field, .review-prompt { display: grid; gap: 7px; color: var(--v2-text-secondary); font-size: 11px; }
textarea { width: 100%; resize: vertical; min-height: 132px; padding: 10px 11px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-md); color: var(--v2-text-primary); background: var(--v2-canvas); font: inherit; line-height: 1.6; }
.generate-button { display: flex; width: 100%; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; color: var(--v2-text-on-accent); background: var(--v2-accent); font-weight: 600; }
.generation-status { min-height: 42px; align-items: center; gap: 7px; margin: 14px 0 0; padding: 8px 10px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); color: var(--v2-text-secondary); background: var(--v2-surface-1); font-size: 12px; }
.generation-status small { margin-left: auto; color: var(--v2-text-muted); }
.feedback { align-items: flex-start; gap: 7px; margin: 10px 0 0; padding: 9px 10px; border-radius: var(--v2-radius-md); font-size: 12px; line-height: 1.55; }
.feedback.is-error { color: var(--v2-danger); background: color-mix(in oklch, var(--v2-danger) 10%, transparent); }
.feedback.is-success { color: var(--v2-success); background: color-mix(in oklch, var(--v2-success) 10%, transparent); }
.review-prompt p { margin: 0; padding: 11px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); color: var(--v2-text-primary); background: var(--v2-surface-1); font-size: 12px; line-height: 1.65; white-space: pre-wrap; }
dl { display: grid; gap: 1px; margin: 0 0 16px; overflow: hidden; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); background: var(--v2-border-subtle); }
dl > div { justify-content: space-between; gap: 12px; padding: 9px 10px; background: var(--v2-surface-1); }
dt, dd { margin: 0; font-size: 12px; }
dt { color: var(--v2-text-secondary); }
.is-spinning { animation: context-spin 900ms linear infinite; }
@keyframes context-spin { to { transform: rotate(360deg); } }
@media (hover: hover) { button:not(:disabled):hover { color: var(--v2-accent); background: var(--v2-surface-3); } .generate-button:hover { color: var(--v2-text-on-accent); background: var(--v2-accent-hover); } }
@media (prefers-reduced-motion: reduce) { button { transition: none; } button:active:not(:disabled) { transform: none; } .is-spinning { animation: none; } }
</style>
