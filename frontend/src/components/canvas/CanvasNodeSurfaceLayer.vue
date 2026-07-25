<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { buildCanvasNodeInteraction } from './canvas-node-interaction'
import {
  buildCanvasCardViewModel,
  buildCanvasNodePresentation,
  resolveCanvasCardReferenceDisplayTitle,
} from './canvas-node-presentation'
import { resolveCanvasCardProductionInteractionState } from './canvas-card-production-state'
import CanvasNodeComposer from './CanvasNodeComposer.vue'
import CanvasNodeMedia from './CanvasNodeMedia.vue'
import CanvasRuntimeCard from './CanvasRuntimeCard.vue'
import CanvasCardWorkSurface, { type CanvasCardReferenceCandidate } from './CanvasCardWorkSurface.vue'
import CanvasCapabilityCardComposer from './CanvasCapabilityCardComposer.vue'
import CanvasTextCardModeChooser from './CanvasTextCardModeChooser.vue'
import CanvasTextWorkflowComposer from './CanvasTextWorkflowComposer.vue'
import CanvasScriptGenerationControls from './CanvasScriptGenerationControls.vue'
import CanvasScriptEmptyState from './CanvasScriptEmptyState.vue'
import { resolveCanvasCardProjectedResult, resolveCanvasCardWorkModel, type CanvasCardWorkModeId } from './canvas-card-work-model'
import { createConnectNodesCommand } from '../../modules/canvas/canvas-commands'
import { resolveKeyframeRailPlacement } from './canvas-keyframe-placement'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import type { VideoReferenceRole } from '../../modules/canvas/generation-capability-contract'
import type { GenerationNodeParameters, ResolvedGenerationRequestContext } from '../../modules/canvas/generation-parameters'
import type {
  CanvasCardPromptDocument,
  CanvasCardReference,
} from '../../modules/canvas/canvas-card-view-model'
import type { ScriptAuthoringCapabilities, ScriptAuthoringIntent, TextWorkflowMode } from '../../modules/canvas/script-authoring'
import {
  isScriptRoleReferenceCandidate,
  MAX_SCRIPT_REFERENCE_ASSETS,
  readScriptReferenceAssetIds,
} from '../../modules/canvas/script-reference-assets'
import type { ScriptGenerationSubmission } from './composables/use-canvas-script-generation'
import {
  resolveCanvasAttachedSurfacePlacement,
} from '../../modules/canvas/canvas-card-geometry'
const props = withDefaults(defineProps<{
  cardWorkBusy?: boolean
  cardWorkCanGenerate?: boolean
  cardWorkError?: string
  cardWorkHasSource?: boolean
  cardWorkModelLabel?: string
  cardWorkParameterSummary?: readonly string[]
  cardWorkSourceCount?: number
  capturePending: boolean
  connections: CanvasConnection[]
  generationRuntimePresentations?: ReadonlyMap<string, GenerationRuntimePresentation>
  generationContext?: ResolvedGenerationRequestContext | null
  hiddenNodeIds?: ReadonlySet<string>
  nodes: CanvasNode[]
  selectedNodeIds: string[]
  readonly: boolean
  referenceSourceNodes?: CanvasNode[]
  referenceTargetNodeId?: string
  scriptAuthoringActive?: boolean
  scriptAuthoringCapability?: ScriptAuthoringCapabilities | null
  scriptAuthoringCapabilityError?: string
  scriptAuthoringCapabilityLoading?: boolean
  scriptAuthoringError?: string
  scriptAuthoringIntent?: ScriptAuthoringIntent | null
  scriptAuthoringSuccess?: string
  scriptWorkflowNodeId?: string
  scriptQuota?: number
  stageSize?: { width: number; height: number }
  surfaceNodeRectStyle: (node: CanvasNode, role?: 'content' | 'composer') => Record<string, string>
  textAuthoringNodeId?: string
  textGenerationErrors?: ReadonlyMap<string, string>
  textGenerationPendingNodeIds?: ReadonlySet<string>
  textWorkflowMode?: CanvasCardWorkModeId | ''
  textWorkflowNodeId?: string
  viewportInsets?: Partial<{ top: number; right: number; bottom: number; left: number }>
}>(), {
  cardWorkBusy: false,
  cardWorkCanGenerate: false,
  cardWorkError: '',
  cardWorkHasSource: false,
  cardWorkModelLabel: '',
  cardWorkParameterSummary: () => [],
  cardWorkSourceCount: 0,
  generationRuntimePresentations: () => new Map(),
  generationContext: null,
  hiddenNodeIds: () => new Set(),
  textAuthoringNodeId: '',
  textGenerationErrors: () => new Map(),
  textGenerationPendingNodeIds: () => new Set(),
  textWorkflowMode: '',
  textWorkflowNodeId: '',
  referenceTargetNodeId: '',
  referenceSourceNodes: () => [],
  scriptAuthoringActive: false,
  scriptAuthoringCapability: null,
  scriptAuthoringCapabilityError: '',
  scriptAuthoringCapabilityLoading: false,
  scriptAuthoringError: '',
  scriptAuthoringIntent: null,
  scriptAuthoringSuccess: '',
  scriptWorkflowNodeId: '',
  scriptQuota: 0,
  stageSize: () => ({ width: 0, height: 0 }),
  viewportInsets: () => ({}),
})
const emit = defineEmits<{
  cardGenerate: [nodeId: string, prompt: string, mode: CanvasCardWorkModeId]
  cardOpenAssets: [nodeId: string, opener: HTMLElement]
  cardReferenceCancel: []
  cardReferenceStart: [targetNodeId: string]
  cardScriptRoleReferenceClear: [targetNodeId: string]
  cardScriptRoleReferenceSelect: [targetNodeId: string, sourceNodeId: string]
  cardReference: [targetNodeId: string, sourceNodeId: string, restoreMentionFocus?: boolean]
  cardUpload: [nodeId: string, file: File]
  cardUpdateParameters: [parameters: GenerationNodeParameters]
  cardUpdateComposition: [
    nodeId: string,
    prompt: string,
    promptDocument: CanvasCardPromptDocument,
    references: readonly CanvasCardReference[],
  ]
  cancelScriptAuthoring: []
  commitContent: [nodeId: string, content: string]
  directEditClose: [nodeId: string]
  captureFrame: [nodeId: string, file: File, timeSeconds: number, aspectRatio: number]
  mediaMetadata: [nodeId: string, aspectRatio: number]
  nodePointerDown: [nodeId: string, event: PointerEvent]
  portPointerDown: [nodeId: string, portId: string, direction: 'input' | 'output', event: PointerEvent]
  referenceReorder: [nodeId: string, stableId: string, direction: -1 | 1]
  renameNode: [nodeId: string, title: string]
  selectNode: [nodeId: string, event: PointerEvent]
  generateScript: [submission: ScriptGenerationSubmission]
  retryScriptCapability: []
  scriptWorkflowClose: []
  scriptWorkflowOpen: [nodeId: string]
  textMode: [nodeId: string, mode: CanvasCardWorkModeId, opener?: HTMLElement]
  textWorkflowCancel: []
  textWorkflowSubmit: [nodeId: string, prompt: string, mode: CanvasCardWorkModeId, modelId: string]
}>()
const enabledTextModeIds = computed<CanvasCardWorkModeId[]>(() => [
  'direct-write',
  ...new Set(
    (props.scriptAuthoringCapability?.models ?? [])
      .flatMap((model) => model.workflowModes),
  ),
])
function textModelsForMode(mode: CanvasCardWorkModeId) {
  return (props.scriptAuthoringCapability?.models ?? []).filter((model) => (
    model.workflowModes.includes(mode as TextWorkflowMode)
  ))
}
function submitTextWorkflow(nodeId: string, prompt: string, modelId: string) {
  if (!props.textWorkflowMode) return
  emit('textWorkflowSubmit', nodeId, prompt, props.textWorkflowMode, modelId)
}
const surfaces = computed(() => props.nodes.flatMap((node) => {
  if (props.hiddenNodeIds.has(node.id)) return []
  const referenceTarget = props.referenceTargetNodeId
    ? props.nodes.find((candidate) => candidate.id === props.referenceTargetNodeId) ?? null
    : null
  const isSelected = props.selectedNodeIds.length === 1 && props.selectedNodeIds[0] === node.id
  const interaction = buildCanvasNodeInteraction(node, {
    isDirectEditing: props.textAuthoringNodeId === node.id,
    isReadOnly: props.readonly,
    isSelected,
  })
  const workModel = resolveCanvasCardWorkModel(node, { isReadOnly: props.readonly, isSelected })
  const projectedResult = isSelected
    ? resolveCanvasCardProjectedResult(node, props.nodes, props.connections)
    : null
  const projectedMedia = projectedResult ? buildCanvasNodePresentation(projectedResult).media : null
  const isScriptReferenceTarget = referenceTarget?.type === 'script' && referenceTarget.contentData?.subtype === 'script'
  const assetId = node.contentData?.asset_id
  const isReferenceCandidate = Boolean(
    referenceTarget && node.id !== referenceTarget.id &&
    (isScriptReferenceTarget || (typeof assetId === 'string' && Boolean(assetId.trim()))) &&
    createConnectNodesCommand(props.nodes, props.connections, node.id, referenceTarget.id),
  )
  const showsTextWorkflow = props.textWorkflowNodeId === node.id && Boolean(props.textWorkflowMode)
  const scriptContent = node.content ?? node.contentData?.text
  const isCanonicalScript = node.type === 'script' && node.contentData?.subtype === 'script'
  const capabilitySubtype = node.contentData?.subtype
  const capabilityWorkflow: 'audio' | 'video-composition' | null = node.type === 'generation' && (
    capabilitySubtype === 'video-composition' || capabilitySubtype === 'audio'
  )
    ? capabilitySubtype
    : null
  const isEmptyScript = isCanonicalScript && (typeof scriptContent !== 'string' || !scriptContent.trim())
  const scriptRoleReferenceIds = new Set(readScriptReferenceAssetIds(node))
  const hasScriptSource = isCanonicalScript && props.connections.some((connection) => {
    if (connection.to !== node.id) return false
    const sourceNode = props.nodes.find((candidate) => candidate.id === connection.from)
    return sourceNode?.type === 'script' && sourceNode.contentData?.subtype === 'script'
  })
  const hasScriptWorkflowSource = hasScriptSource || scriptRoleReferenceIds.size > 0
  const showsScriptEmptyState = isEmptyScript && !hasScriptWorkflowSource &&
    props.textAuthoringNodeId !== node.id && !showsTextWorkflow
  const showsTextModeChooser = workModel.showsEmptyModeChooser && !isCanonicalScript && props.textAuthoringNodeId !== node.id && !showsTextWorkflow
  const showsScriptAuthoring = isSelected && props.scriptWorkflowNodeId === node.id &&
    !props.readonly && !showsTextWorkflow && props.textAuthoringNodeId !== node.id &&
    isCanonicalScript && (!isEmptyScript || hasScriptWorkflowSource)
  const runtimePresentation = props.generationRuntimePresentations.get(node.id) ?? null
  const interactionState = resolveCanvasCardProductionInteractionState({
    hasInlineEditor: props.textAuthoringNodeId === node.id || (
      interaction.kind === 'composer' && isSelected && !workModel.showsAttachedWorkSurface
    ),
    hasAttachedComposer: workModel.showsAttachedWorkSurface || showsTextWorkflow ||
      showsScriptAuthoring || Boolean(isSelected && capabilityWorkflow),
    isSubmitting: runtimePresentation?.phase === 'submitting',
  })
  const viewModel = buildCanvasCardViewModel(node, {
    isReadOnly: props.readonly,
    isSelected,
    interactionState,
    runtimePresentation,
  })
  const referenceCandidates: CanvasCardReferenceCandidate[] = workModel.canSelectCanvasReference
    ? props.nodes.flatMap((candidate) => {
        const assetId = candidate.contentData?.asset_id
        if (candidate.id === node.id || typeof assetId !== 'string' || !assetId.trim()) return []
        return createConnectNodesCommand(props.nodes, props.connections, candidate.id, node.id)
          ? [{
              id: candidate.id,
              title: resolveCanvasCardReferenceDisplayTitle(candidate, props.nodes),
              previewUrl: (() => {
                const media = buildCanvasNodePresentation(candidate).media
                if (media?.kind === 'image') return media.url
                if (media?.kind === 'video') return media.poster ?? media.url
                return undefined
              })(),
            }]
          : []
      })
    : []
  const connectedReferences: CanvasCardReferenceCandidate[] = isSelected
    ? (props.generationContext?.mediaSources ?? []).flatMap((source) => {
        const sourceNode = props.nodes.find((candidate) => candidate.id === source.nodeId)
        if (!sourceNode) return []
        const media = buildCanvasNodePresentation(sourceNode).media
        return [{
          assetId: source.assetId ?? undefined,
          id: source.nodeId,
          title: resolveCanvasCardReferenceDisplayTitle(sourceNode, props.nodes),
          previewUrl: media?.kind === 'image' ? media.url : media?.kind === 'video' ? media.poster ?? media.url : undefined,
        }]
      })
    : []
  const selectedReferences: CanvasCardReferenceCandidate[] = props.generationContext?.mediaType === 'video' &&
    props.generationContext.capabilities?.contract_version === 6
    ? (
        viewModel.references.length
          ? [...viewModel.references].sort((left, right) => left.order - right.order).flatMap((reference) => {
              const connected = connectedReferences.find((candidate) => (
                candidate.id === reference.stableId && candidate.assetId === reference.assetId
              ))
              const role = ['first-frame', 'last-frame', 'reference'].includes(reference.role)
                ? reference.role as VideoReferenceRole
                : 'reference'
              return connected ? [{
                ...connected,
                key: `${reference.stableId}:${reference.assetId}:${reference.role}:${reference.order}`,
                order: reference.order,
                previewUrl: reference.thumbnailUrl,
                role,
                title: reference.displayName,
              }] : []
            })
          : (props.generationContext.videoReferences ?? []).flatMap((binding) => {
              const connected = connectedReferences.find((reference) => reference.id === binding.node_id)
              return connected ? [{
                ...connected,
                key: `${binding.node_id}:${binding.asset_id}:${binding.role}:${binding.order}`,
                order: binding.order,
                role: binding.role,
              }] : []
            })
      )
    : connectedReferences
  const materializedResultId = typeof node.contentData?.materialized_result_node_id === 'string'
    ? node.contentData.materialized_result_node_id
    : ''
  const scriptRoleReferenceCandidates = isCanonicalScript
    ? props.referenceSourceNodes.flatMap((candidate) => {
        const candidateAssetId = typeof candidate.contentData?.asset_id === 'string'
          ? candidate.contentData.asset_id.trim()
          : ''
        if (!candidateAssetId || scriptRoleReferenceIds.has(candidateAssetId) || !isScriptRoleReferenceCandidate(candidate)) return []
        const media = buildCanvasNodePresentation(candidate).media
        return [{
          id: candidate.id,
          previewUrl: media?.kind === 'image' ? media.url : undefined,
          title: resolveCanvasCardReferenceDisplayTitle(candidate, props.referenceSourceNodes),
        }]
      })
    : []
  const zoom = Number.parseFloat(
    props.surfaceNodeRectStyle(node, 'content')['--canvas-surface-zoom'] ?? '1',
  )
  return [{ node, viewModel, interaction, workModel, projectedMedia, projectedResultId: projectedResult?.id ?? materializedResultId, capabilityWorkflow, connectedReferences, referenceCandidates, selectedReferences, runtimePresentation, showsTextModeChooser, showsTextWorkflow, showsScriptAuthoring, showsScriptEmptyState, isCanonicalScript, isReferenceCandidate, referenceDisplayTitle: resolveCanvasCardReferenceDisplayTitle(node, props.nodes), scriptRoleReferenceCandidates, scriptRoleReferenceCount: scriptRoleReferenceIds.size, zoom }]
}))
function forwardCaptureFrame(nodeId: string, file: File, timeSeconds: number, aspectRatio: number) { emit('captureFrame', nodeId, file, timeSeconds, aspectRatio) }
function attachedSurfaceStyle(
  node: CanvasNode,
  surfaceHeight: number,
  containerRole: 'content' | 'composer' = 'content',
) {
  const contentStyle = props.surfaceNodeRectStyle(node, 'content')
  const zoom = Number.parseFloat(contentStyle['--canvas-surface-zoom'] ?? '1')
  const containerStyle = props.surfaceNodeRectStyle(node, containerRole)
  const containerLeft = Number.parseFloat(containerStyle.left ?? '0')
  const containerTop = Number.parseFloat(containerStyle.top ?? '0')
  const containerScale = containerRole === 'composer' ? zoom : 1
  const containerWidth = Number.parseFloat(containerStyle.width ?? '0') * containerScale
  const containerHeight = Number.parseFloat(containerStyle.height ?? '0') * containerScale
  const placement = resolveCanvasAttachedSurfacePlacement({
    nodeSurfaceRect: {
      left: containerLeft,
      top: containerTop,
      width: containerWidth,
      height: containerHeight,
    },
    stageRect: { left: 0, top: 0, width: props.stageSize.width, height: props.stageSize.height },
    insets: props.viewportInsets,
    surfaceHeight: surfaceHeight * containerScale,
    preferredWidth: 660 * containerScale,
    gap: 16 * zoom,
  })
  return {
    '--canvas-attached-anchor-x': `${placement.anchorX / containerScale}px`,
    left: `${(placement.left - containerLeft) / containerScale}px`,
    top: placement.placement === 'below'
      ? 'calc(100% + var(--canvas-card-floating-gap, 16px))'
      : `${(placement.top - containerTop) / containerScale}px`,
    width: `${placement.width / containerScale}px`,
    transform: 'none',
  }
}
</script>
<template>
  <div class="canvas-node-surface-layer">
    <div v-for="surface in surfaces" :key="surface.node.id" class="canvas-node-surface" :class="[`is-${surface.interaction.kind}`, `is-${surface.viewModel.state.phase}`, { 'has-script-empty-state': surface.showsScriptEmptyState }]" :data-card-state="surface.viewModel.state.phase" :data-node-id="surface.node.id" :style="surfaceNodeRectStyle(surface.node, 'content')">
      <CanvasRuntimeCard
        :node="surface.node"
        :readonly="readonly"
        :view-model="surface.viewModel"
        :zoom="surface.zoom"
        @drag-start="(nodeId, event) => emit('nodePointerDown', nodeId, event)"
        @direct-edit="(nodeId) => emit('textMode', nodeId, 'direct-write')"
        @port-start="(nodeId, portId, direction, event) => emit('portPointerDown', nodeId, portId, direction, event)"
        @rename="(nodeId, title) => emit('renameNode', nodeId, title)"
        @select="(nodeId, event) => emit('selectNode', nodeId, event)"
      >
        <CanvasNodeMedia v-if="surface.projectedMedia" :media="surface.projectedMedia" :capture-pending="capturePending" @metadata="emit('mediaMetadata', surface.projectedResultId, $event)" />
        <CanvasScriptEmptyState
          v-else-if="surface.showsScriptEmptyState"
          :can-select-role-source="!readonly && !surface.node.isLocked && surface.scriptRoleReferenceCount < MAX_SCRIPT_REFERENCE_ASSETS"
          :can-select-script-source="!readonly && !surface.node.isLocked"
          :role-reference-candidates="surface.scriptRoleReferenceCandidates"
          :role-reference-count="surface.scriptRoleReferenceCount"
          @clear-role-references="emit('cardScriptRoleReferenceClear', surface.node.id)"
          @select-role-reference="(sourceNodeId) => emit('cardScriptRoleReferenceSelect', surface.node.id, sourceNodeId)"
          @select-script-source="emit('cardReferenceStart', surface.node.id)"
          @direct-write="(opener) => emit('textMode', surface.node.id, 'direct-write', opener)"
        />
        <CanvasTextCardModeChooser
          v-else-if="surface.showsTextModeChooser"
          :enabled-mode-ids="textGenerationPendingNodeIds.has(surface.node.id) || surface.runtimePresentation?.isTerminal === false ? ['direct-write'] : enabledTextModeIds"
          :error="textGenerationErrors.get(surface.node.id) ?? ''"
          :modes="surface.workModel.modes"
          :pending="textGenerationPendingNodeIds.has(surface.node.id)"
          @select="(mode, opener) => emit('textMode', surface.node.id, mode, opener)"
        />
        <CanvasNodeComposer v-else-if="surface.interaction.kind === 'composer' && selectedNodeIds.length === 1 && !surface.workModel.showsAttachedWorkSurface" :label="surface.interaction.label" :model-value="surface.interaction.content" @commit="emit('commitContent', surface.node.id, $event)" @close="emit('directEditClose', surface.node.id)" />
        <CanvasNodeMedia v-else-if="surface.interaction.kind === 'media'" :media="surface.interaction.media" :can-capture-frame="!readonly && !surface.node.isLocked && selectedNodeIds.length === 1 && selectedNodeIds[0] === surface.node.id && surface.interaction.media.kind === 'video'" :capture-pending="capturePending" :keyframe-rail-placement="resolveKeyframeRailPlacement(surface.node, nodes)" @capture-frame="(file, timeSeconds, aspectRatio) => forwardCaptureFrame(surface.projectedResultId || surface.node.id, file, timeSeconds, aspectRatio)" @metadata="emit('mediaMetadata', surface.projectedResultId || surface.node.id, $event)" />
        <div v-else class="canvas-runtime-card-primary">
          <p>{{ surface.viewModel.body.content || '尚未添加内容' }}</p>
          <button
            v-if="surface.isCanonicalScript && selectedNodeIds.length === 1 && selectedNodeIds[0] === surface.node.id"
            type="button"
            @click.stop="emit('scriptWorkflowOpen', surface.node.id)"
            @pointerdown.stop
          >展开脚本工作流</button>
        </div>
      </CanvasRuntimeCard>
      <CanvasCardWorkSurface
        v-if="surface.workModel.showsAttachedWorkSurface"
        :busy="cardWorkBusy"
        :can-generate="cardWorkCanGenerate"
        :error="cardWorkError"
        :generation-context="generationContext"
        :has-source="cardWorkHasSource"
        :model-label="cardWorkModelLabel"
        :node="surface.node"
        :placement-style="attachedSurfaceStyle(
          surface.node,
          surface.selectedReferences.length ? 236 : 176,
          surface.interaction.kind === 'composer' ? 'composer' : 'content',
        )"
        :parameter-summary="cardWorkParameterSummary"
        :persisted-generation-mode="surface.viewModel.configuration.generationMode"
        :prompt-document="surface.viewModel.configuration.promptDocument"
        :canonical-references="surface.viewModel.references"
        :connected-references="surface.connectedReferences"
        :reference-candidates="surface.referenceCandidates"
        :selected-references="surface.selectedReferences"
        :reference-mode-active="referenceTargetNodeId === surface.node.id"
        :runtime-presentation="surface.runtimePresentation"
        :source-count="cardWorkSourceCount"
        :readonly="readonly"
        @generate="(prompt, mode) => emit('cardGenerate', surface.node.id, prompt, mode)"
        @begin-reference="emit('cardReferenceStart', surface.node.id)"
        @cancel-reference="emit('cardReferenceCancel')"
        @update-parameters="emit('cardUpdateParameters', $event)"
        @update-composition="(prompt, document, references) => emit(
          'cardUpdateComposition',
          surface.node.id,
          prompt,
          document,
          references,
        )"
      />
      <CanvasCapabilityCardComposer
        v-if="surface.capabilityWorkflow && selectedNodeIds.length === 1"
        :kind="surface.capabilityWorkflow"
        :placement-style="attachedSurfaceStyle(surface.node, 132)"
      />
      <CanvasTextWorkflowComposer
        v-if="surface.showsTextWorkflow && textWorkflowMode"
        class="canvas-text-card-work-surface"
        :style="attachedSurfaceStyle(surface.node, 210)"
        :busy="surface.runtimePresentation?.isTerminal === false"
        :error="textGenerationErrors.get(surface.node.id) ?? ''"
        :mode="textWorkflowMode"
        :models="textModelsForMode(textWorkflowMode)"
        :runtime-presentation="surface.runtimePresentation"
        :title="surface.node.title"
        @cancel="emit('textWorkflowCancel')"
        @submit="(prompt, modelId) => submitTextWorkflow(surface.node.id, prompt, modelId)"
      />
      <CanvasScriptGenerationControls
        v-if="surface.showsScriptAuthoring"
        class="canvas-script-card-work-surface"
        :style="attachedSurfaceStyle(surface.node, 170)"
        :active="scriptAuthoringActive"
        :capability="scriptAuthoringCapability"
        :capability-error="scriptAuthoringCapabilityError"
        :capability-loading="scriptAuthoringCapabilityLoading"
        :error="scriptAuthoringError"
        :initial-intent="scriptAuthoringIntent"
        :node="surface.node"
        :quota="scriptQuota"
        :readonly="readonly"
        :success="scriptAuthoringSuccess"
        @cancel="emit('scriptWorkflowClose')"
        @generate="emit('generateScript', $event)"
        @retry-capability="emit('retryScriptCapability')"
      />
      <button v-if="surface.isReferenceCandidate && referenceTargetNodeId" type="button" class="canvas-card-reference-candidate" :aria-label="referenceTargetNodeId && nodes.find((node) => node.id === referenceTargetNodeId)?.type === 'script' ? `选择 ${surface.referenceDisplayTitle} 作为剧本来源` : `选择 ${surface.referenceDisplayTitle} 作为参考`" @click.stop="emit('cardReference', referenceTargetNodeId, surface.node.id)" @pointerdown.stop>
        <span>{{ nodes.find((node) => node.id === referenceTargetNodeId)?.type === 'script' ? '作为剧本来源' : '作为参考' }}</span><small>{{ surface.referenceDisplayTitle }}</small>
      </button>
    </div>
  </div>
</template>
<style scoped lang="scss" src="./canvas-node-surfaces.scss"></style>
