<script setup lang="ts">
import { FileText, Image, Music2, Video } from 'lucide-vue-next'
import type { CanvasCardWorkMode } from './canvas-card-work-model'

withDefaults(defineProps<{
  enabledModeIds: readonly CanvasCardWorkMode['id'][]
  error?: string
  modes: readonly CanvasCardWorkMode[]
  pending?: boolean
}>(), {
  error: '',
  pending: false,
})
const emit = defineEmits<{ select: [modeId: CanvasCardWorkMode['id'], opener: HTMLElement] }>()

const icons = {
  'direct-write': FileText,
  'text-to-video': Video,
  'image-to-prompt': Image,
  'text-to-music': Music2,
} as const

function select(modeId: CanvasCardWorkMode['id'], event: MouseEvent) {
  emit('select', modeId, event.currentTarget as HTMLElement)
}
</script>

<template>
  <div class="canvas-text-card-mode-chooser" role="group" aria-label="文本卡片创作方式" @pointerdown.stop @click.stop>
    <button v-for="mode in modes" :key="mode.id" type="button" :disabled="!enabledModeIds.includes(mode.id)" :title="enabledModeIds.includes(mode.id) ? mode.label : `${mode.label}：当前没有允许的模型`" @click="select(mode.id, $event)">
      <component :is="icons[mode.id as keyof typeof icons]" :size="15" aria-hidden="true" />
      <span>{{ mode.label }}</span>
    </button>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-else-if="pending" aria-live="polite">正在持久化生成任务…</p>
  </div>
</template>

<style scoped lang="scss">
.canvas-text-card-mode-chooser { display: grid; box-sizing: border-box; width: 100%; height: 100%; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding: 10px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-md); background: var(--v2-surface-1); pointer-events: auto; }
button { display: flex; min-width: 0; min-height: 42px; align-items: center; gap: 7px; padding: 7px 9px; border: 1px solid var(--v2-border-subtle); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: var(--v2-surface-2); font: inherit; font-size: 10px; text-align: left; cursor: pointer; }
button:hover { border-color: var(--v2-accent); color: var(--v2-text-primary); background: var(--v2-accent-soft); }
button:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
button:disabled { cursor: not-allowed; opacity: .45; }
span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
p { grid-column: 1 / -1; margin: 0; color: var(--v2-danger); font-size: 10px; }
</style>
