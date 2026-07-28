<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type RuntimeContextToolId =
  | 'text'
  | 'script'
  | 'image-generation'
  | 'video-generation'
  | 'video-composition'
  | 'audio-generation'

defineProps<{
  allowedAudioModelCount: number
  canDeleteSelection: boolean
  canRedo: boolean
  canUndo: boolean
  position: { left: number; top: number }
}>()

const emit = defineEmits<{
  close: []
  createNode: [toolId: RuntimeContextToolId]
  deleteSelection: []
  fitAll: []
  redo: []
  undo: []
}>()
const menuRef = ref<HTMLElement | null>(null)

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

function closeOnOutsidePointer(event: PointerEvent) {
  if (event.target instanceof Node && menuRef.value?.contains(event.target)) return
  emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', closeOnEscape, true)
  window.addEventListener('pointerdown', closeOnOutsidePointer, true)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', closeOnEscape, true)
  window.removeEventListener('pointerdown', closeOnOutsidePointer, true)
})
</script>

<template>
  <div
    ref="menuRef"
    class="runtime-context-menu"
    role="menu"
    aria-label="画布快捷菜单"
    :style="{ left: `${position.left}px`, top: `${position.top}px` }"
    @pointerdown.stop
  >
    <button role="menuitem" type="button" @click="emit('createNode', 'text')">新建文本</button>
    <button role="menuitem" type="button" @click="emit('createNode', 'script')">新建脚本</button>
    <button role="menuitem" type="button" @click="emit('createNode', 'image-generation')">
      新建图片生成
    </button>
    <button role="menuitem" type="button" @click="emit('createNode', 'video-generation')">
      新建视频生成
    </button>
    <button role="menuitem" type="button" @click="emit('createNode', 'video-composition')">
      新建视频合成
    </button>
    <button
      role="menuitem"
      type="button"
      :disabled="allowedAudioModelCount === 0"
      @click="emit('createNode', 'audio-generation')"
    >
      新建音频生成
    </button>
    <hr />
    <button role="menuitem" type="button" @click="emit('fitAll')">适应全部内容</button>
    <button role="menuitem" type="button" :disabled="!canUndo" @click="emit('undo')">撤销</button>
    <button role="menuitem" type="button" :disabled="!canRedo" @click="emit('redo')">重做</button>
    <hr />
    <button
      role="menuitem"
      type="button"
      :disabled="!canDeleteSelection"
      @click="emit('deleteSelection')"
    >
      删除
    </button>
  </div>
</template>

<style scoped lang="scss">
.runtime-context-menu {
  position: fixed;
  z-index: 80;
  display: grid;
  width: 190px;
  gap: 2px;
  padding: 7px;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-md);
  background: var(--v2-surface-3);
  box-shadow: var(--v2-shadow-lg);
}

button {
  min-height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-secondary);
  background: transparent;
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

button:hover,
button:focus-visible {
  color: var(--v2-text-primary);
  background: var(--v2-surface-4);
  outline: none;
}

button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

hr {
  width: 100%;
  margin: 4px 0;
  border: 0;
  border-top: 1px solid var(--v2-border-subtle);
}
</style>
