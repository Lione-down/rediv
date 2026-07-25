<script setup lang="ts">
import { CornerDownRight, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ConnectionContinuationOption } from '../../modules/canvas/connection-continuation'
import { resolveCanvasNodeIcon } from './canvas-node-icons'

const props = defineProps<{
  options: ConnectionContinuationOption[]
  originTitle: string
  direction: 'downstream' | 'upstream'
  allowedAudioModelCount: number
}>()
const emit = defineEmits<{
  cancel: []
  select: [key: string]
}>()
const menuRef = ref<HTMLElement | null>(null)
const itemRefs = ref<HTMLButtonElement[]>([])
type DisplayOption = ConnectionContinuationOption & { displayLabel: string; isAvailable: boolean; availabilityLabel?: string }
const displayOptions = computed<DisplayOption[]>(() => {
  const options = props.options.map((option) => ({
    ...option,
    displayLabel: option.type === 'script' && option.subtype === 'prompt' ? '文本' : option.label,
    isAvailable: option.subtype !== 'audio' || props.allowedAudioModelCount > 0,
    ...(option.subtype === 'audio' && props.allowedAudioModelCount === 0
      ? { availabilityLabel: '无兼容模型' }
      : {}),
  }))
  const order = (option: DisplayOption) => {
    if (option.type === 'script' && option.subtype === 'prompt') return 0
    if (option.type === 'script') return 1
    if (option.type === 'generation' && option.subtype === 'image') return 2
    if (option.type === 'generation' && option.subtype === 'video') return 3
    if (option.type === 'generation' && option.subtype === 'video-composition') return 4
    if (option.type === 'generation' && option.subtype === 'audio') return 5
    return 6
  }
  return options.sort((left, right) => order(left) - order(right))
})

function focusItem(index: number) {
  const items = itemRefs.value
  if (!items.length) return
  items[(index + items.length) % items.length]?.focus({ preventScroll: true })
}

function handleKeyDown(event: KeyboardEvent) {
  const index = itemRefs.value.indexOf(document.activeElement as HTMLButtonElement)
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('cancel')
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusItem(index + 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusItem(index - 1)
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    focusItem(event.key === 'Home' ? 0 : displayOptions.value.length - 1)
  }
}

function selectOption(option: DisplayOption) {
  if (option.isAvailable) emit('select', option.key)
}

function handleOutsidePointerDown(event: PointerEvent) {
  if (!menuRef.value?.contains(event.target as Node)) emit('cancel')
}

onMounted(() => {
  window.addEventListener('pointerdown', handleOutsidePointerDown, true)
  void nextTick(() => focusItem(0))
})
onBeforeUnmount(() => window.removeEventListener('pointerdown', handleOutsidePointerDown, true))
</script>

<template>
  <section ref="menuRef" class="continuation-menu" role="dialog" aria-label="继续连接" @keydown="handleKeyDown" @pointerdown.stop>
    <header>
      <span><CornerDownRight :size="14" aria-hidden="true" />{{ direction === 'upstream' ? '创建上游' : '继续连接' }}</span>
      <button type="button" aria-label="取消继续连接" @click="emit('cancel')"><X :size="14" aria-hidden="true" /></button>
    </header>
    <p>{{ direction === 'upstream' ? `为「${originTitle}」创建兼容上游` : `从「${originTitle}」创建兼容节点` }}</p>
    <div role="menu" aria-label="兼容节点">
      <button
        v-for="option in displayOptions"
        :key="option.key"
        ref="itemRefs"
        type="button"
        role="menuitem"
        :aria-disabled="!option.isAvailable"
        @click="selectOption(option)"
      >
        <component :is="resolveCanvasNodeIcon(option.icon)" :size="16" aria-hidden="true" />
        <span>{{ option.displayLabel }}</span>
        <small>{{ option.availabilityLabel ?? (option.targetPort === 'prompt' || option.sourcePort === 'out' && option.type === 'script' ? '文本' : option.targetPort === 'media' ? '参考' : option.sourcePort === 'out' && option.type === 'asset' ? '素材' : '结果') }}</small>
      </button>
    </div>
    <footer>↑↓ 选择 · Enter 创建 · Esc 取消</footer>
  </section>
</template>

<style scoped lang="scss">
.continuation-menu {
  position: absolute;
  z-index: 12;
  width: 248px;
  padding: 7px;
  border: 1px solid var(--v2-border-standard, var(--border-standard));
  border-radius: var(--v2-radius-lg, var(--radius-lg));
  color: var(--v2-text-primary, var(--text-primary));
  background: var(--v2-surface-3, var(--bg-panel-raised));
  box-shadow: var(--shadow-floating, var(--shadow-soft));
}
header, header span, [role="menu"] button { display: flex; align-items: center; }
header { justify-content: space-between; min-height: 28px; padding: 0 3px 0 5px; }
header span { gap: 6px; font-size: 12px; font-weight: 650; }
header button { display: grid; width: 28px; height: 28px; place-items: center; border: 0; border-radius: 7px; color: var(--v2-text-muted); background: transparent; cursor: pointer; }
p { margin: 2px 5px 7px; overflow: hidden; color: var(--v2-text-muted); font-size: 10px; white-space: nowrap; text-overflow: clip; }
[role="menu"] { display: grid; gap: 3px; }
[role="menu"] button {
  min-height: 38px;
  gap: 9px;
  padding: 0 9px;
  border: 0;
  border-radius: var(--v2-radius-md, var(--radius-md));
  color: var(--v2-text-secondary, var(--text-secondary));
  background: transparent;
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
[role="menu"] button span { flex: 1; color: var(--v2-text-primary, var(--text-primary)); }
[role="menu"] button small { color: var(--v2-text-muted); font-size: 10px; }
[role="menu"] button[aria-disabled="true"] { color: var(--v2-text-disabled); cursor: not-allowed; opacity: 0.64; }
[role="menu"] button[aria-disabled="true"] span { color: var(--v2-text-disabled); }
footer { margin: 6px 5px 2px; color: var(--v2-text-muted); font-size: 9px; }
button:focus-visible { outline: 2px solid var(--v2-focus-ring, var(--accent-select)); outline-offset: -2px; }
@media (hover: hover) {
  header button:hover, [role="menu"] button:not([aria-disabled="true"]):hover { color: var(--v2-accent); background: var(--v2-accent-soft); }
}
@media (prefers-reduced-motion: reduce) { .continuation-menu, button { transition: none; } }
</style>
