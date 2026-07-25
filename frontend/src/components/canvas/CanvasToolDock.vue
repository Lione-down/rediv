<script setup lang="ts">
import { AudioLines, CirclePlus, FileClock, FileText, Image, Library, ScrollText, Upload, Video } from 'lucide-vue-next'
import type { Component } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'
import {
  getAuthoringNodeOptions,
  type CanonicalNodeType,
} from '../../modules/canvas/node-registry'
import type { ProjectResourceTab } from '../../modules/canvas/project-resource-types'

const props = withDefaults(defineProps<{
  allowedAudioModelCount?: number
  open: boolean
}>(), {
  allowedAudioModelCount: 0,
})
const emit = defineEmits<{
  'update:open': [open: boolean]
  openResources: [opener: HTMLElement, tab: ProjectResourceTab]
  openVideoEditPreflight: [opener: HTMLElement]
  select: [type: CanonicalNodeType, subtype: string]
}>()

const triggerRef = ref<HTMLButtonElement | null>(null)
const itemRefs = ref<HTMLButtonElement[]>([])

interface CatalogEntry {
  id: string
  label: string
  ariaLabel: string
  icon: Component
  authoring?: boolean
  badge?: string
  disabled?: boolean
  disabledReason?: string
  node?: { type: CanonicalNodeType; subtype: string }
  resourceTab?: ProjectResourceTab
  action?: 'video-preflight'
}

const authoringIcons = {
  text: FileText,
  script: ScrollText,
  'image-generation': Image,
  'video-generation': Video,
  'video-composition': Video,
  'audio-generation': AudioLines,
} as const

const catalogEntries = computed<readonly CatalogEntry[]>(() => [
  ...getAuthoringNodeOptions({
    allowedAudioModelCount: props.allowedAudioModelCount,
  }).map((option) => ({
    id: option.id,
    label: option.label,
    ariaLabel: `添加${option.label}卡片`,
    icon: authoringIcons[option.id],
    authoring: true,
    disabled: option.availability === 'disabled',
    disabledReason: option.unavailableReason,
    node: { type: option.type, subtype: option.subtype },
  })),
  { id: 'library', label: '素材库', badge: 'NEW', ariaLabel: '从素材库选择', icon: Library, resourceTab: 'assets' },
  { id: 'upload', label: '上传', ariaLabel: '上传素材', icon: Upload, resourceTab: 'assets' },
  { id: 'history', label: '从生成历史选择', ariaLabel: '从生成历史选择', icon: FileClock, resourceTab: 'tasks' },
])
function toggleMenu() {
  emit('update:open', !props.open)
}

function selectNode(type: string, subtype: string) {
  emit('select', type as CanonicalNodeType, subtype)
  emit('update:open', false)
  void nextTick(() => triggerRef.value?.focus({ preventScroll: true }))
}

function selectEntry(entry: CatalogEntry, event: MouseEvent) {
  if (!(event.currentTarget instanceof HTMLElement)) return
  const surfaceOpener = triggerRef.value ?? event.currentTarget
  if (entry.resourceTab) {
    emit('update:open', false)
    emit('openResources', surfaceOpener, entry.resourceTab)
    return
  }
  if (entry.action === 'video-preflight') {
    emit('update:open', false)
    emit('openVideoEditPreflight', surfaceOpener)
    return
  }
  if (entry.node) selectNode(entry.node.type, entry.node.subtype)
}

function focusItem(index: number) {
  const items = itemRefs.value
  if (!items.length) return
  items[(index + items.length) % items.length]?.focus({ preventScroll: true })
}

function handleMenuKeyDown(event: KeyboardEvent) {
  const currentIndex = itemRefs.value.indexOf(document.activeElement as HTMLButtonElement)
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('update:open', false)
    void nextTick(() => triggerRef.value?.focus({ preventScroll: true }))
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    event.preventDefault()
    focusItem(currentIndex + 1)
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    event.preventDefault()
    focusItem(currentIndex - 1)
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    focusItem(event.key === 'Home' ? 0 : itemRefs.value.length - 1)
  }
}

watch(() => props.open, (open) => {
  if (open) void nextTick(() => focusItem(0))
})
</script>

<template>
  <div class="canvas-tool-dock">
    <Transition name="node-menu">
      <div
        v-if="open"
        class="node-menu"
        role="menu"
        aria-label="添加节点"
        @keydown="handleMenuKeyDown"
      >
        <button
          v-for="entry in catalogEntries"
          :key="entry.id"
          ref="itemRefs"
          type="button"
          role="menuitem"
          :aria-label="entry.ariaLabel"
          :data-authoring-option="entry.authoring ? entry.id : undefined"
          :disabled="entry.disabled"
          :title="entry.disabledReason"
          @click="selectEntry(entry, $event)"
        >
          <component :is="entry.icon" :size="17" aria-hidden="true" />
          <span>{{ entry.label }}</span>
          <small v-if="entry.badge">{{ entry.badge }}</small>
        </button>
      </div>
    </Transition>

    <button
      ref="triggerRef"
      class="add-node-trigger"
      type="button"
      aria-label="添加节点"
      aria-haspopup="menu"
      aria-keyshortcuts="Tab"
      title="添加节点 (Tab)"
      :aria-expanded="open"
      @click="toggleMenu"
    >
      <span data-rail-visual><CirclePlus :size="18" aria-hidden="true" /></span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.canvas-tool-dock {
  display: contents;
}

.add-node-trigger,
.node-menu button {
  min-width: 40px;
  min-height: 40px;
  border: 0;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;
  transition: color var(--v2-duration-fast, 120ms), background-color var(--v2-duration-fast, 120ms), transform var(--v2-duration-fast, 120ms);
}

.add-node-trigger {
  display: grid;
  width: 40px;
  height: 40px;
  padding: 0;
  place-items: center;
}

[data-rail-visual] {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: var(--radius-md);
}

.add-node-trigger[aria-expanded="true"] {
  color: var(--v2-accent, var(--accent-select));
  background: var(--v2-accent-soft);
}

.node-menu {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0;
  display: grid;
  width: 232px;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 6px;
  border: 1px solid var(--border-standard, var(--border-subtle));
  border-radius: var(--radius-lg);
  background: var(--bg-panel-raised, var(--bg-panel));
  box-shadow: var(--shadow-floating, var(--shadow-soft));
}

.node-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  font: inherit;
  font-size: 12px;
  text-align: left;
}

.node-menu small {
  margin-left: auto;
  color: var(--v2-accent-hover, var(--accent-select));
  font-size: 10px;
  font-weight: 600;
}
.node-menu button:disabled { cursor: not-allowed; opacity: .48; }

button:active { transform: scale(var(--v2-press-scale, 0.96)); }
button:focus-visible {
  outline: 2px solid var(--v2-focus-ring, var(--accent-select));
  outline-offset: 2px;
}

.node-menu-enter-active,
.node-menu-leave-active {
  transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1), transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
}
.node-menu-enter-from,
.node-menu-leave-to { opacity: 0; transform: translate(0, 8px) scale(0.98); }

@media (hover: hover) {
  button:hover { color: var(--v2-accent, var(--accent-select)); background: var(--bg-panel-subtle); }
}

@media (prefers-reduced-motion: reduce) {
  .node-menu-enter-active,
  .node-menu-leave-active { transition: none; }
  button:active { transform: none; }
}
</style>
