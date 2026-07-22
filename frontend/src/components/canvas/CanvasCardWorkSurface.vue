<script setup lang="ts">
import { ImagePlus, Library, Link2, LoaderCircle, Send } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import type { CanvasNode } from '../../types/canvas'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import {
  resolveCanvasCardWorkModel,
  type CanvasCardWorkModeId,
} from './canvas-card-work-model'

export interface CanvasCardReferenceCandidate {
  id: string
  title: string
}

const props = withDefaults(defineProps<{
  busy?: boolean
  canGenerate?: boolean
  error?: string
  hasSource?: boolean
  modelLabel?: string
  node: CanvasNode
  parameterSummary?: readonly string[]
  referenceCandidates?: readonly CanvasCardReferenceCandidate[]
  referenceModeActive?: boolean
  runtimePresentation?: GenerationRuntimePresentation | null
  sourceCount?: number
  readonly?: boolean
}>(), {
  busy: false,
  canGenerate: false,
  error: '',
  hasSource: false,
  modelLabel: '',
  parameterSummary: () => [],
  referenceCandidates: () => [],
  referenceModeActive: false,
  runtimePresentation: null,
  sourceCount: 0,
  readonly: false,
})

const emit = defineEmits<{
  generate: [prompt: string, mode: CanvasCardWorkModeId]
  beginReference: []
  cancelReference: []
  openAssets: [opener: HTMLElement]
  updatePrompt: [prompt: string]
  upload: [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const prompt = ref(props.node.content ?? '')
const workModel = computed(() => resolveCanvasCardWorkModel(props.node, {
  isReadOnly: props.readonly,
  isSelected: true,
}))
const activeMode = ref<CanvasCardWorkModeId>(workModel.value.modes[0]?.id ?? 'text-to-image')
const selectedMode = computed(() => (
  workModel.value.modes.find((mode) => mode.id === activeMode.value) ?? workModel.value.modes[0]
))
const requiredSourceCount = computed(() => {
  if (activeMode.value === 'keyframes-video') return 2
  return selectedMode.value?.requiresSource ? 1 : 0
})
const needsSource = computed(() => props.sourceCount < requiredSourceCount.value)
const modeExecutable = computed(() => activeMode.value !== 'image-upscale')
const submitDisabled = computed(() => (
  props.readonly || props.busy || !props.canGenerate || !modeExecutable.value || needsSource.value || !prompt.value.trim()
))
const accept = 'image/*'

watch(() => props.node.id, () => {
  prompt.value = props.node.content ?? ''
  activeMode.value = workModel.value.modes[0]?.id ?? 'text-to-image'
})
watch(() => props.node.content, (content) => {
  if (document.activeElement?.getAttribute('aria-label') !== '卡片生成提示词') prompt.value = content ?? ''
})

function updatePrompt(event: Event) {
  prompt.value = (event.target as HTMLTextAreaElement).value
  emit('updatePrompt', prompt.value)
}

function pickUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('upload', file)
  input.value = ''
}

function opener(event: MouseEvent) {
  return event.currentTarget as HTMLElement
}
</script>

<template>
  <section
    class="canvas-card-work-surface"
    :aria-label="`${node.title} 卡片工作区`"
    @click.stop
    @dblclick.stop
    @pointerdown.stop
  >
    <div class="canvas-card-work-surface__toolbar">
      <div class="canvas-card-work-surface__modes" role="group" aria-label="卡片工作模式">
        <button
          v-for="mode in workModel.modes"
          :key="mode.id"
          type="button"
          :class="{ 'is-active': activeMode === mode.id }"
          :aria-pressed="activeMode === mode.id"
          @click="activeMode = mode.id"
        >{{ mode.label }}</button>
      </div>

      <div class="canvas-card-work-surface__sources" role="toolbar" aria-label="图片来源">
        <input ref="fileInput" class="visually-hidden" type="file" :accept="accept" aria-label="上传本地素材到当前卡片" @change="pickUpload" />
        <button type="button" :disabled="readonly || busy" @click="emit('cancelReference'); fileInput?.click()"><ImagePlus :size="14" aria-hidden="true" />本地上传</button>
        <button type="button" :disabled="readonly || busy" @click="emit('cancelReference'); emit('openAssets', opener($event))"><Library :size="14" aria-hidden="true" />项目资产</button>
        <button type="button" :disabled="readonly || busy || !referenceCandidates.length" :aria-pressed="referenceModeActive" @click="referenceModeActive ? emit('cancelReference') : emit('beginReference')"><Link2 :size="14" aria-hidden="true" />{{ referenceModeActive ? '退出参考选择' : '画布参考' }}</button>
      </div>
    </div>

    <div class="canvas-card-work-surface__composer">
      <textarea
        :value="prompt"
        aria-label="卡片生成提示词"
        maxlength="8000"
        :placeholder="workModel.family === 'video' ? '描述镜头运动、主体动作和氛围' : '输入提示词，或选择素材后描述编辑要求'"
        :disabled="readonly || busy"
        @input="updatePrompt"
      ></textarea>
    </div>

    <footer>
      <div class="canvas-card-work-surface__metadata">
        <span>{{ modelLabel || '模型未就绪' }}</span>
        <span v-if="parameterSummary.length">{{ parameterSummary.join(' · ') }}</span>
        <span v-if="needsSource" class="is-warning">此模式需要图片来源</span>
        <span v-else-if="!modeExecutable" class="is-warning">此模式请在高级图片操作中执行</span>
        <span v-if="referenceModeActive" class="is-reference" role="status">正在从画布选择参考 · 点击高亮图片卡，Esc 退出</span>
        <span v-if="runtimePresentation" class="is-runtime" :class="`is-${runtimePresentation.phase}`" role="status">{{ runtimePresentation.label }}</span>
        <span v-if="error" class="is-error" role="alert">{{ error }}</span>
      </div>
      <button class="canvas-card-work-surface__submit" type="button" :disabled="submitDisabled" aria-label="在当前卡片生成" @click="emit('generate', prompt.trim(), selectedMode.id)">
        <LoaderCircle v-if="busy" :size="15" class="is-spinning" aria-hidden="true" />
        <Send v-else :size="15" aria-hidden="true" />
      </button>
    </footer>
  </section>
</template>

<style scoped lang="scss">
.canvas-card-work-surface { position: absolute; top: calc(100% + var(--canvas-card-floating-gap, 16px)); left: 50%; display: grid; box-sizing: border-box; width: 660px; min-width: 660px; max-width: 660px; min-height: 190px; grid-template-rows: auto minmax(0, 1fr) auto; gap: 6px; padding: 10px 12px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-md); color: var(--v2-text-primary); background: var(--v2-surface-2); box-shadow: var(--v2-shadow-floating); transform: translateX(-50%); pointer-events: auto; }
.canvas-card-work-surface__toolbar, .canvas-card-work-surface__modes, .canvas-card-work-surface__sources, footer, .canvas-card-work-surface__metadata { display: flex; min-width: 0; align-items: center; gap: 6px; }
.canvas-card-work-surface__toolbar { overflow: hidden; gap: 8px; }
.canvas-card-work-surface__modes, .canvas-card-work-surface__sources { flex: 0 0 auto; white-space: nowrap; }
.canvas-card-work-surface__sources { padding-left: 8px; border-left: 1px solid var(--v2-border-subtle); }
button { display: inline-flex; min-height: 26px; align-items: center; justify-content: center; gap: 5px; padding: 0 8px; border: 1px solid transparent; border-radius: var(--radius-pill); color: var(--v2-text-secondary); background: var(--v2-surface-1); font: inherit; font-size: 10px; cursor: pointer; }
button.is-active { border-color: var(--v2-accent); color: var(--v2-accent); background: var(--v2-accent-soft); }
button:focus-visible, textarea:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
button:disabled { cursor: not-allowed; opacity: .42; }
.canvas-card-work-surface__composer { min-height: 80px; }
textarea { box-sizing: border-box; width: 100%; height: 100%; min-height: 80px; max-height: none; resize: none; padding: 12px 6px; border: 0; border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: transparent; font: inherit; font-size: 12px; line-height: 1.5; }
footer { min-height: 36px; align-items: flex-end; }
.canvas-card-work-surface__metadata { flex: 1 1 auto; flex-wrap: wrap; align-self: center; color: var(--v2-text-secondary); font-size: 9px; }
.canvas-card-work-surface__submit { width: 34px; height: 34px; padding: 0; border-color: var(--v2-accent); color: var(--v2-text-on-accent); background: var(--v2-accent); }
.canvas-card-work-surface__metadata span + span::before { margin-right: 6px; color: var(--v2-border-standard); content: '·'; }
footer .is-warning { color: var(--v2-warning); }
footer .is-error { color: var(--v2-danger); }
footer .is-reference { color: var(--v2-accent); }
footer .is-runtime { color: var(--v2-text-primary); }
footer .is-runtime.is-failed, footer .is-runtime.is-timed_out { color: var(--v2-danger); }
footer .is-runtime.is-succeeded { color: var(--v2-success); }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.is-spinning { animation: card-work-spin 900ms linear infinite; }
@keyframes card-work-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .is-spinning { animation: none; } }
</style>
