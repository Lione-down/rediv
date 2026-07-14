<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
const props = defineProps<{ modelValue: string; label: string }>()
const emit = defineEmits<{ commit: [value: string] }>()
const draft = ref(props.modelValue)
const isComposing = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
watch(() => props.modelValue, (value) => { if (!isComposing.value) draft.value = value })
function flush() { if (timer) clearTimeout(timer); timer = null; if (draft.value !== props.modelValue) emit('commit', draft.value) }
function schedule() { if (isComposing.value) return; if (timer) clearTimeout(timer); timer = setTimeout(flush, 500) }
function handleEscape(event: KeyboardEvent) { flush(); (event.currentTarget as HTMLTextAreaElement).blur() }
onBeforeUnmount(flush)
</script>
<template>
  <textarea v-model="draft" class="canvas-node-editor" :aria-label="label" @blur="flush" @compositionstart="isComposing = true" @compositionend="isComposing = false; schedule()" @input="schedule" @keydown.esc.stop.prevent="handleEscape" @keydown.stop />
</template>
