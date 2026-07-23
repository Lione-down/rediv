<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { CanvasNode } from '../../types/canvas'

const props = defineProps<{
  node: CanvasNode
  readonly: boolean
}>()
const emit = defineEmits<{
  commit: [nodeId: string, title: string]
}>()

const buttonRef = ref<HTMLButtonElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const isEditing = ref(false)
const draft = ref(props.node.title)

watch(() => props.node.title, (title) => {
  if (!isEditing.value) draft.value = title
})

async function startEditing() {
  if (props.readonly || props.node.isLocked) return
  draft.value = props.node.title
  isEditing.value = true
  await nextTick()
  inputRef.value?.focus({ preventScroll: true })
  inputRef.value?.select()
}

function finishEditing() {
  if (!isEditing.value) return
  isEditing.value = false
  const title = draft.value.trim()
  if (title && title !== props.node.title) emit('commit', props.node.id, title)
}

function cancelEditing() {
  draft.value = props.node.title
  isEditing.value = false
  void nextTick(() => buttonRef.value?.focus({ preventScroll: true }))
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    finishEditing()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelEditing()
  }
}
</script>

<template>
  <div
    class="canvas-node-title-editor"
    :data-node-id="node.id"
    @pointerdown.stop
    @dblclick.stop
  >
    <input
      v-if="isEditing"
      ref="inputRef"
      v-model="draft"
      aria-label="节点标题"
      maxlength="120"
      @blur="finishEditing"
      @keydown="handleKeydown"
    />
    <button
      v-else-if="!readonly && !node.isLocked"
      ref="buttonRef"
      type="button"
      :aria-label="`重命名 ${node.title}`"
      :title="`重命名 ${node.title}`"
      @click.stop="startEditing"
    >
      {{ node.title }}
    </button>
    <span v-else :title="node.title">{{ node.title }}</span>
  </div>
</template>

<style scoped lang="scss">
.canvas-node-title-editor {
  position: absolute;
  z-index: 7;
  box-sizing: border-box;
  overflow: visible;
  pointer-events: none;
}

.canvas-node-title-editor > button,
.canvas-node-title-editor > input,
.canvas-node-title-editor > span {
  position: absolute;
  bottom: calc(100% + 4px * var(--canvas-surface-zoom, 1));
  left: 0;
  box-sizing: border-box;
  width: 100%;
  height: calc(18px * var(--canvas-surface-zoom, 1));
  min-height: 10px;
  overflow: hidden;
  border: 0;
  color: var(--v2-text-secondary);
  background: transparent;
  font: inherit;
  font-size: clamp(9px, calc(12px * var(--canvas-surface-zoom, 1)), 14px);
  font-weight: 600;
  line-height: 1.2;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: auto;
}

.canvas-node-title-editor > button {
  padding: 0;
  cursor: text;
}

.canvas-node-title-editor > button:hover {
  color: var(--v2-text-primary);
}

.canvas-node-title-editor > input {
  padding: 0 5px;
  border: 1px solid var(--v2-accent-strong);
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-primary);
  background: var(--v2-surface-2);
  box-shadow: 0 0 0 2px color-mix(in oklch, var(--v2-accent) 20%, transparent);
}

.canvas-node-title-editor > button:focus-visible,
.canvas-node-title-editor > input:focus-visible {
  outline: 2px solid var(--v2-focus-ring);
  outline-offset: 2px;
}
</style>
