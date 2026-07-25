<script setup lang="ts">
import CanvasRuntimeNodeLayer from './CanvasRuntimeNodeLayer.vue'
import CanvasRuntimeAttachedSurfaces from './CanvasRuntimeAttachedSurfaces.vue'
import CanvasRuntimeScriptWorkspace from './CanvasRuntimeScriptWorkspace.vue'
import CanvasRuntimeEdgeLayer from './CanvasRuntimeEdgeLayer.vue'
import CanvasRuntimeContinuationMenu from './CanvasRuntimeContinuationMenu.vue'
import CanvasRuntimeChrome from './CanvasRuntimeChrome.vue'
import CanvasRuntimeContextMenu from './CanvasRuntimeContextMenu.vue'
import CanvasRuntimeMinimap from './CanvasRuntimeMinimap.vue'
import {
  useRuntimeCanvasShell,
  type RuntimeContextToolId,
} from './use-runtime-canvas-shell'
import { computed, ref } from 'vue'
import type { PersistedViewport } from '../../modules/canvas/persistence'
import type { CanvasCardConfigurationSnapshot } from '../../modules/canvas/canvas-card-configuration'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import type {
  GenerationNodeParameters,
  ResolvedGenerationRequestContext,
} from '../../modules/canvas/generation-parameters'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import type { CanvasMetadataDto } from '../../modules/canvas/types'
import type { ProjectAsset } from '../../modules/canvas/project-resource-types'
import { buildCanvasCardViewModel } from '../../modules/canvas/canvas-card-view-model'
import {
  resolveConnectionContinuationOptions,
  type ConnectionContinuationDirection,
  type ConnectionContinuationOption,
} from '../../modules/canvas/connection-continuation'
import { resolveVisibleAcquisitionConnectionPorts } from '../../modules/canvas/node-registry'

export type ReplacementCanvasView = 'workflow' | 'storyboard'
export interface ReplacementModelOption {
  id: string
  label: string
}
const props = defineProps<{
  accountName: string
  allowedAudioModelCount: number
  assets: readonly ProjectAsset[]
  canRedo: boolean
  canUndo: boolean
  canvasCount: number
  canvasName: string
  canvases: readonly CanvasMetadataDto[]
  connections: readonly CanvasConnection[]
  documentReady: boolean
  generationContext: ResolvedGenerationRequestContext | null
  modelOptions: readonly ReplacementModelOption[]
  nodes: readonly CanvasNode[]
  projectName: string
  selectedNodeId: string
  syncLabel: string
  runtimePresentations: ReadonlyMap<string, GenerationRuntimePresentation>
  viewport: PersistedViewport
  viewMode: ReplacementCanvasView
}>()

const emit = defineEmits<{
  clearSelection: []
  connectNodes: [payload: {
    sourceNodeId: string
    sourcePort?: string
    targetNodeId: string
    targetPort?: string
  }]
  continueConnection: [payload: {
    direction: ConnectionContinuationDirection
    option: ConnectionContinuationOption
    originNodeId: string
    point: { x: number; y: number }
  }]
  openActions: [payload: { opener: HTMLElement; query: string }]
  createNode: [toolId: RuntimeContextToolId, point?: { x: number; y: number }]
  generate: []
  redo: []
  selectNode: [nodeId: string]
  switchCanvas: [canvasId: string]
  moveNode: [payload: { nodeId: string; x: number; y: number }]
  updateViewport: [viewport: PersistedViewport]
  updatePrompt: [payload: { nodeId: string; prompt: string }]
  updateConfiguration: [payload: {
    configuration: CanvasCardConfigurationSnapshot
    nodeId: string
  }]
  updateGenerationParameters: [parameters: GenerationNodeParameters]
  'update:viewMode': [mode: ReplacementCanvasView]
  undo: []
}>()

const visibleNodes = computed(() => props.nodes.filter((node) => node.type !== 'result'))
const transientNodePositions = ref(new Map<string, { x: number; y: number }>())
const edgeNodes = computed(() => visibleNodes.value.map((node) => {
  const transient = transientNodePositions.value.get(node.id)
  return transient ? { ...node, ...transient } : node
}))
const selectedNode = computed(() => (
  edgeNodes.value.find((node) => node.id === props.selectedNodeId) ?? null
))
const interactionState = ref<
  'idle' | 'card-drag' | 'canvas-pan' | 'direct-edit' | 'port-drag'
>('idle')
const draftEdge = ref<{
  current: { x: number; y: number }
  start: { x: number; y: number }
} | null>(null)
const elasticPortPositions = ref(new Map<string, { x: number; y: number }>())
const scriptWorkspaceNodeId = ref('')
const lastPortDrop = ref('none')
const continuation = ref<{
  direction: ConnectionContinuationDirection
  options: ConnectionContinuationOption[]
  originNodeId: string
  point: { x: number; y: number }
  position: { left: number; top: number }
} | null>(null)
const scriptWorkspaceNode = computed(() => (
  props.nodes.find((node) => node.id === scriptWorkspaceNodeId.value) ?? null
))

function updateDraggedNode(payload: { nodeId: string; x: number; y: number } | null) {
  if (!payload) {
    transientNodePositions.value = new Map()
    return
  }
  transientNodePositions.value = new Map(transientNodePositions.value)
    .set(payload.nodeId, { x: payload.x, y: payload.y })
}

function setNodeInteractionState(state: 'idle' | 'card-drag' | 'direct-edit' | 'port-drag') {
  interactionState.value = state
}

function updatePortPosition(payload: {
  direction: 'input' | 'output'
  logicalPortId: string
  nodeId: string
  point: { x: number; y: number } | null
}) {
  const positions = new Map(elasticPortPositions.value)
  const key = `${payload.nodeId}:${payload.direction}:${payload.logicalPortId}`
  if (payload.point) positions.set(key, payload.point)
  else positions.delete(key)
  elasticPortPositions.value = positions
}

function updateDirectContent(payload: { nodeId: string; content: string }) {
  emit('updatePrompt', { nodeId: payload.nodeId, prompt: payload.content })
}

function openScriptWorkspace(nodeId: string) {
  emit('selectNode', nodeId)
  scriptWorkspaceNodeId.value = nodeId
}

function acquirePortDropTarget(
  x: number,
  y: number,
  direction: 'input' | 'output',
  originNodeId: string,
) {
  const oppositeDirection = direction === 'output' ? 'input' : 'output'
  return [...document.querySelectorAll<HTMLElement>(
    `[data-visible-port="${oppositeDirection}"]`,
  )]
    .filter((candidate) => candidate.dataset.nodeId !== originNodeId)
    .map((candidate) => {
      const rect = candidate.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      return {
        candidate,
        distance: Math.hypot(centerX - x, centerY - y),
        radius: Math.max(28, Math.max(rect.width, rect.height) * 1.5),
      }
    })
    .filter(({ distance, radius }) => distance <= radius)
    .sort((left, right) => left.distance - right.distance)[0]?.candidate ?? null
}

function continuationOptions(
  node: CanvasNode,
  direction: ConnectionContinuationDirection,
) {
  const card = buildCanvasCardViewModel(node)
  const ports = direction === 'downstream' ? card.outputPorts : card.inputPorts
  const unique = new Map<string, ConnectionContinuationOption>()
  for (const port of ports) {
    for (const option of resolveConnectionContinuationOptions(node, port.id, direction)) {
      if (option.subtype === 'audio' && props.allowedAudioModelCount === 0) continue
      unique.set(option.key, option)
    }
  }
  return [...unique.values()]
}

function openContinuation(payload: {
  direction: 'input' | 'output'
  nodeId: string
  x: number
  y: number
}) {
  const origin = props.nodes.find((node) => node.id === payload.nodeId)
  if (!origin) return
  const direction: ConnectionContinuationDirection = payload.direction === 'output'
    ? 'downstream'
    : 'upstream'
  const options = continuationOptions(origin, direction)
  if (!options.length) return
  continuation.value = {
    direction,
    options,
    originNodeId: origin.id,
    point: {
      x: (payload.x - props.viewport.x) / props.viewport.zoom,
      y: (payload.y - props.viewport.y) / props.viewport.zoom,
    },
    position: {
      left: Math.min(Math.max(16, payload.x + 12), window.innerWidth - 280),
      top: Math.min(Math.max(76, payload.y - 24), window.innerHeight - 360),
    },
  }
}

function chooseContinuation(option: ConnectionContinuationOption) {
  const state = continuation.value
  if (!state) return
  emit('continueConnection', {
    direction: state.direction,
    option,
    originNodeId: state.originNodeId,
    point: state.point,
  })
  continuation.value = null
}

function handlePortDrag(payload: {
  direction: 'input' | 'output'
  logicalPortId: string | null
  nodeId: string
  phase: 'start' | 'move' | 'end'
  x: number
  y: number
}) {
  if (payload.phase === 'start') {
    draftEdge.value = {
      start: { x: payload.x, y: payload.y },
      current: { x: payload.x, y: payload.y },
    }
    interactionState.value = 'port-drag'
    return
  }
  if (payload.phase === 'move' && draftEdge.value) {
    draftEdge.value = {
      ...draftEdge.value,
      current: { x: payload.x, y: payload.y },
    }
    return
  }
  const target = acquirePortDropTarget(
    payload.x,
    payload.y,
    payload.direction,
    payload.nodeId,
  )
  const targetNodeId = target?.dataset.nodeId
  const targetDirection = target?.dataset.visiblePort
  lastPortDrop.value = targetNodeId && targetDirection
    ? `${payload.nodeId}:${payload.direction}->${targetNodeId}:${targetDirection}`
    : 'miss'
  if (
    targetNodeId &&
    targetNodeId !== payload.nodeId &&
    targetDirection &&
    targetDirection !== payload.direction
  ) {
    const sourceNodeId = payload.direction === 'output' ? payload.nodeId : targetNodeId
    const targetConnectionNodeId = payload.direction === 'output' ? targetNodeId : payload.nodeId
    const sourceNode = props.nodes.find((node) => node.id === sourceNodeId)
    const targetNode = props.nodes.find((node) => node.id === targetConnectionNodeId)
    const ports = sourceNode && targetNode
      ? resolveVisibleAcquisitionConnectionPorts(sourceNode, targetNode)
      : null
    if (ports) {
      emit('connectNodes', {
        sourceNodeId,
        sourcePort: ports.sourcePort,
        targetNodeId: targetConnectionNodeId,
        targetPort: ports.targetPort,
      })
      continuation.value = null
    } else {
      lastPortDrop.value = 'incompatible'
    }
  } else {
    openContinuation(payload)
  }
  draftEdge.value = null
  interactionState.value = 'idle'
}

const {
  beginCanvasPan,
  changeZoom,
  contextMenu,
  createNodeFromContext,
  finishCanvasPan,
  fitAll,
  handleCanvasWheel,
  moveCanvas,
  openCanvasContextMenu,
  zoomPercent,
} = useRuntimeCanvasShell({
  clearSelection: () => emit('clearSelection'),
  createNode: (toolId, point) => emit('createNode', toolId, point),
  nodes: () => visibleNodes.value,
  setInteractionState: (state) => { interactionState.value = state },
  updateViewport: (viewport) => emit('updateViewport', viewport),
  viewport: () => props.viewport,
})

</script>

<template>
  <section
    class="replacement-runtime"
    data-canvas-runtime="replacement"
    :data-runtime-state="documentReady ? 'ready' : 'loading'"
    :data-interaction-state="interactionState"
    :data-last-port-drop="lastPortDrop"
    aria-label="Revid Canvas"
  >
    <div
      v-show="viewMode === 'workflow'"
      class="replacement-runtime__world"
      data-canvas-world
      aria-label="画布世界"
      @pointerdown="beginCanvasPan"
      @pointermove="moveCanvas"
      @pointerup="finishCanvasPan"
      @pointercancel="finishCanvasPan"
      @contextmenu="openCanvasContextMenu"
      @wheel="handleCanvasWheel"
    >
      <div class="replacement-runtime__origin" aria-hidden="true"></div>
      <CanvasRuntimeEdgeLayer
        :connections="connections"
        :draft="draftEdge"
        :nodes="edgeNodes"
        :port-positions="elasticPortPositions"
        :selected-node-id="selectedNodeId"
        :viewport="viewport"
      />
      <CanvasRuntimeMinimap
        :nodes="edgeNodes"
        :selected-node-id="selectedNodeId"
        :viewport="viewport"
        @update-viewport="emit('updateViewport', $event)"
      />
      <CanvasRuntimeNodeLayer
        :nodes="visibleNodes"
        :runtime-presentations="runtimePresentations"
        :selected-node-id="selectedNodeId"
        :viewport="viewport"
        @drag-node="updateDraggedNode"
        @interaction-state="setNodeInteractionState"
        @move-node="emit('moveNode', $event)"
        @open-script="openScriptWorkspace"
        @port-drag="handlePortDrag"
        @port-position="updatePortPosition"
        @select-node="emit('selectNode', $event)"
        @update-content="updateDirectContent"
      />
    </div>

    <section
      v-if="viewMode === 'storyboard'"
      class="replacement-runtime__storyboard"
      data-runtime-storyboard
      aria-label="故事板"
    >
      <header>
        <span>Storyboard</span>
        <strong>{{ canvasName }}</strong>
        <small>{{ nodes.length }} 个内容节点</small>
      </header>
      <div class="replacement-runtime__storyboard-track">
        <article
          v-for="(node, index) in visibleNodes.filter(candidate => candidate.type !== 'group')"
          :key="node.id"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <strong>{{ node.title }}</strong>
            <p>{{ node.content || '等待内容' }}</p>
          </div>
        </article>
      </div>
    </section>

    <CanvasRuntimeAttachedSurfaces
      v-if="selectedNode"
      :node="selectedNode"
      :generation-context="generationContext"
      :model-options="modelOptions"
      :runtime-presentation="runtimePresentations.get(selectedNode.id) ?? null"
      :viewport="viewport"
      @generate="emit('generate')"
      @open-actions="emit('openActions', $event)"
      @update-configuration="emit('updateConfiguration', $event)"
      @update-generation-parameters="emit('updateGenerationParameters', $event)"
      @update-prompt="emit('updatePrompt', $event)"
    />

    <CanvasRuntimeScriptWorkspace
      v-if="scriptWorkspaceNode"
      :node="scriptWorkspaceNode"
      @close="scriptWorkspaceNodeId = ''"
    />

    <CanvasRuntimeContinuationMenu
      v-if="continuation"
      :direction="continuation.direction"
      :options="continuation.options"
      :position="continuation.position"
      @close="continuation = null"
      @select="chooseContinuation"
    />

    <CanvasRuntimeContextMenu
      v-if="contextMenu"
      :allowed-audio-model-count="allowedAudioModelCount"
      :can-redo="canRedo"
      :can-undo="canUndo"
      :position="contextMenu.position"
      @close="contextMenu = null"
      @create-node="createNodeFromContext"
      @fit-all="contextMenu = null; fitAll()"
      @redo="contextMenu = null; emit('redo')"
      @undo="contextMenu = null; emit('undo')"
    />

    <CanvasRuntimeChrome
      :account-name="accountName"
      :allowed-audio-model-count="allowedAudioModelCount"
      :assets="assets"
      :can-redo="canRedo"
      :can-undo="canUndo"
      :canvas-count="canvasCount"
      :canvas-name="canvasName"
      :canvases="canvases"
      :document-ready="documentReady"
      :project-name="projectName"
      :sync-label="syncLabel"
      :view-mode="viewMode"
      :zoom-percent="zoomPercent"
      @change-zoom="changeZoom"
      @create-node="emit('createNode', $event)"
      @fit-all="fitAll"
      @open-assist="emit('openActions', { opener: $event, query: '' })"
      @redo="emit('redo')"
      @switch-canvas="emit('switchCanvas', $event)"
      @undo="emit('undo')"
      @update-view-mode="emit('update:viewMode', $event)"
    />
  </section>
</template>

<style lang="scss" src="./canvas-replacement-runtime.scss"></style>
