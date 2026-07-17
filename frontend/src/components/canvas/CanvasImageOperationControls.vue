<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IMAGE_OPERATIONS,
  parseImageOperationContract,
  type ImageOperationContract,
  type ImageOperationRegion,
} from '../../modules/canvas/image-operations'
import type {
  GenerationNodeParameters,
  ResolvedGenerationRequestContext,
} from '../../modules/canvas/generation-parameters'

const props = defineProps<{
  context: ResolvedGenerationRequestContext
  disabled?: boolean
  readonly?: boolean
}>()

const emit = defineEmits<{
  updateParameters: [parameters: GenerationNodeParameters]
}>()

const validationError = ref('')
const operation = computed(() => props.context.imageOperation ?? null)
const definition = computed(() => operation.value ? IMAGE_OPERATIONS[operation.value.id] : null)
const isLocalMarker = computed(() => definition.value?.execution === 'local')

function numberFromInput(event: Event) {
  const value = Number((event.currentTarget as HTMLInputElement).value)
  return Number.isFinite(value) ? value : null
}

function updateOperation(next: ImageOperationContract) {
  const capabilities = props.context.capabilities?.image.operations
  if (!capabilities || !operation.value || !props.context.aspectRatio) return
  try {
    const normalized = parseImageOperationContract(next, capabilities)
    validationError.value = ''
    emit('updateParameters', {
      schema_version: 1,
      image: { aspect_ratio: props.context.aspectRatio, operation: normalized },
    })
  } catch {
    validationError.value = '图片操作参数必须保持在当前 capability 允许的规范范围内。'
  }
}

function updateRegion(key: keyof Pick<ImageOperationRegion, 'x' | 'y' | 'width' | 'height'>, event: Event) {
  if (!operation.value?.region) return
  const value = numberFromInput(event)
  if (value === null) return
  updateOperation({
    ...operation.value,
    region: { ...operation.value.region, [key]: value },
  })
}

function updateMaskFeather(event: Event) {
  if (!operation.value?.mask) return
  const feather = numberFromInput(event)
  if (feather === null) return
  updateOperation({ ...operation.value, mask: { ...operation.value.mask, feather } })
}

function updateMaskInvert(event: Event) {
  if (!operation.value?.mask) return
  updateOperation({
    ...operation.value,
    mask: { ...operation.value.mask, invert: (event.currentTarget as HTMLInputElement).checked },
  })
}

function updateExpansion(side: 'top' | 'right' | 'bottom' | 'left', event: Event) {
  if (!operation.value?.expansion) return
  const value = numberFromInput(event)
  if (value === null) return
  updateOperation({
    ...operation.value,
    expansion: { ...operation.value.expansion, [side]: value },
  })
}

function updateUpscaleFactor(event: Event) {
  if (!operation.value) return
  const factor = Number((event.currentTarget as HTMLInputElement).value)
  if (!Number.isInteger(factor)) return
  updateOperation({ ...operation.value, upscale_factor: factor })
}
</script>

<template>
  <section v-if="operation && definition" class="image-operation-controls" aria-label="图片操作参数">
    <div class="image-operation-controls__heading">
      <span>图片操作</span>
      <strong>{{ definition.title }}</strong>
    </div>
    <p class="image-operation-controls__description">{{ definition.description }}</p>

    <div v-if="operation.region" class="image-operation-controls__region">
      <div
        class="image-operation-controls__preview"
        role="img"
        aria-label="源图归一化区域预览"
      >
        <span
          :style="{
            left: `${operation.region.x * 100}%`,
            top: `${operation.region.y * 100}%`,
            width: `${operation.region.width * 100}%`,
            height: `${operation.region.height * 100}%`,
          }"
        />
      </div>
      <fieldset :disabled="disabled || readonly">
        <legend>目标区域（源图归一化）</legend>
        <div class="image-operation-controls__number-grid">
          <label>区域 X<input aria-label="区域 X" type="number" min="0" :max="1 - operation.region.width" step="0.01" :value="operation.region.x" @change="updateRegion('x', $event)" /></label>
          <label>区域 Y<input aria-label="区域 Y" type="number" min="0" :max="1 - operation.region.height" step="0.01" :value="operation.region.y" @change="updateRegion('y', $event)" /></label>
          <label>区域宽度<input aria-label="区域宽度" type="number" min="0.01" :max="1 - operation.region.x" step="0.01" :value="operation.region.width" @change="updateRegion('width', $event)" /></label>
          <label>区域高度<input aria-label="区域高度" type="number" min="0.01" :max="1 - operation.region.y" step="0.01" :value="operation.region.height" @change="updateRegion('height', $event)" /></label>
        </div>
      </fieldset>
    </div>

    <fieldset v-if="operation.mask" :disabled="disabled || readonly">
      <legend>区域遮罩</legend>
      <div class="image-operation-controls__mask">
        <label>羽化<input aria-label="遮罩羽化" type="number" min="0" max="1" step="0.01" :value="operation.mask.feather" @change="updateMaskFeather" /></label>
        <label class="image-operation-controls__check"><input aria-label="反转遮罩" type="checkbox" :checked="operation.mask.invert" @change="updateMaskInvert" /><span>反转遮罩</span></label>
      </div>
    </fieldset>

    <fieldset v-if="operation.expansion" :disabled="disabled || readonly">
      <legend>扩展边距（源图比例）</legend>
      <div class="image-operation-controls__number-grid">
        <label>上<input aria-label="上扩展边距" type="number" min="0" max="1" step="0.01" :value="operation.expansion.top" @change="updateExpansion('top', $event)" /></label>
        <label>右<input aria-label="右扩展边距" type="number" min="0" max="1" step="0.01" :value="operation.expansion.right" @change="updateExpansion('right', $event)" /></label>
        <label>下<input aria-label="下扩展边距" type="number" min="0" max="1" step="0.01" :value="operation.expansion.bottom" @change="updateExpansion('bottom', $event)" /></label>
        <label>左<input aria-label="左扩展边距" type="number" min="0" max="1" step="0.01" :value="operation.expansion.left" @change="updateExpansion('left', $event)" /></label>
      </div>
    </fieldset>

    <fieldset v-if="operation.upscale_factor" :disabled="disabled || readonly">
      <legend>高清倍率</legend>
      <div class="image-operation-controls__factors">
        <label v-for="factor in context.capabilities?.image.operations?.upscale_factors ?? []" :key="factor">
          <input type="radio" name="image-operation-upscale-factor" :value="factor" :checked="operation.upscale_factor === factor" @change="updateUpscaleFactor" />
          <span>{{ factor }}×</span>
        </label>
      </div>
    </fieldset>

    <p v-if="isLocalMarker" class="image-operation-controls__local" role="status">本地区域标记，不会调用生成服务。</p>
    <p v-if="validationError" class="image-operation-controls__error" role="alert">{{ validationError }}</p>
  </section>
</template>

<style scoped lang="scss">
.image-operation-controls { display: grid; gap: 10px; margin-top: 10px; padding: 10px; border: 1px solid color-mix(in srgb, var(--v2-accent) 35%, var(--v2-border-subtle)); border-radius: var(--v2-radius-md); background: linear-gradient(135deg, color-mix(in srgb, var(--v2-accent) 8%, var(--v2-surface-1)), var(--v2-surface-1)); }
.image-operation-controls__heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--v2-text-secondary); font-size: 11px; }
.image-operation-controls__heading strong { color: var(--v2-text-primary); font-size: 11px; }
.image-operation-controls__description, .image-operation-controls__local, .image-operation-controls__error { margin: 0; font-size: 10px; line-height: 1.5; }
.image-operation-controls__description { color: var(--v2-text-muted); }
.image-operation-controls__local { color: var(--v2-accent); }
.image-operation-controls__error { color: var(--v2-danger); }
.image-operation-controls__region { display: grid; gap: 8px; }
.image-operation-controls__preview { position: relative; min-height: 82px; overflow: hidden; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); background: repeating-linear-gradient(45deg, var(--v2-surface-2) 0 12px, var(--v2-surface-3) 12px 24px); }
.image-operation-controls__preview span { position: absolute; box-sizing: border-box; border: 2px solid var(--v2-accent); border-radius: 3px; background: color-mix(in srgb, var(--v2-accent) 20%, transparent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--v2-canvas) 70%, transparent) inset; }
fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
legend { margin-bottom: 6px; color: var(--v2-text-secondary); font-size: 10px; }
.image-operation-controls__number-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.image-operation-controls label { display: grid; min-width: 0; gap: 4px; color: var(--v2-text-secondary); font-size: 10px; }
.image-operation-controls input[type='number'] { width: 100%; min-height: 34px; box-sizing: border-box; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-surface-2); font: inherit; font-variant-numeric: tabular-nums; }
.image-operation-controls input:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.image-operation-controls__mask { display: flex; align-items: end; gap: 10px; }
.image-operation-controls__mask > label:first-child { flex: 1; }
.image-operation-controls__check { display: flex !important; min-height: 34px; align-items: center; grid-auto-flow: column; gap: 6px; }
.image-operation-controls__factors { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.image-operation-controls__factors label { position: relative; min-height: 36px; place-items: center; }
.image-operation-controls__factors input { position: absolute; opacity: 0; }
.image-operation-controls__factors span { display: grid; width: 100%; min-height: 34px; place-items: center; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); background: var(--v2-surface-2); }
.image-operation-controls__factors input:checked + span { border-color: var(--v2-accent); color: var(--v2-accent); background: color-mix(in srgb, var(--v2-accent) 10%, var(--v2-surface-2)); }
fieldset:disabled { opacity: .48; }
@media (max-width: 390px) { .image-operation-controls__number-grid { grid-template-columns: 1fr; } }
</style>
