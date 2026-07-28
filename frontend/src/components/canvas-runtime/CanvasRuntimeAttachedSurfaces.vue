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
import { computed, nextTick, ref, watch } from 'vue'
import CanvasGenerationParameterControls from '../canvas/CanvasGenerationParameterControls.vue'
import CanvasInlineReferenceEditor from '../canvas/CanvasInlineReferenceEditor.vue'
import CanvasScriptGenerationControls from '../canvas/CanvasScriptGenerationControls.vue'
import { projectRuntimeNode } from '../../modules/canvas-runtime/canvas-runtime-node-projection'
import type { CanvasCardConfigurationSnapshot } from '../../modules/canvas/canvas-card-configuration'
import { buildCanvasCardViewModel } from '../../modules/canvas/canvas-card-view-model'
import type {
  CanvasCardPromptDocument,
  CanvasCardReference,
} from '../../modules/canvas/canvas-card-view-model'
import { createCanvasCardPromptDocument } from '../../modules/canvas/canvas-card-configuration'
import { canvasCardPromptText } from '../../modules/canvas/canvas-card-configuration'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import { formatGenerationFailureMessage } from '../../modules/canvas/generation-runtime-presentation'
import type {
  GenerationNodeParameters,
  ResolvedGenerationRequestContext,
  VideoReferenceBinding,
} from '../../modules/canvas/generation-parameters'
import type { PersistedViewport } from '../../modules/canvas/persistence'
import type { CanvasNode } from '../../types/canvas'
import type { ProjectAsset } from '../../modules/canvas/project-resource-types'
import type { ScriptGenerationSubmission } from '../canvas/composables/use-canvas-script-generation'
import type { ScriptAuthoringCapabilities } from '../../modules/canvas/script-authoring'
import type { ReplacementModelOption } from './CanvasReplacementRuntime.vue'
import {
  runtimeReferenceRoleLabel,
  useRuntimeAttachedPlacement,
} from './use-runtime-attached-placement'

const props = defineProps<{
  assets: readonly ProjectAsset[]
  generationContext: ResolvedGenerationRequestContext | null
  generationQuota: number
  modelOptions: readonly ReplacementModelOption[]
  node: CanvasNode
  runtimePresentation: GenerationRuntimePresentation | null
  scriptActive: boolean
  scriptCapability: ScriptAuthoringCapabilities | null
  scriptCapabilityError: string
  scriptCapabilityLoading: boolean
  scriptError: string
  scriptQuota: number
  scriptSuccess: string
  viewport: PersistedViewport
}>()

const emit = defineEmits<{
  generate: []
  cancelScript: []
  generateScript: [submission: ScriptGenerationSubmission]
  openActions: [payload: { opener: HTMLElement; query: string }]
  openScriptWorkspace: [nodeId: string]
  retryScriptCapability: []
  updateConfiguration: [payload: {
    configuration: CanvasCardConfigurationSnapshot
    nodeId: string
  }]
  updateGenerationParameters: [parameters: GenerationNodeParameters]
  updateComposition: [payload: {
    generationMode: string | null
    nodeId: string
    parameters: GenerationNodeParameters | null
    prompt: string
    promptDocument: CanvasCardPromptDocument
    references: readonly CanvasCardReference[]
  }]
  updatePrompt: [payload: { nodeId: string; prompt: string }]
}>()

const draftPrompt = ref(props.node.content ?? '')
const promptEditor = ref<InstanceType<typeof CanvasInlineReferenceEditor> | null>(null)
const referencePickerOpen = ref(false)
const brokenReferenceThumbnails = ref(new Set<string>())
const activePopover = ref<'models' | 'parameters' | 'script-settings' | null>(null)
const projection = computed(() => projectRuntimeNode(props.node, props.runtimePresentation))
const cardViewModel = computed(() => buildCanvasCardViewModel(props.node, {
  isSelected: true,
  runtimePresentation: props.runtimePresentation,
}))
function usableThumbnailUrl(value: unknown) {
  if (typeof value !== 'string') return ''
  const normalized = value.trim()
  if (
    !normalized ||
    normalized.startsWith('canvas-asset:') ||
    !(
      normalized.startsWith('https://') ||
      normalized.startsWith('http://') ||
      normalized.startsWith('data:image/') ||
      normalized.startsWith('blob:') ||
      normalized.startsWith('/')
    )
  ) return ''
  return normalized
}

const assetsById = computed(() => new Map(props.assets.map((asset) => [asset.id, asset])))
const resolvedReferences = computed(() => cardViewModel.value.references.map((reference) => {
  const assetUrl = usableThumbnailUrl(assetsById.value.get(reference.assetId)?.url)
  if (assetUrl) return { ...reference, thumbnailUrl: assetUrl }
  const persistedUrl = usableThumbnailUrl(reference.thumbnailUrl)
  if (persistedUrl) return { ...reference, thumbnailUrl: persistedUrl }
  const source = props.generationContext?.mediaSources.find((candidate) => (
    candidate.nodeId === reference.stableId && candidate.assetId === reference.assetId
  ))
  const sourceUrl = usableThumbnailUrl(source?.thumbnailUrl)
  return sourceUrl
    ? { ...reference, thumbnailUrl: sourceUrl }
    : reference
}))
const configurationByNodeId = new Map<string, CanvasCardConfigurationSnapshot>()
watch(
  () => [props.node.id, cardViewModel.value.configuration, resolvedReferences.value] as const,
  ([nodeId, configuration, references]) => {
    configurationByNodeId.set(nodeId, {
      schemaVersion: 1,
      generationMode: configuration.generationMode,
      modelId: configuration.modelId,
      promptDocument: configuration.promptDocument,
      references,
    })
  },
  { deep: true, immediate: true },
)
const selectedModelLabel = computed(() => {
  const selectedId = cardViewModel.value.configuration.modelId
  return props.modelOptions.find((option) => option.id === selectedId)?.label
    ?? selectedId
    ?? '选择模型'
})
const videoMode = computed(() => {
  const mode = props.generationContext?.referenceMode
    ?? cardViewModel.value.configuration.generationMode
  if (mode === 'keyframes' || mode === 'keyframes-video') return 'keyframes'
  if (mode === 'image-to-video' || mode === 'first-frame-video') return 'image-to-video'
  return 'text-to-video'
})
const mentionReferences = computed(() => (
  props.generationContext?.mediaSources.flatMap((source, order): CanvasCardReference[] => {
    if (!source.assetId || !['included', 'reference-mode-excluded'].includes(source.state)) return []
    const canonical = resolvedReferences.value.find((reference) => (
      reference.stableId === source.nodeId && reference.assetId === source.assetId
    ))
    return [canonical ?? {
      stableId: source.nodeId,
      assetId: source.assetId,
      displayName: source.title,
      thumbnailUrl: source.thumbnailUrl ?? '',
      sourceRevision: 0,
      role: 'reference',
      order,
    }]
  }) ?? []
))
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
  if (props.generationContext?.parameterError) return props.generationContext.parameterError
  const requiredQuota = projection.value.kind === 'image'
    ? props.generationContext?.outputCount ?? 1
    : 1
  if (props.generationQuota < requiredQuota) {
    const quotaLabel = projection.value.kind === 'image' ? '图片' : '视频'
    return `${quotaLabel}生成需要 ${requiredQuota} quota，当前剩余 ${props.generationQuota}`
  }
  return ''
})
const generationFailureMessage = computed(() => (
  props.runtimePresentation?.error
    ? formatGenerationFailureMessage(props.runtimePresentation.error)
    : ''
))
const { composerStyle, toolbarStyle } = useRuntimeAttachedPlacement(
  () => props.node,
  () => props.viewport,
)

watch(() => props.node.id, () => {
  draftPrompt.value = props.node.content ?? ''
  referencePickerOpen.value = false
  activePopover.value = null
  brokenReferenceThumbnails.value = new Set()
})

watch(() => props.node.content, (content) => {
  draftPrompt.value = content ?? ''
})

function buildVideoParameters(
  references: readonly CanvasCardReference[],
): GenerationNodeParameters | null {
  const context = props.generationContext
  if (!context || context.mediaType !== 'video') return null
  const available = new Set(context.mediaSources.flatMap((source) => (
    source.assetId ? [`${source.nodeId}:${source.assetId}`] : []
  )))
  const bindings: VideoReferenceBinding[] = [...references]
    .sort((left, right) => left.order - right.order)
    .filter((reference) => available.has(`${reference.stableId}:${reference.assetId}`))
    .map((reference, order) => ({
      node_id: reference.stableId,
      asset_id: reference.assetId,
      role: reference.role === 'first-frame' || reference.role === 'last-frame'
        ? reference.role
        : 'reference',
      order,
    }))
  return {
    schema_version: 1,
    video: {
      aspect_ratio: context.aspectRatio
        ?? context.capabilities?.video.default_aspect_ratio ?? '16:9',
      duration_seconds: context.durationSeconds
        ?? context.capabilities?.video.default_duration_seconds ?? 5,
      reference_bindings: bindings,
      ...(context.shotControls ? { shot_controls: context.shotControls } : {}),
    },
  }
}

function referenceThumbnailKey(reference: CanvasCardReference) {
  return `${reference.stableId}:${reference.assetId}`
}

function referenceThumbnailUrl(reference: CanvasCardReference) {
  const value = reference.thumbnailUrl.trim()
  if (
    !value ||
    value.startsWith('canvas-asset:') ||
    brokenReferenceThumbnails.value.has(referenceThumbnailKey(reference))
  ) return null
  return value
}

function markReferenceThumbnailBroken(reference: CanvasCardReference) {
  brokenReferenceThumbnails.value = new Set([
    ...brokenReferenceThumbnails.value,
    referenceThumbnailKey(reference),
  ])
}

function emitComposition(
  prompt: string,
  promptDocument: CanvasCardPromptDocument,
  references: readonly CanvasCardReference[],
  generationMode = cardViewModel.value.configuration.generationMode,
) {
  emit('updateComposition', {
    generationMode,
    nodeId: props.node.id,
    parameters: buildVideoParameters(references),
    prompt,
    promptDocument,
    references,
  })
}

function updateComposition(prompt: string, promptDocument: CanvasCardPromptDocument) {
  draftPrompt.value = prompt
  const referencedIds = new Set(promptDocument.segments.flatMap((segment) => (
    segment.kind === 'reference' ? [`${segment.stableId}:${segment.assetId}`] : []
  )))
  const added = mentionReferences.value.filter((reference) => (
    referencedIds.has(`${reference.stableId}:${reference.assetId}`)
  ))
  const references = [...resolvedReferences.value, ...added.filter((reference) => (
    !resolvedReferences.value.some((candidate) => (
      candidate.stableId === reference.stableId && candidate.assetId === reference.assetId
    ))
  ))].map((reference, order) => ({ ...reference, order }))
  emitComposition(prompt, promptDocument, references)
}

function insertReference(reference: CanvasCardReference) {
  referencePickerOpen.value = false
  void nextTick(() => promptEditor.value?.insertReference(reference))
}

function openReferencePicker() {
  referencePickerOpen.value = true
  void nextTick(() => promptEditor.value?.focus())
}

function changeReferenceRole(reference: CanvasCardReference, event: Event) {
  const role = (event.target as HTMLSelectElement).value
  if (role !== 'first-frame' && role !== 'last-frame' && role !== 'reference') return
  const references = resolvedReferences.value.map((candidate) => {
    if (
      candidate.stableId === reference.stableId &&
      candidate.assetId === reference.assetId
    ) return { ...candidate, role }
    if ((role === 'first-frame' || role === 'last-frame') && candidate.role === role) {
      return { ...candidate, role: 'reference' }
    }
    return candidate
  })
  emitComposition(
    draftPrompt.value,
    cardViewModel.value.configuration.promptDocument,
    references,
  )
}

function selectVideoMode(mode: 'text-to-video' | 'image-to-video' | 'keyframes') {
  if (projection.value.kind !== 'video' || mode === videoMode.value) return
  const candidates = resolvedReferences.value.length
    ? [...resolvedReferences.value]
    : [...mentionReferences.value]
  const selected = mode === 'text-to-video'
    ? []
    : mode === 'image-to-video'
      ? candidates.slice(0, 1).map((reference) => ({ ...reference, role: 'first-frame' as const }))
      : candidates.map((reference, index) => ({
          ...reference,
          role: index === 0
            ? 'first-frame' as const
            : index === candidates.length - 1 ? 'last-frame' as const : 'reference' as const,
        }))
  const retained = new Set(selected.map((reference) => (
    `${reference.stableId}:${reference.assetId}`
  )))
  const promptDocument = createCanvasCardPromptDocument(
    cardViewModel.value.configuration.promptDocument.segments.flatMap((segment) => (
      segment.kind === 'reference' &&
      !retained.has(`${segment.stableId}:${segment.assetId}`)
        ? []
        : [segment]
    )),
  )
  emitComposition(
    draftPrompt.value,
    promptDocument,
    selected.map((reference, order) => ({ ...reference, order })),
    mode,
  )
}

function togglePopover(popover: 'models' | 'parameters' | 'script-settings') {
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
      references: resolvedReferences.value,
    },
  })
  activePopover.value = null
}

function updateScriptBrief(payload: { nodeId: string; value: string }) {
  const configuration = configurationByNodeId.get(payload.nodeId)
  if (!configuration) return
  emit('updateConfiguration', {
    nodeId: payload.nodeId,
    configuration: {
      ...configuration,
      promptDocument: createCanvasCardPromptDocument(
        payload.value ? [{ kind: 'text', text: payload.value }] : [],
      ),
    },
  })
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
    <template v-if="projection.kind === 'script'">
      <button
        type="button"
        aria-label="调整脚本配置"
        data-script-tool="settings"
        @click="togglePopover('script-settings')"
      >
        <SlidersHorizontal :size="16" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="扩展脚本工作流"
        data-script-tool="workspace"
        @click="emit('openScriptWorkspace', node.id)"
      >
        <Expand :size="16" aria-hidden="true" />
      </button>
    </template>
    <template v-else>
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
    </template>
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
    <template v-if="projection.kind === 'script'">
      <CanvasScriptGenerationControls
        :active="scriptActive"
        :capability="scriptCapability"
        :capability-error="scriptCapabilityError"
        :capability-loading="scriptCapabilityLoading"
        :error="scriptError"
        :initial-value="canvasCardPromptText(cardViewModel.configuration.promptDocument)"
        :model-id="cardViewModel.configuration.modelId"
        :node="node"
        output-kind="story_production"
        :quota="scriptQuota"
        :success="scriptSuccess"
        @cancel="emit('cancelScript')"
        @generate="emit('generateScript', $event)"
        @retry-capability="emit('retryScriptCapability')"
        @select-model="selectModel"
        @update-brief="updateScriptBrief"
      />
      <section
        v-if="activePopover === 'script-settings'"
        class="runtime-node-composer__popover is-script-settings"
        data-script-settings-popover
        aria-label="脚本生成配置"
      >
        <strong>结构化分镜</strong>
        <span>{{ scriptCapability?.modelLabel ?? '模型未就绪' }}</span>
        <small>自动使用项目内置 revid.story-director；无需选择 Skill。</small>
      </section>
    </template>
    <template v-else>
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
        :disabled="mentionReferences.length < 1"
        @click="selectVideoMode('image-to-video')"
      >
        首帧
      </button>
      <button
        type="button"
        data-video-mode="keyframes"
        :aria-pressed="videoMode === 'keyframes'"
        :disabled="mentionReferences.length < 2"
        @click="selectVideoMode('keyframes')"
      >
        首尾帧
      </button>
    </div>
    <div class="runtime-node-composer__references" aria-label="引用">
      <button type="button" @click="openReferencePicker">+ 添加素材</button>
      <span
        v-for="(reference, index) in resolvedReferences"
        :key="reference.stableId"
        class="runtime-node-composer__reference-token"
        data-reference-token
        :data-reference-order="reference.order"
        :data-reference-role="reference.role"
      >
        <b>{{ index + 1 }}</b>
        <img
          v-if="referenceThumbnailUrl(reference)"
          :src="referenceThumbnailUrl(reference)!"
          alt=""
          @error="markReferenceThumbnailBroken(reference)"
        />
        <span v-else class="runtime-node-composer__reference-fallback" aria-hidden="true">
          {{ reference.displayName.slice(0, 1) }}
        </span>
        <em>{{ reference.displayName }}</em>
        <select
          v-if="projection.kind === 'video' && ((generationContext?.capabilities?.contract_version ?? 0) < 7 || generationContext?.referenceMode === 'keyframes')"
          :aria-label="`${reference.displayName} 参考角色`"
          :value="reference.role"
          @change="changeReferenceRole(reference, $event)"
        >
          <option value="first-frame">首帧</option>
          <option value="last-frame">尾帧</option>
          <option value="reference">中间关键帧</option>
        </select>
        <small v-else>{{ runtimeReferenceRoleLabel(reference.role) }}</small>
      </span>
    </div>
    <div class="runtime-node-composer__prompt-shell">
      <CanvasInlineReferenceEditor
        ref="promptEditor"
        :model-value="draftPrompt"
        :prompt-document="cardViewModel.configuration.promptDocument"
        :references="resolvedReferences"
        @change="updateComposition"
        @mention-state="referencePickerOpen = $event"
      />
    </div>
    <div
      v-if="referencePickerOpen"
      class="runtime-node-composer__reference-picker"
      role="listbox"
      aria-label="已连接的可引用素材"
    >
      <button
        v-for="reference in mentionReferences"
        :key="`${reference.stableId}:${reference.assetId}`"
        type="button"
        role="option"
        :aria-label="`引用 ${reference.displayName}`"
        @click="insertReference(reference)"
      >
        {{ reference.displayName }}
      </button>
      <p v-if="!mentionReferences.length" role="status">暂无可引用图片，请先连接图片卡片</p>
    </div>
    <p
      v-if="generationFailureMessage"
      class="runtime-node-composer__blocked-reason is-error"
      data-runtime-failure
      role="alert"
    >
      {{ generationFailureMessage }}
    </p>
    <p
      v-if="generationUnavailableReason"
      class="runtime-node-composer__blocked-reason"
      role="status"
    >
      {{ generationUnavailableReason }}
    </p>
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
    </template>
  </section>
</template>

<style scoped lang="scss" src="./canvas-runtime-attached-popovers.scss"></style>
