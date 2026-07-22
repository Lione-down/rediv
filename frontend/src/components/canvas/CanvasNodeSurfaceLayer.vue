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
import { resolveCanvasCardProjectedResult, resolveCanvasCardWorkModel, type CanvasCardWorkModeId } from './canvas-card-work-model'
import { createConnectNodesCommand } from '../../modules/canvas/canvas-commands'
import { resolveKeyframeRailPlacement } from './canvas-keyframe-placement'
import type { CanvasNodeContinuationTrigger as ContinuationTrigger } from './canvas-node-continuation-trigger'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
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
  hiddenNodeIds?: ReadonlySet<string>
  continuationTrigger: ContinuationTrigger | null
  nodes: CanvasNode[]
  selectedNodeIds: string[]
  readonly: boolean
  referenceTargetNodeId?: string
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
  hiddenNodeIds: () => new Set(),
  textAuthoringNodeId: '',
  textWorkflowMode: '',
  textWorkflowNodeId: '',
  referenceTargetNodeId: '',
})
const emit = defineEmits<{
  cardGenerate: [nodeId: string, prompt: string, mode: CanvasCardWorkModeId]
  cardOpenAssets: [nodeId: string, opener: HTMLElement]
  cardReferenceCancel: []
  cardReferenceStart: [targetNodeId: string]
  cardReference: [targetNodeId: string, sourceNodeId: string]
  cardUpload: [nodeId: string, file: File]
  commitContent: [nodeId: string, content: string]
  continueNode: [nodeId: string, portId: string]
  captureFrame: [nodeId: string, file: File, timeSeconds: number, aspectRatio: number]
  mediaMetadata: [nodeId: string, aspectRatio: number]
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
  const assetId = node.contentData?.asset_id
  const isReferenceCandidate = Boolean(
    referenceTarget && node.id !== referenceTarget.id && typeof assetId === 'string' && assetId.trim() &&
    createConnectNodesCommand(props.nodes, props.connections, node.id, referenceTarget.id),
  )
  const showsTextWorkflow = props.textWorkflowNodeId === node.id && Boolean(props.textWorkflowMode)
  const showsTextModeChooser = workModel.showsEmptyModeChooser && props.textAuthoringNodeId !== node.id && !showsTextWorkflow
  if (interaction.kind === 'static' && !workModel.showsAttachedWorkSurface && !projectedMedia && !showsTextModeChooser && !isReferenceCandidate) return []
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
          ? [{ id: candidate.id, title: candidate.title }]
          : []
      })
    : []
  const materializedResultId = typeof node.contentData?.materialized_result_node_id === 'string'
    ? node.contentData.materialized_result_node_id
    : ''
  return [{ node, interaction, cardPresentation, workModel, projectedMedia, projectedResultId: projectedResult?.id ?? materializedResultId, referenceCandidates, runtimePresentation: props.generationRuntimePresentations.get(node.id) ?? null, showsTextModeChooser, showsTextWorkflow, isReferenceCandidate }]
}))
function forwardContinuation(nodeId: string, portId: string) { emit('continueNode', nodeId, portId) }
function forwardCaptureFrame(nodeId: string, file: File, timeSeconds: number, aspectRatio: number) { emit('captureFrame', nodeId, file, timeSeconds, aspectRatio) }
</script>
<template>
  <div class="canvas-node-surface-layer">
    <CanvasNodeContinuationTrigger v-if="continuationTrigger" :node="continuationTrigger.node" :port-id="continuationTrigger.portId" :surface-node-rect-style="surfaceNodeRectStyle" @open="forwardContinuation" />
    <div v-for="surface in surfaces" :key="surface.node.id" class="canvas-node-surface" :class="`is-${surface.interaction.kind}`" :data-card-state="surface.cardPresentation.state" :data-node-id="surface.node.id" :style="surfaceNodeRectStyle(surface.node, surface.interaction.kind === 'composer' ? 'composer' : 'content')">
      <CanvasNodeMedia v-if="surface.projectedMedia" :media="surface.projectedMedia" :capture-pending="capturePending" @metadata="emit('mediaMetadata', surface.projectedResultId, $event)" />
      <CanvasTextWorkflowComposer v-else-if="surface.showsTextWorkflow && textWorkflowMode" :mode="textWorkflowMode" :title="surface.node.title" @cancel="emit('textWorkflowCancel')" @submit="emit('textWorkflowSubmit', surface.node.id, $event, textWorkflowMode)" />
      <CanvasTextCardModeChooser v-else-if="surface.showsTextModeChooser" :enabled-mode-ids="['direct-write', 'text-to-video', 'text-to-music']" :modes="surface.workModel.modes" @select="(mode, opener) => emit('textMode', surface.node.id, mode, opener)" />
      <CanvasNodeComposer v-else-if="surface.interaction.kind === 'composer' && selectedNodeIds.length === 1 && !surface.workModel.showsAttachedWorkSurface" :label="surface.interaction.label" :model-value="surface.interaction.content" @commit="emit('commitContent', surface.node.id, $event)" />
      <CanvasNodeMedia v-else-if="surface.interaction.kind === 'media'" :media="surface.interaction.media" :can-capture-frame="!readonly && !surface.node.isLocked && selectedNodeIds.length === 1 && selectedNodeIds[0] === surface.node.id && surface.interaction.media.kind === 'video'" :capture-pending="capturePending" :keyframe-rail-placement="resolveKeyframeRailPlacement(surface.node, nodes)" @capture-frame="(file, timeSeconds, aspectRatio) => forwardCaptureFrame(surface.projectedResultId || surface.node.id, file, timeSeconds, aspectRatio)" @metadata="emit('mediaMetadata', surface.projectedResultId || surface.node.id, $event)" />
      <CanvasCardWorkSurface
        v-if="surface.workModel.showsAttachedWorkSurface"
        :busy="cardWorkBusy"
        :can-generate="cardWorkCanGenerate"
        :error="cardWorkError"
        :has-source="cardWorkHasSource"
        :model-label="cardWorkModelLabel"
        :node="surface.node"
        :parameter-summary="cardWorkParameterSummary"
        :reference-candidates="surface.referenceCandidates"
        :reference-mode-active="referenceTargetNodeId === surface.node.id"
        :runtime-presentation="surface.runtimePresentation"
        :source-count="cardWorkSourceCount"
        :readonly="readonly"
        @generate="(prompt, mode) => emit('cardGenerate', surface.node.id, prompt, mode)"
        @begin-reference="emit('cardReferenceStart', surface.node.id)"
        @cancel-reference="emit('cardReferenceCancel')"
        @open-assets="(opener) => emit('cardOpenAssets', surface.node.id, opener)"
        @update-prompt="emit('commitContent', surface.node.id, $event)"
        @upload="(file) => emit('cardUpload', surface.node.id, file)"
      />
      <button v-if="surface.isReferenceCandidate && referenceTargetNodeId" type="button" class="canvas-card-reference-candidate" :aria-label="`选择 ${surface.node.title} 作为参考`" @click.stop="emit('cardReference', referenceTargetNodeId, surface.node.id)" @pointerdown.stop>
        <span>作为参考</span><small>{{ surface.node.title }}</small>
      </button>
    </div>
  </div>
</template>
<style scoped lang="scss" src="./canvas-node-surfaces.scss"></style>
