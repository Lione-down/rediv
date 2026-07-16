<script setup lang="ts">
import { computed } from 'vue'
import {
  formatGenerationProgressPercent,
  normalizeGenerationProgressPercent,
  type GenerationRuntimePresentation,
} from '../../modules/canvas/generation-runtime-presentation'
import type { ProjectGenerationTask } from '../../modules/canvas/project-resource-types'

const props = defineProps<{
  runtimePresentation: GenerationRuntimePresentation | null
  task: ProjectGenerationTask | null
}>()

const progressTask = computed(() => props.runtimePresentation?.task ?? props.task)
const progressPercent = computed(() => normalizeGenerationProgressPercent(
  props.runtimePresentation?.progressPercent ?? progressTask.value?.progress_percent,
))
const isIndeterminate = computed(() => (
  progressPercent.value === null && ['submitting', 'queued', 'running'].includes(
    props.runtimePresentation?.phase ?? progressTask.value?.status ?? '',
  )
))
</script>

<template>
  <div v-if="runtimePresentation || progressTask" class="generation-progress-detail">
    <progress
      v-if="progressPercent !== null"
      aria-label="生成进度"
      max="100"
      :value="progressPercent"
    ></progress>
    <progress v-else aria-label="生成进度" max="100"></progress>
    <span v-if="progressPercent !== null" aria-hidden="true">{{ formatGenerationProgressPercent(progressPercent) }}</span>
    <span v-else-if="isIndeterminate">进度由服务返回，当前未提供百分比</span>
    <span v-else>未记录百分比</span>
  </div>
</template>

<style scoped lang="scss">
.generation-progress-detail { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; margin-top: 7px; color: var(--v2-text-muted); font-size: 11px; }
progress { width: 100%; height: 6px; accent-color: var(--v2-accent); }
span { max-width: 190px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
</style>
