<script setup lang="ts">
import { computed } from 'vue'
import type {
  GenerationNodeParameters,
  ResolvedGenerationRequestContext,
  VideoReferenceMode,
} from '../../modules/canvas/generation-parameters'

const props = defineProps<{
  context: ResolvedGenerationRequestContext
  disabled?: boolean
  readonly?: boolean
}>()

const emit = defineEmits<{
  updateParameters: [parameters: GenerationNodeParameters]
}>()

const validMediaSources = computed(() => props.context.mediaSources.filter((source) => (
  source.state === 'included' || source.state === 'reference-mode-excluded'
)))
const selectedDuration = computed(() => (
  props.context.durationSeconds ?? props.context.capabilities?.video.default_duration_seconds ?? 0
))
const selectedMode = computed(() => props.context.referenceMode ?? '')
const selectedPrimaryNodeId = computed(() => props.context.primaryReferenceNodeId ?? '')

function updateImage(aspectRatio: string) {
  emit('updateParameters', { schema_version: 1, image: { aspect_ratio: aspectRatio } })
}

function updateVideo(change: {
  durationSeconds?: number
  referenceMode?: VideoReferenceMode
  primaryReferenceNodeId?: string
}) {
  const referenceMode = change.referenceMode ?? props.context.referenceMode ?? (
    validMediaSources.value.length ? 'image-to-video' : 'text-to-video'
  )
  const primaryReferenceNodeId = referenceMode === 'image-to-video'
    ? change.primaryReferenceNodeId ?? props.context.primaryReferenceNodeId ?? validMediaSources.value[0]?.nodeId
    : undefined
  emit('updateParameters', {
    schema_version: 1,
    video: {
      duration_seconds: change.durationSeconds ?? selectedDuration.value,
      reference_mode: referenceMode,
      ...(primaryReferenceNodeId ? { primary_reference_node_id: primaryReferenceNodeId } : {}),
    },
  })
}
</script>

<template>
  <section class="generation-parameters" aria-label="生成参数">
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
      <fieldset :disabled="disabled">
        <legend>输出比例</legend>
        <div class="generation-parameters__choices is-ratio">
          <label v-for="ratio in context.capabilities.image.aspect_ratios" :key="ratio">
            <input
              type="radio"
              name="generation-aspect-ratio"
              :checked="context.aspectRatio === ratio"
              :value="ratio"
              @change="updateImage(ratio)"
            />
            <span>{{ ratio }}</span>
          </label>
        </div>
      </fieldset>
      <p class="generation-parameters__hint">
        {{ context.capabilities.image.model }} · {{ context.capabilities.image.size }}
      </p>
    </template>

    <template v-else-if="context.capabilities && context.mediaType === 'video'">
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
      <fieldset v-if="selectedMode === 'image-to-video' && validMediaSources.length > 1" :disabled="disabled">
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
      <p class="generation-parameters__hint">
        {{ context.capabilities.video.model }} · {{ context.capabilities.video.width }}×{{ context.capabilities.video.height }}
      </p>
    </template>
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
label { position: relative; display: grid; min-width: 0; min-height: 40px; place-items: center; cursor: pointer; }
label input { position: absolute; width: 1px; height: 1px; opacity: 0; }
label span { display: grid; width: 100%; min-height: 40px; place-items: center; padding: 5px; overflow: hidden; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-2); font-size: 10px; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
label input:checked + span { border-color: var(--v2-accent); color: var(--v2-accent); background: color-mix(in oklch, var(--v2-accent) 10%, var(--v2-surface-2)); }
label input:focus-visible + span { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
label.disabled, fieldset:disabled label { cursor: not-allowed; opacity: .42; }
.generation-parameters__hint, .generation-parameters__error { margin: 0; font-size: 10px; line-height: 1.5; }
.generation-parameters__hint { color: var(--v2-text-muted); }
.generation-parameters__error { color: var(--v2-danger); }
.generation-parameters__summary { display: flex; flex-wrap: wrap; gap: 5px; margin: 0; }
.generation-parameters__summary div { padding: 5px 7px; border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-2); }
.generation-parameters__summary dd { margin: 0; font-size: 10px; }
</style>
