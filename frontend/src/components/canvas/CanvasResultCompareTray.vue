<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CanvasNode } from '../../types/canvas'
import { buildCanvasNodePresentation } from './canvas-node-presentation'
import CanvasNodeMedia from './CanvasNodeMedia.vue'

export interface CanvasResultCompareItem {
  isSelected: boolean
  node: CanvasNode
  order: number
}

const props = defineProps<{
  items: CanvasResultCompareItem[]
  originTitle: string
}>()

const emit = defineEmits<{
  close: []
  select: [nodeId: string]
}>()

const closeButton = ref<HTMLButtonElement | null>(null)
const presentedItems = computed(() => props.items.map((item) => ({
  ...item,
  media: buildCanvasNodePresentation(item.node).media,
})))

function handleEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
  void nextTick(() => closeButton.value?.focus({ preventScroll: true }))
})

onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<template>
  <section class="result-compare-tray" role="region" aria-label="结果变体比较">
    <header>
      <div>
        <strong>结果变体</strong>
        <span>{{ originTitle }} · {{ items.length }} 个同源结果</span>
      </div>
      <button ref="closeButton" type="button" aria-label="关闭结果变体比较" title="关闭" @click="emit('close')">
        <X :size="18" aria-hidden="true" />
      </button>
    </header>

    <ol aria-label="同源结果列表">
      <li v-for="item in presentedItems" :key="item.node.id" :class="{ 'is-selected': item.isSelected }">
        <div class="variant-heading">
          <span class="variant-marker">V{{ item.order }}</span>
          <strong>{{ item.node.title }}</strong>
          <Check v-if="item.isSelected" :size="15" aria-label="当前选择" />
        </div>
        <div class="variant-media">
          <CanvasNodeMedia v-if="item.media" :media="item.media" />
          <span v-else>没有可预览的媒体</span>
        </div>
        <footer>
          <span>{{ item.node.status || 'idle' }}</span>
          <button
            type="button"
            :aria-label="`选择变体 V${item.order}`"
            :disabled="item.isSelected"
            @click="emit('select', item.node.id)"
          >
            {{ item.isSelected ? '当前结果' : '选择此结果' }}
          </button>
        </footer>
      </li>
    </ol>
  </section>
</template>

<style scoped lang="scss">
.result-compare-tray {
  position: absolute;
  z-index: 18;
  right: var(--compare-right, 16px);
  bottom: 88px;
  left: var(--compare-left, 16px);
  display: grid;
  overflow: hidden;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-lg);
  color: var(--v2-text-primary);
  background: color-mix(in srgb, var(--v2-surface-2) 96%, transparent);
  box-shadow: var(--v2-shadow-floating);
  backdrop-filter: blur(16px);
}

header, header > div, .variant-heading, footer { display: flex; align-items: center; }
header { min-height: 52px; justify-content: space-between; gap: 16px; padding: 7px 10px 7px 16px; border-bottom: 1px solid var(--v2-border-subtle); }
header > div { min-width: 0; gap: 9px; }
header strong { font-size: 13px; }
header span { overflow: hidden; color: var(--v2-text-secondary); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
button { min-height: 36px; border: 0; border-radius: var(--v2-radius-md); color: inherit; background: transparent; cursor: pointer; }
button:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
button:disabled { cursor: default; opacity: .72; }
header button { display: grid; min-width: 36px; place-items: center; }
header button:hover { background: var(--v2-surface-3); }
ol { display: flex; gap: 10px; margin: 0; padding: 10px; overflow-x: auto; list-style: none; scroll-snap-type: x proximity; }
li { flex: 0 0 clamp(210px, 22vw, 270px); overflow: hidden; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); background: var(--v2-surface-1); scroll-snap-align: start; }
li.is-selected { border-color: color-mix(in srgb, var(--v2-accent) 72%, var(--v2-border-standard)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--v2-accent) 26%, transparent); }
.variant-heading { min-height: 38px; gap: 8px; padding: 6px 9px; }
.variant-heading strong { min-width: 0; flex: 1; overflow: hidden; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.variant-heading svg { color: var(--v2-accent); }
.variant-marker { padding: 3px 6px; border-radius: 5px; color: var(--v2-accent); background: color-mix(in srgb, var(--v2-accent) 12%, transparent); font-size: 10px; font-weight: 700; }
.variant-media { display: grid; height: 142px; place-items: center; overflow: hidden; border-block: 1px solid var(--v2-border-subtle); color: var(--v2-text-muted); background: var(--v2-canvas); font-size: 11px; }
footer { min-height: 42px; justify-content: space-between; gap: 8px; padding: 4px 7px 4px 10px; color: var(--v2-text-muted); font-size: 10px; }
footer button { padding: 0 9px; color: var(--v2-text-primary); background: var(--v2-surface-3); font-size: 11px; }
footer button:not(:disabled):hover { color: var(--v2-text-on-accent); background: var(--v2-accent); }

@media (max-width: 767px) {
  .result-compare-tray { right: 8px; bottom: max(156px, calc(env(safe-area-inset-bottom) + 148px)); left: 8px; }
  header > div { display: grid; gap: 1px; }
  ol { padding: 8px; }
  li { flex-basis: min(76vw, 260px); }
  .variant-media { height: 132px; }
}

@media (prefers-reduced-motion: reduce) {
  ol { scroll-behavior: auto; }
}
</style>
