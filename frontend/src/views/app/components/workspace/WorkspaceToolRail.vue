<script setup lang="ts">
import type { Component } from 'vue'
import { Hand, Image as ImageIcon, MousePointer2, Sparkles, Type } from 'lucide-vue-next'

type ToolKey = 'select' | 'hand' | 'text' | 'image' | 'generate'

interface ToolItem {
  key: ToolKey
  label: string
  icon: Component
}

interface Props {
  activeTool: ToolKey
  onToolChange: (tool: ToolKey) => void
  onTogglePanel?: () => void
}

const props = defineProps<Props>()

const tools: ToolItem[] = [
  { key: 'select', label: '选择', icon: MousePointer2 },
  { key: 'hand', label: '移动', icon: Hand },
  { key: 'text', label: '文本', icon: Type },
  { key: 'image', label: '图片', icon: ImageIcon },
  { key: 'generate', label: '生成', icon: Sparkles },
]
</script>

<template>
  <nav class="tool-rail" aria-label="画布工具">
    <button
      v-for="tool in tools"
      :key="tool.key"
      class="tool-button focus-ring"
      :class="{ active: props.activeTool === tool.key }"
      type="button"
      :title="tool.label"
      :aria-label="tool.label"
      :aria-pressed="props.activeTool === tool.key"
      @click="props.onToolChange(tool.key)"
    >
      <component :is="tool.icon" :size="18" />
    </button>
  </nav>
</template>

<style scoped lang="scss">
.tool-rail {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 76px;
  z-index: 10;
  display: grid;
  align-content: start;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-2);
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-panel);
}

.tool-button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  background: transparent;
  transition:
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.tool-button:hover,
.tool-button.active {
  color: var(--text-primary);
  background: oklch(58% 0.115 252 / 0.12);
}

.tool-button:active {
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .tool-button {
    transition: color 0s ease, background-color 0s ease, box-shadow 0s ease, transform 0s ease;
  }

  .tool-button:active {
    transform: none;
  }
}
</style>
