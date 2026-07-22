<script setup lang="ts">
import {
  Crop,
  Download,
  Eraser,
  Expand,
  Grid2X2,
  ImageUpscale,
  Lightbulb,
  Maximize2,
  Paintbrush,
  PanelRightOpen,
  ScanFace,
  Sparkles,
  WandSparkles,
} from 'lucide-vue-next'
import { computed } from 'vue'
import type { OwnedMediaActionTarget } from '../../modules/canvas/professional-action-registry'

const props = defineProps<{
  availableActionIds: readonly string[]
  target: OwnedMediaActionTarget
}>()
const emit = defineEmits<{
  fullscreen: []
  inspect: []
  openAction: [opener: HTMLElement, actionId: string]
}>()

const actions = [
  { id: 'image-operation.upscale', label: '高清放大', icon: ImageUpscale },
  { id: 'image-operation.expand', label: '扩展画面', icon: Expand },
  { id: 'unavailable.multi-angle', label: '多角度', icon: ScanFace },
  { id: 'unavailable.lighting', label: '光影控制', icon: Lightbulb },
  { id: 'image-operation.inpaint', label: '局部重绘', icon: WandSparkles },
  { id: 'image-operation.erase', label: '擦除区域', icon: Eraser },
  { id: 'image-operation.cutout', label: '主体抠图', icon: Sparkles },
  { id: 'image.split-4', label: '图片拆分', icon: Grid2X2 },
  { id: 'unavailable.brush', label: '画笔', icon: Paintbrush },
  { id: 'unavailable.crop', label: '裁剪', icon: Crop },
] as const

const availableIds = computed(() => new Set(props.availableActionIds))
const downloadName = computed(() => `${props.target.title || 'revid-media'}.${props.target.kind === 'video' ? 'mp4' : 'png'}`)

function openAction(event: MouseEvent, actionId: string) {
  if (!availableIds.value.has(actionId) || !(event.currentTarget instanceof HTMLElement)) return
  emit('openAction', event.currentTarget, actionId)
}
</script>

<template>
  <div class="canvas-media-toolbar" role="toolbar" aria-label="媒体节点操作" @pointerdown.stop>
    <button
      v-for="action in actions"
      :key="action.id"
      class="canvas-media-toolbar__action"
      type="button"
      :aria-label="action.label"
      :title="availableIds.has(action.id) ? action.label : `${action.label}（暂不可用）`"
      :disabled="!availableIds.has(action.id)"
      @click.stop="openAction($event, action.id)"
    >
      <component :is="action.icon" :size="15" aria-hidden="true" />
      <span>{{ action.label }}</span>
    </button>
    <a
      class="canvas-media-toolbar__utility is-leading"
      :href="target.url"
      :download="downloadName"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="下载媒体"
      title="下载媒体"
      @click.stop
    >
      <Download :size="15" aria-hidden="true" />
    </a>
    <button class="canvas-media-toolbar__utility" type="button" aria-label="打开节点详情" title="打开节点详情" @click.stop="emit('inspect')">
      <PanelRightOpen :size="15" aria-hidden="true" />
    </button>
    <button class="canvas-media-toolbar__utility" type="button" aria-label="全屏查看" title="全屏查看" @click.stop="emit('fullscreen')">
      <Maximize2 :size="15" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.canvas-media-toolbar {
  position: absolute;
  z-index: 9;
  top: 0;
  left: 0;
  display: flex;
  box-sizing: border-box;
  width: 100%;
  height: 50px;
  min-width: 0;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  padding: 6px;
  border: 1px solid var(--v2-border-strong);
  border-radius: var(--v2-radius-sm);
  background: var(--v2-surface-2);
  box-shadow: var(--v2-shadow-floating);
  transform: translateY(var(--canvas-media-toolbar-translate-y, calc(-100% - 8px)));
  pointer-events: auto;
  scrollbar-width: none;
  backdrop-filter: blur(10px);
}

.canvas-media-toolbar::-webkit-scrollbar { display: none; }

.canvas-media-toolbar button,
.canvas-media-toolbar a {
  display: inline-grid;
  width: 28px;
  min-width: 28px;
  height: 36px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: var(--v2-radius-xs);
  color: var(--v2-text-secondary);
  background: transparent;
  cursor: pointer;
}

.canvas-media-toolbar button:hover:not(:disabled),
.canvas-media-toolbar a:hover {
  color: var(--v2-text-primary);
  background: var(--v2-accent-soft);
}

.canvas-media-toolbar button:disabled {
  color: var(--v2-text-muted);
  cursor: not-allowed;
  opacity: 0.42;
}

.canvas-media-toolbar .canvas-media-toolbar__action {
  display: inline-flex;
  width: auto;
  min-width: max-content;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 6px;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
}

.canvas-media-toolbar__action svg { flex: 0 0 auto; }

.canvas-media-toolbar__utility.is-leading { margin-left: auto; }

.canvas-media-toolbar button:focus-visible,
.canvas-media-toolbar a:focus-visible {
  outline: 2px solid var(--v2-focus-ring);
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .canvas-media-toolbar button,
  .canvas-media-toolbar a { transition: none; }
}
</style>
