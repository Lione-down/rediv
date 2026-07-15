<script setup lang="ts">
import { ChevronDown, ChevronUp, Copy, Group, Image as ImageIcon, Link2, LockKeyhole, LockKeyholeOpen, Trash2, Ungroup, Video, WandSparkles, Workflow } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type CanvasArrangeMenuKey =
  | 'align-left' | 'align-center-x' | 'align-right' | 'align-top' | 'align-center-y' | 'align-bottom'
  | 'distribute-horizontal' | 'distribute-vertical' | 'auto-arrange'

const props = defineProps<{
  count: number
  canConnect: boolean
  canCompose: boolean
  composeAssetImageCount: number
  composeImageCount: number
  composeResultCount: number
  composeSources: Array<{ nodeId: string; role: string; title: string; canMoveUp: boolean; canMoveDown: boolean }>
  composeTextCount: number
  composeVideoMode: 'text-to-video' | 'img2vid' | 'keyframes'
  canDelete: boolean
  canDuplicate: boolean
  canGroup: boolean
  canAlign: boolean
  canAutoArrange: boolean
  canDistribute: boolean
  canUngroup: boolean
  hasLocked: boolean
}>()

const emit = defineEmits<{
  arrange: [action: CanvasArrangeMenuKey]
  duplicate: []
  group: []
  ungroup: []
  connect: []
  compose: [mediaType: 'image' | 'video']
  reorderComposeSource: [nodeId: string, direction: 'up' | 'down']
  delete: []
  toggleLock: []
}>()
const isArrangeOpen = ref(false)
const isComposeOpen = ref(false)

const arrangeOptions = computed(() => [
  ...((props.canAlign || props.canGroup) ? [
    { label: '左对齐', key: 'align-left' }, { label: '水平居中', key: 'align-center-x' },
    { label: '右对齐', key: 'align-right' }, { label: '顶部对齐', key: 'align-top' },
    { label: '垂直居中', key: 'align-center-y' }, { label: '底部对齐', key: 'align-bottom' },
  ] : []),
  ...(props.canDistribute ? [
    { label: '水平分布', key: 'distribute-horizontal' },
    { label: '垂直分布', key: 'distribute-vertical' },
  ] : []),
  ...(props.canAutoArrange ? [{ label: '自动排列', key: 'auto-arrange' }] : []),
])
const canArrangeNodes = computed(() => arrangeOptions.value.length > 0)

function handleArrangeSelect(key: string | number) {
  emit('arrange', key as CanvasArrangeMenuKey)
  isArrangeOpen.value = false
}

function toggleArrange() {
  isComposeOpen.value = false
  isArrangeOpen.value = !isArrangeOpen.value
}

function toggleCompose() {
  isArrangeOpen.value = false
  isComposeOpen.value = !isComposeOpen.value
}

function handleCompose(mediaType: 'image' | 'video') {
  emit('compose', mediaType)
  isComposeOpen.value = false
}

function closeMenus() {
  isArrangeOpen.value = false
  isComposeOpen.value = false
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  closeMenus()
}

watch(() => isArrangeOpen.value || isComposeOpen.value, (isOpen) => {
  if (isOpen) window.addEventListener('keydown', handleWindowKeydown)
  else window.removeEventListener('keydown', handleWindowKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', handleWindowKeydown))
</script>

<template>
  <div class="selection-toolbar" role="toolbar" :aria-label="`${count} 个已选节点的操作`" @keydown.esc.stop="closeMenus">
    <span class="selection-count">已选 {{ count }}</span>
    <div v-if="canCompose" class="compose-menu">
      <button
        type="button"
        aria-label="合并所选节点为生成任务"
        title="合并所选节点为生成任务"
        :aria-expanded="isComposeOpen"
        @click="toggleCompose"
      >
        <WandSparkles :size="16" aria-hidden="true" />
      </button>
      <div v-if="isComposeOpen" class="compose-panel" role="menu" aria-label="选择生成任务类型">
        <p>
          {{ composeTextCount }} 提示词 · {{ composeAssetImageCount }} 素材图<span v-if="composeResultCount"> · {{ composeResultCount }} 生成结果</span>
        </p>
        <ol class="compose-source-list" aria-label="有序生成输入">
          <li v-for="source in composeSources" :key="source.nodeId">
            <strong>{{ source.role }}</strong><span>{{ source.title }}</span>
            <span class="compose-order-actions">
              <button type="button" class="compose-order-button" :aria-label="`上移 ${source.role} ${source.title}`" :disabled="!source.canMoveUp" @click="emit('reorderComposeSource', source.nodeId, 'up')"><ChevronUp :size="13" aria-hidden="true" /></button>
              <button type="button" class="compose-order-button" :aria-label="`下移 ${source.role} ${source.title}`" :disabled="!source.canMoveDown" @click="emit('reorderComposeSource', source.nodeId, 'down')"><ChevronDown :size="13" aria-hidden="true" /></button>
            </span>
          </li>
        </ol>
        <button type="button" class="compose-action" role="menuitem" @click="handleCompose('image')">
          <ImageIcon :size="15" aria-hidden="true" /><span><strong>图片生成</strong><small>{{ composeResultCount ? '历史结果融合' : composeImageCount ? '多输入融合' : '纯文本生成' }}</small></span>
        </button>
        <button type="button" class="compose-action" role="menuitem" @click="handleCompose('video')">
          <Video :size="15" aria-hidden="true" /><span><strong>视频生成</strong><small>{{ composeVideoMode === 'text-to-video' ? '文生视频' : composeVideoMode === 'img2vid' ? '图生视频' : '有序关键帧' }}</small></span>
        </button>
      </div>
    </div>
    <button v-if="canGroup" type="button" aria-label="组合所选节点" title="组合所选节点 (Ctrl+G)" @click="$emit('group')">
      <Group :size="16" aria-hidden="true" />
    </button>
    <button v-if="canUngroup" type="button" aria-label="取消组合" title="取消组合 (Ctrl+Shift+G)" @click="$emit('ungroup')">
      <Ungroup :size="16" aria-hidden="true" />
    </button>
    <button v-if="canConnect" type="button" aria-label="连接所选两个节点" title="连接所选两个节点 (Ctrl+L)" @click="$emit('connect')">
      <Link2 :size="16" aria-hidden="true" />
    </button>
    <div v-if="canArrangeNodes" class="arrange-menu" @keydown.esc.stop="isArrangeOpen = false">
      <button
        type="button"
        aria-label="排列所选节点"
        title="排列所选节点"
        :aria-expanded="isArrangeOpen"
        @click="toggleArrange"
      >
        <Workflow :size="16" aria-hidden="true" />
      </button>
      <div v-if="isArrangeOpen" class="arrange-panel" role="menu" aria-label="排列所选节点">
        <button
          v-for="option in arrangeOptions"
          :key="option.key"
          type="button"
          role="menuitem"
          @click="handleArrangeSelect(option.key)"
        >{{ option.label }}</button>
      </div>
    </div>
    <button
      type="button"
      :aria-label="hasLocked ? '解锁所选节点' : '锁定所选节点'"
      :title="hasLocked ? '解锁所选节点' : '锁定所选节点'"
      @click="$emit('toggleLock')"
    >
      <LockKeyholeOpen v-if="hasLocked" :size="16" aria-hidden="true" />
      <LockKeyhole v-else :size="16" aria-hidden="true" />
    </button>
    <button v-if="canDuplicate" type="button" aria-label="复制所选节点" title="复制所选节点 (Ctrl+D)" @click="$emit('duplicate')">
      <Copy :size="16" aria-hidden="true" />
    </button>
    <button v-if="canDelete" class="is-danger" type="button" aria-label="删除所选节点" title="删除所选节点 (Delete)" @click="$emit('delete')">
      <Trash2 :size="16" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.selection-toolbar {
  position: absolute;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 38px;
  padding: 1px 3px 1px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  background: var(--bg-panel);
  box-shadow: 0 10px 28px oklch(3% 0.01 292 / 0.28);
  transform: translateX(-50%);
}

.selection-count {
  padding-right: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.arrange-menu, .compose-menu { position: relative; }
.arrange-panel, .compose-panel {
  position: absolute;
  top: var(--arrange-menu-top, calc(100% + 10px));
  bottom: var(--arrange-menu-bottom, auto);
  left: 50%;
  display: grid;
  width: 144px;
  max-height: 360px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--bg-panel);
  box-shadow: var(--shadow-floating, var(--shadow-soft));
  transform: translateX(-50%);
}
.compose-panel { top: var(--compose-menu-top, calc(100% + 10px)); bottom: var(--compose-menu-bottom, auto); width: 220px; overflow: hidden; }
.compose-panel > p { margin: 0; padding: 7px 9px 5px; color: var(--text-secondary); font-size: 10px; font-variant-numeric: tabular-nums; }
.compose-source-list { display: grid; gap: 1px; max-height: 200px; margin: 0 4px 4px; padding: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--border-subtle); scrollbar-width: thin; list-style: none; }
.compose-source-list li { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; align-items: center; gap: 6px; padding: 5px 5px 5px 7px; color: var(--text-secondary); background: var(--bg-panel-subtle); font-size: 10px; line-height: 1.35; }
.compose-source-list li strong { color: var(--text-primary); font-variant-numeric: tabular-nums; }
.compose-source-list li span { overflow-wrap: anywhere; }
.compose-order-actions { display: flex; gap: 1px; }
.compose-order-button { width: 24px; height: 24px; border-radius: var(--v2-radius-sm); }
.compose-order-button:disabled { cursor: default; opacity: 0.24; }
.arrange-panel button {
  display: flex;
  width: 136px;
  justify-content: flex-start;
  padding: 0 10px;
  font-size: 12px;
}
.compose-panel > .compose-action { display: flex; width: 212px; min-height: 46px; height: auto; justify-content: flex-start; gap: 8px; padding: 5px 10px; font-size: 12px; }
.compose-panel button span { display: grid; gap: 1px; text-align: left; }
.compose-panel button strong { font-weight: 600; }
.compose-panel button small { color: var(--text-secondary); font-size: 10px; }

button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;
  transition: color var(--v2-duration-fast, 120ms), background-color var(--v2-duration-fast, 120ms), transform var(--v2-duration-fast, 120ms);
}

@media (hover: hover) {
  button:hover { background: var(--bg-panel-subtle); }
  button.is-danger:hover { color: var(--danger); }
}

button:active { transform: scale(var(--v2-press-scale, 0.96)); }
button:focus-visible {
  outline: 2px solid var(--v2-focus-ring, var(--accent-select));
  outline-offset: 2px;
}
</style>
