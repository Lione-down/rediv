<script setup lang="ts">
import { Clapperboard, Workflow } from 'lucide-vue-next'
import { nextTick, ref } from 'vue'

export type CanvasViewMode = 'workflow' | 'storyboard'

const props = defineProps<{ modelValue: CanvasViewMode }>()
const emit = defineEmits<{ 'update:modelValue': [mode: CanvasViewMode] }>()
const workflowRef = ref<HTMLButtonElement | null>(null)
const storyboardRef = ref<HTMLButtonElement | null>(null)

const modes: readonly CanvasViewMode[] = ['workflow', 'storyboard']

function selectMode(mode: CanvasViewMode, shouldFocus = false) {
  emit('update:modelValue', mode)
  if (shouldFocus) void nextTick(() => (mode === 'workflow' ? workflowRef.value : storyboardRef.value)?.focus())
}

function handleKeydown(event: KeyboardEvent) {
  const currentIndex = modes.indexOf(props.modelValue)
  let nextIndex = currentIndex
  if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + modes.length) % modes.length
  else if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % modes.length
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = modes.length - 1
  else return
  event.preventDefault()
  selectMode(modes[nextIndex], true)
}
</script>

<template>
  <div class="canvas-view-mode-switch" role="tablist" aria-label="画布视图" @keydown="handleKeydown">
    <button
      ref="workflowRef"
      type="button"
      role="tab"
      :aria-selected="modelValue === 'workflow'"
      :tabindex="modelValue === 'workflow' ? 0 : -1"
      @click="selectMode('workflow')"
    >
      <Workflow :size="15" aria-hidden="true" />工作流
    </button>
    <button
      ref="storyboardRef"
      type="button"
      role="tab"
      :aria-selected="modelValue === 'storyboard'"
      :tabindex="modelValue === 'storyboard' ? 0 : -1"
      @click="selectMode('storyboard')"
    >
      <Clapperboard :size="15" aria-hidden="true" />故事板
    </button>
  </div>
</template>

<style scoped lang="scss">
.canvas-view-mode-switch {
  display: inline-flex;
  min-height: var(--v2-control-min-size);
  align-items: center;
  padding: 3px;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-sm);
  background: var(--v2-surface-1);
  box-shadow: var(--v2-shadow-floating);
}

button {
  display: inline-flex;
  min-width: 94px;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: var(--v2-space-2);
  padding: 0 var(--v2-space-3);
  border: 0;
  border-radius: calc(var(--v2-radius-sm) - 2px);
  color: var(--v2-text-muted);
  background: transparent;
  font: inherit;
  font-size: var(--v2-font-size-caption);
  font-weight: var(--v2-font-weight-medium);
  cursor: pointer;
}

button[aria-selected='true'] {
  color: var(--v2-text-primary);
  background: var(--v2-surface-3);
  box-shadow: inset 0 0 0 1px var(--v2-border-subtle);
}

button:focus-visible {
  outline: 2px solid var(--v2-focus-ring);
  outline-offset: 2px;
}

@media (hover: hover) {
  button:hover { color: var(--v2-text-primary); }
}

@media (max-width: 767px) {
  button { min-width: 88px; }
}
</style>
