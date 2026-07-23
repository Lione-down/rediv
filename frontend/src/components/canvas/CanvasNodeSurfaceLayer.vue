<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { buildCanvasNodeInteraction } from './canvas-node-interaction'
import { buildCanvasNodePresentation } from './canvas-node-presentation'
import { resolveCanvasCardInteractionPresentation } from './canvas-card-interaction-presentation'
import CanvasNodeComposer from './CanvasNodeComposer.vue'
import CanvasNodeContinuationTrigger from './CanvasNodeContinuationTrigger.vue'
import CanvasNodeMedia from './CanvasNodeMedia.vue'
import CanvasCardWorkSurface, { type CanvasCardReferenceCandidate } from './CanvasCardWorkSurface.vue'
import CanvasTextCardModeChooser from './CanvasTextCardModeChooser.vue'
import CanvasTextWorkflowComposer from './CanvasTextWorkflowComposer.vue'
import CanvasScriptGenerationControls from './CanvasScriptGenerationControls.vue'
import CanvasScriptEmptyState from './CanvasScriptEmptyState.vue'
import { resolveCanvasCardProjectedResult, resolveCanvasCardWorkModel, type CanvasCardWorkModeId } from './canvas-card-work-model'
import { createConnectNodesCommand } from '../../modules/canvas/canvas-commands'
import { resolveKeyframeRailPlacement } from './canvas-keyframe-placement'
import type { CanvasNodeContinuationTrigger as ContinuationTrigger } from './canvas-node-continuation-trigger'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import type { GenerationNodeParameters, ResolvedGenerationRequestContext } from '../../modules/canvas/generation-parameters'
import type { ScriptAuthoringCapabilities, ScriptAuthoringIntent } from '../../modules/canvas/script-authoring'
import {
  isScriptRoleReferenceCandidate,
  MAX_SCRIPT_REFERENCE_ASSETS,
  readScriptReferenceAssetIds,
} from '../../modules/canvas/script-reference-assets'
import type { ScriptGenerationSubmission } from './composables/use-canvas-script-generation'
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
  continuationTrigger: ContinuationTrigger | null
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
  scriptQuota?: number
  surfaceNodeRectStyle: (node: CanvasNode, role?: 'content' | 'composer') => Record<string, string>
  textAuthoringNodeId?: string
  textWorkflowMode?: CanvasCardWorkModeId | ''
  textWorkflowNodeId?: string
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
  scriptQuota: 0,
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
  cancelScriptAuthoring: []
  commitContent: [nodeId: string, content: string]
  continueNode: [nodeId: string, portId: string]
  captureFrame: [nodeId: string, file: File, timeSeconds: number, aspectRatio: number]
  mediaMetadata: [nodeId: string, aspectRatio: number]
  generateScript: [submission: ScriptGenerationSubmission]
  retryScriptCapability: []
  textMode: [nodeId: string, mode: CanvasCardWorkModeId, opener: HTMLElement]
  textWorkflowCancel: []
  textWorkflowSubmit: [nodeId: string, prompt: string, mode: CanvasCardWorkModeId]
}>()
const surfaces = computed(() => props.nodes.flatMap((node) => {
  if (props.hiddenNodeIds.has(node.id)) return []
  const referenceTarget = props.referenceTargetNodeId
    ? props.nodes.find((candidate) => candidate.id === props.referenceTargetNodeId) ?? null
    : null
  const isSelected = props.selectedNodeIds.length === 1 && props.selectedNodeIds[0] === node.id
  const interaction = buildCanvasNodeInteraction(node, { isReadOnly: props.readonly, isSelected })
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
  const isEmptyScript = isCanonicalScript && (typeof scriptContent !== 'string' || !scriptContent.trim())
  const showsScriptEmptyState = isEmptyScript && props.textAuthoringNodeId !== node.id && !showsTextWorkflow
  const showsTextModeChooser = workModel.showsEmptyModeChooser && !isCanonicalScript && props.textAuthoringNodeId !== node.id && !showsTextWorkflow
  const showsScriptAuthoring = isSelected && !props.readonly && !showsTextWorkflow && props.textAuthoringNodeId !== node.id &&
    isCanonicalScript
  if (interaction.kind === 'static' && !workModel.showsAttachedWorkSurface && !projectedMedia && !showsTextModeChooser && !showsScriptEmptyState && !isReferenceCandidate) return []
  const cardPresentation = resolveCanvasCardInteractionPresentation({
    bodyKind: interaction.kind === 'media' ? 'media' : 'authoring',
    isCompatibleDrag: false,
    isFocused: false,
    isHovered: false,
    isLocked: Boolean(node.isLocked),
    isReadOnly: props.readonly,
    isSelected,
    lifecycleTone: node.status === 'running' ? 'progress' : node.status === 'warning' ? 'danger' : 'none',
    reducedMotion: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  })
  const referenceCandidates: CanvasCardReferenceCandidate[] = workModel.canSelectCanvasReference
    ? props.nodes.flatMap((candidate) => {
        const assetId = candidate.contentData?.asset_id
        if (candidate.id === node.id || typeof assetId !== 'string' || !assetId.trim()) return []
        return createConnectNodesCommand(props.nodes, props.connections, candidate.id, node.id)
          ? [{
              id: candidate.id,
              title: candidate.title,
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
          id: source.nodeId,
          title: source.title,
          previewUrl: media?.kind === 'image' ? media.url : media?.kind === 'video' ? media.poster ?? media.url : undefined,
        }]
      })
    : []
  const selectedReferences: CanvasCardReferenceCandidate[] = props.generationContext?.mediaType === 'video' &&
    props.generationContext.capabilities?.contract_version === 6
    ? (props.generationContext.videoReferences ?? []).flatMap((binding) => {
        const connected = connectedReferences.find((reference) => reference.id === binding.node_id)
        return connected ? [{
          ...connected,
          key: `${binding.node_id}:${binding.asset_id}:${binding.role}:${binding.order}`,
          order: binding.order,
          role: binding.role,
        }] : []
      })
    : connectedReferences
  const materializedResultId = typeof node.contentData?.materialized_result_node_id === 'string'
    ? node.contentData.materialized_result_node_id
    : ''
  const scriptRoleReferenceIds = new Set(readScriptReferenceAssetIds(node))
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
          title: candidate.title,
        }]
      })
    : []
  return [{ node, interaction, cardPresentation, workModel, projectedMedia, projectedResultId: projectedResult?.id ?? materializedResultId, connectedReferences, referenceCandidates, selectedReferences, runtimePresentation: props.generationRuntimePresentations.get(node.id) ?? null, showsTextModeChooser, showsTextWorkflow, showsScriptAuthoring, showsScriptEmptyState, isReferenceCandidate, scriptRoleReferenceCandidates, scriptRoleReferenceCount: scriptRoleReferenceIds.size }]
}))
function forwardContinuation(nodeId: string, portId: string) { emit('continueNode', nodeId, portId) }
function forwardCaptureFrame(nodeId: string, file: File, timeSeconds: number, aspectRatio: number) { emit('captureFrame', nodeId, file, timeSeconds, aspectRatio) }
function attachedSurfaceStyle(node: CanvasNode, surfaceHeight: number) {
  const nodeStyle = props.surfaceNodeRectStyle(node, 'content')
  const nodeLeft = Number.parseFloat(nodeStyle.left ?? '0')
  const nodeTop = Number.parseFloat(nodeStyle.top ?? '0')
  const nodeWidth = Number.parseFloat(nodeStyle.width ?? '0')
  const nodeHeight = Number.parseFloat(nodeStyle.height ?? '0')
  const gap = 16 * Number.parseFloat(nodeStyle['--canvas-surface-zoom'] ?? '1')
  const surfaceWidth = Math.min(660, Math.max(0, window.innerWidth - 32))
  const desiredLeft = nodeLeft + nodeWidth / 2 - surfaceWidth / 2
  const clampedLeft = Math.min(Math.max(desiredLeft, 16), window.innerWidth - 16 - surfaceWidth)
  const belowTop = nodeTop + nodeHeight + gap
  const aboveTop = nodeTop - gap - surfaceHeight
  const shouldFlipAbove = belowTop + surfaceHeight > window.innerHeight - 12 && aboveTop >= 12
  return {
    '--canvas-attached-anchor-x': `${nodeLeft + nodeWidth / 2 - clampedLeft}px`,
    left: `${clampedLeft - nodeLeft}px`,
    ...(shouldFlipAbove ? { top: `${-surfaceHeight - gap}px` } : {}),
    transform: 'none',
  }
}
</script>
<template>
  <div class="canvas-node-surface-layer">
    <CanvasNodeContinuationTrigger v-if="continuationTrigger" :node="continuationTrigger.node" :port-id="continuationTrigger.portId" :surface-node-rect-style="surfaceNodeRectStyle" @open="forwardContinuation" />
    <div v-for="surface in surfaces" :key="surface.node.id" class="canvas-node-surface" :class="[`is-${surface.interaction.kind}`, { 'has-script-empty-state': surface.showsScriptEmptyState }]" :data-card-state="surface.cardPresentation.state" :data-node-id="surface.node.id" :style="surfaceNodeRectStyle(surface.node, surface.showsScriptAuthoring || surface.showsScriptEmptyState ? 'content' : surface.interaction.kind === 'composer' ? 'composer' : 'content')">
      <CanvasNodeMedia v-if="surface.projectedMedia" :media="surface.projectedMedia" :capture-pending="capturePending" @metadata="emit('mediaMetadata', surface.projectedResultId, $event)" />
      <CanvasTextWorkflowComposer v-else-if="surface.showsTextWorkflow && textWorkflowMode" :mode="textWorkflowMode" :title="surface.node.title" @cancel="emit('textWorkflowCancel')" @submit="emit('textWorkflowSubmit', surface.node.id, $event, textWorkflowMode)" />
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
      <CanvasTextCardModeChooser v-else-if="surface.showsTextModeChooser" :enabled-mode-ids="['direct-write', 'text-to-video', 'text-to-music']" :modes="surface.workModel.modes" @select="(mode, opener) => emit('textMode', surface.node.id, mode, opener)" />
      <CanvasNodeComposer v-else-if="surface.interaction.kind === 'composer' && selectedNodeIds.length === 1 && !surface.workModel.showsAttachedWorkSurface" :label="surface.interaction.label" :model-value="surface.interaction.content" @commit="emit('commitContent', surface.node.id, $event)" />
      <CanvasNodeMedia v-else-if="surface.interaction.kind === 'media'" :media="surface.interaction.media" :can-capture-frame="!readonly && !surface.node.isLocked && selectedNodeIds.length === 1 && selectedNodeIds[0] === surface.node.id && surface.interaction.media.kind === 'video'" :capture-pending="capturePending" :keyframe-rail-placement="resolveKeyframeRailPlacement(surface.node, nodes)" @capture-frame="(file, timeSeconds, aspectRatio) => forwardCaptureFrame(surface.projectedResultId || surface.node.id, file, timeSeconds, aspectRatio)" @metadata="emit('mediaMetadata', surface.projectedResultId || surface.node.id, $event)" />
      <CanvasCardWorkSurface
        v-if="surface.workModel.showsAttachedWorkSurface"
        :busy="cardWorkBusy"
        :can-generate="cardWorkCanGenerate"
        :error="cardWorkError"
        :generation-context="generationContext"
        :has-source="cardWorkHasSource"
        :model-label="cardWorkModelLabel"
        :node="surface.node"
        :placement-style="attachedSurfaceStyle(surface.node, surface.selectedReferences.length ? 236 : 176)"
        :parameter-summary="cardWorkParameterSummary"
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
        @update-prompt="emit('commitContent', surface.node.id, $event)"
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
        @cancel="emit('cancelScriptAuthoring')"
        @generate="emit('generateScript', $event)"
        @retry-capability="emit('retryScriptCapability')"
      />
      <button v-if="surface.isReferenceCandidate && referenceTargetNodeId" type="button" class="canvas-card-reference-candidate" :aria-label="referenceTargetNodeId && nodes.find((node) => node.id === referenceTargetNodeId)?.type === 'script' ? `选择 ${surface.node.title} 作为剧本来源` : `选择 ${surface.node.title} 作为参考`" @click.stop="emit('cardReference', referenceTargetNodeId, surface.node.id)" @pointerdown.stop>
        <span>{{ nodes.find((node) => node.id === referenceTargetNodeId)?.type === 'script' ? '作为剧本来源' : '作为参考' }}</span><small>{{ surface.node.title }}</small>
      </button>
    </div>
  </div>
</template>
<style scoped lang="scss" src="./canvas-node-surfaces.scss"></style>
