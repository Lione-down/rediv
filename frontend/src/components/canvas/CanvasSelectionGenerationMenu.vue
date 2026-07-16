<script setup lang="ts">
import { ChevronDown, ChevronUp, Image as ImageIcon, Video } from 'lucide-vue-next'
import type { SelectionGenerationMediaType, SelectionVideoMode } from '../../modules/canvas/selection-generation'

export interface CanvasSelectionGenerationSource {
  nodeId: string
  role: string
  title: string
  canMoveUp: boolean
  canMoveDown: boolean
}

const props = withDefaults(defineProps<{
  aggregate?: boolean
  assetImageCount: number
  imageCount: number
  resultCount: number
  sources: CanvasSelectionGenerationSource[]
  textCount: number
  videoMode: SelectionVideoMode
}>(), { aggregate: false })

const emit = defineEmits<{
  compose: [mediaType: SelectionGenerationMediaType]
  reorderSource: [nodeId: string, direction: 'up' | 'down']
}>()
</script>

<template>
  <div class="compose-panel" role="menu" aria-label="选择生成任务类型">
    <p v-if="aggregate" class="compose-summary">
      {{ sources.length }} 个来源 · {{ textCount }} 提示词 · {{ imageCount }} 参考图 · {{ resultCount }} 结果引用
    </p>
    <p v-else class="compose-summary">
      {{ textCount }} 提示词 · {{ assetImageCount }} 素材图<span v-if="resultCount"> · {{ resultCount }} 生成结果</span>
    </p>
    <ol class="compose-source-list" aria-label="有序生成输入">
      <li v-for="source in sources" :key="source.nodeId">
        <strong>{{ source.role }}</strong><span>{{ source.title }}</span>
        <span class="compose-order-actions">
          <button type="button" class="compose-order-button" :aria-label="`上移 ${source.role} ${source.title}`" :disabled="!source.canMoveUp" @click="emit('reorderSource', source.nodeId, 'up')"><ChevronUp :size="13" aria-hidden="true" /></button>
          <button type="button" class="compose-order-button" :aria-label="`下移 ${source.role} ${source.title}`" :disabled="!source.canMoveDown" @click="emit('reorderSource', source.nodeId, 'down')"><ChevronDown :size="13" aria-hidden="true" /></button>
        </span>
      </li>
    </ol>
    <button type="button" class="compose-action" role="menuitem" @click="emit('compose', 'image')">
      <ImageIcon :size="15" aria-hidden="true" /><span><strong>图片生成</strong><small>{{ resultCount ? '历史结果融合' : imageCount ? '多输入融合' : '纯文本生成' }}</small></span>
    </button>
    <button type="button" class="compose-action" role="menuitem" @click="emit('compose', 'video')">
      <Video :size="15" aria-hidden="true" /><span><strong>视频生成</strong><small>{{ videoMode === 'text-to-video' ? '文生视频' : videoMode === 'image-to-video' ? '图生视频' : '有序关键帧' }}</small></span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.compose-panel {
  position: absolute;
  z-index: 7;
  top: var(--compose-menu-top, calc(100% + 10px));
  bottom: var(--compose-menu-bottom, auto);
  left: var(--compose-menu-left, 50%);
  right: var(--compose-menu-right, auto);
  display: grid;
  width: 220px;
  max-height: 360px;
  overflow: hidden;
  padding: 4px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  background: var(--bg-panel);
  box-shadow: var(--shadow-floating, var(--shadow-soft));
  pointer-events: auto;
  transform: var(--compose-menu-transform, translateX(-50%));
}

.compose-summary {
  margin: 0;
  padding: 7px 9px 5px;
  color: var(--text-secondary);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.compose-source-list {
  display: grid;
  gap: 1px;
  max-height: 200px;
  margin: 0 0 4px;
  padding: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--border-subtle);
  scrollbar-width: thin;
  list-style: none;
}

.compose-source-list li {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  padding: 5px 5px 5px 7px;
  color: var(--text-secondary);
  background: var(--bg-panel-subtle);
  font-size: 10px;
  line-height: 1.35;
}

.compose-source-list li strong { color: var(--text-primary); font-variant-numeric: tabular-nums; }
.compose-source-list li span { overflow-wrap: anywhere; }
.compose-order-actions { display: flex; gap: 1px; }

button {
  border: 0;
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;
  transition: color var(--v2-duration-fast, 120ms), background-color var(--v2-duration-fast, 120ms), transform var(--v2-duration-fast, 120ms);
}

.compose-order-button {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  padding: 0;
  border-radius: var(--v2-radius-sm);
}

.compose-order-button:disabled { cursor: default; opacity: 0.24; }
.compose-action { display: flex; width: 212px; min-height: 46px; justify-content: flex-start; align-items: center; gap: 8px; padding: 5px 10px; border-radius: var(--radius-md); font-size: 12px; }
.compose-action span { display: grid; gap: 1px; text-align: left; }
.compose-action strong { font-weight: 600; }
.compose-action small { color: var(--text-secondary); font-size: 10px; }

@media (hover: hover) {
  button:not(:disabled):hover { background: var(--bg-panel-subtle); }
}

button:active { transform: scale(var(--v2-press-scale, 0.96)); }
button:focus-visible { outline: 2px solid var(--v2-focus-ring, var(--accent-select)); outline-offset: 2px; }
</style>
