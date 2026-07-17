<script setup lang="ts">
import {
  Clapperboard,
  CornerDownLeft,
  FileText,
  Grid2X2,
  ImagePlus,
  Search,
  StickyNote,
  Video,
  X,
} from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ResolvedProfessionalCanvasAction } from '../../modules/canvas/professional-action-registry'

const props = defineProps<{
  actions: readonly ResolvedProfessionalCanvasAction[]
  error?: string
  query: string
}>()
const emit = defineEmits<{
  close: []
  select: [actionId: string]
  'update:query': [query: string]
}>()
const paletteRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const activeIndex = ref(0)
const activeAction = computed(() => props.actions[activeIndex.value] ?? null)
const activeDescendant = computed(() => activeAction.value
  ? `canvas-professional-action-${activeAction.value.id}`
  : undefined)

function actionIcon(action: ResolvedProfessionalCanvasAction) {
  if (action.intent.type === 'create-shot-graph' || action.intent.type === 'create-storyboard-recipe') return Clapperboard
  if (action.intent.type === 'create-image-operation') return ImagePlus
  if (action.intent.type === 'split-image-grid') return Grid2X2
  if (action.intent.nodeType === 'script') return FileText
  if (action.intent.nodeType === 'note') return StickyNote
  if (action.intent.subtype === 'video') return Video
  return ImagePlus
}

function actionCategory(action: ResolvedProfessionalCanvasAction) {
  if (action.category === 'image') return '图片处理'
  if (action.category === 'image-operation') return '专业图片操作'
  if (action.category === 'storyboard') return '故事板配方'
  return action.category === 'script' ? '脚本规划' : '画布创建'
}

function setActiveIndex(index: number) {
  if (!props.actions.length) {
    activeIndex.value = 0
    return
  }
  activeIndex.value = (index + props.actions.length) % props.actions.length
}

function executeActive() {
  if (activeAction.value) emit('select', activeAction.value.id)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.isComposing) return
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    setActiveIndex(activeIndex.value + 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    setActiveIndex(activeIndex.value - 1)
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    setActiveIndex(event.key === 'Home' ? 0 : props.actions.length - 1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    executeActive()
  }
}

function handleQueryInput(event: Event) {
  emit('update:query', (event.currentTarget as HTMLInputElement).value)
}

function handleOutsidePointerDown(event: PointerEvent) {
  if (!paletteRef.value?.contains(event.target as Node)) emit('close')
}

watch(() => props.actions.map((action) => action.id).join('|'), () => {
  activeIndex.value = 0
})

onMounted(() => {
  window.addEventListener('pointerdown', handleOutsidePointerDown, true)
  void nextTick(() => searchRef.value?.focus({ preventScroll: true }))
})
onBeforeUnmount(() => window.removeEventListener('pointerdown', handleOutsidePointerDown, true))
</script>

<template>
  <section
    ref="paletteRef"
    class="professional-action-palette"
    role="dialog"
    aria-label="专业操作"
    @keydown="handleKeydown"
    @pointerdown.stop
  >
    <header class="professional-action-palette__header">
      <div>
        <strong>专业操作</strong>
        <span>输入关键词或使用方向键选择</span>
      </div>
      <button type="button" aria-label="关闭专业操作" @click="emit('close')">
        <X :size="16" aria-hidden="true" />
      </button>
    </header>

    <label class="professional-action-palette__search">
      <Search :size="17" aria-hidden="true" />
      <input
        ref="searchRef"
        :value="query"
        type="text"
        role="combobox"
        aria-label="搜索专业操作"
        aria-autocomplete="list"
        aria-expanded="true"
        aria-controls="canvas-professional-action-listbox"
        :aria-activedescendant="activeDescendant"
        placeholder="搜索操作"
        @input="handleQueryInput"
      />
      <kbd>/</kbd>
    </label>

    <p v-if="error" class="professional-action-palette__error" role="alert">{{ error }}</p>
    <div
      id="canvas-professional-action-listbox"
      class="professional-action-palette__list"
      role="listbox"
      aria-label="可用专业操作"
    >
      <button
        v-for="(action, index) in actions"
        :id="`canvas-professional-action-${action.id}`"
        :key="action.id"
        type="button"
        role="option"
        :aria-selected="index === activeIndex"
        :class="{ 'is-active': index === activeIndex }"
        @click="emit('select', action.id)"
        @pointerenter="activeIndex = index"
      >
        <span class="professional-action-palette__icon">
          <component :is="actionIcon(action)" :size="17" aria-hidden="true" />
        </span>
        <span class="professional-action-palette__copy">
          <strong>{{ action.title }}</strong>
          <small>{{ action.description }}</small>
        </span>
        <span class="professional-action-palette__category">{{ actionCategory(action) }}</span>
      </button>
      <p v-if="!actions.length" class="professional-action-palette__empty" role="status">
        没有匹配的可用操作
      </p>
    </div>

    <footer>
      <span>↑↓ 选择</span>
      <span><CornerDownLeft :size="12" aria-hidden="true" />执行</span>
      <span>Esc 关闭</span>
    </footer>
  </section>
</template>

<style scoped lang="scss">
.professional-action-palette {
  position: fixed;
  z-index: 70;
  top: max(88px, calc(env(safe-area-inset-top) + 72px));
  left: 50%;
  display: grid;
  width: min(560px, calc(100vw - 32px));
  max-height: min(620px, calc(100dvh - 120px));
  gap: var(--v2-space-2);
  padding: var(--v2-space-3);
  overflow: hidden;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-lg);
  color: var(--v2-text-primary);
  background: var(--v2-surface-3);
  box-shadow: var(--v2-shadow-prominent);
  transform: translateX(-50%);
}

.professional-action-palette__header,
.professional-action-palette__header > div,
.professional-action-palette__search,
.professional-action-palette__list,
.professional-action-palette__copy {
  display: grid;
}

.professional-action-palette__header {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--v2-space-3);
}

.professional-action-palette__header > div { gap: 2px; }
.professional-action-palette__header strong { font-size: var(--v2-font-size-title); line-height: var(--v2-line-height-title); }
.professional-action-palette__header span { color: var(--v2-text-muted); font-size: var(--v2-font-size-caption); }
.professional-action-palette__header button {
  display: grid;
  width: var(--v2-control-min-size);
  height: var(--v2-control-min-size);
  place-items: center;
  border: 0;
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-muted);
  background: transparent;
  cursor: pointer;
  transition: transform var(--v2-duration-fast) var(--v2-ease-standard), background-color var(--v2-duration-fast) var(--v2-ease-standard);
}

.professional-action-palette__search {
  min-height: 44px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--v2-space-2);
  padding: 0 var(--v2-space-3);
  border: 1px solid var(--v2-border-strong);
  border-radius: var(--v2-radius-md);
  color: var(--v2-text-muted);
  background: var(--v2-surface-1);
}

.professional-action-palette__search:focus-within { border-color: var(--v2-accent); box-shadow: 0 0 0 2px var(--v2-accent-soft); }
.professional-action-palette__search input { min-width: 0; border: 0; outline: 0; color: var(--v2-text-primary); background: transparent; font: inherit; font-size: var(--v2-font-size-control); }
.professional-action-palette__search input::placeholder { color: var(--v2-text-muted); }
.professional-action-palette__search kbd { padding: 2px 7px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-xs); color: var(--v2-text-muted); background: var(--v2-surface-2); font: inherit; font-size: 11px; }

.professional-action-palette__list { gap: var(--v2-space-1); overflow-y: auto; overscroll-behavior: contain; }
.professional-action-palette__list > button {
  display: grid;
  min-height: 58px;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--v2-space-3);
  padding: 7px var(--v2-space-3);
  border: 1px solid transparent;
  border-radius: var(--v2-radius-md);
  color: var(--v2-text-secondary);
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform var(--v2-duration-fast) var(--v2-ease-standard), background-color var(--v2-duration-fast) var(--v2-ease-standard), border-color var(--v2-duration-fast) var(--v2-ease-standard);
}

.professional-action-palette__list > button.is-active { border-color: color-mix(in oklch, var(--v2-accent) 36%, var(--v2-border-standard)); background: var(--v2-accent-soft); }
.professional-action-palette__icon { display: grid; width: 36px; height: 36px; place-items: center; border-radius: var(--v2-radius-sm); color: var(--v2-accent-hover); background: var(--v2-surface-prominent); }
.professional-action-palette__copy { min-width: 0; gap: 2px; }
.professional-action-palette__copy strong { overflow: hidden; color: var(--v2-text-primary); font-size: var(--v2-font-size-body); text-overflow: clip; white-space: nowrap; }
.professional-action-palette__copy small { overflow: hidden; color: var(--v2-text-secondary); font-size: var(--v2-font-size-caption); text-overflow: clip; white-space: nowrap; }
.professional-action-palette__category { color: var(--v2-text-secondary); font-size: 11px; white-space: nowrap; }
.professional-action-palette__empty { margin: 0; padding: 28px var(--v2-space-3); color: var(--v2-text-muted); font-size: var(--v2-font-size-body); text-align: center; }
.professional-action-palette__error { margin: 0; padding: var(--v2-space-2) var(--v2-space-3); border-radius: var(--v2-radius-sm); color: var(--v2-danger); background: var(--v2-surface-2); font-size: var(--v2-font-size-caption); }
.professional-action-palette footer { display: flex; align-items: center; gap: var(--v2-space-4); padding: var(--v2-space-1) var(--v2-space-1) 0; color: var(--v2-text-muted); font-size: 10px; }
.professional-action-palette footer span { display: inline-flex; align-items: center; gap: 4px; }
.professional-action-palette button:active { transform: scale(var(--v2-press-scale)); }
.professional-action-palette button:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }

@media (hover: hover) {
  .professional-action-palette__header button:hover,
  .professional-action-palette__list > button:hover { color: var(--v2-text-primary); background: var(--v2-accent-soft); }
}

@media (prefers-reduced-motion: reduce) {
  .professional-action-palette button { transition: none; }
}
</style>
