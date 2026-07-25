<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { CanvasCardViewModel } from '../../modules/canvas/canvas-card-view-model'
import { resolveCanvasCardGeometry } from '../../modules/canvas/canvas-card-geometry'
import type { CanvasNode } from '../../types/canvas'
import { resolveCanvasRuntimePortGeometry } from './canvas-port-presentation'

const props = defineProps<{
  node: CanvasNode
  readonly: boolean
  viewModel: CanvasCardViewModel
  zoom: number
}>()

const emit = defineEmits<{
  dragStart: [nodeId: string, event: PointerEvent]
  directEdit: [nodeId: string]
  portStart: [nodeId: string, portId: string, direction: 'input' | 'output', event: PointerEvent]
  rename: [nodeId: string, title: string]
  select: [nodeId: string, event: PointerEvent]
}>()

const isRenaming = ref(false)
const titleDraft = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

function canStartDrag() {
  return props.viewModel.state.canDrag && !props.readonly && !props.node.isLocked
}

function handleDragStart(event: PointerEvent) {
  if (!canStartDrag()) return
  emit('dragStart', props.node.id, event)
}

function portStyle(direction: 'input' | 'output', index: number, count: number) {
  const visibleHeight = resolveCanvasCardGeometry(props.node).visible.height
  const geometry = resolveCanvasRuntimePortGeometry(visibleHeight, index, count, props.zoom)
  return {
    left: direction === 'input'
      ? `-${geometry.visualSize / 2}px`
      : `calc(100% - ${geometry.visualSize / 2}px)`,
    top: `calc(${((index + 1) / (count + 1)) * 100}% - ${geometry.visualSize / 2}px)`,
    '--port-acquisition-size': `${geometry.acquisitionSize}px`,
    '--port-visual-size': `${geometry.visualSize}px`,
  }
}

function beginRename() {
  if (!props.viewModel.editability.title) return
  titleDraft.value = props.viewModel.title
  isRenaming.value = true
  void nextTick(() => {
    titleInput.value?.focus({ preventScroll: true })
    titleInput.value?.select()
  })
}

function finishRename() {
  if (!isRenaming.value) return
  isRenaming.value = false
  const title = titleDraft.value.trim()
  if (title && title !== props.viewModel.title) emit('rename', props.node.id, title)
}

function handleTitleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    isRenaming.value = false
  } else if (event.key === 'Enter') {
    event.preventDefault()
    finishRename()
  }
}

function beginDirectEdit() {
  if (!props.viewModel.editability.body || props.readonly || props.node.isLocked) return
  emit('directEdit', props.node.id)
}
</script>

<template>
  <article
    class="canvas-runtime-card"
    :class="[
      `is-${viewModel.visualKind}`,
      `is-${viewModel.state.phase}`,
      { 'is-locked': node.isLocked, 'is-readonly': readonly },
    ]"
    :data-card-state="viewModel.state.phase"
    :data-node-id="node.id"
    :data-ownership="viewModel.ownership"
    :data-title-editable="String(viewModel.editability.title)"
    :data-body-editable="String(viewModel.editability.body)"
    :data-configuration-editable="String(viewModel.editability.configuration)"
    :data-generation-mode="viewModel.configuration.generationMode ?? undefined"
    :data-model-id="viewModel.configuration.modelId ?? undefined"
    @pointerdown.stop="emit('select', node.id, $event)"
  >
    <header
      class="canvas-runtime-card__drag-region"
      :aria-label="`移动 ${viewModel.title}`"
      :aria-disabled="canStartDrag() ? undefined : 'true'"
      @pointerdown.stop="handleDragStart"
    >
      <span class="canvas-runtime-card__type">{{ viewModel.typeLabel }}</span>
      <input
        v-if="isRenaming"
        ref="titleInput"
        v-model="titleDraft"
        class="canvas-runtime-card__title-input"
        :aria-label="`重命名 ${viewModel.title}`"
        @blur="finishRename"
        @keydown="handleTitleKeydown"
        @pointerdown.stop
      />
      <button
        v-else
        type="button"
        class="canvas-runtime-card__title"
        :disabled="!viewModel.editability.title"
        :title="viewModel.editability.title ? '双击重命名' : viewModel.title"
        @dblclick.stop="beginRename"
        @keydown.enter.stop.prevent="beginRename"
        @pointerdown.stop="emit('select', node.id, $event)"
      >{{ viewModel.title }}</button>
      <span
        v-if="viewModel.lifecycle"
        class="canvas-runtime-card__status"
        :class="`is-${viewModel.lifecycle.tone}`"
      >{{ viewModel.lifecycle.label }}</span>
    </header>

    <div class="canvas-runtime-card__body" @dblclick.stop="beginDirectEdit">
      <slot>
        <p v-if="viewModel.body.content">{{ viewModel.body.content }}</p>
        <p v-else class="canvas-runtime-card__empty">尚未添加内容</p>
      </slot>
    </div>

    <button
      v-for="(port, index) in viewModel.ports.input"
      :key="`input-${port.id}`"
      type="button"
      class="canvas-runtime-port is-input"
      :data-port-direction="port.direction"
      :data-port-id="port.id"
      :style="portStyle('input', index, viewModel.ports.input.length)"
      :aria-label="`${viewModel.title} 输入端口 ${port.id}`"
      @pointerdown.stop.prevent="emit('portStart', node.id, port.id, 'input', $event)"
    ><span aria-hidden="true">+</span></button>
    <button
      v-for="(port, index) in viewModel.ports.output"
      :key="`output-${port.id}`"
      type="button"
      class="canvas-runtime-port is-output"
      :data-port-direction="port.direction"
      :data-port-id="port.id"
      :style="portStyle('output', index, viewModel.ports.output.length)"
      :aria-label="`${viewModel.title} 输出端口 ${port.id}`"
      @pointerdown.stop.prevent="emit('portStart', node.id, port.id, 'output', $event)"
    ><span aria-hidden="true">+</span></button>
  </article>
</template>

<style scoped lang="scss">
.canvas-runtime-card {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: visible;
  border: 0;
  border-radius: var(--v2-radius-md);
  outline: 1px solid color-mix(in oklch, var(--canvas-node-outline) 72%, transparent);
  outline-offset: -1px;
  color: var(--v2-text-primary);
  background: color-mix(in oklch, var(--canvas-node-surface) 96%, transparent);
  box-shadow: 0 12px 30px oklch(3% 0.01 292 / 0.18);
  pointer-events: auto;
}

.canvas-runtime-card.is-selected,
.canvas-runtime-card.is-editing,
.canvas-runtime-card.is-composing {
  outline-color: var(--canvas-node-selected-outline);
  box-shadow: 0 0 0 1px color-mix(in oklch, var(--canvas-node-selected-outline) 45%, transparent),
    0 16px 36px var(--canvas-node-selected-shadow);
}

.canvas-runtime-card.is-running,
.canvas-runtime-card.is-submitting { outline-color: var(--v2-accent); }
.canvas-runtime-card.is-failed { outline-color: var(--danger); }
.canvas-runtime-card.is-locked,
.canvas-runtime-card.is-readonly { cursor: default; }

.canvas-runtime-card__drag-region {
  display: flex;
  box-sizing: border-box;
  height: calc(42px * var(--canvas-surface-zoom, 1));
  align-items: center;
  gap: calc(8px * var(--canvas-surface-zoom, 1));
  padding: calc(8px * var(--canvas-surface-zoom, 1)) calc(12px * var(--canvas-surface-zoom, 1));
  border-bottom: 1px solid color-mix(in oklch, var(--border-subtle) 72%, transparent);
  border-radius: var(--v2-radius-md) var(--v2-radius-md) 0 0;
  background: color-mix(in oklch, var(--canvas-node-surface) 90%, var(--bg-panel-raised));
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.canvas-runtime-card__drag-region:active { cursor: grabbing; }
.canvas-runtime-card.is-locked .canvas-runtime-card__drag-region,
.canvas-runtime-card.is-readonly .canvas-runtime-card__drag-region,
.canvas-runtime-card__drag-region[aria-disabled="true"] { cursor: default; }
.canvas-runtime-card__type { flex: none; color: var(--v2-text-muted); font-size: calc(10px * var(--canvas-surface-zoom, 1)); font-weight: 700; letter-spacing: .04em; }
.canvas-runtime-card__title {
  min-width: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  font-size: calc(13px * var(--canvas-surface-zoom, 1));
  font-weight: 650;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.canvas-runtime-card__title:disabled { opacity: 1; }
.canvas-runtime-card__title-input {
  min-width: 0;
  height: calc(26px * var(--canvas-surface-zoom, 1));
  flex: 1;
  border: 1px solid var(--v2-accent);
  border-radius: var(--v2-radius-sm);
  color: inherit;
  background: var(--bg-panel);
  font: inherit;
  font-size: calc(13px * var(--canvas-surface-zoom, 1));
  font-weight: 650;
}
.canvas-runtime-card__status { margin-left: auto; color: var(--v2-text-muted); font-size: calc(10px * var(--canvas-surface-zoom, 1)); white-space: nowrap; }
.canvas-runtime-card__status.is-progress { color: var(--v2-accent-hover); }
.canvas-runtime-card__status.is-success { color: var(--success); }
.canvas-runtime-card__status.is-danger { color: var(--danger); }
.canvas-runtime-card__body {
  position: absolute;
  inset: calc(42px * var(--canvas-surface-zoom, 1)) 0 0;
  box-sizing: border-box;
  min-height: 0;
  overflow: hidden;
  border-radius: 0 0 var(--v2-radius-md) var(--v2-radius-md);
}
.canvas-runtime-card__body:has(> .script-empty-state) { overflow: visible; }
.canvas-runtime-card__body > p { margin: 0; padding: calc(14px * var(--canvas-surface-zoom, 1)); color: var(--v2-text-secondary); font-size: calc(13px * var(--canvas-surface-zoom, 1)); line-height: 1.55; white-space: pre-wrap; }
.canvas-runtime-card__body > .canvas-runtime-card__empty { color: var(--v2-text-muted); }
.canvas-runtime-port {
  position: absolute;
  z-index: 8;
  display: grid;
  box-sizing: border-box;
  width: var(--port-visual-size, 20px);
  height: var(--port-visual-size, 20px);
  padding: 0;
  place-items: center;
  border: 2px solid var(--canvas-port-outline);
  border-radius: 50%;
  color: var(--canvas-port-outline);
  background: var(--canvas-port-idle-fill);
  font: inherit;
  font-size: min(15px, var(--port-visual-size, 20px));
  line-height: 1;
  cursor: crosshair;
}
.canvas-runtime-port::before {
  position: absolute;
  width: var(--port-acquisition-size, 80px);
  height: var(--port-acquisition-size, 80px);
  border-radius: 50%;
  content: '';
}
.canvas-runtime-port span { transform: translateY(-1px); }
.canvas-runtime-port:hover,
.canvas-runtime-port:focus-visible {
  border-color: var(--accent-select);
  color: white;
  background: var(--accent-select);
  outline: none;
  transform: scale(1.08);
}

@media (prefers-reduced-motion: no-preference) {
  .canvas-runtime-card,
  .canvas-runtime-port { transition: border-color 120ms ease-out, box-shadow 120ms ease-out, transform 120ms ease-out; }
}
</style>
