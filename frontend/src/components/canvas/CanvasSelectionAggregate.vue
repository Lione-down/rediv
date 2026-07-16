<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { SelectionGenerationIntent, SelectionGenerationMediaType } from '../../modules/canvas/selection-generation'
import CanvasSelectionGenerationMenu, { type CanvasSelectionGenerationSource } from './CanvasSelectionGenerationMenu.vue'

const props = defineProps<{
  count: number
  intent: SelectionGenerationIntent | null
  sources: CanvasSelectionGenerationSource[]
}>()

const emit = defineEmits<{
  compose: [mediaType: SelectionGenerationMediaType]
  reorderSource: [nodeId: string, direction: 'up' | 'down']
}>()

const aggregateRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const isMenuOpen = ref(false)

function closeMenu(restoreFocus = false) {
  isMenuOpen.value = false
  if (restoreFocus) void nextTick(() => triggerRef.value?.focus({ preventScroll: true }))
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu(true)
}

function handleWindowPointerdown(event: PointerEvent) {
  if (!(event.target instanceof Node) || aggregateRef.value?.contains(event.target)) return
  closeMenu()
}

function handleCompose(mediaType: SelectionGenerationMediaType) {
  closeMenu()
  emit('compose', mediaType)
}

function handleReorderSource(nodeId: string, direction: 'up' | 'down') {
  emit('reorderSource', nodeId, direction)
}

watch(isMenuOpen, (isOpen) => {
  if (isOpen) {
    window.addEventListener('keydown', handleWindowKeydown)
    window.addEventListener('pointerdown', handleWindowPointerdown, true)
  } else {
    window.removeEventListener('keydown', handleWindowKeydown)
    window.removeEventListener('pointerdown', handleWindowPointerdown, true)
  }
})
watch(() => props.intent, (intent) => { if (!intent) closeMenu() })
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
  window.removeEventListener('pointerdown', handleWindowPointerdown, true)
})
</script>

<template>
  <div ref="aggregateRef" class="selection-aggregate-hull" :aria-label="`已选 ${count} 个节点`">
    <span class="selection-aggregate-label">已选 {{ count }} 个节点</span>
    <div v-if="intent" class="selection-aggregate-continuation">
      <button
        ref="triggerRef"
        type="button"
        :aria-label="`从 ${count} 个已选节点批量生成`"
        :title="`从 ${count} 个已选节点批量生成`"
        :aria-expanded="isMenuOpen"
        @click="isMenuOpen = !isMenuOpen"
      >
        <Plus :size="19" aria-hidden="true" />
      </button>
      <CanvasSelectionGenerationMenu
        v-if="isMenuOpen"
        aggregate
        :asset-image-count="intent.assetImageCount"
        :image-count="intent.imageCount"
        :result-count="intent.resultCount"
        :sources="sources"
        :text-count="intent.textCount"
        :video-mode="intent.videoMode"
        @compose="handleCompose"
        @reorder-source="handleReorderSource"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.selection-aggregate-hull {
  position: absolute;
  z-index: 2;
  border: 1px solid color-mix(in oklch, var(--accent-select) 42%, transparent);
  border-radius: calc(var(--radius-md) + 4px);
  background: color-mix(in oklch, var(--accent-select) 2.5%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--bg-canvas) 64%, transparent);
  pointer-events: none;
}

.selection-aggregate-label {
  position: absolute;
  top: 0;
  right: 14px;
  padding: 3px 7px;
  border: 1px solid color-mix(in oklch, var(--accent-select) 34%, var(--border-subtle));
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  background: color-mix(in oklch, var(--bg-canvas) 92%, transparent);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  transform: translateY(-50%);
}

.selection-aggregate-continuation {
  position: absolute;
  top: 50%;
  right: 0;
  pointer-events: auto;
  transform: translate(50%, -50%);
  --compose-menu-top: 50%;
  --compose-menu-bottom: auto;
  --compose-menu-left: auto;
  --compose-menu-right: calc(100% + 10px);
  --compose-menu-transform: translateY(-50%);
}

.selection-aggregate-continuation > button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  padding: 0;
  border: 1px solid color-mix(in oklch, var(--accent-select) 56%, var(--border-subtle));
  border-radius: 50%;
  color: var(--text-primary);
  background: color-mix(in oklch, var(--bg-panel) 92%, var(--accent-select) 8%);
  box-shadow: 0 8px 24px oklch(3% 0.01 292 / 0.24);
  cursor: pointer;
  transition: background-color var(--v2-duration-fast, 120ms), border-color var(--v2-duration-fast, 120ms), transform var(--v2-duration-fast, 120ms);
}

@media (hover: hover) {
  .selection-aggregate-continuation > button:hover { border-color: var(--accent-select); background: color-mix(in oklch, var(--bg-panel) 82%, var(--accent-select) 18%); }
}

.selection-aggregate-continuation > button:active { transform: scale(var(--v2-press-scale, 0.96)); }
.selection-aggregate-continuation > button:focus-visible { outline: 2px solid var(--v2-focus-ring, var(--accent-select)); outline-offset: 3px; }
</style>
