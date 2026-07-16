<script setup lang="ts">
import { Link2, LocateFixed, LockKeyhole, Trash2, X } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref } from 'vue'
import { canDeleteCanvasNode, isConnectionMutationSupported } from '../../modules/canvas/canvas-commands'
import { useCanvasStore } from '../../store/canvas'
import type { CanvasNode } from '../../types/canvas'
import { buildCanvasNodePresentation } from './canvas-node-presentation'
import { useCanvasCommandInteractions } from './composables/use-canvas-command-interactions'
import {
  formatGenerationProgressPercent,
  type GenerationRuntimePresentation,
} from '../../modules/canvas/generation-runtime-presentation'

const props = withDefaults(defineProps<{
  generationRuntimePresentations?: ReadonlyMap<string, GenerationRuntimePresentation>
  readonly: boolean
}>(), {
  generationRuntimePresentations: () => new Map(),
})

const emit = defineEmits<{
  close: []
  locateNode: [nodeId: string]
}>()

const canvasStore = useCanvasStore()
const dialogRef = ref<HTMLElement | null>(null)
const { deleteSelection } = useCanvasCommandInteractions({ isReadOnly: () => props.readonly })
const shortcuts = [
  ['Ctrl+Z', '撤销上一步画布编辑'],
  ['Ctrl+Shift+Z', '重做上一步画布编辑'],
  ['Ctrl+D', '复制所选节点'],
  ['Ctrl+G', '组合所选节点'],
  ['Ctrl+Shift+G', '取消组合'],
  ['Tab', '打开添加节点菜单'],
  ['Ctrl+Enter', '连接两个所选节点'],
  ['Ctrl+L', '连接两个所选节点'],
  ['Ctrl+0', '适配全部节点'],
  ['Ctrl++ / Ctrl+-', '放大或缩小画布'],
  ['Alt+Shift+F', '自动排列节点'],
  ['Delete', '删除所选内容'],
  ['Esc', '取消操作或清除选择'],
  ['?', '打开此面板'],
]
const nodeTitles = computed(() => new Map(canvasStore.nodes.map((node) => [node.id, node.title])))

function connectionLabel(from: string, to: string) {
  return `${nodeTitles.value.get(from) ?? from} 到 ${nodeTitles.value.get(to) ?? to}`
}

function nodeTypeLabel(node: CanvasNode) {
  return buildCanvasNodePresentation(node).typeLabel
}

function nodeRuntimeLabel(nodeId: string) {
  const runtime = props.generationRuntimePresentations.get(nodeId)
  if (!runtime) return null
  const percent = formatGenerationProgressPercent(runtime.progressPercent)
  return `${runtime.label}${percent ? ` · ${percent}` : runtime.isIndeterminate ? ' · 百分比未提供' : ''}`
}

function selectAndLocateNode(nodeId: string) {
  emit('locateNode', nodeId)
}

function reviewConnection(connectionId: string) {
  canvasStore.selectConnection(connectionId)
}

function deleteNode(nodeId: string) {
  canvasStore.setSelection([nodeId], nodeId)
  deleteSelection('accessibility')
}

function deleteConnection(connectionId: string) {
  canvasStore.selectConnection(connectionId)
  deleteSelection('accessibility')
}

function canDeleteNode(nodeId: string) {
  return canDeleteCanvasNode(canvasStore.nodes, canvasStore.connections, nodeId)
}

function canDeleteConnection(connectionId: string) {
  const connection = canvasStore.connections.find((candidate) => candidate.id === connectionId)
  return Boolean(connection && isConnectionMutationSupported(canvasStore.nodes, connection))
}

onMounted(() => {
  void nextTick(() => dialogRef.value?.focus({ preventScroll: true }))
})
</script>

<template>
  <aside
    ref="dialogRef"
    class="graph-access-panel"
    role="dialog"
    aria-label="画布内容与快捷键"
    tabindex="-1"
    lang="zh-CN"
  >
    <header>
      <div>
        <strong>画布内容</strong>
        <span>{{ canvasStore.nodes.length }} 个节点 · {{ canvasStore.connections.length }} 条连线</span>
      </div>
      <button type="button" aria-label="关闭画布内容与快捷键" @click="emit('close')">
        <X :size="17" aria-hidden="true" />
      </button>
    </header>

    <section aria-labelledby="canvas-shortcut-heading">
      <h2 id="canvas-shortcut-heading">快捷键</h2>
      <dl class="shortcut-list">
        <div v-for="([key, label]) in shortcuts" :key="key">
          <dt><kbd>{{ key }}</kbd></dt>
          <dd>{{ label }}</dd>
        </div>
      </dl>
    </section>

    <section aria-labelledby="canvas-node-heading">
      <h2 id="canvas-node-heading">节点</h2>
      <p v-if="!canvasStore.nodes.length" class="empty-copy">当前画布没有节点。</p>
      <ul v-else class="graph-list">
        <li v-for="node in canvasStore.nodes" :key="node.id">
          <button
            class="graph-row"
            type="button"
            :aria-pressed="canvasStore.selectedNodeIds.includes(node.id)"
            :aria-label="`选择并定位 ${node.title}`"
            @click="selectAndLocateNode(node.id)"
          >
            <LocateFixed :size="15" aria-hidden="true" />
            <span>
              <strong>{{ node.title }}</strong>
              <small><LockKeyhole v-if="node.isLocked" :size="12" aria-hidden="true" />{{ node.isLocked ? '已锁定 · ' : '' }}{{ nodeTypeLabel(node) }}<template v-if="nodeRuntimeLabel(node.id)"> · {{ nodeRuntimeLabel(node.id) }}</template></small>
            </span>
          </button>
          <button
            v-if="!readonly && canDeleteNode(node.id)"
            class="danger-action"
            type="button"
            :aria-label="`删除节点 ${node.title}`"
            @click="deleteNode(node.id)"
          >
            <Trash2 :size="15" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </section>

    <section aria-labelledby="canvas-connection-heading">
      <h2 id="canvas-connection-heading">连线</h2>
      <p v-if="!canvasStore.connections.length" class="empty-copy">当前画布没有连线。</p>
      <ul v-else class="graph-list">
        <li v-for="connection in canvasStore.connections" :key="connection.id">
          <button
            class="graph-row"
            type="button"
            :aria-pressed="canvasStore.selectedConnectionId === connection.id"
            :aria-label="`查看连线 ${connectionLabel(connection.from, connection.to)}`"
            @click="reviewConnection(connection.id)"
          >
            <Link2 :size="15" aria-hidden="true" />
            <span><strong>{{ connectionLabel(connection.from, connection.to) }}</strong><small>输出 → 输入</small></span>
          </button>
          <button
            v-if="!readonly && canDeleteConnection(connection.id)"
            class="danger-action"
            type="button"
            :aria-label="`删除连线 ${connectionLabel(connection.from, connection.to)}`"
            @click="deleteConnection(connection.id)"
          >
            <Trash2 :size="15" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </section>
  </aside>
</template>

<style scoped lang="scss">
.graph-access-panel {
  position: absolute;
  z-index: 20;
  left: 50%;
  bottom: 96px;
  width: min(400px, calc(100% - 32px));
  max-height: min(620px, calc(100% - 96px));
  overflow: auto;
  padding: 14px;
  border: 1px solid var(--border-standard, var(--border-subtle));
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  background: var(--bg-panel);
  box-shadow: var(--shadow-floating, var(--shadow-soft));
  transform: translateX(-50%);
  overscroll-behavior: contain;
}

.graph-access-panel:focus-visible,
button:focus-visible {
  outline: 2px solid var(--v2-focus-ring, var(--accent-select));
  outline-offset: 2px;
}

header,
header > div,
.graph-row,
.graph-row span {
  display: flex;
}

header {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

header > div,
.graph-row span { flex-direction: column; }
header strong { font-size: 14px; }
header span,
small,
.empty-copy { color: var(--text-secondary); font-size: 12px; }
small { display: flex; align-items: center; gap: 4px; }

h2 {
  margin: 14px 0 8px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.04em;
}

button {
  min-width: 40px;
  min-height: 40px;
  border: 0;
  border-radius: var(--radius-md);
  color: inherit;
  background: transparent;
  cursor: pointer;
  transition: color var(--v2-duration-fast, 120ms), background-color var(--v2-duration-fast, 120ms), transform var(--v2-duration-fast, 120ms);
}

button:active { transform: scale(var(--v2-press-scale, 0.96)); }

.shortcut-list,
.graph-list { margin: 0; padding: 0; }
.shortcut-list > div {
  display: grid;
  grid-template-columns: 112px 1fr;
  align-items: center;
  min-height: 30px;
}
.shortcut-list dt,
.shortcut-list dd { margin: 0; font-size: 12px; }
kbd {
  padding: 3px 7px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  color: var(--text-primary);
  background: var(--bg-panel-subtle);
  font-family: inherit;
  font-size: 11px;
}

.graph-list { list-style: none; }
.graph-list li {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 4px;
}
.graph-row {
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 6px 9px;
  text-align: left;
}
.graph-row span { min-width: 0; }
.graph-row strong,
.graph-row small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.graph-row strong { font-size: 12px; font-weight: 600; }
.graph-row[aria-pressed="true"] { color: var(--v2-accent, var(--accent-select)); background: var(--v2-accent-soft); }
.danger-action { display: grid; place-items: center; }

@media (hover: hover) {
  button:hover { background: var(--bg-panel-subtle); }
  .danger-action:hover { color: var(--danger); }
}

@media (max-width: 720px) {
  .graph-access-panel {
    bottom: max(174px, calc(env(safe-area-inset-bottom) + 158px));
    max-height: calc(100% - 206px);
  }
}
</style>
