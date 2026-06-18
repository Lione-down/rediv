<script setup lang="ts">
import { Hand, Image, MousePointer2, Plus, Sparkles, Type } from '@lucide/vue'
import { useCanvasStore } from '../../store/canvas'

const canvasStore = useCanvasStore()

const tools = [
  { key: 'select', label: '选择', icon: MousePointer2 },
  { key: 'hand', label: '移动', icon: Hand },
  { key: 'text', label: '文本', icon: Type },
  { key: 'image', label: '图片', icon: Image },
  { key: 'generate', label: '生成', icon: Sparkles },
] as const

function nodeCenter(nodeId: string) {
  const node = canvasStore.nodes.find((item) => item.id === nodeId)

  if (!node) return { x: 0, y: 0 }

  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  }
}
</script>

<template>
  <section class="workspace-stage" aria-label="Revid 无限画布工作区">
    <aside class="tool-rail" aria-label="画布工具">
      <button
        v-for="tool in tools"
        :key="tool.key"
        class="tool-button focus-ring"
        :class="{ active: canvasStore.mode === tool.key }"
        type="button"
        :aria-label="tool.label"
        :aria-pressed="canvasStore.mode === tool.key"
        @click="canvasStore.setMode(tool.key)"
      >
        <component :is="tool.icon" :size="19" />
      </button>
    </aside>

    <div class="canvas-surface">
      <svg class="connection-layer" aria-hidden="true">
        <path
          v-for="connection in canvasStore.connections"
          :key="connection.id"
          :class="{ active: connection.active }"
          :d="`M ${nodeCenter(connection.from).x} ${nodeCenter(connection.from).y} C ${nodeCenter(connection.from).x + 110} ${nodeCenter(connection.from).y}, ${nodeCenter(connection.to).x - 110} ${nodeCenter(connection.to).y}, ${nodeCenter(connection.to).x} ${nodeCenter(connection.to).y}`"
        />
      </svg>

      <article
        v-for="node in canvasStore.nodes"
        :key="node.id"
        class="canvas-node"
        :class="[node.type, { selected: canvasStore.selectedNodeId === node.id, running: node.status === 'running' }]"
        :style="{ left: `${node.x}px`, top: `${node.y}px`, width: `${node.width}px`, minHeight: `${node.height}px` }"
        tabindex="0"
        @click="canvasStore.selectNode(node.id)"
        @keydown.enter="canvasStore.selectNode(node.id)"
      >
        <button class="node-port left focus-ring" type="button" aria-label="连接到上游节点">
          <Plus :size="14" />
        </button>
        <header>
          <span>{{ node.type }}</span>
          <strong>{{ node.title }}</strong>
        </header>
        <p>{{ node.content }}</p>
        <button class="node-port right focus-ring" type="button" aria-label="连接到下游节点">
          <Plus :size="14" />
        </button>
      </article>

      <div class="minimap" aria-label="小地图">
        <span v-for="node in canvasStore.nodes" :key="node.id" :style="{ left: `${node.x / 9}px`, top: `${node.y / 7}px` }" />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.workspace-stage {
  position: relative;
  min-height: calc(100dvh - 56px);
  overflow: hidden;
  background:
    linear-gradient(oklch(88% 0.006 92 / 0.36) 1px, transparent 1px),
    linear-gradient(90deg, oklch(88% 0.006 92 / 0.36) 1px, transparent 1px),
    radial-gradient(circle at 45% 42%, oklch(91% 0.025 175 / 0.62), transparent 34%),
    var(--bg-canvas);
  background-size: 28px 28px, 28px 28px, auto, auto;
}

.tool-rail {
  position: absolute;
  top: 22px;
  left: 22px;
  z-index: 5;
  display: grid;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: oklch(100% 0.004 92 / 0.78);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(16px);
}

.tool-button {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 0;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  background: transparent;
}

.tool-button:hover,
.tool-button.active {
  color: var(--text-primary);
  background: oklch(58% 0.115 252 / 0.12);
}

.canvas-surface {
  position: relative;
  width: 1440px;
  height: 760px;
  transform-origin: left top;
}

.connection-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

path {
  fill: none;
  stroke: oklch(37% 0.014 245 / 0.5);
  stroke-width: 1.6;
}

path.active {
  stroke: var(--accent-select);
  stroke-dasharray: 8 10;
  animation: dash 1.4s linear infinite;
}

.canvas-node {
  position: absolute;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px;
  color: var(--text-primary);
  background: oklch(100% 0.004 92 / 0.9);
  box-shadow: 0 18px 42px oklch(24% 0.02 245 / 0.1);
}

.canvas-node.selected {
  border-color: var(--accent-select);
  box-shadow: 0 0 0 3px oklch(58% 0.115 252 / 0.14), 0 18px 42px oklch(24% 0.02 245 / 0.1);
}

.canvas-node.running {
  border-color: var(--accent-generate);
}

.canvas-node header {
  display: grid;
  gap: 2px;
}

.canvas-node span {
  color: var(--text-muted);
  font-size: 11px;
  text-transform: uppercase;
}

.canvas-node strong {
  font-size: 15px;
}

.canvas-node p {
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.55;
}

.node-port {
  position: absolute;
  top: 50%;
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  transform: translateY(-50%);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  color: var(--text-muted);
  background: white;
  opacity: 0;
}

.canvas-node:hover .node-port,
.canvas-node.selected .node-port {
  opacity: 1;
}

.node-port.left {
  left: -12px;
}

.node-port.right {
  right: -12px;
}

.minimap {
  position: fixed;
  right: 22px;
  bottom: 22px;
  width: 160px;
  height: 104px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: oklch(100% 0.004 92 / 0.76);
  box-shadow: var(--shadow-soft);
}

.minimap span {
  position: absolute;
  width: 14px;
  height: 10px;
  border-radius: 3px;
  background: var(--accent-select);
}

@keyframes dash {
  to {
    stroke-dashoffset: -36;
  }
}

@media (max-width: 720px) {
  .tool-rail {
    top: auto;
    right: 12px;
    bottom: 14px;
    left: 12px;
    display: flex;
    justify-content: center;
  }

  .canvas-surface {
    transform: scale(0.72);
  }

  .minimap {
    display: none;
  }
}
</style>
