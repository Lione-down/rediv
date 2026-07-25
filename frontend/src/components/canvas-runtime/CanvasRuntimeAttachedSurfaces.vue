<script setup lang="ts">
import {
  Crop,
  Expand,
  MoreHorizontal,
  Play,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import CanvasGenerationParameterControls from '../canvas/CanvasGenerationParameterControls.vue'
import { projectRuntimeNode } from '../../modules/canvas-runtime/canvas-runtime-node-projection'
import type { CanvasCardConfigurationSnapshot } from '../../modules/canvas/canvas-card-configuration'
import { buildCanvasCardViewModel } from '../../modules/canvas/canvas-card-view-model'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import type {
  GenerationNodeParameters,
  ResolvedGenerationRequestContext,
} from '../../modules/canvas/generation-parameters'
import type { PersistedViewport } from '../../modules/canvas/persistence'
import type { CanvasNode } from '../../types/canvas'
import type { ReplacementModelOption } from './CanvasReplacementRuntime.vue'
import {
  runtimeReferenceRoleLabel,
  useRuntimeAttachedPlacement,
} from './use-runtime-attached-placement'

const props = defineProps<{
  generationContext: ResolvedGenerationRequestContext | null
  modelOptions: readonly ReplacementModelOption[]
  node: CanvasNode
  runtimePresentation: GenerationRuntimePresentation | null
  viewport: PersistedViewport
}>()

const emit = defineEmits<{
  generate: []
  openActions: [payload: { opener: HTMLElement; query: string }]
  updateConfiguration: [payload: {
    configuration: CanvasCardConfigurationSnapshot
    nodeId: string
  }]
  updateGenerationParameters: [parameters: GenerationNodeParameters]
  updatePrompt: [payload: { nodeId: string; prompt: string }]
}>()

const draftPrompt = ref(props.node.content ?? '')
const activePopover = ref<'models' | 'parameters' | null>(null)
const projection = computed(() => projectRuntimeNode(props.node, props.runtimePresentation))
const cardViewModel = computed(() => buildCanvasCardViewModel(props.node, {
  isSelected: true,
  runtimePresentation: props.runtimePresentation,
}))
const selectedModelLabel = computed(() => {
  const selectedId = cardViewModel.value.configuration.modelId
  return props.modelOptions.find((option) => option.id === selectedId)?.label
    ?? selectedId
    ?? '选择模型'
})
const videoMode = computed(() => {
  const mode = cardViewModel.value.configuration.generationMode
  if (mode === 'keyframes' || mode === 'keyframes-video') return 'keyframes'
  if (mode === 'image-to-video' || mode === 'first-frame-video') return 'image-to-video'
  return 'text-to-video'
})
const canCompose = computed(() => (
  projection.value.ownership === 'authoring' &&
  ['text', 'script', 'image', 'video', 'video-composition', 'audio'].includes(projection.value.kind)
))
const generationUnavailableReason = computed(() => {
  if (projection.value.kind === 'video-composition') return '视频合成当前无兼容模型，不可用'
  if (!['image', 'video', 'audio'].includes(projection.value.kind)) {
    return '当前卡片使用直接编辑工作流，不可生成'
  }
  if (props.modelOptions.length === 0) return `${projection.value.bodyLabel}当前无兼容模型，不可用`
  if (props.runtimePresentation?.isTerminal === false) return '当前生成尚未结束'
  return ''
})
const { composerStyle, toolbarStyle } = useRuntimeAttachedPlacement(
  () => props.node,
  () => props.viewport,
)

watch(() => [props.node.id, props.node.content] as const, ([, content]) => {
  draftPrompt.value = content ?? ''
  activePopover.value = null
})

function commitPrompt() {
  const prompt = draftPrompt.value.trim()
  if (prompt === (props.node.content ?? '').trim()) return
  emit('updatePrompt', { nodeId: props.node.id, prompt })
}

function selectVideoMode(mode: 'text-to-video' | 'image-to-video' | 'keyframes') {
  if (projection.value.kind !== 'video' || mode === videoMode.value) return
  emit('updateConfiguration', {
    nodeId: props.node.id,
    configuration: {
      schemaVersion: 1,
      generationMode: mode,
      modelId: cardViewModel.value.configuration.modelId,
      promptDocument: cardViewModel.value.configuration.promptDocument,
      references: cardViewModel.value.references,
    },
  })
}

function togglePopover(popover: 'models' | 'parameters') {
  activePopover.value = activePopover.value === popover ? null : popover
}

function selectModel(modelId: string) {
  if (!modelId || modelId === cardViewModel.value.configuration.modelId) {
    activePopover.value = null
    return
  }
  emit('updateConfiguration', {
    nodeId: props.node.id,
    configuration: {
      schemaVersion: 1,
      generationMode: cardViewModel.value.configuration.generationMode,
      modelId,
      promptDocument: cardViewModel.value.configuration.promptDocument,
      references: cardViewModel.value.references,
    },
  })
  activePopover.value = null
}

function openActions(event: MouseEvent, query = '') {
  const opener = event.currentTarget
  if (opener instanceof HTMLElement) emit('openActions', { opener, query })
}

</script>

<template>
  <div
    class="runtime-node-toolbar"
    role="toolbar"
    :aria-label="`${projection.identityTitle} 工具`"
    data-node-toolbar
    :data-owner-node-id="node.id"
    :style="toolbarStyle"
    @pointerdown.stop
  >
    <button
      type="button"
      aria-label="调整"
      :disabled="!generationContext"
      @click="togglePopover('parameters')"
    >
      <SlidersHorizontal :size="16" aria-hidden="true" />
    </button>
    <button
      type="button"
      aria-label="区域编辑"
      :disabled="projection.media.kind === 'placeholder'"
      @click="openActions($event, '区域')"
    >
      <Crop :size="16" aria-hidden="true" />
    </button>
    <button
      type="button"
      aria-label="扩展"
      :disabled="projection.media.kind === 'placeholder'"
      @click="openActions($event, '扩图')"
    >
      <Expand :size="16" aria-hidden="true" />
    </button>
    <button
      type="button"
      aria-label="更多操作"
      :disabled="projection.media.kind === 'placeholder'"
      @click="openActions($event)"
    >
      <MoreHorizontal :size="16" aria-hidden="true" />
    </button>
  </div>

  <section
    v-if="canCompose"
    class="runtime-node-composer"
    data-node-composer
    :data-owner-node-id="node.id"
    :data-composer-kind="projection.kind"
    :style="composerStyle"
    :aria-label="`${projection.identityTitle} 创作输入`"
    @pointerdown.stop
  >
    <header>
      <span>
        <Sparkles :size="15" aria-hidden="true" />
        {{ projection.bodyLabel }}
      </span>
      <button
        type="button"
        aria-label="打开参数"
        :disabled="!generationContext"
        @click="togglePopover('parameters')"
      >
        <SlidersHorizontal :size="15" aria-hidden="true" />
        参数
      </button>
    </header>
    <div
      v-if="projection.kind === 'video'"
      class="runtime-node-composer__video-modes"
      role="group"
      aria-label="视频生成方式"
    >
      <button
        type="button"
        data-video-mode="text-to-video"
        :aria-pressed="videoMode === 'text-to-video'"
        @click="selectVideoMode('text-to-video')"
      >
        文生视频
      </button>
      <button
        type="button"
        data-video-mode="image-to-video"
        :aria-pressed="videoMode === 'image-to-video'"
        @click="selectVideoMode('image-to-video')"
      >
        首帧
      </button>
      <button
        type="button"
        data-video-mode="keyframes"
        :aria-pressed="videoMode === 'keyframes'"
        @click="selectVideoMode('keyframes')"
      >
        首尾帧
      </button>
    </div>
    <div class="runtime-node-composer__references" aria-label="引用">
      <button type="button">+ 添加素材</button>
      <span
        v-for="(reference, index) in cardViewModel.references"
        :key="reference.stableId"
        class="runtime-node-composer__reference-token"
        data-reference-token
        :data-reference-order="reference.order"
        :data-reference-role="reference.role"
      >
        <b>{{ index + 1 }}</b>
        <img :src="reference.thumbnailUrl" alt="" />
        <em>{{ reference.displayName }}</em>
        <small>{{ runtimeReferenceRoleLabel(reference.role) }}</small>
      </span>
    </div>
    <label>
      <span class="sr-only">创作描述</span>
      <textarea
        v-model="draftPrompt"
        rows="3"
        :placeholder="projection.media.kind === 'placeholder' ? projection.media.label : '描述下一步创作意图'"
        @blur="commitPrompt"
      ></textarea>
    </label>
    <footer>
      <button
        type="button"
        class="runtime-node-composer__model"
        aria-label="选择模型"
        :disabled="modelOptions.length === 0"
        @click="togglePopover('models')"
      >
        <WandSparkles :size="14" aria-hidden="true" />
        {{ selectedModelLabel }}
      </button>
      <button
        type="button"
        class="runtime-node-composer__submit"
        :disabled="Boolean(generationUnavailableReason)"
        :aria-label="generationUnavailableReason || '开始生成'"
        :title="generationUnavailableReason || undefined"
        @click="emit('generate')"
      >
        <Play :size="15" aria-hidden="true" />
      </button>
    </footer>
    <div
      v-if="activePopover === 'parameters' && generationContext"
      class="runtime-node-composer__popover is-parameters"
      data-runtime-parameter-popover
    >
      <CanvasGenerationParameterControls
        compact
        :context="generationContext"
        :disabled="runtimePresentation?.isTerminal === false"
        @update-parameters="emit('updateGenerationParameters', $event)"
      />
    </div>
    <section
      v-if="activePopover === 'models'"
      class="runtime-node-composer__popover is-models"
      data-runtime-model-popover
      aria-label="允许的模型"
    >
      <strong>允许的模型</strong>
      <button
        v-for="model in modelOptions"
        :key="model.id"
        type="button"
        :aria-pressed="cardViewModel.configuration.modelId === model.id"
        @click="selectModel(model.id)"
      >
        {{ model.label }}
      </button>
    </section>
  </section>
</template>

<style scoped lang="scss" src="./canvas-runtime-attached-popovers.scss"></style>
