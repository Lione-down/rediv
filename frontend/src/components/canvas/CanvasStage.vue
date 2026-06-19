<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { useCanvasStore } from '../../store/canvas'

const canvasStore = useCanvasStore()

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
        <span
          v-for="node in canvasStore.nodes"
          :key="node.id"
          :style="{ left: `${node.x / 9}px`, top: `${node.y / 7}px` }"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.workspace-stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background:
    linear-gradient(oklch(88% 0.006 92 / 0.45) 1px, transparent 1px),
    linear-gradient(90deg, oklch(88% 0.006 92 / 0.45) 1px, transparent 1px),
    radial-gradient(circle at 42% 38%, oklch(92% 0.024 175 / 0.46), transparent 33%),
    var(--bg-canvas);
  background-size: 24px 24px, 24px 24px, auto, auto;
}

.canvas-surface {
  position: relative;
  width: max(100%, 1440px);
  min-width: 100%;
  height: 100%;
  min-height: 760px;
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
  stroke: oklch(37% 0.014 245 / 0.44);
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
  background: oklch(100% 0.004 92 / 0.92);
  box-shadow: 0 18px 42px oklch(24% 0.02 245 / 0.1);
  transition:
    box-shadow 120ms ease,
    border-color 120ms ease,
    transform 120ms ease,
    opacity 120ms ease;
}

.canvas-node:hover {
  transform: translateY(-1px);
}

.canvas-node.selected {
  border: 2px solid var(--accent-select);
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
  transition:
    opacity 120ms ease,
    background-color 120ms ease,
    color 120ms ease,
    transform 120ms ease;
}

.canvas-node:hover .node-port,
.canvas-node.selected .node-port {
  opacity: 1;
}

.node-port:active {
  transform: translateY(-50%) scale(0.96);
}

.node-port.left {
  left: -12px;
}

.node-port.right {
  right: -12px;
}

.minimap {
  position: absolute;
  right: 20px;
  bottom: 20px;
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

@media (max-width: 920px) {
  .canvas-surface {
    min-height: calc(100dvh - 260px);
  }

  .minimap {
    right: 14px;
    bottom: 14px;
    width: 128px;
    height: 86px;
  }
}

@media (max-width: 720px) {
  .canvas-surface {
    width: max(100%, 1180px);
    min-height: calc(100dvh - 280px);
  }

  .minimap {
    display: none;
  }
}
</style>
