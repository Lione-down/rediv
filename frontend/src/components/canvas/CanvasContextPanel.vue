<script setup lang="ts">
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, CircleAlert, CircleCheck, Columns2, Focus, GitBranch, Image, Info, Link2, LoaderCircle, Play, Sparkles, Video, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import {
  formatGenerationRequestParameters,
  type GenerationNodeParameters,
  type ResolvedGenerationRequestContext,
} from '../../modules/canvas/generation-parameters'
import type { ResolvedResultLineage } from '../../modules/canvas/generation-lineage'
import type { ProjectGenerationTask } from '../../modules/canvas/project-resource-types'
import { resolveGenerationRunHistory } from '../../modules/canvas/generation-run-history'
import { canBranchFromImageResult, type ResultBranchMediaType } from '../../modules/canvas/resource-commands'
import { useCanvasStore } from '../../store/canvas'
import type { CanvasNode } from '../../types/canvas'
import { formatCapturedFrameTime, resolveCapturedFrameProvenance } from '../../modules/canvas/captured-frame-provenance'
import type { GenerationInputLineageBridge } from '../../modules/canvas/generation-input-lineage'
import { resolveGenerationTaskProgressSummary, type GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import { resolveVisualAssetRecipe, VISUAL_ASSET_RECIPES, type VisualAssetRecipeId } from '../../modules/canvas/visual-asset-recipes'
import { IMAGE_OPERATIONS } from '../../modules/canvas/image-operations'
import CanvasGenerationParameterControls from './CanvasGenerationParameterControls.vue'
import CanvasGenerationProgress from './CanvasGenerationProgress.vue'
import CanvasCinematicSkillControls from './CanvasCinematicSkillControls.vue'
import CanvasCinematicTakeReview from './CanvasCinematicTakeReview.vue'
import type { PreparedCinematicGeneration } from '../../modules/canvas/cinematic-skills'
import CanvasScriptGenerationControls from './CanvasScriptGenerationControls.vue'
import type { ScriptAuthoringCapabilities, ScriptAuthoringIntent } from '../../modules/canvas/script-authoring'
import type { ScriptGenerationSubmission } from './composables/use-canvas-script-generation'
import { useCanvasCinematicLineage } from './composables/use-canvas-cinematic-lineage'
import CanvasStoryboardAssetGroupDetails from './CanvasStoryboardAssetGroupDetails.vue'
import CanvasStoryboardAssetEditor from './CanvasStoryboardAssetEditor.vue'
import type { StoryboardAssetEditIntent } from '../../modules/canvas/storyboard-asset-commands'

const props = withDefaults(defineProps<{
  error?: string
  allowGenerationExecution?: boolean
  canContinue?: boolean
  canArrangeTrace?: boolean
  canFitTrace?: boolean
  generationContext?: ResolvedGenerationRequestContext | null
  generationInputLineage?: GenerationInputLineageBridge[]
  generationTasks?: ProjectGenerationTask[]
  isGenerating?: boolean
  latestTask?: ProjectGenerationTask | null
  mediaType?: 'image' | 'video' | null
  mode: 'panel' | 'drawer'
  node: CanvasNode
  outputVariantCount?: number
  projectId?: string
  canvasId?: string
  quota?: number
  readonly?: boolean
  resultLineage?: ResolvedResultLineage | null
  runtimePresentation?: GenerationRuntimePresentation | null
  success?: string
  scriptAuthoringActive?: boolean
  scriptAuthoringCapability?: ScriptAuthoringCapabilities | null
  scriptAuthoringCapabilityError?: string
  scriptAuthoringCapabilityLoading?: boolean
  scriptAuthoringError?: string
  scriptAuthoringIntent?: ScriptAuthoringIntent | null
  scriptAuthoringInCard?: boolean
  scriptAuthoringSuccess?: string
  scriptQuota?: number
  storyboardAssetEditIntent?: StoryboardAssetEditIntent | null
}>(), {
  error: '',
  allowGenerationExecution: true,
  canContinue: false,
  canArrangeTrace: false,
  canFitTrace: false,
  generationContext: null,
  generationInputLineage: () => [],
  generationTasks: () => [],
  isGenerating: false,
  latestTask: null,
  mediaType: null,
  outputVariantCount: 0,
  projectId: '',
  canvasId: '',
  quota: 0,
  readonly: false,
  resultLineage: null,
  runtimePresentation: null,
  success: '',
  scriptAuthoringActive: false,
  scriptAuthoringCapability: null,
  scriptAuthoringCapabilityError: '',
  scriptAuthoringCapabilityLoading: false,
  scriptAuthoringError: '',
  scriptAuthoringIntent: null,
  scriptAuthoringInCard: false,
  scriptAuthoringSuccess: '',
  scriptQuota: 0,
  storyboardAssetEditIntent: null,
})

const canvasStore = useCanvasStore()
const emit = defineEmits<{
  branchGeneration: [mediaType: ResultBranchMediaType]
  arrangeTrace: []
  close: []
  compareResults: []
  continueNode: []
  fitTrace: []
  locateNode: [nodeId: string]
  generate: [prompt?: string]
  directorPreflightReady: [generationNodeId: string, prepared: PreparedCinematicGeneration]
  reorderInput: [connectionId: string, direction: -1 | 1]
  updatePrompt: [prompt: string]
  updateParameters: [parameters: GenerationNodeParameters]
  retryRecipe: [recipeId: VisualAssetRecipeId]
  visualRecipe: [recipeId: VisualAssetRecipeId]
  cancelScriptAuthoring: []
  generateScript: [submission: ScriptGenerationSubmission]
  retryScriptCapability: []
  editStoryboardAsset: [intent: StoryboardAssetEditIntent]
}>()
const prompt = ref(props.node.content?.trim() || '')
const visualRecipe = computed(() => resolveVisualAssetRecipe(props.node))
const imageOperation = computed(() => props.generationContext?.imageOperation ?? null)
const isLocalImageOperation = computed(() => imageOperation.value?.id === 'region')
const operationRequiresPrompt = computed(() => imageOperation.value
  ? IMAGE_OPERATIONS[imageOperation.value.id].requiresPrompt
  : true)
const usesPrompt = computed(() => !imageOperation.value || operationRequiresPrompt.value)
const storyboardAssetEditing = computed(() => (
  props.storyboardAssetEditIntent?.promptNodeId === props.node.id &&
  props.node.type === 'script' && props.node.contentData?.subtype === 'prompt'
))
const isStoryboardAssetGroup = computed(() => (
  props.node.type === 'group' && props.node.contentData?.storyboard_kind === 'shot-plan'
))
const requestedOutputCount = computed(() => (
  props.mediaType === 'image' && !props.generationContext?.imageBatch
    ? props.generationContext?.outputCount ?? 1
    : 1
))
const canGenerate = computed(() => Boolean(
  props.allowGenerationExecution && !isLocalImageOperation.value && props.mediaType &&
  (visualRecipe.value || !usesPrompt.value || prompt.value.trim() || props.generationContext?.prompt) &&
  !props.generationContext?.parameterError && props.quota >= requestedOutputCount.value && !props.isGenerating,
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
const inputLineageByConnectionId = computed(() => new Map(
  props.generationInputLineage.map((bridge) => [bridge.connectionId, bridge]),
))
const runHistory = computed(() => resolveGenerationRunHistory(props.node.id, props.generationTasks, 5, {
  connections: canvasStore.connections,
  nodes: canvasStore.nodes,
}))
const canBranchResult = computed(() => canBranchFromImageResult(props.node))
const capturedFrameProvenance = computed(() => resolveCapturedFrameProvenance(props.node, canvasStore.nodes))
const staleScriptLineage = computed(() => {
  const direct = props.node.contentData
  const group = props.node.parentNodeId
    ? canvasStore.nodes.find((candidate) => candidate.id === props.node.parentNodeId)?.contentData
    : null
  const lineage = direct?.source_script_node_id ? direct : group
  if (typeof lineage?.source_script_node_id !== 'string' || typeof lineage.source_script_text !== 'string') return null
  const source = canvasStore.nodes.find((candidate) => candidate.id === lineage.source_script_node_id)
  const currentText = source?.content ?? source?.contentData?.text
  return {
    sourceNodeId: lineage.source_script_node_id,
    isStale: typeof currentText !== 'string' || currentText.trim() !== lineage.source_script_text,
  }
})
const { cinematicResultStale, cinematicTaskSnapshot } = useCanvasCinematicLineage({
  getCanvasId: () => props.canvasId,
  getGenerationTasks: () => props.generationTasks,
  getLatestTask: () => props.latestTask,
  getProjectId: () => props.projectId,
  getResultTaskId: () => props.resultLineage?.taskId,
})
const mediaStateLabel = {
  included: '已作为参考图',
  'missing-asset': '缺少资源，未使用',
  'unsupported-media': '仅支持图片，未使用',
  duplicate: '重复资源，已合并',
  limit: '超出 8 张上限，未使用',
  'reference-mode-excluded': '当前参考模式未使用',
} as const
const runStatusLabel = {
  queued: '排队中',
  running: '生成中',
  succeeded: '已完成',
  failed: '失败',
  timed_out: '已超时',
} as const
const isRuntimeActive = computed(() => ['submitting', 'queued', 'running'].includes(props.runtimePresentation?.phase ?? ''))
const statusLabel = computed(() => {
  if (props.runtimePresentation) return props.runtimePresentation.label
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
  if (props.generationContext?.referenceMode === 'image-to-video') return '图生视频参考 R1'
  return `视频关键帧 R${order}`
}

const resultTaskParameters = computed(() => {
  const task = props.generationTasks.find((candidate) => candidate.id === props.resultLineage?.taskId)
  return formatGenerationRequestParameters(task?.request_parameters)
})

function mediaSourceState(connectionId: string, state: keyof typeof mediaStateLabel) {
  const bridge = inputLineageByConnectionId.value.get(connectionId)
  return bridge ? `来自 ${bridge.generationTitle} · V${bridge.variantOrder}` : mediaStateLabel[state]
}

function mediaSourceLineage(connectionId: string) {
  return inputLineageByConnectionId.value.get(connectionId)
}

function mediaSourceAriaLabel(connectionId: string, title: string) {
  const bridge = inputLineageByConnectionId.value.get(connectionId)
  return `定位到画布：${title}${bridge ? `，来自 ${bridge.generationTitle} V${bridge.variantOrder}` : ''}`
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
  if (visualRecipe.value) emit('retryRecipe', visualRecipe.value.id)
  else emit('generate', usesPrompt.value ? prompt.value.trim() : undefined)
}
</script>

<template>
  <aside class="context-panel" :class="`is-${mode}`" :aria-label="`节点详情 ${node.title}`">
    <header>
      <div><Sparkles v-if="mediaType" :size="18" aria-hidden="true" /><Info v-else :size="18" aria-hidden="true" /><span><strong>{{ node.title }}</strong><small>{{ node.type }} · {{ String(node.contentData?.subtype || node.type) }}</small></span></div>
      <div class="header-actions"><button v-if="canArrangeTrace" type="button" aria-label="整理完整生成链路" title="整理完整生成链路" @click="emit('arrangeTrace')"><Columns2 :size="17" aria-hidden="true" /></button><button v-if="canFitTrace" type="button" aria-label="适配完整生成链路" title="适配完整生成链路" @click="emit('fitTrace')"><Focus :size="17" aria-hidden="true" /></button><button v-if="canContinue" type="button" aria-label="继续此节点" title="继续此节点" @click="emit('continueNode')"><GitBranch :size="17" aria-hidden="true" /></button><button type="button" aria-label="关闭节点详情" title="关闭节点详情" @click="emit('close')"><X :size="18" aria-hidden="true" /></button></div>
    </header>
    <CanvasStoryboardAssetGroupDetails
      :node="node"
      :readonly="readonly"
      @edit-asset="emit('editStoryboardAsset', $event)"
      @locate-node="emit('locateNode', $event)"
    />
    <CanvasStoryboardAssetEditor
      v-if="storyboardAssetEditing && storyboardAssetEditIntent"
      :intent="storyboardAssetEditIntent"
      :node="node"
      :readonly="readonly"
    />
    <CanvasScriptGenerationControls
      v-if="node.type === 'script' && node.contentData?.subtype === 'script' && !scriptAuthoringInCard"
      :active="scriptAuthoringActive"
      :capability="scriptAuthoringCapability"
      :capability-error="scriptAuthoringCapabilityError"
      :capability-loading="scriptAuthoringCapabilityLoading"
      :error="scriptAuthoringError"
      :initial-intent="scriptAuthoringIntent"
      :node="node"
      :quota="scriptQuota"
      :readonly="readonly"
      :success="scriptAuthoringSuccess"
      @cancel="emit('cancelScriptAuthoring')"
      @generate="emit('generateScript', $event)"
      @retry-capability="emit('retryScriptCapability')"
    />
    <section v-if="staleScriptLineage?.isStale" class="stale-lineage" role="status" aria-label="旧来源版本">
      <CircleAlert :size="15" aria-hidden="true" />
      <span>此分镜或生成节点基于旧脚本版本；历史结果保留，刷新必须由你显式执行。</span>
      <button type="button" @click="emit('locateNode', staleScriptLineage.sourceNodeId)">查看当前脚本</button>
    </section>
    <section v-if="cinematicResultStale" class="stale-lineage" role="status" aria-label="旧引用版本">
      <CircleAlert :size="15" aria-hidden="true" />
      <span>此任务或结果基于旧引用版本；历史结果仍可用，重新生成必须由你显式执行。</span>
    </section>
    <CanvasCinematicTakeReview
      v-if="node.type === 'result'"
      :canvas-id="canvasId"
      :node="node"
      :project-id="projectId"
      :readonly="readonly"
      :result-lineage="resultLineage"
      :task-snapshot="cinematicTaskSnapshot"
      @locate-node="emit('locateNode', $event)"
      @preflight-ready="(nodeId, prepared) => emit('directorPreflightReady', nodeId, prepared)"
    />

    <section v-if="mediaType" class="generation-editor" role="region" aria-label="生成任务编辑器">
      <div class="section-heading"><span>{{ generationLabel }}生成</span><span>剩余 {{ quota }}</span></div>
      <section v-if="visualRecipe" class="recipe-summary" aria-label="视觉资产配方">
        <span>参考优先配方</span>
        <strong>{{ visualRecipe.title }}</strong>
        <p>{{ visualRecipe.description }}。保持参考中的身份、造型与视觉风格，由你检查结果后决定是否重试。</p>
      </section>
      <label v-else-if="!readonly && usesPrompt" class="prompt-field">
        <span>生成提示词</span>
        <textarea :value="prompt" rows="6" maxlength="4000" aria-label="生成提示词" :disabled="isGenerating" @input="updatePrompt"></textarea>
      </label>
      <div v-else-if="readonly && usesPrompt" class="review-prompt"><span>生成提示词</span><p>{{ prompt || '未填写提示词' }}</p></div>
      <p v-else-if="isLocalImageOperation" class="generation-operation-note" role="status">区域标记只保存到画布，不会创建生成任务。</p>
      <p v-else class="generation-operation-note">此图片操作不需要 prompt，将使用已连接的媒体输入。</p>
      <CanvasCinematicSkillControls
        v-if="!visualRecipe && !imageOperation && generationContext && mediaType"
        :canvas-id="canvasId"
        :disabled="isGenerating"
        :generation-parameters="generationContext.parameters ?? {}"
        :media-type="mediaType"
        :node="node"
        :project-id="projectId"
        :readonly="readonly"
        :user-instruction="generationContext.prompt || prompt"
      />
      <CanvasGenerationParameterControls
        v-if="generationContext"
        :context="generationContext"
        :disabled="isGenerating"
        :readonly="readonly"
        @update-parameters="emit('updateParameters', $event)"
      />

      <section v-if="generationContext" class="connected-context" aria-label="已连接生成上下文">
        <div class="context-summary"><span><Link2 :size="14" aria-hidden="true" />已连接上下文</span><strong>{{ connectedInputCount }} 项已使用</strong></div>
        <ul>
          <li v-for="source in generationContext.textSources" :key="`text-${source.nodeId}`" :class="{ muted: !source.isIncluded }">
            <button type="button" class="context-node-link" :aria-label="`定位到画布：${source.title}`" @click="emit('locateNode', source.nodeId)"><Link2 :size="13" aria-hidden="true" /><span><strong>提示词 {{ source.order }} · {{ source.title }}</strong><small>{{ source.isIncluded ? '已合并文本' : '空内容，未使用' }}</small></span><ArrowRight :size="13" aria-hidden="true" /></button>
            <span v-if="!readonly && allowGenerationExecution && !visualRecipe" class="input-order-actions">
              <button type="button" :disabled="isGenerating || !canMoveInput(source.connectionId, 'text', -1)" :aria-label="`上移提示词 ${source.title}`" @click="emit('reorderInput', source.connectionId, -1)"><ArrowUp :size="14" aria-hidden="true" /></button>
              <button type="button" :disabled="isGenerating || !canMoveInput(source.connectionId, 'text', 1)" :aria-label="`下移提示词 ${source.title}`" @click="emit('reorderInput', source.connectionId, 1)"><ArrowDown :size="14" aria-hidden="true" /></button>
            </span>
          </li>
          <li v-for="source in generationContext.mediaSources" :key="`media-${source.nodeId}`" :class="{ muted: source.state !== 'included' }">
            <button type="button" class="context-node-link" :aria-label="mediaSourceAriaLabel(source.connectionId, source.title)" @click="emit('locateNode', source.nodeId)"><Image :size="13" aria-hidden="true" /><span><strong>参考图 {{ source.requestOrder ?? source.order }} · {{ source.title }}</strong><small>{{ mediaSourceState(source.connectionId, source.state) }}</small></span><ArrowRight :size="13" aria-hidden="true" /></button>
            <button
              v-if="mediaSourceLineage(source.connectionId)"
              type="button"
              class="input-origin-link"
              :aria-label="`定位到上游生成：${mediaSourceLineage(source.connectionId)!.generationTitle} V${mediaSourceLineage(source.connectionId)!.variantOrder}`"
              :title="`定位到上游生成：${mediaSourceLineage(source.connectionId)!.generationTitle} V${mediaSourceLineage(source.connectionId)!.variantOrder}`"
              @click="emit('locateNode', mediaSourceLineage(source.connectionId)!.generationNodeId)"
            ><GitBranch :size="14" aria-hidden="true" /></button>
            <span v-if="!readonly && allowGenerationExecution && !visualRecipe" class="input-order-actions">
              <button type="button" :disabled="isGenerating || !canMoveInput(source.connectionId, 'media', -1)" :aria-label="`上移参考图 ${source.title}`" @click="emit('reorderInput', source.connectionId, -1)"><ArrowUp :size="14" aria-hidden="true" /></button>
              <button type="button" :disabled="isGenerating || !canMoveInput(source.connectionId, 'media', 1)" :aria-label="`下移参考图 ${source.title}`" @click="emit('reorderInput', source.connectionId, 1)"><ArrowDown :size="14" aria-hidden="true" /></button>
            </span>
          </li>
        </ul>
        <p v-if="!visualRecipe && usesPrompt">最终提示词 {{ generationContext.prompt.length }} / 4000 字符</p>
        <details v-if="!visualRecipe" class="request-preflight">
          <summary>检查最终生成请求</summary>
          <div class="request-preflight__body">
            <section v-if="generationContext.parameterSummary.length" aria-label="最终生成参数">
              <div class="request-preflight__heading"><span>最终参数</span><strong>{{ generationContext.parameterSummary.length }} 项</strong></div>
              <ul><li v-for="item in generationContext.parameterSummary" :key="item"><strong>{{ item }}</strong></li></ul>
            </section>
            <section v-if="usesPrompt" aria-label="最终合并提示词">
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

      <div v-if="generationContext && !isLocalImageOperation" class="generation-submit-summary" role="group" aria-label="生成提交摘要">
        <span><strong>输出</strong>{{ requestedOutputCount }} 个</span>
        <span><strong>成本</strong>估算不可用</span>
        <span v-if="mediaType === 'video'"><strong>音频</strong>暂不可用</span>
      </div>

      <button
        v-if="!readonly && allowGenerationExecution && !isLocalImageOperation"
        type="button"
        class="generate-button"
        :disabled="!canGenerate"
        :aria-label="visualRecipe ? `重新生成${visualRecipe.title}` : `开始${generationLabel}生成`"
        @click="requestGeneration"
      >
        <LoaderCircle v-if="isRuntimeActive" :size="17" class="is-spinning" aria-hidden="true" />
        <Play v-else :size="17" aria-hidden="true" />
        {{ isRuntimeActive ? `${visualRecipe?.title ?? generationLabel}生成中` : visualRecipe ? `重新生成${visualRecipe.title}` : `开始${generationLabel}生成` }}
      </button>

      <p class="generation-status" role="status" aria-label="生成状态">
        <LoaderCircle v-if="isRuntimeActive" :size="15" class="is-spinning" aria-hidden="true" />
        <CircleCheck v-else-if="statusLabel === '已完成'" :size="15" aria-hidden="true" />
        <span>{{ statusLabel }}</span>
        <small v-if="latestTask">{{ latestTask.id }}</small>
      </p>
      <CanvasGenerationProgress :runtime-presentation="runtimePresentation" :task="latestTask" />
      <section v-if="outputVariantCount > 1" class="output-variant-summary" aria-label="生成输出版本">
        <div><span>生成结果</span><strong>{{ outputVariantCount }} 个版本</strong></div>
        <button type="button" class="compare-results-button" :aria-label="`比较 ${outputVariantCount} 个生成结果`" @click="emit('compareResults')">
          <Columns2 :size="16" aria-hidden="true" />比较生成结果
        </button>
      </section>
      <details v-if="runHistory.total" class="run-history">
        <summary><span>运行记录</span><strong>{{ runHistory.total }} 次</strong></summary>
        <ol aria-label="生成运行记录">
          <li v-for="run in runHistory.runs" :key="run.task.id" :class="`is-${run.task.status}`">
            <span class="run-history__marker" aria-hidden="true"></span>
            <div>
              <strong>Run {{ run.sequence }} · {{ runStatusLabel[run.task.status] }}</strong>
              <small>{{ run.task.model || run.task.provider }} · {{ runTiming(run.task) }}</small>
              <small v-if="resolveGenerationTaskProgressSummary(run.task)">{{ resolveGenerationTaskProgressSummary(run.task) }}</small>
              <small v-if="formatGenerationRequestParameters(run.task.request_parameters)">{{ formatGenerationRequestParameters(run.task.request_parameters) }}</small>
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

    <section v-else-if="!storyboardAssetEditing && !isStoryboardAssetGroup" class="node-review" aria-label="节点内容">
      <dl><div><dt>节点类型</dt><dd>{{ node.type }}</dd></div><div><dt>状态</dt><dd>{{ node.status || 'idle' }}</dd></div><div><dt>位置</dt><dd>{{ Math.round(node.x) }}, {{ Math.round(node.y) }}</dd></div></dl>
      <section v-if="capturedFrameProvenance" class="captured-frame-detail" aria-label="视频帧来源">
        <div class="section-heading"><span>视频帧来源</span><strong>{{ formatCapturedFrameTime(capturedFrameProvenance.captureTimeSeconds) }}</strong></div>
        <dl>
          <div><dt>源视频</dt><dd><button type="button" class="lineage-node-link" :aria-label="`定位到源视频：${capturedFrameProvenance.sourceTitle}`" @click="emit('locateNode', capturedFrameProvenance.sourceNodeId)">{{ capturedFrameProvenance.sourceTitle }}<ArrowRight :size="13" aria-hidden="true" /></button></dd></div>
          <div><dt>截取时间</dt><dd>{{ formatCapturedFrameTime(capturedFrameProvenance.captureTimeSeconds) }}</dd></div>
        </dl>
      </section>
      <section v-if="resultLineage" class="result-lineage-detail" aria-label="生成结果谱系">
        <div class="section-heading"><span>生成谱系</span><strong>V{{ resultLineage.selectedVariantOrder }} / {{ resultLineage.variants.length }}</strong></div>
        <dl>
          <div><dt>来源节点</dt><dd><button type="button" class="lineage-node-link" :aria-label="`定位到画布：${resultLineage.generationTitle}`" @click="emit('locateNode', resultLineage.generationNodeId)">{{ resultLineage.generationTitle }}<ArrowRight :size="13" aria-hidden="true" /></button></dd></div>
          <div v-if="resultLineage.taskId"><dt>任务</dt><dd>{{ resultLineage.taskId }}</dd></div>
          <div v-if="resultLineage.model"><dt>模型</dt><dd>{{ resultLineage.model }}</dd></div>
          <div v-if="resultTaskParameters"><dt>生成参数</dt><dd>{{ resultTaskParameters }}</dd></div>
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
      <details v-if="!readonly && allowGenerationExecution && canBranchResult" class="result-branch">
        <summary><span><GitBranch :size="14" aria-hidden="true" />以此结果继续</span><small>作为参考图</small></summary>
        <div>
          <button type="button" @click="emit('branchGeneration', 'image')"><Image :size="15" aria-hidden="true" /><span><strong>图片生成</strong><small>创建参考分支</small></span></button>
          <button type="button" @click="emit('branchGeneration', 'video')"><Video :size="15" aria-hidden="true" /><span><strong>视频生成</strong><small>图生视频</small></span></button>
        </div>
        <section class="recipe-branch-actions" aria-label="视觉资产快捷生成">
          <button v-for="recipe in VISUAL_ASSET_RECIPES" :key="recipe.id" type="button" @click="emit('visualRecipe', recipe.id)">
            <Sparkles :size="15" aria-hidden="true" /><span><strong>{{ recipe.actionLabel }}</strong><small>{{ recipe.description }}</small></span>
          </button>
        </section>
      </details>
      <div class="review-prompt"><span>内容</span><p>{{ node.content || '此节点没有文本内容。' }}</p></div>
    </section>
  </aside>
</template>

<style scoped lang="scss" src="./canvas-context-panel.scss"></style>
