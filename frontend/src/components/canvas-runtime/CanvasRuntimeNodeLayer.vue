<script setup lang="ts">
import {
  AudioWaveform,
  Clapperboard,
  FileText,
  Image as ImageIcon,
  ScrollText,
  Sparkles,
  Video,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import {
  CANVAS_PORT_VISUAL_WORLD_SIZE,
  resolveCanvasElasticPortPosition,
  resolveCanvasPortAcquisitionWorldRect,
  resolveCanvasPortRestingPosition,
} from '../canvas/canvas-port-presentation'
import {
  projectRuntimeNode,
  type RuntimeNodeProjection,
} from '../../modules/canvas-runtime/canvas-runtime-node-projection'
import type { PersistedViewport } from '../../modules/canvas/persistence'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import type { CanvasNode } from '../../types/canvas'
import { VISIBLE_ACQUISITION_PORT_KEY } from '../../modules/canvas-runtime/canvas-runtime-geometry'
import { useRuntimeNodeDrag } from './use-runtime-node-drag'
const props = defineProps<{
  nodes: readonly CanvasNode[]
  runtimePresentations: ReadonlyMap<string, GenerationRuntimePresentation>
  selectedNodeId: string
  viewport: PersistedViewport
}>()

const emit = defineEmits<{
  dragNode: [payload: { nodeId: string; x: number; y: number } | null]
  interactionState: [state: 'idle' | 'card-drag' | 'direct-edit' | 'port-drag']
  moveNode: [payload: { nodeId: string; x: number; y: number }]
  openScript: [nodeId: string]
  portDrag: [payload: {
    direction: 'input' | 'output'
    logicalPortId: string | null
    nodeId: string
    phase: 'start' | 'move' | 'end'
    x: number
    y: number
  }]
  portPosition: [payload: {
    direction: 'input' | 'output'
    logicalPortId: string
    nodeId: string
    point: { x: number; y: number } | null
  }]
  selectNode: [nodeId: string]
  updateContent: [payload: { nodeId: string; content: string }]
}>()

const projectedNodes = computed(() => props.nodes.map((node) => (
  projectRuntimeNode(node, props.runtimePresentations.get(node.id) ?? null)
)))
const editingNodeId = ref('')
const editingDraft = ref('')
const videoStates = ref(new Map<string, 'loading' | 'ready' | 'error'>())
const portDragState = ref<{
  direction: 'input' | 'output'
  logicalPortId: string | null
  nodeId: string
  pointerId: number
} | null>(null)
const elasticPortPositions = ref(new Map<string, { x: number; y: number }>())

function portKey(nodeId: string, direction: 'input' | 'output', logicalPortId: string) {
  return `${nodeId}:${direction}:${logicalPortId}`
}

function nodeIcon(kind: ReturnType<typeof projectRuntimeNode>['kind']) {
  if (kind === 'text') return FileText
  if (kind === 'script') return ScrollText
  if (kind === 'image' || kind === 'asset' || kind === 'result') return ImageIcon
  if (kind === 'video') return Video
  if (kind === 'video-composition') return Clapperboard
  if (kind === 'audio') return AudioWaveform
  return Sparkles
}

function worldStyle() {
  return {
    transform: `translate(${props.viewport.x}px, ${props.viewport.y}px) scale(${props.viewport.zoom})`,
  }
}

function beginDirectEdit(projection: RuntimeNodeProjection) {
  if (projection.kind !== 'text') return
  emit('selectNode', projection.node.id)
  editingNodeId.value = projection.node.id
  editingDraft.value = projection.content
  emit('interactionState', 'direct-edit')
}

function commitDirectEdit(projection: RuntimeNodeProjection) {
  if (editingNodeId.value !== projection.node.id) return
  const content = editingDraft.value.trim()
  editingNodeId.value = ''
  emit('interactionState', 'idle')
  if (content !== projection.content.trim()) {
    emit('updateContent', { nodeId: projection.node.id, content })
  }
}

function cancelDirectEdit() {
  editingNodeId.value = ''
  emit('interactionState', 'idle')
}

function setVideoState(nodeId: string, state: 'loading' | 'ready' | 'error') {
  videoStates.value = new Map(videoStates.value).set(nodeId, state)
}

function videoState(nodeId: string) {
  return videoStates.value.get(nodeId) ?? 'loading'
}

const {
  beginCardDrag: beginCardDragFromPointer,
  cancelCardDrag,
  dragState,
  finishCardDrag,
  moveCard,
  nodeStyle,
} = useRuntimeNodeDrag({
  moveNode: (payload) => emit('moveNode', payload),
  selectNode: (nodeId) => emit('selectNode', nodeId),
  setInteractionState: (state) => emit('interactionState', state),
  updateTransientNode: (payload) => emit('dragNode', payload),
  viewport: () => props.viewport,
})

function beginCardDrag(event: PointerEvent, node: CanvasNode) {
  beginCardDragFromPointer(event, node, Boolean(editingNodeId.value))
}
function portAcquisitionStyle(
  node: CanvasNode,
  direction: 'input' | 'output',
  index: number,
  count: number,
) {
  const rect = resolveCanvasPortAcquisitionWorldRect(
    direction,
    { width: Math.max(220, node.width), height: Math.max(140, node.height) },
    index,
    count,
    props.viewport.zoom,
  )
  return {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
}

function visiblePortStyle(
  node: CanvasNode,
  direction: 'input' | 'output',
  logicalPortId: string,
  index: number,
  count: number,
) {
  const nodeSize = { width: Math.max(220, node.width), height: Math.max(140, node.height) }
  const acquisition = resolveCanvasPortAcquisitionWorldRect(
    direction,
    nodeSize,
    index,
    count,
    props.viewport.zoom,
  )
  const elastic = elasticPortPositions.value.get(portKey(node.id, direction, logicalPortId))
  const center = elastic ?? resolveCanvasPortRestingPosition(
    direction,
    nodeSize,
    index,
    count,
  )
  const size = CANVAS_PORT_VISUAL_WORLD_SIZE / props.viewport.zoom
  return {
    left: `${center.x - acquisition.x - size / 2}px`,
    top: `${center.y - acquisition.y - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${12 / props.viewport.zoom}px`,
  }
}

function updateElasticPort(
  event: PointerEvent,
  node: CanvasNode,
  direction: 'input' | 'output',
  logicalPortId: string,
  index: number,
  count: number,
) {
  const article = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-runtime-node]')
  if (!article) return
  const articleRect = article.getBoundingClientRect()
  const pointer = {
    x: (event.clientX - articleRect.left) / props.viewport.zoom,
    y: (event.clientY - articleRect.top) / props.viewport.zoom,
  }
  const position = resolveCanvasElasticPortPosition(
    direction,
    pointer,
    { width: Math.max(220, node.width), height: Math.max(140, node.height) },
    index,
    count,
    props.viewport.zoom,
  )
  if (!position) return
  const key = portKey(node.id, direction, logicalPortId)
  elasticPortPositions.value = new Map(elasticPortPositions.value).set(key, position)
  emit('portPosition', {
    direction,
    logicalPortId,
    nodeId: node.id,
    point: {
      x: articleRect.left + position.x * props.viewport.zoom,
      y: articleRect.top + position.y * props.viewport.zoom,
    },
  })
}

function resetElasticPort(
  nodeId: string,
  direction: 'input' | 'output',
  logicalPortId: string,
) {
  if (portDragState.value?.nodeId === nodeId) return
  const positions = new Map(elasticPortPositions.value)
  positions.delete(portKey(nodeId, direction, logicalPortId))
  elasticPortPositions.value = positions
  emit('portPosition', { direction, logicalPortId, nodeId, point: null })
}

function beginPortDrag(
  event: PointerEvent,
  nodeId: string,
  direction: 'input' | 'output',
  logicalPortId: string | null,
) {
  if (event.button !== 0) return
  const control = event.currentTarget as HTMLElement
  const visible = control.querySelector<HTMLElement>('[data-visible-port]')
  const rect = (visible ?? control).getBoundingClientRect()
  control.setPointerCapture(event.pointerId)
  emit('selectNode', nodeId)
  portDragState.value = { direction, logicalPortId, nodeId, pointerId: event.pointerId }
  emit('interactionState', 'port-drag')
  emit('portDrag', {
    direction,
    logicalPortId,
    nodeId,
    phase: 'start',
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  })
}

function movePortDrag(event: PointerEvent) {
  const drag = portDragState.value
  if (!drag || drag.pointerId !== event.pointerId) return
  emit('portDrag', {
    direction: drag.direction,
    logicalPortId: drag.logicalPortId,
    nodeId: drag.nodeId,
    phase: 'move',
    x: event.clientX,
    y: event.clientY,
  })
}

function finishPortDrag(event: PointerEvent) {
  const drag = portDragState.value
  if (!drag || drag.pointerId !== event.pointerId) return
  emit('portDrag', {
    direction: drag.direction,
    logicalPortId: drag.logicalPortId,
    nodeId: drag.nodeId,
    phase: 'end',
    x: event.clientX,
    y: event.clientY,
  })
  portDragState.value = null
  const positions = new Map(elasticPortPositions.value)
  positions.delete(portKey(drag.nodeId, drag.direction, drag.logicalPortId ?? ''))
  elasticPortPositions.value = positions
  if (drag.logicalPortId) {
    emit('portPosition', {
      direction: drag.direction,
      logicalPortId: drag.logicalPortId,
      nodeId: drag.nodeId,
      point: null,
    })
  }
  emit('interactionState', 'idle')
}
</script>

<template>
  <div class="runtime-node-world" :style="worldStyle()" data-runtime-world>
    <article
      v-for="projection in projectedNodes"
      :key="projection.node.id"
      class="runtime-node"
      :style="nodeStyle(projection.node)"
      :data-runtime-node="projection.node.id"
      :data-node-kind="projection.kind"
      :data-node-ownership="projection.ownership"
      :data-runtime-phase="projection.phase"
      :data-dragging="dragState?.nodeId === projection.node.id ? 'true' : undefined"
      :data-creatable="projection.ownership === 'generated-result' ? 'false' : undefined"
      :data-selected="selectedNodeId === projection.node.id ? 'true' : undefined"
      :aria-label="`${projection.identityTitle}，${projection.identityMeta || projection.bodyLabel}`"
      :tabindex="selectedNodeId === projection.node.id ? 0 : -1"
      @click.stop="emit('selectNode', projection.node.id)"
      @dblclick.stop="beginDirectEdit(projection)"
      @pointerdown.stop="beginCardDrag($event, projection.node)"
      @pointermove.stop="moveCard"
      @pointerup.stop="finishCardDrag"
      @pointercancel.stop="cancelCardDrag"
      @keydown.enter.prevent="emit('selectNode', projection.node.id)"
    >
      <header
        class="runtime-node__identity"
        data-node-identity
        data-node-drag-handle
      >
        <span aria-hidden="true">
          <component :is="nodeIcon(projection.kind)" :size="14" />
        </span>
        <strong>{{ projection.identityTitle }}</strong>
        <small v-if="projection.identityMeta">{{ projection.identityMeta }}</small>
      </header>

      <div
        class="runtime-node__body"
        data-node-body
        :data-media-state="projection.media.kind"
        @dblclick.stop="beginDirectEdit(projection)"
      >
        <textarea
          v-if="editingNodeId === projection.node.id"
          v-model="editingDraft"
          class="runtime-node__direct-editor"
          data-direct-editor
          :aria-label="`编辑 ${projection.identityTitle}`"
          @blur="commitDirectEdit(projection)"
          @click.stop
          @dblclick.stop
          @pointerdown.stop
          @keydown.escape.prevent="cancelDirectEdit"
        ></textarea>
        <img
          v-else-if="projection.media.kind === 'image'"
          :src="projection.media.url"
          :alt="projection.media.label"
        />
        <div
          v-else-if="projection.media.kind === 'video'"
          class="runtime-node__video"
          :data-video-state="videoState(projection.node.id)"
          @click.stop
          @dblclick.stop
          @pointerdown.stop
          @pointermove.stop
          @pointerup.stop
        >
          <video
            :src="projection.media.url"
            :poster="projection.media.poster"
            :aria-label="projection.media.label"
            controls
            playsinline
            preload="metadata"
            @loadstart="setVideoState(projection.node.id, 'loading')"
            @loadeddata="setVideoState(projection.node.id, 'ready')"
            @error="setVideoState(projection.node.id, 'error')"
          >
            {{ projection.media.label }}
          </video>
          <span
            v-if="videoState(projection.node.id) === 'loading'"
            class="runtime-node__video-status"
            role="status"
          >Loading video…</span>
          <a
            v-else-if="videoState(projection.node.id) === 'error'"
            class="runtime-node__video-status"
            :href="projection.media.url"
            target="_blank"
            rel="noreferrer"
            @click.stop
            @pointerdown.stop
          >Video unavailable. Open media.</a>
        </div>
        <div v-else-if="projection.kind === 'script'" class="runtime-node__script-summary">
          <div>
            <ScrollText :size="20" aria-hidden="true" />
            <span>结构化脚本</span>
          </div>
          <p>{{ projection.content || '尚未填写脚本简介。' }}</p>
          <button
            type="button"
            aria-label="打开结构化脚本"
            @click.stop="emit('openScript', projection.node.id)"
            @pointerdown.stop
          >
            打开工作流
          </button>
        </div>
        <div v-else class="runtime-node__placeholder">
          <component :is="nodeIcon(projection.kind)" :size="28" aria-hidden="true" />
          <p>{{ projection.media.label }}</p>
          <span v-if="projection.content">{{ projection.content }}</span>
        </div>
        <div
          v-if="projection.lifecycle && projection.media.kind !== 'video'"
          class="runtime-node__lifecycle"
          data-runtime-lifecycle
          :data-runtime-tone="projection.lifecycle.tone"
        >
          <span>{{ projection.lifecycle.label }}</span>
          <progress
            v-if="projection.lifecycle.progressPercent !== null"
            :value="projection.lifecycle.progressPercent"
            max="100"
          ></progress>
          <span v-else-if="projection.lifecycle.isIndeterminate" aria-hidden="true">•••</span>
        </div>
      </div>
      <button
        v-if="projection.inputPorts.length"
        :key="`input:${VISIBLE_ACQUISITION_PORT_KEY}`"
        type="button"
        class="runtime-node__port-acquisition is-input"
        data-port-acquisition="input"
        :data-logical-port-count="projection.inputPortCount"
        :data-logical-port-ids="projection.inputPorts.map((port) => port.id).join(',')"
        :data-node-id="projection.node.id"
        :style="portAcquisitionStyle(projection.node, 'input', 0, 1)"
        aria-label="输入连接"
        @click.stop
        @pointerenter.stop="updateElasticPort($event, projection.node, 'input', VISIBLE_ACQUISITION_PORT_KEY, 0, 1)"
        @pointerleave.stop="resetElasticPort(projection.node.id, 'input', VISIBLE_ACQUISITION_PORT_KEY)"
        @pointerdown.stop="beginPortDrag($event, projection.node.id, 'input', null)"
        @pointermove.stop="updateElasticPort($event, projection.node, 'input', VISIBLE_ACQUISITION_PORT_KEY, 0, 1); movePortDrag($event)"
        @pointerup.stop="finishPortDrag"
        @pointercancel.stop="finishPortDrag"
      >
        <span
          class="runtime-node__port"
          data-visible-port="input"
          :data-logical-port-count="projection.inputPortCount"
          :data-logical-port-ids="projection.inputPorts.map((port) => port.id).join(',')"
          :data-node-id="projection.node.id"
          :style="visiblePortStyle(projection.node, 'input', VISIBLE_ACQUISITION_PORT_KEY, 0, 1)"
          aria-hidden="true"
        >+</span>
      </button>
      <button
        v-if="projection.outputPorts.length"
        :key="`output:${VISIBLE_ACQUISITION_PORT_KEY}`"
        type="button"
        class="runtime-node__port-acquisition is-output"
        data-port-acquisition="output"
        :data-logical-port-count="projection.outputPortCount"
        :data-logical-port-ids="projection.outputPorts.map((port) => port.id).join(',')"
        :data-node-id="projection.node.id"
        :style="portAcquisitionStyle(projection.node, 'output', 0, 1)"
        aria-label="输出连接"
        @click.stop
        @pointerenter.stop="updateElasticPort($event, projection.node, 'output', VISIBLE_ACQUISITION_PORT_KEY, 0, 1)"
        @pointerleave.stop="resetElasticPort(projection.node.id, 'output', VISIBLE_ACQUISITION_PORT_KEY)"
        @pointerdown.stop="beginPortDrag($event, projection.node.id, 'output', null)"
        @pointermove.stop="updateElasticPort($event, projection.node, 'output', VISIBLE_ACQUISITION_PORT_KEY, 0, 1); movePortDrag($event)"
        @pointerup.stop="finishPortDrag"
        @pointercancel.stop="finishPortDrag"
      >
        <span
          class="runtime-node__port"
          data-visible-port="output"
          :data-logical-port-count="projection.outputPortCount"
          :data-logical-port-ids="projection.outputPorts.map((port) => port.id).join(',')"
          :data-node-id="projection.node.id"
          :style="visiblePortStyle(projection.node, 'output', VISIBLE_ACQUISITION_PORT_KEY, 0, 1)"
          aria-hidden="true"
        >+</span>
      </button>
    </article>
  </div>
</template>

<style scoped lang="scss" src="./canvas-runtime-node-layer.scss"></style>
