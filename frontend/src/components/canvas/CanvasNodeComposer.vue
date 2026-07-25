<script setup lang="ts">
import CanvasNodeEditor from './CanvasNodeEditor.vue'

defineProps<{ modelValue: string; label: string }>()
const emit = defineEmits<{ commit: [value: string]; close: [] }>()
</script>

<template>
  <section class="canvas-node-composer" aria-label="节点内容编辑器">
    <CanvasNodeEditor :label="label" :model-value="modelValue" @commit="emit('commit', $event)" @close="emit('close')" />
  </section>
</template>
