<script setup lang="ts">
import { ChevronLeft, ChevronRight, Link2, LoaderCircle, Send, SlidersHorizontal, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import type { CanvasNode } from '../../types/canvas'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import type {
  CanvasCardPromptDocument,
  CanvasCardReference,
} from '../../modules/canvas/canvas-card-view-model'
import type {
  GenerationNodeParameters,
  ResolvedGenerationRequestContext,
  VideoReferenceBinding,
  VideoReferenceRole,
} from '../../modules/canvas/generation-parameters'
import CanvasGenerationParameterControls from './CanvasGenerationParameterControls.vue'
import CanvasInlineReferenceEditor from './CanvasInlineReferenceEditor.vue'
import {
  resolveCanvasCardVideoWorkMode,
  resolveCanvasCardWorkModel,
  type CanvasCardWorkModeId,
} from './canvas-card-work-model'
import { getPersistedGenerationStatus } from '../../modules/canvas/node-registry'
import { formatGenerationFailureMessage } from '../../modules/canvas/generation-runtime-presentation'

export interface CanvasCardReferenceCandidate {
  assetId?: string
  id: string
  key?: string
  order?: number
  previewUrl?: string
  role?: VideoReferenceRole
  title: string
}

interface CanvasCardMentionOption {
  candidate: CanvasCardReferenceCandidate
  reference: CanvasCardReference
}

const props = withDefaults(defineProps<{
  busy?: boolean
  canGenerate?: boolean
  error?: string
  generationContext?: ResolvedGenerationRequestContext | null
  hasSource?: boolean
  modelLabel?: string
  node: CanvasNode
  placementStyle?: Record<string, string>
  parameterSummary?: readonly string[]
  persistedGenerationMode?: string | null
  promptDocument?: CanvasCardPromptDocument
  canonicalReferences?: readonly CanvasCardReference[]
  connectedReferences?: readonly CanvasCardReferenceCandidate[]
  referenceCandidates?: readonly CanvasCardReferenceCandidate[]
  selectedReferences?: readonly CanvasCardReferenceCandidate[]
  referenceModeActive?: boolean
  runtimePresentation?: GenerationRuntimePresentation | null
  sourceCount?: number
  readonly?: boolean
}>(), {
  busy: false,
  canGenerate: false,
  error: '',
  generationContext: null,
  hasSource: false,
  modelLabel: '',
  placementStyle: () => ({}),
  parameterSummary: () => [],
  persistedGenerationMode: null,
  promptDocument: () => ({ schemaVersion: 1, segments: [] }),
  canonicalReferences: () => [],
  connectedReferences: () => [],
  referenceCandidates: () => [],
  selectedReferences: () => [],
  referenceModeActive: false,
  runtimePresentation: null,
  sourceCount: 0,
  readonly: false,
})

const emit = defineEmits<{
  generate: [prompt: string, mode: CanvasCardWorkModeId]
  beginReference: []
  cancelReference: []
  updateParameters: [parameters: GenerationNodeParameters]
  updatePrompt: [prompt: string]
  updateComposition: [
    prompt: string,
    promptDocument: CanvasCardPromptDocument,
    references: readonly CanvasCardReference[],
  ]
}>()

const promptField = ref<InstanceType<typeof CanvasInlineReferenceEditor> | null>(null)
const settingsButton = ref<HTMLButtonElement | null>(null)
const prompt = ref(props.node.content ?? '')
const referencePickerOpen = ref(false)
const settingsOpen = ref(false)
const workModel = computed(() => resolveCanvasCardWorkModel(props.node, {
  isReadOnly: props.readonly,
  isSelected: true,
}))
const activeMode = computed<CanvasCardWorkModeId>(() => {
  if (workModel.value.family === 'image') return props.sourceCount > 0 ? 'image-to-image' : 'text-to-image'
  if (workModel.value.family === 'video') {
    const videoReferences = props.generationContext?.videoReferences ?? []
    return resolveCanvasCardVideoWorkMode({
      persistedGenerationMode: props.persistedGenerationMode,
      referenceMode: props.generationContext?.referenceMode ?? null,
      referenceRoles: videoReferences.map((binding) => binding.role),
    })
  }
  return workModel.value.modes[0]?.id ?? 'direct-write'
})
const selectedMode = computed(() => (
  workModel.value.modes.find((mode) => mode.id === activeMode.value) ?? workModel.value.modes[0]
))
const requiredSourceCount = computed(() => {
  if (activeMode.value === 'keyframes-video') return 2
  return selectedMode.value?.requiresSource ? 1 : 0
})
const needsSource = computed(() => props.sourceCount < requiredSourceCount.value)
const modeExecutable = computed(() => activeMode.value !== 'image-upscale')
const persistedGenerationStatus = computed(() => getPersistedGenerationStatus(props.node.contentData ?? {}))
const runtimePhase = computed(() => props.runtimePresentation?.phase ?? persistedGenerationStatus.value)
const runtimeLabel = computed(() => {
  if (props.runtimePresentation) return props.runtimePresentation.label
  const labels = {
    queued: '排队中',
    running: '生成中',
    succeeded: '已完成',
    failed: '失败',
    timed_out: '已超时',
  }
  return persistedGenerationStatus.value ? labels[persistedGenerationStatus.value] : ''
})
const submitDisabled = computed(() => (
  props.readonly || props.busy || !props.canGenerate || !modeExecutable.value || needsSource.value || !prompt.value.trim()
))
const referenceLimit = computed(() => (
  props.generationContext?.mediaType === 'video'
    ? props.generationContext.capabilities?.video.max_references ?? 9
    : 9
))
const parameterSummaryLabel = computed(() => props.parameterSummary.length
  ? props.parameterSummary.join(' · ')
  : '生成参数')
const mentionReferences = computed<CanvasCardMentionOption[]>(() => {
  const candidates = props.connectedReferences.length
    ? props.connectedReferences
    : props.selectedReferences
  return candidates.flatMap((candidate, order): CanvasCardMentionOption[] => {
    const canonical = props.canonicalReferences.find((reference) => reference.stableId === candidate.id)
    if (canonical) {
      return [{
        candidate: {
          ...candidate,
          title: canonical.displayName,
          previewUrl: canonical.thumbnailUrl,
        },
        reference: canonical,
      }]
    }
    const assetId = candidate.assetId?.trim()
    if (!assetId) return []
    return [{
      candidate,
      reference: {
        stableId: candidate.id,
        assetId,
        displayName: candidate.title,
        thumbnailUrl: candidate.previewUrl || `canvas-asset:${assetId}`,
        sourceRevision: 0,
        role: candidate.role ?? 'reference',
        order,
      } satisfies CanvasCardReference,
    }]
  })
})
const presentedSelectedReferences = computed(() => props.selectedReferences.map((reference) => {
  const canonical = props.canonicalReferences.find((candidate) => candidate.stableId === reference.id)
  return canonical
    ? { ...reference, title: canonical.displayName, previewUrl: canonical.thumbnailUrl }
    : reference
}))
const isStructuredVideoReference = computed(() => (
  props.generationContext?.mediaType === 'video' &&
  props.generationContext.capabilities?.contract_version === 6 &&
  Boolean(props.generationContext.parameters && 'video' in props.generationContext.parameters)
))
const videoRoleLabels: Record<VideoReferenceRole, string> = {
  'first-frame': '首帧',
  'last-frame': '尾帧',
  reference: '普通参考',
}

watch(() => props.node.id, () => {
  prompt.value = props.node.content ?? ''
  referencePickerOpen.value = false
  settingsOpen.value = false
})
watch(() => props.node.content, (content) => {
  if (document.activeElement?.getAttribute('aria-label') !== '卡片生成提示词') prompt.value = content ?? ''
})

function updateComposition(
  value: string,
  promptDocument: CanvasCardPromptDocument,
) {
  prompt.value = value
  const documentReferences = promptDocument.segments.flatMap((segment) => {
    if (segment.kind !== 'reference') return []
    const reference = props.canonicalReferences.find((candidate) => (
      candidate.stableId === segment.stableId && candidate.assetId === segment.assetId
    )) ?? mentionReferences.value.find(({ reference }) => (
      reference.stableId === segment.stableId && reference.assetId === segment.assetId
    ))?.reference
    return reference ? [reference] : []
  })
  const references = [
    ...props.canonicalReferences,
    ...documentReferences.filter((reference) => !props.canonicalReferences.some((candidate) => (
      candidate.stableId === reference.stableId && candidate.assetId === reference.assetId
    ))),
  ]
  emit('updateComposition', value, promptDocument, references)
}

function insertConnectedMention(reference: CanvasCardReference) {
  referencePickerOpen.value = false
  void nextTick(() => {
    promptField.value?.insertReference(reference)
  })
}

function insertReferenceIntent() {
  referencePickerOpen.value = false
  void nextTick(() => {
    promptField.value?.focus()
  })
}

function emitVideoReferences(bindings: VideoReferenceBinding[]) {
  const context = props.generationContext
  if (!context || !isStructuredVideoReference.value) return
  emit('updateParameters', {
    schema_version: 1,
    video: {
      duration_seconds: context.durationSeconds ?? context.capabilities?.video.default_duration_seconds ?? 5,
      reference_bindings: bindings.map((binding, order) => ({ ...binding, order })),
      ...(context.shotControls ? { shot_controls: context.shotControls } : {}),
    },
  })
}

function changeReferenceRole(reference: CanvasCardReferenceCandidate, event: Event) {
  const role = (event.target as HTMLSelectElement).value as VideoReferenceRole
  const bindings = (props.generationContext?.videoReferences ?? []).map((binding) => ({ ...binding }))
  const index = reference.order ?? -1
  const target = bindings[index]
  if (!target || target.role === role) return
  const occupiedIndex = bindings.findIndex((binding, candidateIndex) => (
    candidateIndex !== index && binding.role === role && (role === 'first-frame' || role === 'last-frame')
  ))
  if (occupiedIndex >= 0) bindings[occupiedIndex].role = target.role
  target.role = role
  emitVideoReferences(bindings)
}

function moveReference(reference: CanvasCardReferenceCandidate, direction: -1 | 1) {
  const bindings = (props.generationContext?.videoReferences ?? []).map((binding) => ({ ...binding }))
  const index = reference.order ?? -1
  const nextIndex = index + direction
  if (!bindings[index] || !bindings[nextIndex]) return
  ;[bindings[index], bindings[nextIndex]] = [bindings[nextIndex], bindings[index]]
  emitVideoReferences(bindings)
}

function removeReference(reference: CanvasCardReferenceCandidate) {
  const index = reference.order ?? -1
  const bindings = (props.generationContext?.videoReferences ?? []).filter((_, candidateIndex) => candidateIndex !== index)
  if (bindings.length === (props.generationContext?.videoReferences ?? []).length) return
  emitVideoReferences(bindings)
}

function closeTransientSurface() {
  if (referencePickerOpen.value) {
    referencePickerOpen.value = false
    void nextTick(() => promptField.value?.focus())
    return
  }
  if (settingsOpen.value) {
    settingsOpen.value = false
    void nextTick(() => settingsButton.value?.focus({ preventScroll: true }))
  }
}
</script>

<template>
  <section
    class="canvas-card-work-surface"
    data-surface-style="source-attached-media-workbench"
    :style="placementStyle"
    :aria-label="`${node.title} 卡片工作区`"
    @click.stop
    @dblclick.stop
    @keydown.esc.stop="closeTransientSurface"
    @pointerdown.stop
  >
    <div class="canvas-card-work-surface__quick-actions">
      <button class="canvas-card-work-surface__reference-action" type="button" :disabled="readonly || busy || !referenceCandidates.length" :aria-pressed="referenceModeActive" @click="referenceModeActive ? emit('cancelReference') : emit('beginReference')">
        <Link2 :size="13" aria-hidden="true" />{{ referenceModeActive ? '退出参考选择' : '参考' }}
      </button>
      <span v-if="presentedSelectedReferences.length">已连接 {{ presentedSelectedReferences.length }}/{{ referenceLimit }}</span>
    </div>

    <div class="canvas-card-work-surface__composer">
      <div class="canvas-card-work-surface__prompt-shell">
        <CanvasInlineReferenceEditor
          ref="promptField"
          :model-value="prompt"
          :prompt-document="promptDocument"
          :references="canonicalReferences"
          :disabled="readonly || busy"
          @change="updateComposition"
          @mention-state="referencePickerOpen = $event"
        />
      </div>
      <div v-if="presentedSelectedReferences.length" class="canvas-card-work-surface__reference-list" role="group" :aria-label="isStructuredVideoReference ? '已选择视频参考' : '已连接参考素材'">
          <article v-for="(reference, index) in presentedSelectedReferences" :key="reference.key ?? reference.id" class="canvas-card-work-surface__reference-chip" data-canonical-reference-control>
            <button type="button" class="canvas-card-work-surface__reference-intent" :aria-label="`定位 ${reference.title} 引用 token`" :disabled="readonly || busy" @click="insertReferenceIntent">
              <img v-if="reference.previewUrl" :src="reference.previewUrl" alt="" />
              <span v-else aria-hidden="true">{{ reference.title.slice(0, 1) }}</span>
              <b aria-hidden="true">{{ index + 1 }}</b>
            </button>
            <strong>{{ reference.title }}</strong>
            <select v-if="isStructuredVideoReference && reference.role" :value="reference.role" :disabled="readonly || busy" :aria-label="`${reference.title} 参考角色`" @change="changeReferenceRole(reference, $event)">
              <option v-for="role in generationContext?.capabilities?.video.reference_roles ?? []" :key="role" :value="role">{{ videoRoleLabels[role] }}</option>
            </select>
            <div v-if="isStructuredVideoReference" class="canvas-card-work-surface__reference-order">
              <button type="button" :aria-label="`前移 ${reference.title}`" :disabled="readonly || busy || index === 0" @click="moveReference(reference, -1)"><ChevronLeft :size="12" aria-hidden="true" /></button>
              <button type="button" :aria-label="`后移 ${reference.title}`" :disabled="readonly || busy || index === presentedSelectedReferences.length - 1" @click="moveReference(reference, 1)"><ChevronRight :size="12" aria-hidden="true" /></button>
              <button type="button" :aria-label="`移除参考 ${reference.title}`" :disabled="readonly || busy" @click="removeReference(reference)"><X :size="12" aria-hidden="true" /></button>
            </div>
          </article>
      </div>
      <div v-if="referencePickerOpen" class="canvas-card-work-surface__reference-picker" role="listbox" aria-label="已连接的可引用素材">
        <button v-for="{ candidate, reference } in mentionReferences" :key="reference.stableId" type="button" role="option" :aria-label="`引用 ${candidate.title}`" @click="insertConnectedMention(reference)">
          <img v-if="candidate.previewUrl" :src="candidate.previewUrl" alt="" />
          <span v-else aria-hidden="true">{{ candidate.title.slice(0, 1) }}</span>
          <strong>{{ candidate.title }}</strong>
        </button>
        <p v-if="!mentionReferences.length" role="status">暂无可引用资产，请先通过参考连接图片</p>
      </div>
    </div>

    <p v-if="referenceModeActive" class="canvas-card-work-surface__selection-status" role="status">正在从画布选择参考 · 点击高亮图片卡，Esc 退出</p>
    <footer>
      <div class="canvas-card-work-surface__metadata">
        <span class="canvas-card-work-surface__model">{{ modelLabel || '模型未就绪' }}</span>
        <button v-if="generationContext" ref="settingsButton" class="canvas-card-work-surface__settings" type="button" :aria-expanded="settingsOpen" :aria-label="`生成参数 ${parameterSummaryLabel}`" @click="settingsOpen = !settingsOpen">
          <SlidersHorizontal :size="14" aria-hidden="true" /><span>{{ parameterSummaryLabel }}</span>
        </button>
        <span v-if="needsSource" class="is-warning">此模式需要图片来源</span>
        <span v-else-if="!modeExecutable" class="is-warning">此模式请在高级图片操作中执行</span>
        <span v-if="runtimeLabel" class="is-runtime" :class="`is-${runtimePhase}`" role="status">{{ runtimeLabel }}</span>
        <span v-if="error || runtimePresentation?.error" class="is-error" role="alert">{{ formatGenerationFailureMessage(error || runtimePresentation?.error) }}</span>
      </div>
      <button class="canvas-card-work-surface__submit" type="button" :disabled="submitDisabled" aria-label="在当前卡片生成" @click="emit('generate', prompt.trim(), activeMode)">
        <LoaderCircle v-if="busy" :size="15" class="is-spinning" aria-hidden="true" />
        <Send v-else :size="15" aria-hidden="true" />
      </button>
    </footer>
    <CanvasGenerationParameterControls
      v-if="settingsOpen && generationContext"
      class="canvas-card-work-surface__settings-panel"
      compact
      :context="generationContext"
      :disabled="busy"
      :readonly="readonly"
      @update-parameters="emit('updateParameters', $event)"
    />
  </section>
</template>

<style scoped lang="scss">
.canvas-card-work-surface { position: absolute; top: calc(100% + var(--canvas-card-floating-gap, 16px)); left: 50%; display: grid; box-sizing: border-box; width: 660px; min-width: 660px; max-width: 660px; min-height: 190px; grid-auto-rows: auto; gap: 8px; padding: 8px; overflow: visible; border: 1px solid var(--canvas-composer-outline); border-radius: var(--v2-radius-lg); color: var(--v2-text-primary); background: var(--canvas-composer-surface); box-shadow: var(--v2-shadow-floating); transform: translateX(-50%); pointer-events: auto; }
.canvas-card-work-surface__quick-actions, footer, .canvas-card-work-surface__metadata { display: flex; min-width: 0; align-items: center; gap: 6px; }
.canvas-card-work-surface__quick-actions { min-height: 28px; padding-left: 4px; color: var(--v2-text-muted); font-size: 11px; }
button { display: inline-flex; min-height: 32px; align-items: center; justify-content: center; gap: 5px; padding: 0 8px; border: 1px solid transparent; border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: transparent; font: inherit; font-size: 12px; cursor: pointer; transition: color var(--v2-duration-fast) var(--v2-ease-standard), border-color var(--v2-duration-fast) var(--v2-ease-standard), background var(--v2-duration-fast) var(--v2-ease-standard), transform var(--v2-duration-fast) var(--v2-ease-standard); }
button:active:not(:disabled) { transform: scale(var(--v2-press-scale)); }
button:focus-visible, .canvas-card-work-surface__prompt-shell:focus-within { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
button:disabled { cursor: not-allowed; opacity: .42; }
.canvas-card-work-surface__reference-action { min-height: 24px; padding-inline: 8px; border-radius: var(--v2-radius-pill); color: var(--v2-text-muted); background: var(--v2-surface-1); }
.canvas-card-work-surface__reference-action[aria-pressed='true'] { color: var(--v2-accent-hover); background: var(--v2-accent-soft); }
.canvas-card-work-surface__reference-list { display: inline-flex; max-width: 100%; min-width: 0; gap: 7px; padding: 7px 0 0; overflow: auto hidden; vertical-align: middle; scrollbar-width: none; }
.canvas-card-work-surface__reference-chip { position: relative; display: grid; flex: 0 0 86px; min-width: 0; grid-template-columns: 42px minmax(0, 1fr); grid-template-rows: 21px 21px; gap: 2px 5px; padding: 4px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-2); }
.canvas-card-work-surface__reference-intent { position: relative; width: 42px; height: 42px; min-height: 42px; grid-row: 1 / 3; padding: 0; overflow: hidden; border-radius: var(--v2-radius-xs); }
.canvas-card-work-surface__reference-intent img { width: 100%; height: 100%; object-fit: cover; }
.canvas-card-work-surface__reference-intent > span { display: grid; width: 100%; height: 100%; place-items: center; background: var(--v2-surface-3); }
.canvas-card-work-surface__reference-intent b { position: absolute; top: 2px; left: 2px; display: grid; min-width: 16px; height: 16px; place-items: center; border-radius: var(--v2-radius-pill); color: var(--v2-text-primary); background: oklch(7% 0.01 292 / .82); font-size: 8px; }
.canvas-card-work-surface__reference-chip > strong { overflow: hidden; align-self: end; color: var(--v2-text-primary); font-size: 8px; font-weight: var(--v2-font-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.canvas-card-work-surface__reference-chip > select { width: 100%; min-width: 0; height: 20px; padding: 0 2px; border: 0; border-radius: var(--v2-radius-xs); color: var(--v2-text-secondary); background: var(--v2-surface-1); font: inherit; font-size: 8px; }
.canvas-card-work-surface__reference-order { position: absolute; top: 2px; right: 2px; display: flex; gap: 1px; padding: 2px; border-radius: var(--v2-radius-xs); background: var(--v2-surface-1); opacity: 0; pointer-events: none; transition: opacity var(--v2-duration-fast) var(--v2-ease-standard); }
.canvas-card-work-surface__reference-chip:hover .canvas-card-work-surface__reference-order, .canvas-card-work-surface__reference-chip:focus-within .canvas-card-work-surface__reference-order { opacity: 1; pointer-events: auto; }
.canvas-card-work-surface__reference-order button { width: 20px; height: 20px; min-height: 20px; padding: 0; }
.canvas-card-work-surface__reference-chip select:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 1px; }
.canvas-card-work-surface__reference-picker { position: absolute; z-index: 12; top: 10px; left: 10px; display: grid; width: 280px; max-height: 220px; gap: 4px; padding: 6px; overflow: auto; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-md); background: var(--v2-surface-3); box-shadow: var(--v2-shadow-floating); }
.canvas-card-work-surface__reference-picker button { display: grid; grid-template-columns: 32px minmax(0, 1fr); justify-content: stretch; text-align: left; }
.canvas-card-work-surface__reference-picker img, .canvas-card-work-surface__reference-picker button > span { width: 32px; height: 24px; border-radius: var(--v2-radius-xs); object-fit: cover; }
.canvas-card-work-surface__reference-picker button > span { display: grid; place-items: center; background: var(--v2-surface-3); }
.canvas-card-work-surface__reference-picker strong { overflow: hidden; font-weight: var(--v2-font-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.canvas-card-work-surface__reference-picker p { margin: 0; padding: 9px 10px; color: var(--v2-text-muted); font-size: 11px; }
.canvas-card-work-surface__composer { position: relative; min-height: 80px; }
.canvas-card-work-surface__prompt-shell { display: flex; min-height: 80px; border-radius: var(--v2-radius-md); background: var(--v2-surface-1); }
.canvas-card-work-surface__selection-status { margin: 0; padding: 7px 9px; border-radius: var(--v2-radius-sm); color: var(--v2-accent-hover); background: var(--v2-accent-soft); font-size: 11px; }
footer { min-height: 36px; align-items: flex-end; }
.canvas-card-work-surface__metadata { flex: 1 1 auto; flex-wrap: wrap; align-self: center; color: var(--v2-text-secondary); font-size: 11px; }
.canvas-card-work-surface__model { padding-inline: 8px; color: var(--v2-text-primary); font-size: 13px; }
.canvas-card-work-surface__settings { min-width: 0; max-width: 360px; justify-content: flex-start; overflow: hidden; color: var(--v2-text-primary); }
.canvas-card-work-surface__settings span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.canvas-card-work-surface__submit { width: 34px; height: 34px; padding: 0; border-color: var(--v2-accent); color: var(--v2-text-on-accent); background: var(--v2-accent); }
.canvas-card-work-surface__settings-panel { position: absolute; z-index: 11; bottom: 42px; left: 50%; box-sizing: border-box; width: 340px; transform: translateX(-50%); }
.canvas-card-work-surface__metadata span + span::before { margin-right: 6px; color: var(--v2-border-standard); content: '·'; }
footer .is-warning { color: var(--v2-warning); }
footer .is-error { color: var(--v2-danger); }
footer .is-runtime { color: var(--v2-text-primary); }
footer .is-runtime.is-failed, footer .is-runtime.is-timed_out { color: var(--v2-danger); }
footer .is-runtime.is-succeeded { color: var(--v2-success); }
.is-spinning { animation: card-work-spin 900ms linear infinite; }
@keyframes card-work-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .is-spinning { animation: none; } }
@media (max-width: 1000px) { .canvas-card-work-surface { width: min(660px, calc(100vw - 32px)); min-width: 0; } .canvas-card-work-surface__settings { max-width: 280px; } }
</style>
