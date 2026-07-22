<script setup lang="ts">
import { ArrowLeft, ArrowRight, Clapperboard, Copy, Group, Hash, Link2, LockKeyhole, LockKeyholeOpen, PanelRightOpen, RefreshCcw, Trash2, Ungroup, WandSparkles, Workflow } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { StoryboardGroupSettings } from '../../modules/canvas/storyboard-group'
import CanvasSelectionGenerationMenu from './CanvasSelectionGenerationMenu.vue'

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
  composeVideoMode: 'text-to-video' | 'image-to-video' | 'keyframes'
  canDelete: boolean
  canDuplicate: boolean
  canGroup: boolean
  canCreateStoryboard: boolean
  canAlign: boolean
  canAutoArrange: boolean
  canDistribute: boolean
  canUngroup: boolean
  hasLocked: boolean
  storyboardControls: {
    groupId: string
    nodeId: string | null
    settings: StoryboardGroupSettings
    canMoveEarlier: boolean
    canMoveLater: boolean
  } | null
}>()

const emit = defineEmits<{
  arrange: [action: CanvasArrangeMenuKey]
  duplicate: []
  group: []
  createStoryboard: []
  convertStoryboard: [groupId: string]
  reorderStoryboard: [groupId: string, nodeId: string, direction: -1 | 1]
  updateStoryboardSettings: [groupId: string, settings: StoryboardGroupSettings]
  ungroup: []
  connect: []
  compose: [mediaType: 'image' | 'video']
  reorderComposeSource: [nodeId: string, direction: 'up' | 'down']
  delete: []
  inspect: []
  toggleLock: []
}>()
const isArrangeOpen = ref(false)
const isComposeOpen = ref(false)
const toolbarRef = ref<HTMLElement | null>(null)

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

function handleReorderComposeSource(nodeId: string, direction: 'up' | 'down') {
  emit('reorderComposeSource', nodeId, direction)
}

function updateStoryboardSetting(updates: Partial<StoryboardGroupSettings>) {
  if (!props.storyboardControls) return
  emit('updateStoryboardSettings', props.storyboardControls.groupId, {
    ...props.storyboardControls.settings,
    ...updates,
  })
}

function closeMenus() {
  isArrangeOpen.value = false
  isComposeOpen.value = false
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  closeMenus()
}

function handleWindowPointerdown(event: PointerEvent) {
  if (!(event.target instanceof Node) || toolbarRef.value?.contains(event.target)) return
  closeMenus()
}

watch(() => isArrangeOpen.value || isComposeOpen.value, (isOpen) => {
  if (isOpen) {
    window.addEventListener('keydown', handleWindowKeydown)
    window.addEventListener('pointerdown', handleWindowPointerdown, true)
  } else {
    window.removeEventListener('keydown', handleWindowKeydown)
    window.removeEventListener('pointerdown', handleWindowPointerdown, true)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
  window.removeEventListener('pointerdown', handleWindowPointerdown, true)
})
</script>

<template>
  <div ref="toolbarRef" class="selection-toolbar" role="toolbar" :aria-label="`${count} 个已选节点的操作`" @keydown.esc.stop="closeMenus">
    <span class="selection-count">已选 {{ count }}</span>
    <button v-if="count === 1" type="button" aria-label="打开节点详情" title="打开节点详情" @click="$emit('inspect')">
      <PanelRightOpen :size="16" aria-hidden="true" />
    </button>
    <button v-if="canCreateStoryboard" type="button" aria-label="创建分镜组" title="创建分镜组" @click="$emit('createStoryboard')">
      <Clapperboard :size="16" aria-hidden="true" />
    </button>
    <div v-if="storyboardControls" class="storyboard-controls" aria-label="分镜组设置">
      <label>
        <span>比例</span>
        <select aria-label="分镜比例" :value="storyboardControls.settings.aspect_ratio" @change="updateStoryboardSetting({ aspect_ratio: ($event.target as HTMLSelectElement).value as StoryboardGroupSettings['aspect_ratio'] })">
          <option value="16:9">16:9</option><option value="9:16">9:16</option><option value="1:1">1:1</option><option value="4:3">4:3</option>
        </select>
      </label>
      <label>
        <span>列</span>
        <select aria-label="分镜列数" :value="storyboardControls.settings.columns" @change="updateStoryboardSetting({ columns: Number(($event.target as HTMLSelectElement).value) as StoryboardGroupSettings['columns'] })">
          <option v-for="column in 5" :key="column" :value="column">{{ column }}</option>
        </select>
      </label>
      <button
        type="button"
        :aria-label="storyboardControls.settings.show_numbers ? '隐藏分镜编号' : '显示分镜编号'"
        :title="storyboardControls.settings.show_numbers ? '隐藏分镜编号' : '显示分镜编号'"
        :aria-pressed="storyboardControls.settings.show_numbers"
        @click="updateStoryboardSetting({ show_numbers: !storyboardControls.settings.show_numbers })"
      ><Hash :size="16" aria-hidden="true" /></button>
      <template v-if="storyboardControls.nodeId">
        <button type="button" :disabled="!storyboardControls.canMoveEarlier" :aria-label="`前移分镜 ${storyboardControls.nodeId}`" title="前移分镜" @click="$emit('reorderStoryboard', storyboardControls.groupId, storyboardControls.nodeId, -1)"><ArrowLeft :size="16" aria-hidden="true" /></button>
        <button type="button" :disabled="!storyboardControls.canMoveLater" :aria-label="`后移分镜 ${storyboardControls.nodeId}`" title="后移分镜" @click="$emit('reorderStoryboard', storyboardControls.groupId, storyboardControls.nodeId, 1)"><ArrowRight :size="16" aria-hidden="true" /></button>
      </template>
      <button type="button" aria-label="转为普通组合" title="转为普通组合" @click="$emit('convertStoryboard', storyboardControls.groupId)"><RefreshCcw :size="16" aria-hidden="true" /></button>
    </div>
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
      <CanvasSelectionGenerationMenu
        v-if="isComposeOpen"
        :asset-image-count="composeAssetImageCount"
        :image-count="composeImageCount"
        :result-count="composeResultCount"
        :sources="composeSources"
        :text-count="composeTextCount"
        :video-mode="composeVideoMode"
        @compose="handleCompose"
        @reorder-source="handleReorderComposeSource"
      />
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
.storyboard-controls { display: flex; align-items: center; gap: 4px; padding-right: 4px; border-right: 1px solid var(--border-subtle); }
.storyboard-controls label { display: flex; align-items: center; gap: 4px; color: var(--text-secondary); font-size: 10px; }
.storyboard-controls select { min-height: 30px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); background: var(--bg-panel-subtle); font: inherit; font-size: 11px; }
.storyboard-controls select:focus-visible { outline: 2px solid var(--v2-focus-ring, var(--accent-select)); outline-offset: 2px; }
.arrange-panel {
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
.arrange-panel button {
  display: flex;
  width: 136px;
  justify-content: flex-start;
  padding: 0 10px;
  font-size: 12px;
}

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
button:disabled { cursor: not-allowed; opacity: 0.38; }
button:focus-visible {
  outline: 2px solid var(--v2-focus-ring, var(--accent-select));
  outline-offset: 2px;
}
</style>
