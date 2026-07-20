<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasNode } from '../../types/canvas'
import { buildCanvasNodeInteraction } from './canvas-node-interaction'
import CanvasNodeComposer from './CanvasNodeComposer.vue'
import CanvasNodeContinuationTrigger from './CanvasNodeContinuationTrigger.vue'
import CanvasNodeMedia from './CanvasNodeMedia.vue'
import { resolveKeyframeRailPlacement } from './canvas-keyframe-placement'
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
</script>
<template>
  <div class="canvas-node-surface-layer">
    <CanvasNodeContinuationTrigger v-if="continuationTrigger" :node="continuationTrigger.node" :port-id="continuationTrigger.portId" :surface-node-rect-style="surfaceNodeRectStyle" @open="forwardContinuation" />
    <div v-for="surface in surfaces" :key="surface.node.id" class="canvas-node-surface" :class="`is-${surface.interaction.kind}`" :data-node-id="surface.node.id" :style="surfaceNodeRectStyle(surface.node, surface.interaction.kind === 'composer' ? 'composer' : 'content')">
      <CanvasNodeComposer v-if="surface.interaction.kind === 'composer' && selectedNodeIds.length === 1" :label="surface.interaction.label" :model-value="surface.interaction.content" @commit="emit('commitContent', surface.node.id, $event)" />
      <CanvasNodeMedia v-else-if="surface.interaction.kind === 'media'" :media="surface.interaction.media" :can-capture-frame="!readonly && !surface.node.isLocked && selectedNodeIds.length === 1 && selectedNodeIds[0] === surface.node.id && surface.interaction.media.kind === 'video'" :capture-pending="capturePending" :keyframe-rail-placement="resolveKeyframeRailPlacement(surface.node, nodes)" @capture-frame="(file, timeSeconds, aspectRatio) => forwardCaptureFrame(surface.node.id, file, timeSeconds, aspectRatio)" @metadata="emit('mediaMetadata', surface.node.id, $event)" />
    </div>
  </div>
</template>
<style scoped lang="scss" src="./canvas-node-surfaces.scss"></style>
