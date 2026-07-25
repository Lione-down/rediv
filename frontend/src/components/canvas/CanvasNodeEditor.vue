<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
const props = defineProps<{ modelValue: string; label: string }>()
const emit = defineEmits<{ commit: [value: string]; close: [] }>()
const draft = ref(props.modelValue)
const isComposing = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
watch(() => props.modelValue, (value) => { if (!isComposing.value) draft.value = value })
function flush() { if (timer) clearTimeout(timer); timer = null; if (draft.value !== props.modelValue) emit('commit', draft.value) }
function schedule() { if (isComposing.value) return; if (timer) clearTimeout(timer); timer = setTimeout(flush, 500) }
function handleEscape(event: KeyboardEvent) { flush(); (event.currentTarget as HTMLTextAreaElement).blur() }
function close() { flush(); emit('close') }
onBeforeUnmount(flush)
</script>
<template>
  <textarea v-model="draft" class="canvas-node-editor" :aria-label="label" @blur="close" @compositionstart="isComposing = true" @compositionend="isComposing = false; schedule()" @input="schedule" @keydown.esc.stop.prevent="handleEscape" @keydown.stop />
</template>

<style scoped lang="scss">
.canvas-node-editor {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  resize: none;
  border: 0;
  border-radius: var(--v2-radius-sm);
  padding: 8px 10px;
  color: var(--v2-text-primary);
  background: var(--v2-surface-1);
  font: inherit;
  line-height: 1.55;
  pointer-events: auto;
}

.canvas-node-editor:focus {
  outline: 2px solid var(--v2-focus-ring);
  outline-offset: 2px;
}
</style>
