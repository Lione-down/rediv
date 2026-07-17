<script setup lang="ts">
import { Clapperboard, Scissors, X } from 'lucide-vue-next'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { VideoEditOperation, VideoEditPreflight } from '../../modules/canvas/video-edit-preflight'

const props = defineProps<{ operation: VideoEditOperation; plan: VideoEditPreflight | null }>()
const emit = defineEmits<{ close: []; updateOperation: [operation: VideoEditOperation] }>()
const closeButtonRef = ref<HTMLButtonElement | null>(null)

function setKind(kind: 'trim' | 'concat') {
  emit('updateOperation', kind === 'concat' ? { kind } : { kind, start_seconds: 0, end_seconds: 5 })
}
function updateTrim(field: 'start_seconds' | 'end_seconds', event: Event) {
  if (props.operation.kind !== 'trim') return
  const value = Number((event.target as HTMLInputElement).value)
  emit('updateOperation', { ...props.operation, [field]: value })
}
function close() { emit('close') }
function handleEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  event.preventDefault()
  close()
}

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
  void nextTick(() => closeButtonRef.value?.focus({ preventScroll: true }))
})
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<template>
  <section class="video-edit-panel" role="dialog" aria-modal="true" aria-label="视频编辑预检">
    <header><div><span class="video-edit-panel__eyebrow"><Clapperboard :size="14" aria-hidden="true" /> Video Edit v1</span><h2>视频编辑预检</h2><p>仅检查裁剪与序列预览意图；不会处理媒体、创建资产或执行导出。</p></div><button ref="closeButtonRef" type="button" aria-label="关闭视频编辑预检" @click="close"><X :size="17" aria-hidden="true" /></button></header>
    <div class="video-edit-panel__mode" role="group" aria-label="编辑模式"><button type="button" :class="{ active: operation.kind === 'trim' }" @click="setKind('trim')">裁剪</button><button type="button" :class="{ active: operation.kind === 'concat' }" @click="setKind('concat')">拼接</button></div>
    <div v-if="operation.kind === 'trim'" class="video-edit-panel__trim"><label>起点 <input type="number" min="0" step="0.1" :value="operation.start_seconds" @input="updateTrim('start_seconds', $event)" /></label><label>终点 <input type="number" min="0" step="0.1" :value="operation.end_seconds" @input="updateTrim('end_seconds', $event)" /></label></div>
    <p v-if="plan && !plan.executable" class="video-edit-panel__alert" role="alert">{{ plan.errors[0]?.message ?? '预检未通过。' }}</p>
    <template v-else-if="plan?.executable"><video :src="plan.sources[0]?.url" controls preload="metadata" aria-label="视频编辑源预览"></video><ol aria-label="视频序列预览"><li v-for="source in plan.sources" :key="source.node_id"><b>{{ source.order }}</b><span>{{ source.title }}</span></li></ol><p class="video-edit-panel__export" role="status"><Scissors :size="14" aria-hidden="true" />{{ plan.export.message }}</p></template>
  </section>
</template>

<style scoped lang="scss">
.video-edit-panel { position: fixed; z-index: 72; top: max(88px, calc(env(safe-area-inset-top) + 72px)); right: 24px; display: grid; width: min(408px, calc(100vw - 32px)); max-height: calc(100dvh - 118px); gap: var(--v2-space-3); padding: var(--v2-space-4); overflow-y: auto; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-lg); color: var(--v2-text-primary); background: var(--v2-surface-3); box-shadow: var(--v2-shadow-prominent); }
header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--v2-space-3); } h2 { margin: 3px 0; font-size: var(--v2-font-size-title); } header p, small { color: var(--v2-text-secondary); font-size: var(--v2-font-size-caption); } header button { width: var(--v2-control-min-size); height: var(--v2-control-min-size); border: 0; border-radius: var(--v2-radius-sm); color: var(--v2-text-muted); background: transparent; cursor: pointer; }.video-edit-panel__eyebrow, .video-edit-panel__export { display: inline-flex; align-items: center; gap: 5px; color: var(--v2-accent-hover); font-size: 11px; }.video-edit-panel__mode, .video-edit-panel__trim { display: flex; gap: var(--v2-space-2); }.video-edit-panel__mode button { min-height: var(--v2-control-min-size); padding: 0 var(--v2-space-3); border: 1px solid var(--v2-border-strong); border-radius: var(--v2-radius-sm); color: var(--v2-text-primary); background: var(--v2-surface-1); font: inherit; cursor: pointer; }.video-edit-panel__mode button.active { border-color: var(--v2-accent); color: var(--v2-text-on-accent); background: var(--v2-accent); }.video-edit-panel__trim label { display: grid; flex: 1; gap: 4px; color: var(--v2-text-secondary); font-size: var(--v2-font-size-caption); }.video-edit-panel__trim input { width: 100%; min-height: 32px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: inherit; background: var(--v2-surface-1); }.video-edit-panel__alert { margin: 0; padding: var(--v2-space-2); border-radius: var(--v2-radius-sm); color: var(--v2-danger); background: var(--v2-surface-2); font-size: var(--v2-font-size-caption); }.video-edit-panel video { width: 100%; border-radius: var(--v2-radius-md); background: black; }.video-edit-panel ol { display: grid; gap: var(--v2-space-2); margin: 0; padding: 0; list-style: none; }.video-edit-panel li { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: var(--v2-space-2); align-items: center; padding: var(--v2-space-2); border-radius: var(--v2-radius-sm); background: var(--v2-surface-1); }.video-edit-panel li b { display: grid; width: 22px; height: 22px; place-items: center; border-radius: 50%; color: var(--v2-accent-hover); background: var(--v2-accent-soft); font-size: 11px; }.video-edit-panel li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.video-edit-panel :focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .video-edit-panel * { scroll-behavior: auto; } }
</style>
