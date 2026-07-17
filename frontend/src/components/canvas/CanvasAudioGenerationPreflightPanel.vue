<script setup lang="ts">
import { AudioLines, X } from 'lucide-vue-next'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { AudioGenerationPreflight } from '../../modules/canvas/audio-generation'

const props = defineProps<{ plan: AudioGenerationPreflight | null }>()
const emit = defineEmits<{ close: [] }>()
const closeButtonRef = ref<HTMLButtonElement | null>(null)
const intentLabel = () => props.plan?.intent === 'audio-driven-video' ? '音频驱动视频' : '文生音频'
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
  <section class="audio-generation-panel" role="dialog" aria-modal="true" aria-label="音频生成与驱动视频预检">
    <header><div><span class="audio-generation-panel__eyebrow"><AudioLines :size="14" aria-hidden="true" /> Audio Contract v1</span><h2>音频生成与驱动视频预检</h2><p>仅检查来源与执行能力；不会调用 provider、扣减 quota、创建任务或写入素材。</p></div><button ref="closeButtonRef" type="button" aria-label="关闭音频预检" @click="close"><X :size="17" aria-hidden="true" /></button></header>
    <p class="audio-generation-panel__intent">意图 · {{ intentLabel() }}</p>
    <p v-if="plan && !plan.executable" class="audio-generation-panel__alert" role="status">{{ plan.errors[0]?.message ?? '音频执行已阻止。' }}</p>
    <template v-else-if="plan"><ol aria-label="音频预检来源"><li v-for="source in plan.sources" :key="source.node_id"><b>{{ source.role === 'prompt' ? 'T' : source.role === 'audio' ? 'A' : 'V' }}</b><span>{{ source.title }}</span></li></ol><p class="audio-generation-panel__mock" role="status">仅允许本地 mock contract；没有 durable provider、quota、任务或输出资产。</p></template>
  </section>
</template>

<style scoped lang="scss">
.audio-generation-panel { position: fixed; z-index: 72; top: max(88px, calc(env(safe-area-inset-top) + 72px)); right: 24px; display: grid; width: min(408px, calc(100vw - 32px)); max-height: calc(100dvh - 118px); gap: var(--v2-space-3); padding: var(--v2-space-4); overflow-y: auto; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-lg); color: var(--v2-text-primary); background: var(--v2-surface-3); box-shadow: var(--v2-shadow-prominent); }
header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--v2-space-3); } h2 { margin: 3px 0; font-size: var(--v2-font-size-title); } header p { color: var(--v2-text-secondary); font-size: var(--v2-font-size-caption); } header button { width: var(--v2-control-min-size); height: var(--v2-control-min-size); border: 0; border-radius: var(--v2-radius-sm); color: var(--v2-text-muted); background: transparent; cursor: pointer; }.audio-generation-panel__eyebrow, .audio-generation-panel__mock { display: inline-flex; align-items: center; gap: 5px; color: var(--v2-accent-hover); font-size: 11px; }.audio-generation-panel__intent { margin: 0; padding: var(--v2-space-2); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-1); font-size: var(--v2-font-size-caption); }.audio-generation-panel__alert { margin: 0; padding: var(--v2-space-2); border-radius: var(--v2-radius-sm); color: var(--v2-danger); background: var(--v2-surface-2); font-size: var(--v2-font-size-caption); }.audio-generation-panel ol { display: grid; gap: var(--v2-space-2); margin: 0; padding: 0; list-style: none; }.audio-generation-panel li { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: var(--v2-space-2); align-items: center; padding: var(--v2-space-2); border-radius: var(--v2-radius-sm); background: var(--v2-surface-1); }.audio-generation-panel li b { display: grid; width: 22px; height: 22px; place-items: center; border-radius: 50%; color: var(--v2-accent-hover); background: var(--v2-accent-soft); font-size: 11px; }.audio-generation-panel li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.audio-generation-panel :focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .audio-generation-panel * { scroll-behavior: auto; } }
</style>
