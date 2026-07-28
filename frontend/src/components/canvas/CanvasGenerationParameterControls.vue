<script setup lang="ts">
import { computed } from 'vue'
import type {
  GenerationNodeParameters,
  ResolvedGenerationRequestContext,
  VideoReferenceBinding,
  VideoReferenceMode,
  VideoReferenceRole,
  VideoResolution,
} from '../../modules/canvas/generation-parameters'
import CanvasImageOperationControls from './CanvasImageOperationControls.vue'
import {
  createShotControls,
  SHOT_CONTROL_DEFINITIONS,
  type ShotControlId,
  type ShotControls,
} from '../../modules/canvas/shot-controls'

const props = withDefaults(defineProps<{
  compact?: boolean
  context: ResolvedGenerationRequestContext
  disabled?: boolean
  readonly?: boolean
}>(), {
  compact: false,
  disabled: false,
  readonly: false,
})

const emit = defineEmits<{
  updateParameters: [parameters: GenerationNodeParameters]
}>()

const validMediaSources = computed(() => props.context.mediaSources.filter((source) => (
  source.state === 'included' || source.state === 'reference-mode-excluded'
)))
const selectedDuration = computed(() => (
  props.context.durationSeconds ?? props.context.capabilities?.video.default_duration_seconds ?? 0
))
const selectedVideoResolution = computed(() => (
  props.context.videoResolution ?? props.context.capabilities?.video.default_resolution ?? '720p'
))
const selectedVideoDimensions = computed(() => {
  const capability = props.context.capabilities?.video
  if (!capability) return null
  const ratio = props.context.aspectRatio ?? capability.default_aspect_ratio
  return capability.resolution_dimensions[selectedVideoResolution.value]?.[ratio] ??
    capability.aspect_ratio_dimensions[ratio] ?? {
    width: capability.width,
    height: capability.height,
  }
})
const selectedMode = computed(() => props.context.referenceMode ?? '')
const selectedPrimaryNodeId = computed(() => props.context.primaryReferenceNodeId ?? '')
const isStructuredReferenceContract = computed(() => (
  (props.context.capabilities?.contract_version ?? 0) >= 6
))
const selectedVideoReferences = computed(() => props.context.videoReferences ?? [])
const videoReferenceRoleLabels: Record<VideoReferenceRole, string> = {
  'first-frame': '首帧',
  'last-frame': '尾帧',
  reference: '中间关键帧',
}
const activeShotControls = computed(() => (
  props.context.shotControlCapabilities?.supported_controls.map((control) => SHOT_CONTROL_DEFINITIONS[control]) ?? []
))

function updateImage(
  aspectRatio: string,
  shotControls: ShotControls | undefined,
  outputCount = props.context.outputCount ?? props.context.capabilities?.image.default_output_count ?? 1,
  size = props.context.imageSize ?? props.context.capabilities?.image.default_size,
) {
  emit('updateParameters', {
    schema_version: 1,
    image: {
      ...(props.context.capabilities?.contract_version === 7 && size ? { size } : {}),
      aspect_ratio: aspectRatio,
      ...(isStructuredReferenceContract.value ? { output_count: outputCount } : {}),
      ...(props.context.imageOperation ? { operation: props.context.imageOperation } : {}),
      ...(shotControls ? { shot_controls: shotControls } : {}),
    },
  })
}

function updateVideo(change: {
  aspectRatio?: string
  durationSeconds?: number
  referenceMode?: VideoReferenceMode
  primaryReferenceNodeId?: string
  videoResolution?: VideoResolution
  shotControls?: ShotControls
  negativePrompt?: string
}) {
  const hasShotControlsChange = Object.prototype.hasOwnProperty.call(change, 'shotControls')
  const shotControls = hasShotControlsChange ? change.shotControls : props.context.shotControls
  const negativePrompt = Object.prototype.hasOwnProperty.call(change, 'negativePrompt')
    ? change.negativePrompt?.trim()
    : props.context.negativePrompt
  if (isStructuredReferenceContract.value) {
    let bindings = selectedVideoReferences.value
    if (change.referenceMode === 'text-to-video') {
      bindings = []
    } else if (change.referenceMode === 'image-to-video') {
      const selected = bindings.find((binding) => binding.role === 'first-frame')
        ?? bindings[0]
        ?? validMediaSources.value.flatMap((source) => source.assetId
          ? [{
              node_id: source.nodeId,
              asset_id: source.assetId,
              role: 'first-frame' as const,
              order: 0,
            }]
          : [])[0]
      bindings = selected ? [{ ...selected, role: 'first-frame', order: 0 }] : []
    } else if (change.referenceMode === 'keyframes') {
      const candidates = bindings.length >= 2
        ? bindings
        : validMediaSources.value.flatMap((source) => source.assetId
          ? [{
              node_id: source.nodeId,
              asset_id: source.assetId,
              role: 'reference' as const,
              order: 0,
            }]
          : [])
      bindings = candidates.map((binding, order) => ({ ...binding, order }))
    }
    emit('updateParameters', {
      schema_version: 1,
      video: {
        aspect_ratio: change.aspectRatio ?? props.context.aspectRatio
          ?? props.context.capabilities?.video.default_aspect_ratio ?? '',
        duration_seconds: change.durationSeconds ?? selectedDuration.value,
        ...(props.context.capabilities?.contract_version === 7
          ? { resolution: change.videoResolution ?? selectedVideoResolution.value }
          : {}),
        reference_mode: change.referenceMode ?? props.context.referenceMode ?? 'text-to-video',
        reference_bindings: bindings,
        ...(negativePrompt ? { negative_prompt: negativePrompt } : {}),
        ...(shotControls ? { shot_controls: shotControls } : {}),
      },
    })
    return
  }
  const referenceMode = change.referenceMode ?? props.context.referenceMode ?? (
    validMediaSources.value.length ? 'image-to-video' : 'text-to-video'
  )
  const primaryReferenceNodeId = referenceMode === 'image-to-video'
    ? change.primaryReferenceNodeId ?? props.context.primaryReferenceNodeId ?? validMediaSources.value[0]?.nodeId
    : undefined
  let normalizedShotControls = shotControls
  if (referenceMode !== 'image-to-video' && normalizedShotControls && normalizedShotControls.temporal !== 'hold') {
    normalizedShotControls = { ...normalizedShotControls, temporal: 'hold' } as ShotControls
  }
  emit('updateParameters', {
    schema_version: 1,
    video: {
      aspect_ratio: change.aspectRatio ?? props.context.aspectRatio
        ?? props.context.capabilities?.video.default_aspect_ratio ?? '',
      duration_seconds: change.durationSeconds ?? selectedDuration.value,
      ...(props.context.capabilities?.contract_version === 7
        ? { resolution: change.videoResolution ?? selectedVideoResolution.value }
        : {}),
      reference_mode: referenceMode,
      ...(primaryReferenceNodeId ? { primary_reference_node_id: primaryReferenceNodeId } : {}),
      ...(negativePrompt ? { negative_prompt: negativePrompt } : {}),
      ...(normalizedShotControls ? { shot_controls: normalizedShotControls } : {}),
    },
  })
}

function hasVideoReferenceRole(nodeId: string, assetId: string | null, role: VideoReferenceRole) {
  return selectedVideoReferences.value.some((binding) => (
    binding.node_id === nodeId && binding.asset_id === assetId && binding.role === role
  ))
}

function isVideoReferenceRoleDisabled(nodeId: string, assetId: string | null, role: VideoReferenceRole) {
  if (props.disabled || !assetId) return true
  return selectedVideoReferences.value.length >= (props.context.capabilities?.video.max_references ?? 0)
    && !hasVideoReferenceRole(nodeId, assetId, role)
}

function toggleVideoReferenceRole(nodeId: string, assetId: string | null, role: VideoReferenceRole) {
  if (!assetId) return
  const identityMatches = (binding: VideoReferenceBinding) => (
    binding.node_id === nodeId && binding.asset_id === assetId && binding.role === role
  )
  let bindings = selectedVideoReferences.value.filter((binding) => !identityMatches(binding))
  if (bindings.length === selectedVideoReferences.value.length) {
    if (bindings.length >= (props.context.capabilities?.video.max_references ?? 0)) return
    if (role === 'first-frame' || role === 'last-frame') {
      bindings = bindings.filter((binding) => binding.role !== role)
    }
    bindings.push({ node_id: nodeId, asset_id: assetId, role, order: bindings.length })
  }
  const referenceMode: VideoReferenceMode = bindings.length === 0
    ? 'text-to-video'
    : bindings.length === 1 && bindings[0]?.role === 'first-frame'
      ? 'image-to-video'
      : 'keyframes'
  emit('updateParameters', {
    schema_version: 1,
    video: {
      aspect_ratio: props.context.aspectRatio
        ?? props.context.capabilities?.video.default_aspect_ratio ?? '',
      duration_seconds: selectedDuration.value,
      ...(props.context.capabilities?.contract_version === 7
        ? { resolution: selectedVideoResolution.value }
        : {}),
      reference_mode: referenceMode,
      reference_bindings: bindings.map((binding, order) => ({ ...binding, order })),
      ...(props.context.negativePrompt ? { negative_prompt: props.context.negativePrompt } : {}),
      ...(props.context.shotControls ? { shot_controls: props.context.shotControls } : {}),
    },
  })
}

function videoReferenceTitle(binding: VideoReferenceBinding) {
  return validMediaSources.value.find((source) => source.nodeId === binding.node_id)?.title ?? binding.node_id
}

function reorderVideoReference(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= selectedVideoReferences.value.length) return
  const bindings = selectedVideoReferences.value.map((binding) => ({ ...binding }))
  const [moved] = bindings.splice(index, 1)
  bindings.splice(target, 0, moved)
  const referenceMode: VideoReferenceMode = bindings.length === 1 && bindings[0]?.role === 'first-frame'
    ? 'image-to-video'
    : 'keyframes'
  emit('updateParameters', {
    schema_version: 1,
    video: {
      aspect_ratio: props.context.aspectRatio
        ?? props.context.capabilities?.video.default_aspect_ratio ?? '',
      duration_seconds: selectedDuration.value,
      ...(props.context.capabilities?.contract_version === 7
        ? { resolution: selectedVideoResolution.value }
        : {}),
      reference_mode: referenceMode,
      reference_bindings: bindings.map((binding, order) => ({ ...binding, order })),
      ...(props.context.negativePrompt ? { negative_prompt: props.context.negativePrompt } : {}),
      ...(props.context.shotControls ? { shot_controls: props.context.shotControls } : {}),
    },
  })
}

function updateShotControl(control: ShotControlId, event: Event) {
  const value = (event.target as HTMLSelectElement).value
  const shotControls = createShotControls(props.context.shotControls, control, value)
  if (props.context.mediaType === 'image') {
    updateImage(props.context.aspectRatio ?? props.context.capabilities?.image.default_aspect_ratio ?? '4:3', shotControls)
    return
  }
  updateVideo({ shotControls })
}

function isShotControlDisabled(control: ShotControlId) {
  return Boolean(props.disabled) || (
    control === 'temporal' && props.context.mediaType === 'video' && selectedMode.value !== 'image-to-video'
  )
}
</script>

<template>
  <section class="generation-parameters" :class="{ 'is-compact': compact }" aria-label="生成参数">
    <div class="generation-parameters__heading">
      <span>生成参数</span>
      <strong>{{ context.isRecipe ? '配方固定' : '随节点保存' }}</strong>
    </div>

    <p v-if="context.parameterError" class="generation-parameters__error" role="alert">
      {{ context.parameterError }}
    </p>
    <dl v-if="readonly || context.isRecipe" class="generation-parameters__summary">
      <div v-for="item in context.parameterSummary" :key="item"><dd>{{ item }}</dd></div>
    </dl>

    <template v-else-if="context.capabilities && context.mediaType === 'image'">
      <fieldset v-if="context.capabilities.contract_version === 7" :disabled="disabled">
        <legend>输出规格</legend>
        <div class="generation-parameters__choices">
          <label v-for="size in context.capabilities.image.sizes" :key="size">
            <input
              type="radio"
              name="generation-image-size"
              :checked="context.imageSize === size"
              :value="size"
              @change="updateImage(context.aspectRatio ?? context.capabilities.image.default_aspect_ratio, context.shotControls, context.outputCount, size)"
            />
            <span>{{ size }}</span>
          </label>
        </div>
      </fieldset>
      <fieldset :disabled="disabled">
        <legend>输出比例</legend>
        <div class="generation-parameters__choices is-ratio">
          <label v-for="ratio in context.capabilities.image.aspect_ratios" :key="ratio">
            <input
              type="radio"
              name="generation-aspect-ratio"
              :checked="context.aspectRatio === ratio"
              :value="ratio"
              @change="updateImage(ratio, context.shotControls)"
            />
            <span>{{ ratio }}</span>
          </label>
        </div>
      </fieldset>
      <fieldset v-if="context.capabilities.contract_version >= 6" :disabled="disabled">
        <legend>输出数量</legend>
        <div class="generation-parameters__choices">
          <label v-for="count in context.capabilities.image.output_counts" :key="count">
            <input
              type="radio"
              name="generation-output-count"
              :checked="context.outputCount === count"
              :value="count"
              @change="updateImage(context.aspectRatio ?? context.capabilities.image.default_aspect_ratio, context.shotControls, count)"
            />
            <span>{{ count }} 张</span>
          </label>
        </div>
      </fieldset>
      <p class="generation-parameters__hint">
        {{ context.capabilities.image.model }} · {{ context.capabilities.image.size }}
      </p>
    </template>

    <template v-else-if="context.capabilities && context.mediaType === 'video'">
      <fieldset :disabled="disabled">
        <legend>比例</legend>
        <div class="generation-parameters__choices">
          <label v-for="ratio in context.capabilities.video.aspect_ratios" :key="ratio">
            <input
              type="radio"
              name="generation-video-ratio"
              :checked="context.aspectRatio === ratio"
              :value="ratio"
              @change="updateVideo({ aspectRatio: ratio })"
            />
            <span>{{ ratio }}</span>
          </label>
        </div>
      </fieldset>
      <fieldset v-if="context.capabilities.contract_version === 7" :disabled="disabled">
        <legend>清晰度</legend>
        <div class="generation-parameters__choices">
          <label v-for="resolution in context.capabilities.video.resolutions" :key="resolution">
            <input
              type="radio"
              name="generation-video-resolution"
              :checked="selectedVideoResolution === resolution"
              :value="resolution"
              @change="updateVideo({ videoResolution: resolution })"
            />
            <span>{{ resolution }}</span>
          </label>
        </div>
      </fieldset>
      <fieldset :disabled="disabled">
        <legend>时长</legend>
        <div class="generation-parameters__choices">
          <label v-for="preset in context.capabilities.video.duration_presets" :key="preset.duration_seconds">
            <input
              type="radio"
              name="generation-video-duration"
              :checked="selectedDuration === preset.duration_seconds"
              :value="preset.duration_seconds"
              @change="updateVideo({ durationSeconds: preset.duration_seconds })"
            />
            <span>{{ preset.duration_seconds }}s</span>
          </label>
        </div>
      </fieldset>
      <fieldset :disabled="disabled">
        <legend>参考模式</legend>
        <div class="generation-parameters__choices is-mode">
          <label>
            <input type="radio" name="generation-video-mode" :checked="selectedMode === 'text-to-video'" @change="updateVideo({ referenceMode: 'text-to-video' })" />
            <span>文生视频</span>
          </label>
          <label :class="{ disabled: validMediaSources.length < 1 }">
            <input type="radio" name="generation-video-mode" :checked="selectedMode === 'image-to-video'" :disabled="disabled || validMediaSources.length < 1" @change="updateVideo({ referenceMode: 'image-to-video' })" />
            <span>图生视频</span>
          </label>
          <label :class="{ disabled: validMediaSources.length < context.capabilities.video.min_keyframes || validMediaSources.length > context.capabilities.video.max_keyframes }">
            <input
              type="radio"
              name="generation-video-mode"
              :checked="selectedMode === 'keyframes'"
              :disabled="disabled || validMediaSources.length < context.capabilities.video.min_keyframes || validMediaSources.length > context.capabilities.video.max_keyframes"
              @change="updateVideo({ referenceMode: 'keyframes' })"
            />
            <span>关键帧</span>
          </label>
        </div>
      </fieldset>
      <fieldset v-if="context.capabilities.contract_version < 6 && selectedMode === 'image-to-video' && validMediaSources.length > 1" :disabled="disabled">
        <legend>主参考图</legend>
        <div class="generation-parameters__choices is-primary">
          <label v-for="source in validMediaSources" :key="source.nodeId">
            <input
              type="radio"
              name="generation-primary-reference"
              :checked="selectedPrimaryNodeId === source.nodeId"
              :value="source.nodeId"
              @change="updateVideo({ primaryReferenceNodeId: source.nodeId })"
            />
            <span>{{ source.title }}</span>
          </label>
        </div>
      </fieldset>
      <fieldset
        v-if="context.capabilities.contract_version >= 6 && (context.capabilities.contract_version < 7 || selectedMode === 'keyframes')"
        :disabled="disabled"
      >
        <legend>关键帧顺序 · 已用 {{ selectedVideoReferences.length }}/{{ context.capabilities.video.max_references }}</legend>
        <div class="generation-parameters__reference-list">
          <div v-for="source in validMediaSources" :key="source.nodeId" class="generation-parameters__reference-source">
            <strong>{{ source.title }}</strong>
            <div class="generation-parameters__choices is-mode">
              <label v-for="role in context.capabilities.video.reference_roles" :key="role" :class="{ disabled: isVideoReferenceRoleDisabled(source.nodeId, source.assetId, role) }">
                <input
                  type="checkbox"
                  :aria-label="`${source.title} ${videoReferenceRoleLabels[role]}`"
                  :checked="hasVideoReferenceRole(source.nodeId, source.assetId, role)"
                  :disabled="isVideoReferenceRoleDisabled(source.nodeId, source.assetId, role)"
                  @change="toggleVideoReferenceRole(source.nodeId, source.assetId, role)"
                />
                <span>{{ videoReferenceRoleLabels[role] }}</span>
              </label>
            </div>
          </div>
        </div>
        <ol v-if="selectedVideoReferences.length" class="generation-parameters__reference-order" aria-label="视频参考顺序">
          <li v-for="(binding, index) in selectedVideoReferences" :key="`${binding.node_id}:${binding.asset_id}:${binding.role}`">
            <span>{{ index + 1 }}. {{ videoReferenceTitle(binding) }} · {{ videoReferenceRoleLabels[binding.role] }}</span>
            <button type="button" :aria-label="`前移 ${videoReferenceTitle(binding)} ${videoReferenceRoleLabels[binding.role]}`" :disabled="disabled || index === 0" @click="reorderVideoReference(index, -1)">↑</button>
            <button type="button" :aria-label="`后移 ${videoReferenceTitle(binding)} ${videoReferenceRoleLabels[binding.role]}`" :disabled="disabled || index === selectedVideoReferences.length - 1" @click="reorderVideoReference(index, 1)">↓</button>
          </li>
        </ol>
      </fieldset>
      <label
        v-if="context.capabilities.contract_version === 7"
        class="generation-parameters__negative-prompt"
      >
        <span>反向提示词（可选）</span>
        <textarea
          aria-label="视频反向提示词"
          :disabled="disabled"
          :maxlength="context.capabilities.video.negative_prompt_max_length"
          :value="context.negativePrompt ?? ''"
          placeholder="描述视频中需要避免的内容"
          rows="3"
          @change="updateVideo({ negativePrompt: ($event.target as HTMLTextAreaElement).value })"
        />
      </label>
      <p class="generation-parameters__hint">
        {{ context.capabilities.video.model }} ·
        <template v-if="context.capabilities.contract_version === 7">{{ selectedVideoResolution }} 请求档 · </template>
        {{ selectedVideoDimensions?.width }}×{{ selectedVideoDimensions?.height }} 目标（实际以结果为准）
      </p>
    </template>
    <fieldset
      v-if="!readonly && !context.isRecipe && !context.parameterError && !context.imageOperation && activeShotControls.length"
      :disabled="disabled"
    >
      <legend>镜头控制</legend>
      <div class="generation-parameters__shot-controls">
        <label v-for="definition in activeShotControls" :key="definition.id" :class="{ disabled: isShotControlDisabled(definition.id) }">
          <span class="generation-parameters__shot-label">{{ definition.title }}</span>
          <select
            :aria-label="definition.title"
            :disabled="isShotControlDisabled(definition.id)"
            :value="context.shotControls?.[definition.id] ?? context.shotControlCapabilities?.defaults[definition.id]"
            @change="updateShotControl(definition.id, $event)"
          >
            <option v-for="choice in definition.values" :key="choice.value" :value="choice.value">{{ choice.label }}</option>
          </select>
        </label>
      </div>
      <p v-if="context.mediaType === 'video' && selectedMode !== 'image-to-video'" class="generation-parameters__hint">
        时间前推/后推仅适用于单参考图的图生视频。
      </p>
    </fieldset>
    <CanvasImageOperationControls
      v-if="context.imageOperation"
      :context="context"
      :disabled="disabled"
      :readonly="readonly"
      @update-parameters="emit('updateParameters', $event)"
    />
  </section>
</template>

<style scoped lang="scss">
.generation-parameters { display: grid; gap: 10px; margin-top: 12px; padding: 10px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); background: var(--v2-surface-1); }
.generation-parameters__heading { display: flex; align-items: center; justify-content: space-between; color: var(--v2-text-secondary); font-size: 11px; }
.generation-parameters__heading strong { color: var(--v2-text-primary); font-size: 10px; }
fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
legend { margin-bottom: 6px; color: var(--v2-text-secondary); font-size: 10px; }
.generation-parameters__choices { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
.generation-parameters__choices.is-mode { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.generation-parameters__choices.is-primary { grid-template-columns: 1fr; }
.generation-parameters__reference-list { display: grid; gap: 8px; }
.generation-parameters__reference-source { display: grid; gap: 5px; }
.generation-parameters__reference-source > strong { overflow: hidden; color: var(--v2-text-secondary); font-size: 10px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.generation-parameters__reference-order { display: grid; gap: 4px; margin: 8px 0 0; padding: 0; list-style: none; }
.generation-parameters__reference-order li { display: grid; grid-template-columns: minmax(0, 1fr) 26px 26px; align-items: center; gap: 4px; color: var(--v2-text-secondary); font-size: 10px; }
.generation-parameters__reference-order li > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.generation-parameters__reference-order button { width: 26px; height: 26px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-2); cursor: pointer; }
.generation-parameters__reference-order button:disabled { cursor: not-allowed; opacity: .4; }
.generation-parameters__reference-order button:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.generation-parameters__shot-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.generation-parameters__shot-controls label { display: grid; min-height: 0; gap: 4px; place-items: stretch; }
.generation-parameters__shot-label { min-height: 0; padding: 0; border: 0; color: var(--v2-text-secondary); background: transparent; font-size: 10px; text-align: left; white-space: normal; }
.generation-parameters__shot-controls select { width: 100%; min-height: 34px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-surface-2); font: inherit; font-size: 11px; }
.generation-parameters__shot-controls select:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
label { position: relative; display: grid; min-width: 0; min-height: 40px; place-items: center; cursor: pointer; }
label input { position: absolute; width: 1px; height: 1px; opacity: 0; }
label span { display: grid; width: 100%; min-height: 40px; place-items: center; padding: 5px; overflow: hidden; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-2); font-size: 10px; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
label input:checked + span { border-color: var(--v2-accent); color: var(--v2-accent); background: color-mix(in oklch, var(--v2-accent) 10%, var(--v2-surface-2)); }
label input:focus-visible + span { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
label.disabled, fieldset:disabled label { cursor: not-allowed; opacity: .42; }
.generation-parameters__hint, .generation-parameters__error { margin: 0; font-size: 10px; line-height: 1.5; }
.generation-parameters__negative-prompt { display: grid; min-height: 0; gap: 5px; place-items: stretch; color: var(--v2-text-secondary); font-size: 10px; }
.generation-parameters__negative-prompt textarea { box-sizing: border-box; width: 100%; min-height: 58px; resize: vertical; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); padding: 7px 8px; color: var(--v2-text-primary); background: var(--v2-surface-2); font: inherit; }
.generation-parameters__hint { color: var(--v2-text-muted); }
.generation-parameters__error { color: var(--v2-danger); }
.generation-parameters__summary { display: flex; flex-wrap: wrap; gap: 5px; margin: 0; }
.generation-parameters__summary div { padding: 5px 7px; border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-2); }
.generation-parameters__summary dd { margin: 0; font-size: 10px; }
.generation-parameters.is-compact { max-height: 320px; margin-top: 0; overflow: auto; border-color: var(--canvas-composer-outline); background: var(--v2-surface-2); box-shadow: var(--v2-shadow-floating); }
.generation-parameters.is-compact .generation-parameters__heading { position: sticky; z-index: 1; top: -10px; padding: 2px 0 8px; background: var(--v2-surface-2); }
</style>
