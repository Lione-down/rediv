<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasNode } from '../../types/canvas'
import { buildCanvasNodeInteraction } from './canvas-node-interaction'
import CanvasNodeComposer from './CanvasNodeComposer.vue'
import CanvasNodeContinuationTrigger from './CanvasNodeContinuationTrigger.vue'
import CanvasNodeMedia from './CanvasNodeMedia.vue'
import { canvasNodeWorldRect } from './canvas-geometry'
import type { CanvasNodeContinuationTrigger as ContinuationTrigger } from './canvas-node-continuation-trigger'
const props = defineProps<{ capturePending: boolean; continuationTrigger: ContinuationTrigger | null; nodes: CanvasNode[]; selectedNodeIds: string[]; readonly: boolean; surfaceNodeRectStyle: (node: CanvasNode, role?: 'content' | 'composer') => Record<string, string> }>()
const emit = defineEmits<{
  commitContent: [nodeId: string, content: string]
  continueNode: [nodeId: string, portId: string]
  captureFrame: [nodeId: string, file: File, timeSeconds: number, aspectRatio: number]
  mediaMetadata: [nodeId: string, aspectRatio: number]
}>()
const surfaces = computed(() => props.nodes.flatMap((node) => {
  const interaction = buildCanvasNodeInteraction(node, { isReadOnly: props.readonly, isSelected: props.selectedNodeIds.length === 1 && props.selectedNodeIds[0] === node.id })
  return interaction.kind === 'static' ? [] : [{ node, interaction }]
}))
function forwardContinuation(nodeId: string, portId: string) { emit('continueNode', nodeId, portId) }
function forwardCaptureFrame(nodeId: string, file: File, timeSeconds: number, aspectRatio: number) { emit('captureFrame', nodeId, file, timeSeconds, aspectRatio) }
function keyframeRailPlacement(node: CanvasNode): 'above' | 'below' {
  const rect = canvasNodeWorldRect(node, 'content')
  const overlapping = props.nodes
    .filter((candidate) => candidate.id !== node.id)
    .map((candidate) => canvasNodeWorldRect(candidate, 'content'))
    .filter((candidate) => candidate.left < rect.left + rect.width && candidate.left + candidate.width > rect.left)
  const nearestAbove = overlapping
    .filter((candidate) => candidate.top + candidate.height <= rect.top)
    .reduce((bottom, candidate) => Math.max(bottom, candidate.top + candidate.height), Number.NEGATIVE_INFINITY)
  const nearestBelow = overlapping
    .filter((candidate) => candidate.top >= rect.top + rect.height)
    .reduce((top, candidate) => Math.min(top, candidate.top), Number.POSITIVE_INFINITY)
  const spaceAbove = rect.top - nearestAbove
  const spaceBelow = nearestBelow - (rect.top + rect.height)
  return spaceAbove > spaceBelow ? 'above' : 'below'
}
</script>
<template>
  <div class="canvas-node-surface-layer">
    <CanvasNodeContinuationTrigger v-if="continuationTrigger" :node="continuationTrigger.node" :port-id="continuationTrigger.portId" :surface-node-rect-style="surfaceNodeRectStyle" @open="forwardContinuation" />
    <div v-for="surface in surfaces" :key="surface.node.id" class="canvas-node-surface" :class="`is-${surface.interaction.kind}`" :style="surfaceNodeRectStyle(surface.node, surface.interaction.kind === 'composer' ? 'composer' : 'content')">
      <CanvasNodeComposer v-if="surface.interaction.kind === 'composer' && selectedNodeIds.length === 1" :label="surface.interaction.label" :model-value="surface.interaction.content" @commit="emit('commitContent', surface.node.id, $event)" />
      <CanvasNodeMedia v-else-if="surface.interaction.kind === 'media'" :media="surface.interaction.media" :can-capture-frame="!readonly && !surface.node.isLocked && selectedNodeIds.length === 1 && selectedNodeIds[0] === surface.node.id && surface.interaction.media.kind === 'video'" :capture-pending="capturePending" :keyframe-rail-placement="keyframeRailPlacement(surface.node)" @capture-frame="(file, timeSeconds, aspectRatio) => forwardCaptureFrame(surface.node.id, file, timeSeconds, aspectRatio)" @metadata="emit('mediaMetadata', surface.node.id, $event)" />
    </div>
  </div>
</template>
<style scoped lang="scss" src="./canvas-node-surfaces.scss"></style>
