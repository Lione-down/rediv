<script setup lang="ts">
import { Check, CircleAlert, LoaderCircle, RotateCcw, WandSparkles } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { request } from '../../api/request'
import {
  buildCinematicDirectorHandoff,
  requestCinematicDirectorPreflight,
} from '../../modules/canvas/cinematic-director-preflight'
import {
  buildCinematicRetakeDraft,
  resolveCinematicTakeActions,
} from '../../modules/canvas/cinematic-director-ux'
import { parseCinematicDirectorBrief, parseCinematicReferenceTransfer } from '../../modules/canvas/cinematic-director'
import { parseCinematicSequenceState } from '../../modules/canvas/cinematic-sequence'
import { createCinematicTakeReviewCommand } from '../../modules/canvas/cinematic-take-review'
import { loadCinematicSkillSources, type PreparedCinematicGeneration } from '../../modules/canvas/cinematic-skills'
import { useCanvasStore } from '../../store/canvas'
import type { CanvasNode } from '../../types/canvas'
import type { ResolvedResultLineage } from '../../modules/canvas/generation-lineage'

const props = withDefaults(defineProps<{
  canvasId?: string
  node: CanvasNode
  projectId?: string
  readonly?: boolean
  resultLineage?: ResolvedResultLineage | null
  taskSnapshot?: Record<string, unknown> | null
}>(), {
  canvasId: '', projectId: '', readonly: false, resultLineage: null, taskSnapshot: null,
})

const emit = defineEmits<{
  locateNode: [nodeId: string]
  preflightReady: [generationNodeId: string, prepared: PreparedCinematicGeneration]
}>()
const canvasStore = useCanvasStore()
const decision = ref<'keep' | 'fix_in_post' | 'edit' | 'reroll' | 'rewrite'>('keep')
const observedEndState = ref('')
const problemCategory = ref<'camera' | 'action' | 'identity' | 'continuity' | 'lighting' | 'composition' | 'audio' | 'other'>('camera')
const repairVariable = ref('')
const revisedInstruction = ref('')
const isLoading = ref(false)
const error = ref('')
const status = ref('')

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

const canonical = computed(() => record(props.taskSnapshot?.canonical_request))
const isV2 = computed(() => props.taskSnapshot?.contract_version === 2 && canonical.value?.skill_version === 2)
const mediaType = computed(() => canonical.value?.skill_id === 'revid.cinema-image' ? 'image' : 'video')
const actions = computed(() => resolveCinematicTakeActions(mediaType.value, false))
const actionLabels = {
  keep: '保留并进入 canon', fix_in_post: '后期修复', edit: '可用编辑', reroll: '单变量重抽', rewrite: '改写后预检',
}
const selectedActionAvailable = computed(() => actions.value.find(([id]) => id === decision.value)?.[1] ?? false)

function sourceSequence() {
  const brief = record(canonical.value?.director_brief)
  const sourceId = typeof brief?.source_script_node_id === 'string' ? brief.source_script_node_id : null
  const source = sourceId ? canvasStore.nodes.find((candidate) => candidate.id === sourceId) : null
  if (!source) return null
  try {
    return { source, sequence: parseCinematicSequenceState(source.contentData?.cinematic_sequence) }
  } catch {
    return null
  }
}

async function keepTake() {
  const context = sourceSequence()
  const projection = record(canonical.value?.sequence_context)
  const clipId = typeof projection?.current_clip_id === 'string' ? projection.current_clip_id : null
  if (!context || !clipId || !observedEndState.value.trim()) {
    error.value = 'Keep 需要当前 sequence clip 与用户确认的画面结束状态。'
    return
  }
  isLoading.value = true
  error.value = ''
  try {
    const sources = await loadCinematicSkillSources(props.projectId, props.canvasId, request)
    const resultRevision = sources.items.find((item) => item.node_id === props.node.id)?.source_revision
    const clip = context.sequence.clips.find((item) => item.clip_id === clipId)
    if (!resultRevision || !clip) throw new Error('结果 lineage 已变化，请重新检查。')
    const command = createCinematicTakeReviewCommand({
      source: context.source,
      sequence: context.sequence,
      clipId,
      result: props.node,
      resultRevision,
      decision: 'accept',
      observedEndState: observedEndState.value,
      completedBeatIds: clip.completed_beat_ids,
      reservedBeatIds: clip.reserved_beat_ids,
    })
    if (!command) throw new Error('当前 take 无法进入 canon。')
    await canvasStore.dispatchCommand({ source: 'toolbar', command })
    status.value = '已通过一个原子 command 接受；canon revision 仅增加 1。'
  } catch (value) {
    error.value = value instanceof Error ? value.message : 'Keep 失败。'
  } finally {
    isLoading.value = false
  }
}

function currentTransfers() {
  const references = canonical.value?.references
  if (!Array.isArray(references)) return []
  const seen = new Set<string>()
  return references.flatMap((raw) => {
    const item = record(raw)
    const nodeId = typeof item?.node_id === 'string' ? item.node_id : ''
    if (!item || seen.has(nodeId)) return []
    try {
      const parsed = parseCinematicReferenceTransfer({
        contract_version: 1,
        node_id: item.node_id,
        role: item.role,
        instruction: item.instruction,
        must_not_transfer: item.must_not_transfer,
        source_revision: item.source_revision,
      })
      seen.add(parsed.node_id)
      const { contract_version: _version, ...transfer } = parsed
      return [transfer]
    } catch {
      return []
    }
  })
}

async function prepareRetake() {
  if (!props.resultLineage?.taskId || !props.resultLineage.generationNodeId || !canonical.value) return
  isLoading.value = true
  error.value = ''
  status.value = ''
  try {
    const draft = buildCinematicRetakeDraft({
      decision: decision.value,
      priorTaskId: props.resultLineage.taskId,
      priorResultNodeId: props.node.id,
      problemCategory: problemCategory.value,
      repairVariable: repairVariable.value,
      attemptCount: Number(record(canonical.value.retake_context)?.attempt_count ?? 0) + 1,
      revisedInstruction: decision.value === 'rewrite' ? revisedInstruction.value : null,
    })
    const skillId = canonical.value.skill_id
    const provider = record(canonical.value.provider)
    const parameters = record(canonical.value.parameters)
    if (!['revid.cinema-image', 'revid.cinema-video'].includes(String(skillId)) || !provider || !parameters) {
      throw new Error('历史 task snapshot 缺少可复现的 provider 或参数。')
    }
    const sources = await loadCinematicSkillSources(props.projectId, props.canvasId, request)
    const rawBrief = canonical.value.director_brief
    const directorBrief = rawBrief === null ? null : parseCinematicDirectorBrief(rawBrief)
    const input = {
      projectId: props.projectId,
      canvasId: props.canvasId,
      canvasRevision: sources.canvas_revision,
      skillId: skillId as 'revid.cinema-image' | 'revid.cinema-video',
      providerId: String(provider.provider_id),
      modelId: String(provider.model_id),
      userInstruction: decision.value === 'rewrite' ? revisedInstruction.value : `只修复：${repairVariable.value}`,
      mentions: currentTransfers(),
      generationParameters: parameters,
      workflowMode: draft.workflowMode,
      directorBrief,
      sequenceContext: null,
      retakeContext: draft.context,
    }
    const preflight = await requestCinematicDirectorPreflight(input, request)
    if (!preflight.ready_for_handoff) {
      throw new Error((preflight.conflicts[0] ?? preflight.recommendations[0])?.message ?? 'retake preflight 未通过。')
    }
    const prompt = preflight.canonical_request.optimized_prompt
    const imageIds = preflight.canonical_request.image_ids
    if (typeof prompt !== 'string' || !Array.isArray(imageIds)) throw new Error('retake preflight 响应无效。')
    emit('preflightReady', props.resultLineage.generationNodeId, {
      handoff: buildCinematicDirectorHandoff(input, preflight),
      optimizedPrompt: prompt,
      imageIds: imageIds as string[],
    })
    status.value = '新 preflight 已准备；未创建 task。请返回原 generation 节点并显式 Send。'
  } catch (value) {
    error.value = value instanceof Error ? value.message : 'retake preflight 失败。'
  } finally {
    isLoading.value = false
  }
}

async function applyDecision() {
  if (!selectedActionAvailable.value || props.readonly) return
  if (decision.value === 'keep') return keepTake()
  if (decision.value === 'reroll' || decision.value === 'rewrite') return prepareRetake()
  status.value = decision.value === 'fix_in_post'
    ? '已选择后期修复；Canvas canon 与 generation task 均未改变。'
    : '此媒体当前没有可用的非生成编辑入口。'
}
</script>

<template>
  <section v-if="isV2" class="take-review" aria-label="Cinematic Director take review">
    <header><span><WandSparkles :size="14" aria-hidden="true" />Take review</span><small>用户决定 · 不自动重试</small></header>
    <div class="take-actions" role="radiogroup" aria-label="Take 处理方式">
      <label v-for="[action, available] in actions" :key="action" :class="{ unavailable: !available }">
        <input v-model="decision" type="radio" name="cinematic-take-decision" :value="action" :disabled="readonly || !available">
        <span>{{ actionLabels[action] }}</span>
      </label>
    </div>
    <label v-if="decision === 'keep'" class="field"><span>画面结束状态</span><input v-model="observedEndState" maxlength="500" placeholder="角色停在列车门前并抬头" :disabled="readonly"></label>
    <template v-if="decision === 'reroll' || decision === 'rewrite'">
      <label class="field"><span>问题类别</span><select v-model="problemCategory" :disabled="readonly"><option value="camera">Camera</option><option value="action">Action</option><option value="identity">Identity</option><option value="continuity">Continuity</option><option value="lighting">Lighting</option><option value="composition">Composition</option><option value="audio">Audio</option><option value="other">Other</option></select></label>
      <label class="field"><span>唯一 repair variable</span><input v-model="repairVariable" maxlength="200" placeholder="camera movement" :disabled="readonly"></label>
      <label v-if="decision === 'rewrite'" class="field"><span>改写指令</span><textarea v-model="revisedInstruction" rows="3" maxlength="500" :disabled="readonly"></textarea></label>
    </template>
    <button v-if="!readonly" type="button" class="review-action" :disabled="isLoading || !selectedActionAvailable" @click="applyDecision">
      <LoaderCircle v-if="isLoading" :size="14" class="spinning" aria-hidden="true" /><RotateCcw v-else-if="decision === 'reroll' || decision === 'rewrite'" :size="14" aria-hidden="true" /><Check v-else :size="14" aria-hidden="true" />
      {{ decision === 'reroll' || decision === 'rewrite' ? '仅创建新 preflight' : '确认选择' }}
    </button>
    <p v-if="status" class="status" role="status">{{ status }} <button v-if="status.includes('返回原') && resultLineage" type="button" @click="emit('locateNode', resultLineage.generationNodeId)">定位原节点</button></p>
    <p v-if="error" class="error" role="alert"><CircleAlert :size="13" aria-hidden="true" />{{ error }}</p>
  </section>
</template>

<style scoped>
.take-review { display: grid; gap: 9px; padding: 11px; border: 1px solid var(--v2-accent-border); border-radius: var(--v2-radius-md); background: color-mix(in srgb, var(--v2-accent-soft) 42%, var(--v2-surface-2)); }.take-review header { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--v2-text-secondary); font-size: 11px; }.take-review header span { display: inline-flex; align-items: center; gap: 6px; color: var(--v2-accent-hover); }.take-review header small { color: var(--v2-text-muted); }.take-actions { display: flex; flex-wrap: wrap; gap: 5px; }.take-actions label { display: inline-flex; min-height: 30px; align-items: center; gap: 4px; padding: 4px 7px; border: 1px solid var(--v2-border-standard); border-radius: 999px; color: var(--v2-text-secondary); background: var(--v2-surface-1); cursor: pointer; font-size: 10px; }.take-actions label:has(input:checked) { border-color: var(--v2-accent-border); color: var(--v2-accent-hover); background: var(--v2-accent-soft); }.take-actions .unavailable { opacity: .42; cursor: not-allowed; }.field { display: grid; gap: 4px; color: var(--v2-text-secondary); font-size: 10px; }.field input, .field select, .field textarea { min-height: 34px; padding: 7px 8px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-canvas); font: inherit; resize: vertical; }.review-action { display: inline-flex; min-height: 36px; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--v2-accent-border); border-radius: var(--v2-radius-sm); color: var(--v2-accent-hover); background: var(--v2-accent-soft); cursor: pointer; }.review-action:disabled { cursor: not-allowed; opacity: .5; }.status, .error { margin: 0; font-size: 10px; line-height: 1.5; }.status { color: var(--v2-success); }.status button { border: 0; color: var(--v2-accent-hover); background: transparent; cursor: pointer; text-decoration: underline; }.error { display: flex; align-items: flex-start; gap: 5px; color: var(--v2-danger); }.take-review :focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }.spinning { animation: spin 1s linear infinite; }@keyframes spin { to { transform: rotate(360deg); } }@media (prefers-reduced-motion: reduce) { .spinning { animation: none; } }
</style>
