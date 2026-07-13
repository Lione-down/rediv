<script setup lang="ts">
import { Copy, Group, Link2, LockKeyhole, LockKeyholeOpen, Trash2, Ungroup, Workflow } from 'lucide-vue-next'
import { computed, ref } from 'vue'

type CanvasArrangeMenuKey =
  | 'align-left' | 'align-center-x' | 'align-right' | 'align-top' | 'align-center-y' | 'align-bottom'
  | 'distribute-horizontal' | 'distribute-vertical' | 'auto-arrange'

const props = defineProps<{
  count: number
  canConnect: boolean
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
  delete: []
  toggleLock: []
}>()
const isArrangeOpen = ref(false)

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
</script>

<template>
  <div class="selection-toolbar" role="toolbar" :aria-label="`${count} 个已选节点的操作`">
    <span class="selection-count">已选 {{ count }}</span>
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
        @click="isArrangeOpen = !isArrangeOpen"
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
  min-height: 44px;
  padding: 2px 4px 2px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  background: var(--bg-panel);
  box-shadow: var(--shadow-soft);
  transform: translateX(-50%);
}

.selection-count {
  padding-right: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.arrange-menu { position: relative; }
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
  width: 40px;
  height: 40px;
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
