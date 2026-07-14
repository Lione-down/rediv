<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasNode } from '../../types/canvas'
import { buildCanvasNodeInteraction } from './canvas-node-interaction'
import CanvasNodeEditor from './CanvasNodeEditor.vue'
import CanvasNodeMedia from './CanvasNodeMedia.vue'
const props = defineProps<{ nodes: CanvasNode[]; selectedNodeIds: string[]; readonly: boolean; surfaceNodeRectStyle: (node: CanvasNode) => Record<string, string> }>()
const emit = defineEmits<{ commitContent: [nodeId: string, content: string] }>()
const surfaces = computed(() => props.nodes.flatMap((node) => {
  const interaction = buildCanvasNodeInteraction(node, { isReadOnly: props.readonly, isSelected: props.selectedNodeIds.length === 1 && props.selectedNodeIds[0] === node.id })
  return interaction.kind === 'static' ? [] : [{ node, interaction }]
}))
</script>
<template>
  <div class="canvas-node-surface-layer">
    <div v-for="surface in surfaces" :key="surface.node.id" class="canvas-node-surface" :class="`is-${surface.interaction.kind}`" :style="surfaceNodeRectStyle(surface.node)">
      <CanvasNodeEditor v-if="surface.interaction.kind === 'editor' && selectedNodeIds.length === 1" :label="surface.interaction.label" :model-value="surface.interaction.content" @commit="emit('commitContent', surface.node.id, $event)" />
      <CanvasNodeMedia v-else-if="surface.interaction.kind === 'media'" :media="surface.interaction.media" />
    </div>
  </div>
</template>
<style scoped lang="scss" src="./canvas-node-surfaces.scss"></style>
