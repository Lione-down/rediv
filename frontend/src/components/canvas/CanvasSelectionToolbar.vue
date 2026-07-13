<script setup lang="ts">
import { Copy, Group, Link2, Trash2, Ungroup } from 'lucide-vue-next'

defineProps<{
  count: number
  canConnect: boolean
  canDuplicate: boolean
  canGroup: boolean
  canUngroup: boolean
}>()

defineEmits<{
  duplicate: []
  group: []
  ungroup: []
  connect: []
  delete: []
}>()
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
    <button v-if="canConnect" type="button" aria-label="连接所选两个节点" title="连接所选两个节点 (Ctrl+Enter)" @click="$emit('connect')">
      <Link2 :size="16" aria-hidden="true" />
    </button>
    <button v-if="canDuplicate" type="button" aria-label="复制所选节点" title="复制所选节点 (Ctrl+D)" @click="$emit('duplicate')">
      <Copy :size="16" aria-hidden="true" />
    </button>
    <button class="is-danger" type="button" aria-label="删除所选节点" title="删除所选节点 (Delete)" @click="$emit('delete')">
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
