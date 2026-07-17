<script setup lang="ts">
import { Bot, X } from 'lucide-vue-next'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CanvasAgentSkillPreflight } from '../../modules/canvas/agent-skills'

defineProps<{ error: string; isLoading: boolean; plan: CanvasAgentSkillPreflight | null }>()
const emit = defineEmits<{ close: [] }>()
const closeButtonRef = ref<HTMLButtonElement | null>(null)

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
  <section class="agent-skill-preflight-panel" role="dialog" aria-modal="true" aria-label="Agent/Skill Canvas context preflight">
    <header>
      <div>
        <span class="agent-skill-preflight-panel__eyebrow"><Bot :size="14" aria-hidden="true" /> Revid Agent/Skill v1</span>
        <h2>Agent Canvas context preflight</h2>
        <p>Inspects the selected current-Canvas nodes only. It cannot execute a provider, reserve quota, create a task, asset, or Canvas mutation.</p>
      </div>
      <button ref="closeButtonRef" type="button" aria-label="关闭 Agent/Skill context 预检" @click="close"><X :size="17" aria-hidden="true" /></button>
    </header>
    <p v-if="isLoading" class="agent-skill-preflight-panel__state" role="status">Inspecting the Revid-owned contract…</p>
    <p v-else-if="error" class="agent-skill-preflight-panel__alert" role="alert">{{ error }}</p>
    <template v-else-if="plan">
      <p class="agent-skill-preflight-panel__state" role="status">Mock-only · no executable native handoff is available.</p>
      <ol aria-label="Canvas context sources">
        <li v-for="source in plan.sources" :key="source.node_id"><b>C</b><span>{{ source.node_id }}</span><small>{{ source.node_type }} · {{ source.subtype }}</small></li>
      </ol>
    </template>
  </section>
</template>

<style scoped lang="scss">
.agent-skill-preflight-panel { position: fixed; z-index: 72; top: max(88px, calc(env(safe-area-inset-top) + 72px)); right: 24px; display: grid; width: min(408px, calc(100vw - 32px)); max-height: calc(100dvh - 118px); gap: var(--v2-space-3); padding: var(--v2-space-4); overflow-y: auto; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-lg); color: var(--v2-text-primary); background: var(--v2-surface-3); box-shadow: var(--v2-shadow-prominent); }
header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--v2-space-3); } h2 { margin: 3px 0; font-size: var(--v2-font-size-title); } header p { color: var(--v2-text-secondary); font-size: var(--v2-font-size-caption); } header button { width: var(--v2-control-min-size); height: var(--v2-control-min-size); border: 0; border-radius: var(--v2-radius-sm); color: var(--v2-text-muted); background: transparent; cursor: pointer; }.agent-skill-preflight-panel__eyebrow { display: inline-flex; align-items: center; gap: 5px; color: var(--v2-accent-hover); font-size: 11px; }.agent-skill-preflight-panel__state, .agent-skill-preflight-panel__alert { margin: 0; padding: var(--v2-space-2); border-radius: var(--v2-radius-sm); font-size: var(--v2-font-size-caption); }.agent-skill-preflight-panel__state { color: var(--v2-text-secondary); background: var(--v2-surface-1); }.agent-skill-preflight-panel__alert { color: var(--v2-danger); background: var(--v2-surface-2); }.agent-skill-preflight-panel ol { display: grid; gap: var(--v2-space-2); margin: 0; padding: 0; list-style: none; }.agent-skill-preflight-panel li { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: var(--v2-space-2); align-items: center; padding: var(--v2-space-2); border-radius: var(--v2-radius-sm); background: var(--v2-surface-1); }.agent-skill-preflight-panel li b { display: grid; width: 22px; height: 22px; place-items: center; border-radius: 50%; color: var(--v2-accent-hover); background: var(--v2-accent-soft); font-size: 11px; }.agent-skill-preflight-panel li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.agent-skill-preflight-panel li small { color: var(--v2-text-muted); font-size: 10px; }.agent-skill-preflight-panel :focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .agent-skill-preflight-panel * { scroll-behavior: auto; } }
</style>
