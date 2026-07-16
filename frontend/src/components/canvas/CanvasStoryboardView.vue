<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasStoryboardItem, CanvasStoryboardLane } from '../../modules/canvas/storyboard-types'
import type { CanvasNode } from '../../types/canvas'
import CanvasStoryboardLaneComponent from './CanvasStoryboardLane.vue'

const props = defineProps<{ items: readonly CanvasStoryboardItem[]; nodes: readonly CanvasNode[]; readonly: boolean }>()
const emit = defineEmits<{ reorder: [groupId: string, nodeId: string, direction: -1 | 1]; select: [nodeId: string] }>()
const lanes: readonly CanvasStoryboardLane[] = ['text', 'image', 'video']
const nodesById = computed(() => new Map(props.nodes.map((node) => [node.id, node])))
function forwardReorder(groupId: string, nodeId: string, direction: -1 | 1) {
  emit('reorder', groupId, nodeId, direction)
}
</script>

<template>
  <section class="canvas-storyboard" role="region" aria-label="故事板审阅">
    <header class="canvas-storyboard__intro">
      <div>
        <span>Storyboard projection</span>
        <h1>从同一画布审阅叙事顺序</h1>
      </div>
      <p>按镜头类型阅读，选择任一项可检查原节点详情。这里不创建第二份 document。</p>
    </header>
    <div class="canvas-storyboard__lanes">
      <CanvasStoryboardLaneComponent
        v-for="lane in lanes"
        :key="lane"
        :items="items"
        :lane="lane"
        :nodes-by-id="nodesById"
        :readonly="readonly"
        @reorder="forwardReorder"
        @select="emit('select', $event)"
      />
    </div>
  </section>
</template>

<style scoped lang="scss" src="./canvas-storyboard.scss"></style>
