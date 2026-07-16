<script setup lang="ts">
import { FileText, Image, Video } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import type { CanvasStoryboardItem } from '../../modules/canvas/storyboard-types'
import type { CanvasNode } from '../../types/canvas'
import { buildCanvasNodePresentation } from './canvas-node-presentation'
import CanvasNodeMedia from './CanvasNodeMedia.vue'

const props = defineProps<{ item: CanvasStoryboardItem; node: CanvasNode }>()
const emit = defineEmits<{ navigate: [direction: -1 | 1]; select: [nodeId: string] }>()
const selectRef = ref<HTMLButtonElement | null>(null)
const presentation = computed(() => buildCanvasNodePresentation(props.node))
const statusLabels = {
  draft: '草稿',
  queued: '排队中',
  running: '生成中',
  succeeded: '已就绪',
  failed: '失败',
  unavailable: '不可用',
} as const
const laneIcons = { text: FileText, image: Image, video: Video }
const lanePrefixes = { text: 'T', image: 'I', video: 'V' } as const
const sequence = computed(() => `${lanePrefixes[props.item.lane]}${String(props.item.order).padStart(2, '0')}`)
const excerpt = computed(() => presentation.value.content.trim() || '此镜头没有文本内容。')

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  emit('navigate', event.key === 'ArrowLeft' ? -1 : 1)
}

function focus() { selectRef.value?.focus() }
defineExpose({ focus })
</script>

<template>
  <article class="storyboard-item" :class="[`is-${item.lane}`, `has-${item.status}`]">
    <div class="storyboard-item__preview" aria-hidden="true" inert>
      <CanvasNodeMedia v-if="presentation.media" :media="presentation.media" />
      <component :is="laneIcons[item.lane]" v-else :size="24" />
    </div>
    <button
      ref="selectRef"
      type="button"
      class="storyboard-item__select"
      :aria-label="`审阅 ${item.title}`"
      @click="emit('select', item.nodeId)"
      @keydown="handleKeydown"
    >
      <span class="storyboard-item__meta">
        <strong>{{ sequence }}</strong>
        <span :class="`is-${item.status}`">{{ statusLabels[item.status] }}</span>
      </span>
      <strong class="storyboard-item__title">{{ item.title }}</strong>
      <span v-if="item.lane === 'text'" class="storyboard-item__excerpt">{{ excerpt }}</span>
      <span v-if="item.groupId" class="storyboard-item__group">故事板组</span>
    </button>
  </article>
</template>
