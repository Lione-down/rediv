<script setup lang="ts">
import CanvasRuntimeNodeLayer from './CanvasRuntimeNodeLayer.vue'
import CanvasRuntimeAttachedSurfaces from './CanvasRuntimeAttachedSurfaces.vue'
import CanvasRuntimeScriptWorkspace from './CanvasRuntimeScriptWorkspace.vue'
import CanvasRuntimeEdgeLayer from './CanvasRuntimeEdgeLayer.vue'
import CanvasRuntimeContinuationMenu from './CanvasRuntimeContinuationMenu.vue'
import CanvasRuntimeChrome from './CanvasRuntimeChrome.vue'
import CanvasRuntimeContextMenu from './CanvasRuntimeContextMenu.vue'
import CanvasRuntimeMinimap from './CanvasRuntimeMinimap.vue'
import CanvasRuntimeSelectionHull from './CanvasRuntimeSelectionHull.vue'
import {
  useRuntimeCanvasShell,
  type RuntimeContextToolId,
} from './use-runtime-canvas-shell'
import { computed, ref, watch } from 'vue'
import { useRuntimeMarqueeSelection } from './use-runtime-marquee-selection'
import { useRuntimeConnectionDrag } from './use-runtime-connection-drag'
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
import { resolveCanvasDragNodeIds } from '../../modules/canvas/canvas-drag-resolution'
import { canDeleteCanvasNode } from '../../modules/canvas/canvas-commands'
import { isNodeGroupContainer } from '../../modules/canvas/node-registry'
import {
  resolveConnectionContinuationOptions,
  resolveMultiConnectionContinuationOptions,
  type ConnectionContinuationDirection,
  type ConnectionContinuationOption,
} from '../../modules/canvas/connection-continuation'
import type { ScriptGenerationSubmission } from '../canvas/composables/use-canvas-script-generation'
import type {
  ScriptAuthoringCapabilities,
  StoryAssetEditableField,
  StoryShotEditableField,
} from '../../modules/canvas/script-authoring'
import type { StoryShotBatchOptions } from '../../modules/canvas/story-shot-generation'

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
  generationQuota: number
  modelOptions: readonly ReplacementModelOption[]
  nodes: readonly CanvasNode[]
  projectName: string
  selectedNodeId: string
  syncLabel: string
  runtimePresentations: ReadonlyMap<string, GenerationRuntimePresentation>
  scriptActive: boolean
  scriptCapability: ScriptAuthoringCapabilities | null
  scriptCapabilityError: string
  scriptCapabilityLoading: boolean
  scriptError: string
  scriptQuota: number
  scriptSuccess: string
  viewport: PersistedViewport
  viewMode: ReplacementCanvasView
  selectedNodeIds: readonly string[]
}>()

const scriptActiveNodeId = ref('')

const emit = defineEmits<{
  addScriptShot: [nodeId: string]
  createScriptGenerationBatch: [payload: {
    nodeId: string
    options: StoryShotBatchOptions
    shotIds: string[]
  }]
  deleteScriptShot: [payload: { nodeId: string; shotId: string }]
  setScriptPromptsConfirmed: [payload: {
    confirmed: boolean
    nodeId: string
    shotIds: string[]
  }]
  setScriptShotsConfirmed: [payload: { confirmed: boolean; nodeId: string }]
  updateScriptAsset: [payload: {
    assetId: string
    field: StoryAssetEditableField
    nodeId: string
    value: string
  }]
  updateScriptShot: [payload: {
    field: StoryShotEditableField
    nodeId: string
    shotId: string
    value: string | number
  }]
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
    originNodeIds: string[]
    point: { x: number; y: number }
  }]
  openActions: [payload: { opener: HTMLElement; query: string }]
  openTemplates: [opener: HTMLElement]
  createNode: [toolId: RuntimeContextToolId, point?: { x: number; y: number }]
  deleteSelection: [source: 'keyboard' | 'context-menu']
  generate: []
  cancelScript: []
  generateScript: [submission: ScriptGenerationSubmission]
  groupSelection: []
  redo: []
  retryScriptCapability: []
  selectNode: [payload: { nodeId: string; mode: 'replace' | 'toggle' | 'add' }]
  setSelection: [nodeIds: string[]]
  switchCanvas: [canvasId: string]
  ungroupSelection: []
  moveNode: [payload: { nodeId: string; x: number; y: number }]
  moveSelection: [payload: { deltaX: number; deltaY: number; nodeIds: string[] }]
  renameNode: [payload: { nodeId: string; title: string }]
  updateViewport: [viewport: PersistedViewport]
  updatePrompt: [payload: { nodeId: string; prompt: string }]
  updateConfiguration: [payload: {
    configuration: CanvasCardConfigurationSnapshot
    nodeId: string
  }]
  updateComposition: [payload: {
    generationMode: string | null
    nodeId: string
    parameters: GenerationNodeParameters | null
    prompt: string
    promptDocument: import('../../modules/canvas/canvas-card-view-model').CanvasCardPromptDocument
    references: readonly import('../../modules/canvas/canvas-card-view-model').CanvasCardReference[]
  }]
  updateGenerationParameters: [parameters: GenerationNodeParameters]
  'update:viewMode': [mode: ReplacementCanvasView]
  undo: []
}>()

watch(
  () => props.scriptActive,
  (active) => {
    if (!active) {
      scriptActiveNodeId.value = ''
      return
    }
    const nodeId = scriptWorkspaceNodeId.value || props.selectedNodeId
    const node = props.nodes.find((candidate) => candidate.id === nodeId)
    scriptActiveNodeId.value = (
      node?.type === 'script' && node.contentData?.subtype === 'script'
    ) ? node.id : ''
  },
)

const visibleNodes = computed(() => props.nodes.filter((node) => node.type !== 'result'))
const transientNodePositions = ref(new Map<string, { x: number; y: number }>())
const edgeNodes = computed(() => visibleNodes.value.map((node) => {
  const transient = transientNodePositions.value.get(node.id)
  return transient ? { ...node, ...transient } : node
}))
const selectedNode = computed(() => (
  props.selectedNodeIds.length === 1
    ? edgeNodes.value.find((node) => node.id === props.selectedNodeId) ?? null
    : null
))
const canDeleteSelection = computed(() => (
  props.selectedNodeIds.length > 0 &&
  props.selectedNodeIds.every((nodeId) => (
    canDeleteCanvasNode(props.nodes, props.connections, nodeId)
  ))
))
const interactionState = ref<
  'idle' | 'card-drag' | 'canvas-pan' | 'direct-edit' | 'marquee' | 'port-drag'
>('idle')
const elasticPortPositions = ref(new Map<string, { x: number; y: number }>())
const scriptWorkspaceNodeId = ref('')
const continuation = ref<{
  direction: ConnectionContinuationDirection
  options: ConnectionContinuationOption[]
  originNodeIds: string[]
  point: { x: number; y: number }
  position: { left: number; top: number }
} | null>(null)
const scriptWorkspaceNode = computed(() => (
  props.nodes.find((node) => node.id === scriptWorkspaceNodeId.value) ?? null
))

function isTextOrControlTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest(
    'input, textarea, select, button, a, [contenteditable="true"], [role="textbox"], [role="dialog"], [role="menu"]',
  ))
}

function handleRuntimeKeyDown(event: KeyboardEvent) {
  if (
    event.key !== 'Delete' ||
    event.defaultPrevented ||
    isTextOrControlTarget(event.target) ||
    !canDeleteSelection.value
  ) return
  event.preventDefault()
  emit('deleteSelection', 'keyboard')
}

function updateDraggedNode(payload: { nodeId: string; x: number; y: number } | null) {
  if (!payload) {
    transientNodePositions.value = new Map()
    return
  }
  const origin = props.nodes.find((node) => node.id === payload.nodeId)
  if (!origin || !isNodeGroupContainer(origin)) {
    transientNodePositions.value = new Map([[payload.nodeId, { x: payload.x, y: payload.y }]])
    return
  }
  const resolvedIds = resolveCanvasDragNodeIds(props.nodes, [origin.id])
  if (!resolvedIds) {
    transientNodePositions.value = new Map()
    return
  }
  const delta = { x: payload.x - origin.x, y: payload.y - origin.y }
  transientNodePositions.value = new Map(resolvedIds.map((nodeId) => {
    const node = props.nodes.find((candidate) => candidate.id === nodeId)!
    return [nodeId, { x: node.x + delta.x, y: node.y + delta.y }]
  }))
}

function updateDraggedSelection(
  positions: Array<{ nodeId: string; x: number; y: number }> | null,
) {
  transientNodePositions.value = positions
    ? new Map(positions.map((position) => [
      position.nodeId,
      { x: position.x, y: position.y },
    ]))
    : new Map()
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
  emit('selectNode', { nodeId, mode: 'replace' })
  scriptWorkspaceNodeId.value = nodeId
}

function completeScriptStoryboard(nodeId: string) {
  const node = props.nodes.find((candidate) => candidate.id === nodeId)
  const configuredModelId = node
    ? buildCanvasCardViewModel(node).configuration.modelId
    : null
  const modelId = (
    configuredModelId &&
    props.scriptCapability?.models.some((model) => model.id === configuredModelId)
  )
    ? configuredModelId
    : props.scriptCapability?.model ?? ''
  emit('selectNode', { nodeId, mode: 'replace' })
  emit('generateScript', {
    intent: 'script_draft',
    locale: props.scriptCapability?.defaultLocale ?? 'zh-CN',
    modelId,
    value: '自主创建完整可拍摄分镜，保留已有故事事实、人物关系、结局和用户编辑字段。',
    outputKind: 'story_production',
    requestedShotCount: 10,
  })
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
    originNodeIds: [origin.id],
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

function openSelectionContinuation(payload: {
  nodeIds: string[]
  x: number
  y: number
}) {
  const selectedIds = new Set(payload.nodeIds)
  const origins = props.nodes.filter((node) => selectedIds.has(node.id))
  const options = resolveMultiConnectionContinuationOptions(origins)
    .filter((option) => option.subtype !== 'audio' || props.allowedAudioModelCount > 0)
  if (origins.length < 2 || !options.length) return
  continuation.value = {
    direction: 'downstream',
    options,
    originNodeIds: origins.map((origin) => origin.id),
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
    originNodeIds: state.originNodeIds,
    point: state.point,
  })
  continuation.value = null
}

const {
  connectionTarget,
  draftEdge,
  handlePortDrag,
  lastPortDrop,
} = useRuntimeConnectionDrag({
  connectNodes: (payload) => {
    emit('connectNodes', payload)
    continuation.value = null
  },
  nodes: () => props.nodes,
  openContinuation,
  setInteractionState: (state) => { interactionState.value = state },
})

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

const {
  beginWorldPointer,
  cancelWorldPointer,
  canGroupSelection,
  canUngroupSelection,
  finishWorldPointer,
  marquee,
  marqueeStyle,
  moveWorldPointer,
} = useRuntimeMarqueeSelection({
  beginCanvasPan,
  cancelCanvasPan: finishCanvasPan,
  connections: () => props.connections,
  finishCanvasPan,
  groupSelection: () => emit('groupSelection'),
  moveCanvas,
  nodes: () => props.nodes,
  selectedNodeIds: () => props.selectedNodeIds,
  setInteractionState: (state) => { interactionState.value = state },
  setSelection: (nodeIds) => emit('setSelection', nodeIds),
  ungroupSelection: () => emit('ungroupSelection'),
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
    @keydown.capture="handleRuntimeKeyDown"
  >
    <div
      v-show="viewMode === 'workflow'"
      class="replacement-runtime__world"
      data-canvas-world
      aria-label="画布世界"
      @pointerdown="beginWorldPointer"
      @pointermove="moveWorldPointer"
      @pointerup="finishWorldPointer"
      @pointercancel="cancelWorldPointer"
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
        :connection-target="connectionTarget"
        :nodes="edgeNodes"
        :runtime-presentations="runtimePresentations"
        :script-active-node-id="scriptActiveNodeId"
        :selected-node-id="selectedNodeId"
        :selected-node-ids="selectedNodeIds"
        :viewport="viewport"
        @drag-node="updateDraggedNode"
        @interaction-state="setNodeInteractionState"
        @move-node="emit('moveNode', $event)"
        @open-script="openScriptWorkspace"
        @port-drag="handlePortDrag"
        @port-position="updatePortPosition"
        @rename-node="emit('renameNode', $event)"
        @select-node="emit('selectNode', $event)"
        @update-content="updateDirectContent"
      />
      <CanvasRuntimeSelectionHull
        :nodes="edgeNodes"
        :selected-node-ids="selectedNodeIds"
        :viewport="viewport"
        @interaction-state="interactionState = $event"
        @move-selection="emit('moveSelection', $event)"
        @open-continuation="openSelectionContinuation"
        @preview-move="updateDraggedSelection"
      />
      <div
        v-if="marquee"
        class="runtime-selection-marquee"
        data-runtime-marquee
        :style="marqueeStyle"
        aria-hidden="true"
      ></div>
    </div>

    <div
      v-if="canGroupSelection || canUngroupSelection"
      class="runtime-selection-toolbar"
      data-runtime-selection-toolbar
      role="toolbar"
      :aria-label="`${selectedNodeIds.length} 个已选节点的操作`"
    >
      <button
        v-if="canGroupSelection"
        type="button"
        aria-label="组合"
        @click="emit('groupSelection')"
      >组合</button>
      <button
        v-if="canUngroupSelection"
        type="button"
        aria-label="取消组合"
        @click="emit('ungroupSelection')"
      >取消组合</button>
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
          :data-storyboard-node-id="node.id"
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
      :assets="assets"
      :node="selectedNode"
      :generation-context="generationContext"
      :generation-quota="generationQuota"
      :model-options="modelOptions"
      :runtime-presentation="runtimePresentations.get(selectedNode.id) ?? null"
      :script-active="scriptActive"
      :script-capability="scriptCapability"
      :script-capability-error="scriptCapabilityError"
      :script-capability-loading="scriptCapabilityLoading"
      :script-error="scriptError"
      :script-quota="scriptQuota"
      :script-success="scriptSuccess"
      :viewport="viewport"
      @cancel-script="emit('cancelScript')"
      @generate="emit('generate')"
      @generate-script="emit('generateScript', $event)"
      @open-actions="emit('openActions', $event)"
      @open-script-workspace="openScriptWorkspace"
      @retry-script-capability="emit('retryScriptCapability')"
      @update-configuration="emit('updateConfiguration', $event)"
      @update-composition="emit('updateComposition', $event)"
      @update-generation-parameters="emit('updateGenerationParameters', $event)"
      @update-prompt="emit('updatePrompt', $event)"
    />

    <CanvasRuntimeScriptWorkspace
      v-if="scriptWorkspaceNode"
      :active="scriptActive"
      :connections="connections"
      :error="scriptError"
      :node="scriptWorkspaceNode"
      :nodes="nodes"
      :success="scriptSuccess"
      @add-shot="emit('addScriptShot', $event)"
      @close="scriptWorkspaceNodeId = ''"
      @complete-storyboard="completeScriptStoryboard"
      @create-generation-batch="emit('createScriptGenerationBatch', $event)"
      @delete-shot="emit('deleteScriptShot', $event)"
      @set-prompts-confirmed="emit('setScriptPromptsConfirmed', $event)"
      @set-shots-confirmed="emit('setScriptShotsConfirmed', $event)"
      @update-asset="emit('updateScriptAsset', $event)"
      @update-shot="emit('updateScriptShot', $event)"
    />

    <CanvasRuntimeContinuationMenu
      v-if="continuation"
      :direction="continuation.direction"
      :options="continuation.options"
      :position="continuation.position"
      :source-count="continuation.originNodeIds.length"
      @close="continuation = null"
      @select="chooseContinuation"
    />

    <CanvasRuntimeContextMenu
      v-if="contextMenu"
      :allowed-audio-model-count="allowedAudioModelCount"
      :can-delete-selection="canDeleteSelection"
      :can-redo="canRedo"
      :can-undo="canUndo"
      :position="contextMenu.position"
      @close="contextMenu = null"
      @create-node="createNodeFromContext"
      @delete-selection="contextMenu = null; emit('deleteSelection', 'context-menu')"
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
      @open-templates="emit('openTemplates', $event)"
      @redo="emit('redo')"
      @switch-canvas="emit('switchCanvas', $event)"
      @undo="emit('undo')"
      @update-view-mode="emit('update:viewMode', $event)"
    />
  </section>
</template>

<style lang="scss" src="./canvas-replacement-runtime.scss"></style>
