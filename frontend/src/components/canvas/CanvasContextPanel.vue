<script setup lang="ts">
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, CircleCheck, Columns2, Image, Info, Link2, LoaderCircle, Play, Sparkles, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import type { ResolvedGenerationContext } from '../../modules/canvas/generation-context'
import type { ResolvedResultLineage } from '../../modules/canvas/generation-lineage'
import type { ProjectGenerationTask } from '../../modules/canvas/project-resource-types'
import { resolveGenerationRunHistory } from '../../modules/canvas/generation-run-history'
import { useCanvasStore } from '../../store/canvas'
import type { CanvasNode } from '../../types/canvas'

const props = withDefaults(defineProps<{
  error?: string
  generationContext?: ResolvedGenerationContext | null
  generationTasks?: ProjectGenerationTask[]
  isGenerating?: boolean
  latestTask?: ProjectGenerationTask | null
  mediaType?: 'image' | 'video' | null
  mode: 'panel' | 'drawer'
  node: CanvasNode
  quota?: number
  readonly?: boolean
  resultLineage?: ResolvedResultLineage | null
  success?: string
}>(), {
  error: '',
  generationContext: null,
  generationTasks: () => [],
  isGenerating: false,
  latestTask: null,
  mediaType: null,
  quota: 0,
  readonly: false,
  resultLineage: null,
  success: '',
})

const canvasStore = useCanvasStore()

const emit = defineEmits<{
  close: []
  compareResults: []
  generate: [prompt: string]
  reorderInput: [connectionId: string, direction: -1 | 1]
  updatePrompt: [prompt: string]
}>()

const prompt = ref(props.node.content?.trim() || '')
const canGenerate = computed(() => Boolean(
  props.mediaType && (prompt.value.trim() || props.generationContext?.prompt) &&
  props.quota > 0 && !props.isGenerating,
))
const generationLabel = computed(() => props.mediaType === 'video' ? '视频' : '图片')
const connectedInputCount = computed(() => (
  (props.generationContext?.textSources.filter((source) => source.isIncluded).length ?? 0) +
  (props.generationContext?.imageIds.length ?? 0)
))
const includedMediaSources = computed(() => (
  props.generationContext?.mediaSources.filter((source) => source.state === 'included') ?? []
))
const excludedMediaSources = computed(() => (
  props.generationContext?.mediaSources.filter((source) => source.state !== 'included') ?? []
))
const runHistory = computed(() => resolveGenerationRunHistory(props.node.id, props.generationTasks, 5, {
  connections: canvasStore.connections,
  nodes: canvasStore.nodes,
}))
const mediaStateLabel = {
  included: '已作为参考图',
  'missing-asset': '缺少资源，未使用',
  'unsupported-media': '仅支持图片，未使用',
  duplicate: '重复资源，已合并',
  limit: '超出 8 张上限，未使用',
} as const
const runStatusLabel = {
  queued: '排队中',
  running: '生成中',
  succeeded: '已完成',
  failed: '失败',
  timed_out: '已超时',
} as const
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

function mediaRequestRole(requestOrder: number | null) {
  const order = requestOrder ?? 0
  if (props.mediaType === 'image') return `参考图 R${order}`
  if (includedMediaSources.value.length === 1) return '图生视频参考 R1'
  return `视频关键帧 R${order}`
}

function canMoveInput(connectionId: string, kind: 'text' | 'media', direction: -1 | 1) {
  const sources = kind === 'text'
    ? props.generationContext?.textSources
    : props.generationContext?.mediaSources
  const index = sources?.findIndex((source) => source.connectionId === connectionId) ?? -1
  return index >= 0 && index + direction >= 0 && index + direction < (sources?.length ?? 0)
}

function runTiming(task: ProjectGenerationTask) {
  if (task.duration_ms !== null) return `${(task.duration_ms / 1000).toFixed(1)}s`
  const date = new Date(task.created_at)
  if (!Number.isFinite(date.getTime())) return '时间未知'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date)
}

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

      <section v-if="generationContext && (generationContext.textSources.length || generationContext.mediaSources.length)" class="connected-context" aria-label="已连接生成上下文">
        <div class="context-summary"><span><Link2 :size="14" aria-hidden="true" />已连接上下文</span><strong>{{ connectedInputCount }} 项已使用</strong></div>
        <ul>
          <li v-for="source in generationContext.textSources" :key="`text-${source.nodeId}`" :class="{ muted: !source.isIncluded }">
            <Link2 :size="13" aria-hidden="true" /><span><strong>提示词 {{ source.order }} · {{ source.title }}</strong><small>{{ source.isIncluded ? '已合并文本' : '空内容，未使用' }}</small></span>
            <span v-if="!readonly" class="input-order-actions">
              <button type="button" :disabled="!canMoveInput(source.connectionId, 'text', -1)" :aria-label="`上移提示词 ${source.title}`" @click="emit('reorderInput', source.connectionId, -1)"><ArrowUp :size="14" aria-hidden="true" /></button>
              <button type="button" :disabled="!canMoveInput(source.connectionId, 'text', 1)" :aria-label="`下移提示词 ${source.title}`" @click="emit('reorderInput', source.connectionId, 1)"><ArrowDown :size="14" aria-hidden="true" /></button>
            </span>
          </li>
          <li v-for="source in generationContext.mediaSources" :key="`media-${source.nodeId}`" :class="{ muted: source.state !== 'included' }">
            <Image :size="13" aria-hidden="true" /><span><strong>参考图 {{ source.requestOrder ?? source.order }} · {{ source.title }}</strong><small>{{ mediaStateLabel[source.state] }}</small></span>
            <span v-if="!readonly" class="input-order-actions">
              <button type="button" :disabled="!canMoveInput(source.connectionId, 'media', -1)" :aria-label="`上移参考图 ${source.title}`" @click="emit('reorderInput', source.connectionId, -1)"><ArrowUp :size="14" aria-hidden="true" /></button>
              <button type="button" :disabled="!canMoveInput(source.connectionId, 'media', 1)" :aria-label="`下移参考图 ${source.title}`" @click="emit('reorderInput', source.connectionId, 1)"><ArrowDown :size="14" aria-hidden="true" /></button>
            </span>
          </li>
        </ul>
        <p>最终提示词 {{ generationContext.prompt.length }} / 4000 字符</p>
        <details class="request-preflight">
          <summary>检查最终生成请求</summary>
          <div class="request-preflight__body">
            <section aria-label="最终合并提示词">
              <div class="request-preflight__heading"><span>最终 prompt</span><strong>{{ generationContext.prompt.length }} 字符</strong></div>
              <pre>{{ generationContext.prompt || '没有可发送的 prompt' }}</pre>
            </section>
            <section v-if="includedMediaSources.length" aria-label="有序媒体请求">
              <div class="request-preflight__heading"><span>媒体输入</span><strong>{{ includedMediaSources.length }} 项</strong></div>
              <ol>
                <li v-for="source in includedMediaSources" :key="`request-${source.connectionId}`">
                  <span>{{ mediaRequestRole(source.requestOrder) }}</span>
                  <strong>{{ source.title }}</strong>
                </li>
              </ol>
            </section>
            <section v-if="excludedMediaSources.length" aria-label="未进入生成请求的输入">
              <div class="request-preflight__heading"><span>未进入请求</span><strong>{{ excludedMediaSources.length }} 项</strong></div>
              <ul>
                <li v-for="source in excludedMediaSources" :key="`excluded-${source.connectionId}`">
                  <strong>{{ source.title }}</strong>
                  <span>{{ mediaStateLabel[source.state] }}</span>
                </li>
              </ul>
            </section>
          </div>
        </details>
      </section>

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
      <details v-if="runHistory.total" class="run-history">
        <summary><span>运行记录</span><strong>{{ runHistory.total }} 次</strong></summary>
        <ol aria-label="生成运行记录">
          <li v-for="run in runHistory.runs" :key="run.task.id" :class="`is-${run.task.status}`">
            <span class="run-history__marker" aria-hidden="true"></span>
            <div>
              <strong>Run {{ run.sequence }} · {{ runStatusLabel[run.task.status] }}</strong>
              <small>{{ run.task.model || run.task.provider }} · {{ runTiming(run.task) }}</small>
              <p v-if="run.task.error_message">{{ run.task.error_message }}</p>
              <button
                v-if="run.resultNodeId"
                type="button"
                class="run-history__result"
                :aria-label="`检查 Run ${run.sequence} 结果`"
                @click="canvasStore.selectNode(run.resultNodeId)"
              >
                检查结果 <ArrowRight :size="13" aria-hidden="true" />
              </button>
              <p v-else-if="run.task.status === 'succeeded'" class="run-history__availability">
                {{ run.resultState === 'ambiguous' ? '结果关联不明确' : '结果未写入当前画布' }}
              </p>
            </div>
          </li>
        </ol>
        <p v-if="runHistory.total > runHistory.runs.length" class="run-history__remainder">仅显示最近 {{ runHistory.runs.length }} 次</p>
      </details>
      <p v-if="error" class="feedback is-error" role="alert"><AlertTriangle :size="15" aria-hidden="true" />{{ error }}。结果未扣费，可在确认服务恢复后手动重试。</p>
      <p v-else-if="success" class="feedback is-success"><CircleCheck :size="15" aria-hidden="true" />{{ success }}</p>
      <p v-else-if="latestTask?.error_message" class="feedback is-error" role="alert"><AlertTriangle :size="15" aria-hidden="true" />{{ latestTask.error_message }}</p>
    </section>

    <section v-else class="node-review" aria-label="节点内容">
      <dl><div><dt>节点类型</dt><dd>{{ node.type }}</dd></div><div><dt>状态</dt><dd>{{ node.status || 'idle' }}</dd></div><div><dt>位置</dt><dd>{{ Math.round(node.x) }}, {{ Math.round(node.y) }}</dd></div></dl>
      <section v-if="resultLineage" class="result-lineage-detail" aria-label="生成结果谱系">
        <div class="section-heading"><span>生成谱系</span><strong>V{{ resultLineage.selectedVariantOrder }} / {{ resultLineage.variants.length }}</strong></div>
        <dl>
          <div><dt>来源节点</dt><dd>{{ resultLineage.generationTitle }}</dd></div>
          <div v-if="resultLineage.taskId"><dt>任务</dt><dd>{{ resultLineage.taskId }}</dd></div>
          <div v-if="resultLineage.model"><dt>模型</dt><dd>{{ resultLineage.model }}</dd></div>
          <div><dt>输入</dt><dd>{{ resultLineage.inputProvenance.filter((item) => item.isIncluded).length }} 项</dd></div>
        </dl>
        <button
          v-if="resultLineage.variants.length > 1"
          type="button"
          class="compare-results-button"
          :aria-label="`比较 ${resultLineage.variants.length} 个同源结果`"
          @click="emit('compareResults')"
        >
          <Columns2 :size="16" aria-hidden="true" />
          比较同源结果
        </button>
      </section>
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
.connected-context { margin-top: 12px; padding: 10px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); background: var(--v2-surface-1); }
.context-summary, .context-summary span, .connected-context li { display: flex; align-items: center; }
.context-summary { justify-content: space-between; gap: 8px; color: var(--v2-text-secondary); font-size: 11px; }
.context-summary span { gap: 6px; }
.context-summary strong { color: var(--v2-text-primary); font-weight: 600; }
.connected-context ul { display: grid; gap: 5px; margin: 9px 0 0; padding: 0; list-style: none; }
.connected-context li { gap: 7px; min-width: 0; padding: 6px 7px; border-radius: 6px; color: var(--v2-accent); background: var(--v2-surface-2); }
.connected-context li.muted { color: var(--v2-text-muted); }
.connected-context li span { display: grid; min-width: 0; gap: 1px; }
.connected-context li > span:not(.input-order-actions) { flex: 1; }
.connected-context li strong, .connected-context li small { overflow: hidden; white-space: nowrap; text-overflow: clip; }
.connected-context li strong { color: var(--v2-text-primary); font-size: 11px; font-weight: 600; }
.connected-context li small, .connected-context > p { color: var(--v2-text-muted); font-size: 10px; }
.connected-context > p { margin: 8px 0 0; }
.input-order-actions { display: flex; flex: none; grid-auto-flow: column; gap: 2px; opacity: 0; transition: opacity var(--v2-duration-fast); }
.input-order-actions button { display: grid; min-width: 40px; min-height: 40px; place-items: center; }
.connected-context li:hover .input-order-actions, .connected-context li:focus-within .input-order-actions { opacity: 1; }
.request-preflight { margin-top: 10px; border-top: 1px solid var(--v2-border-subtle); }
.request-preflight summary { min-height: 40px; padding: 12px 2px 0; color: var(--v2-text-primary); cursor: pointer; font-size: 11px; font-weight: 600; }
.request-preflight summary:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.request-preflight__body { display: grid; gap: 10px; padding-top: 9px; }
.request-preflight__body section { display: grid; gap: 6px; }
.request-preflight__heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--v2-text-secondary); font-size: 10px; }
.request-preflight__heading strong { color: var(--v2-text-muted); font-variant-numeric: tabular-nums; }
.request-preflight pre { max-height: 180px; margin: 0; padding: 9px; overflow: auto; border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-canvas); font: 11px/1.65 ui-monospace, SFMono-Regular, Consolas, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
.request-preflight ol, .request-preflight ul { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.request-preflight li { display: flex; min-height: 30px; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 7px; border-radius: 5px; color: var(--v2-text-secondary); background: var(--v2-surface-2); font-size: 10px; }
.request-preflight ol li > span { flex: none; color: var(--v2-accent); font-weight: 700; }
.request-preflight li strong { min-width: 0; overflow: hidden; color: var(--v2-text-primary); font-size: 10px; text-overflow: clip; white-space: nowrap; }
.request-preflight ul li > span { color: var(--v2-text-muted); text-align: right; }
.generate-button { display: flex; width: 100%; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; color: var(--v2-text-on-accent); background: var(--v2-accent); font-weight: 600; }
.compare-results-button { display: flex; width: 100%; align-items: center; justify-content: center; gap: 7px; margin-top: 12px; border: 1px solid var(--v2-border-standard); color: var(--v2-text-primary); background: var(--v2-surface-3); font-size: 12px; }
.compare-results-button:hover { border-color: color-mix(in srgb, var(--v2-accent) 52%, var(--v2-border-standard)); }
.generation-status { min-height: 42px; align-items: center; gap: 7px; margin: 14px 0 0; padding: 8px 10px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); color: var(--v2-text-secondary); background: var(--v2-surface-1); font-size: 12px; }
.generation-status small { margin-left: auto; color: var(--v2-text-muted); }
.run-history { margin-top: 8px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); background: var(--v2-surface-1); }
.run-history summary { display: flex; min-height: 40px; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; color: var(--v2-text-secondary); cursor: pointer; font-size: 11px; }
.run-history summary strong { color: var(--v2-text-primary); font-variant-numeric: tabular-nums; }
.run-history summary:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.run-history ol { display: grid; gap: 1px; margin: 0; padding: 0 8px 8px; list-style: none; }
.run-history li { display: grid; grid-template-columns: 8px minmax(0, 1fr); gap: 8px; padding: 8px 4px; border-top: 1px solid var(--v2-border-subtle); }
.run-history__marker { width: 7px; height: 7px; margin-top: 5px; border-radius: 50%; background: var(--v2-text-muted); }
.run-history li.is-succeeded .run-history__marker { background: var(--v2-success); }
.run-history li.is-failed .run-history__marker, .run-history li.is-timed_out .run-history__marker { background: var(--v2-danger); }
.run-history li.is-running .run-history__marker { background: var(--v2-accent); }
.run-history li > div { display: grid; min-width: 0; gap: 2px; }
.run-history li strong, .run-history li small, .run-history li p { overflow: hidden; text-overflow: clip; }
.run-history li strong { color: var(--v2-text-primary); font-size: 11px; white-space: nowrap; }
.run-history li small { color: var(--v2-text-muted); font-size: 10px; white-space: nowrap; }
.run-history li p { display: -webkit-box; margin: 2px 0 0; color: var(--v2-danger); font-size: 10px; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow-wrap: anywhere; }
.run-history .run-history__availability { color: var(--v2-text-muted); }
.run-history__result { display: flex; width: max-content; min-width: 0; min-height: 40px; align-items: center; gap: 4px; margin-top: 2px; padding: 0 4px; border-radius: var(--v2-radius-sm); color: var(--v2-accent); font-size: 10px; font-weight: 600; }
.run-history__remainder { margin: 0; padding: 0 12px 10px; color: var(--v2-text-muted); font-size: 10px; }
.feedback { align-items: flex-start; gap: 7px; margin: 10px 0 0; padding: 9px 10px; border-radius: var(--v2-radius-md); font-size: 12px; line-height: 1.55; }
.feedback.is-error { color: var(--v2-danger); background: color-mix(in oklch, var(--v2-danger) 10%, transparent); }
.feedback.is-success { color: var(--v2-success); background: color-mix(in oklch, var(--v2-success) 10%, transparent); }
.review-prompt p { margin: 0; padding: 11px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); color: var(--v2-text-primary); background: var(--v2-surface-1); font-size: 12px; line-height: 1.65; white-space: pre-wrap; }
.result-lineage-detail { margin-bottom: 16px; }
.result-lineage-detail .section-heading { margin-bottom: 8px; }
.result-lineage-detail .section-heading strong { color: var(--v2-accent); font-variant-numeric: tabular-nums; }
.result-lineage-detail dd { max-width: 220px; overflow: hidden; text-overflow: clip; white-space: nowrap; }
dl { display: grid; gap: 1px; margin: 0 0 16px; overflow: hidden; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); background: var(--v2-border-subtle); }
dl > div { justify-content: space-between; gap: 12px; padding: 9px 10px; background: var(--v2-surface-1); }
dt, dd { margin: 0; font-size: 12px; }
dt { color: var(--v2-text-secondary); }
.is-spinning { animation: context-spin 900ms linear infinite; }
@keyframes context-spin { to { transform: rotate(360deg); } }
@media (hover: hover) { button:not(:disabled):hover { color: var(--v2-accent); background: var(--v2-surface-3); } .generate-button:hover { color: var(--v2-text-on-accent); background: var(--v2-accent-hover); } }
@media (hover: none) { .input-order-actions { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { button, .input-order-actions { transition: none; } button:active:not(:disabled) { transform: none; } .is-spinning { animation: none; } }
</style>
