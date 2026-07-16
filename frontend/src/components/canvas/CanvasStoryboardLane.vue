<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CanvasStoryboardItem, CanvasStoryboardLane } from '../../modules/canvas/storyboard-types'
import type { CanvasNode } from '../../types/canvas'
import CanvasStoryboardItemComponent from './CanvasStoryboardItem.vue'

interface StoryboardItemHandle { focus: () => void }

const props = defineProps<{
  items: readonly CanvasStoryboardItem[]
  lane: CanvasStoryboardLane
  nodesById: ReadonlyMap<string, CanvasNode>
}>()
const emit = defineEmits<{ select: [nodeId: string] }>()
const itemRefs = ref<Array<StoryboardItemHandle | null>>([])
const laneLabels = { text: '文本镜头', image: '图片镜头', video: '视频镜头' } as const
const laneDescriptions = {
  text: '脚本、提示与文字节拍',
  image: '参考图、生成任务与静态结果',
  video: '视频素材与动态结果',
} as const
const laneItems = computed(() => props.items.filter((item) => item.lane === props.lane))
const resolvedItems = computed(() => laneItems.value.flatMap((item) => {
  const node = props.nodesById.get(item.nodeId)
  return node ? [{ item, node }] : []
}))

function setItemRef(instance: StoryboardItemHandle | null, index: number) {
  itemRefs.value[index] = instance
}

function focusSibling(index: number, direction: -1 | 1) {
  const count = resolvedItems.value.length
  if (!count) return
  itemRefs.value[(index + direction + count) % count]?.focus()
}
</script>

<template>
  <section class="storyboard-lane" :class="`is-${lane}`" role="region" :aria-label="`${laneLabels[lane]}，共 ${resolvedItems.length} 项`">
    <header class="storyboard-lane__header">
      <div>
        <strong>{{ laneLabels[lane] }}</strong>
        <span>{{ laneDescriptions[lane] }}</span>
      </div>
      <span class="storyboard-lane__count">{{ resolvedItems.length }}</span>
    </header>
    <div v-if="resolvedItems.length" class="storyboard-lane__track">
      <CanvasStoryboardItemComponent
        v-for="({ item, node }, index) in resolvedItems"
        :key="item.nodeId"
        :ref="(instance) => setItemRef(instance as StoryboardItemHandle | null, index)"
        :item="item"
        :node="node"
        @navigate="focusSibling(index, $event)"
        @select="emit('select', $event)"
      />
    </div>
    <p v-else class="storyboard-lane__empty">当前画布没有可审阅的{{ laneLabels[lane] }}。</p>
  </section>
</template>
