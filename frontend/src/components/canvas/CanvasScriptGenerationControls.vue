<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CircleAlert, LoaderCircle, RefreshCw, Sparkles, WandSparkles, X } from 'lucide-vue-next'
import type { CanvasNode } from '../../types/canvas'
import type {
  ScriptAuthoringCapabilities,
  ScriptAuthoringIntent,
  ScriptAuthoringLocale,
} from '../../modules/canvas/script-authoring'
import type { ScriptGenerationSubmission } from './composables/use-canvas-script-generation'

const props = withDefaults(defineProps<{
  active?: boolean
  capability: ScriptAuthoringCapabilities | null
  capabilityError?: string
  capabilityLoading?: boolean
  error?: string
  initialIntent?: ScriptAuthoringIntent | null
  node: CanvasNode
  quota?: number
  readonly?: boolean
  success?: string
}>(), { active: false, capabilityError: '', capabilityLoading: false, error: '', initialIntent: null, quota: 0, readonly: false, success: '' })

const emit = defineEmits<{
  cancel: []
  generate: [submission: ScriptGenerationSubmission]
  retryCapability: []
}>()
const intent = ref<ScriptAuthoringIntent>('script_draft')
const locale = ref<ScriptAuthoringLocale>('zh-CN')
const value = ref('')
const sourceText = computed(() => {
  const raw = props.node.content ?? props.node.contentData?.text
  return typeof raw === 'string' ? raw.trim() : ''
})
const canRefine = computed(() => Boolean(sourceText.value))
const canSubmit = computed(() => Boolean(
  props.capability && props.quota > 0 && !props.readonly && !props.active && value.value.trim() &&
  (intent.value === 'script_draft' || canRefine.value),
))

watch(() => props.node.id, () => {
  intent.value = props.initialIntent ?? (sourceText.value ? 'script_refine' : 'script_draft')
  value.value = intent.value === 'script_draft' ? sourceText.value : ''
  locale.value = props.capability?.defaultLocale ?? 'zh-CN'
}, { immediate: true })

watch(() => props.initialIntent, (nextIntent) => {
  if (!nextIntent) return
  if (nextIntent === 'script_draft') {
    intent.value = nextIntent
    if (!value.value) value.value = sourceText.value
    return
  }
  selectIntent(nextIntent)
})

function selectIntent(next: ScriptAuthoringIntent) {
  if (next === 'script_refine' && !canRefine.value) return
  intent.value = next
  value.value = ''
}

function submit() {
  if (!canSubmit.value) return
  emit('generate', { intent: intent.value, locale: locale.value, value: value.value.trim() })
}
</script>

<template>
  <section class="script-authoring" aria-label="AI 脚本写作">
    <div class="script-authoring__heading">
      <span><Sparkles :size="15" aria-hidden="true" />AI 脚本写作</span>
      <strong v-if="capability">{{ capability.modelLabel }}</strong>
      <strong v-else>{{ capabilityLoading ? '正在加载模型…' : '模型未就绪' }}</strong>
    </div>
    <p>生成结果会直接替换当前脚本，可通过 Canvas 撤销；不会自动创建分镜、图片或视频。</p>
    <div class="script-authoring__intents" role="group" aria-label="脚本写作意图">
      <button type="button" :aria-pressed="intent === 'script_draft'" :disabled="readonly || active" @click="selectIntent('script_draft')">从创意生成脚本</button>
      <button type="button" :aria-pressed="intent === 'script_refine'" :disabled="readonly || active || !canRefine" @click="selectIntent('script_refine')">优化当前脚本</button>
    </div>
    <label v-if="!readonly" class="script-authoring__field">
      <span>{{ intent === 'script_draft' ? '创意 Brief' : '优化要求' }}</span>
      <textarea
        v-model="value"
        :aria-label="intent === 'script_draft' ? '创意 Brief' : '脚本优化要求'"
        :disabled="active"
        :maxlength="capability?.briefMaxLength ?? 4000"
        :placeholder="intent === 'script_draft' ? '例如：雨夜车站，一名摄影师寻找失踪的胶卷……' : '例如：提升节奏，保留人物关系和结局……'"
        rows="4"
      />
    </label>
    <div v-else class="script-authoring__readonly" role="status">只读审阅模式不能调用 Agnes 或修改脚本。</div>
    <div class="script-authoring__actions">
      <button v-if="!capability && !capabilityLoading" type="button" class="secondary" aria-label="重试加载模型" @click="emit('retryCapability')"><RefreshCw :size="15" aria-hidden="true" />重试模型</button>
      <button v-if="active" type="button" class="secondary" @click="emit('cancel')"><X :size="15" aria-hidden="true" />取消</button>
      <button type="button" :disabled="!canSubmit" @click="submit">
        <LoaderCircle v-if="active" class="spin" :size="15" aria-hidden="true" />
        <WandSparkles v-else :size="15" aria-hidden="true" />
        {{ active ? 'Agnes 写作中' : intent === 'script_draft' ? '生成新脚本' : '生成优化版本' }}
      </button>
    </div>
    <p v-if="quota <= 0" class="script-authoring__message is-error"><CircleAlert :size="14" aria-hidden="true" />文本 quota 不足。</p>
    <p v-else-if="capabilityError" class="script-authoring__message is-error" role="alert"><CircleAlert :size="14" aria-hidden="true" />{{ capabilityError }}</p>
    <p v-else-if="error" class="script-authoring__message is-error" role="alert"><CircleAlert :size="14" aria-hidden="true" />{{ error }}</p>
    <p v-else-if="success" class="script-authoring__message" role="status">{{ success }}</p>
  </section>
</template>

<style scoped>
.script-authoring { display: grid; gap: 10px; padding: 12px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-md); background: var(--v2-surface-2); }
.script-authoring__heading, .script-authoring__heading span, .script-authoring__actions, .script-authoring__message { display: flex; align-items: center; gap: 7px; }
.script-authoring__heading { justify-content: space-between; }
.script-authoring__heading span { color: var(--v2-text-primary); font-weight: 650; }
.script-authoring__heading strong { padding: 3px 7px; border-radius: 999px; color: var(--v2-accent-hover); background: var(--v2-accent-soft); font-size: 11px; }
.script-authoring > p { margin: 0; color: var(--v2-text-secondary); font-size: var(--v2-font-size-caption); line-height: 1.5; }
.script-authoring__intents { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.script-authoring button { min-height: 34px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-1); }
.script-authoring button[aria-pressed="true"], .script-authoring__actions button:last-child { border-color: var(--v2-accent); color: var(--v2-text-primary); background: var(--v2-accent-soft); }
.script-authoring button:disabled { cursor: not-allowed; opacity: .48; }
.script-authoring__field { display: grid; gap: 6px; color: var(--v2-text-secondary); font-size: var(--v2-font-size-caption); }
.script-authoring__field textarea { min-height: 88px; resize: vertical; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); padding: 9px 10px; color: var(--v2-text-primary); background: var(--v2-surface-1); font: inherit; line-height: 1.5; }
.script-authoring__field textarea:focus-visible, .script-authoring button:focus-visible, .script-authoring input:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.script-authoring__actions { justify-content: flex-end; }
.script-authoring__actions button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 11px; }
.script-authoring__actions .secondary { background: transparent; }
.script-authoring__message { padding: 8px; border-radius: var(--v2-radius-sm); background: var(--v2-accent-soft); }
.script-authoring__message.is-error { color: var(--v2-danger); background: var(--v2-surface-1); }
.script-authoring__readonly { color: var(--v2-text-muted); font-size: 12px; }
.spin { animation: script-authoring-spin .8s linear infinite; }
@keyframes script-authoring-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
</style>
