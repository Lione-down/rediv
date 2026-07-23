<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CircleAlert, LoaderCircle, RefreshCw, Send, UserRound, X } from 'lucide-vue-next'
import type { CanvasNode } from '../../types/canvas'
import { readScriptReferenceAssetIds } from '../../modules/canvas/script-reference-assets'
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
const referenceAssetIds = computed(() => readScriptReferenceAssetIds(props.node))
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
  emit('generate', {
    intent: intent.value,
    locale: locale.value,
    value: value.value.trim(),
    ...(intent.value === 'script_draft' && referenceAssetIds.value.length
      ? { referenceAssetIds: referenceAssetIds.value }
      : {}),
  })
}
</script>

<template>
  <section class="script-authoring" data-layout="prompt-first" aria-label="AI 脚本写作">
    <div v-if="referenceAssetIds.length" class="script-authoring__references" role="status">
      <UserRound :size="14" aria-hidden="true" />
      <span>角色参考 {{ referenceAssetIds.length }}/8</span>
    </div>
    <label v-if="!readonly" class="script-authoring__field">
      <span class="visually-hidden">{{ intent === 'script_draft' ? '创意 Brief' : '优化要求' }}</span>
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
    <p v-if="quota <= 0" class="script-authoring__message is-error"><CircleAlert :size="14" aria-hidden="true" />文本 quota 不足。</p>
    <p v-else-if="capabilityError" class="script-authoring__message is-error" role="alert"><CircleAlert :size="14" aria-hidden="true" />{{ capabilityError }}</p>
    <p v-else-if="error" class="script-authoring__message is-error" role="alert"><CircleAlert :size="14" aria-hidden="true" />{{ error }}</p>
    <p v-else-if="success" class="script-authoring__message" role="status">{{ success }}</p>
    <div class="script-authoring__actions">
      <button v-if="!capability && !capabilityLoading" type="button" class="secondary" aria-label="重试加载模型" @click="emit('retryCapability')"><RefreshCw :size="15" aria-hidden="true" />重试模型</button>
      <strong>{{ capability?.modelLabel ?? (capabilityLoading ? '正在加载模型…' : '模型未就绪') }}</strong>
      <span v-if="quota > 0" class="script-authoring__quota">{{ quota }}</span>
      <span class="script-authoring__spacer" />
      <button v-if="active" type="button" class="secondary is-icon" aria-label="取消脚本生成" @click="emit('cancel')"><X :size="15" aria-hidden="true" /></button>
      <button type="button" class="script-authoring__submit" :disabled="!canSubmit" :aria-label="intent === 'script_draft' ? '生成新脚本' : '优化当前脚本'" @click="submit">
        <LoaderCircle v-if="active" class="spin" :size="15" aria-hidden="true" />
        <Send v-else :size="15" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.script-authoring { display: grid; min-height: 154px; gap: 8px; padding: 8px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-lg); background: var(--canvas-composer-surface); }
.script-authoring__actions, .script-authoring__message { display: flex; align-items: center; gap: 7px; }
.script-authoring__references { display: inline-flex; width: max-content; min-height: 24px; align-items: center; gap: 6px; padding: 0 8px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-2); font-size: 11px; }
.script-authoring button { min-height: 32px; border: 0; border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: transparent; }
.script-authoring button:disabled { cursor: not-allowed; opacity: .48; }
.script-authoring__field { display: grid; min-height: 96px; color: var(--v2-text-secondary); font-size: var(--v2-font-size-caption); }
.script-authoring__field textarea { box-sizing: border-box; min-height: 96px; resize: none; border: 0; border-radius: var(--v2-radius-md); padding: 9px 10px; color: var(--v2-text-primary); background: var(--v2-surface-1); font: inherit; font-size: 13px; line-height: 1.75; }
.script-authoring__field textarea:focus-visible, .script-authoring button:focus-visible, .script-authoring input:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.script-authoring__actions { min-height: 34px; }
.script-authoring__actions strong { padding-inline: 8px; color: var(--v2-text-primary); font-size: 13px; font-weight: 600; }
.script-authoring__quota { color: var(--v2-text-muted); font-size: 11px; font-variant-numeric: tabular-nums; }
.script-authoring__spacer { flex: 1; }
.script-authoring__actions button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 11px; }
.script-authoring__actions .secondary { background: transparent; }
.script-authoring__actions .is-icon, .script-authoring__submit { width: 34px; height: 34px; padding: 0; }
.script-authoring__submit { color: var(--v2-text-on-accent) !important; background: var(--v2-accent) !important; }
.script-authoring__message { padding: 8px; border-radius: var(--v2-radius-sm); background: var(--v2-accent-soft); }
.script-authoring__message.is-error { color: var(--v2-danger); background: var(--v2-surface-1); }
.script-authoring__readonly { color: var(--v2-text-muted); font-size: 12px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.spin { animation: script-authoring-spin .8s linear infinite; }
@keyframes script-authoring-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
</style>
