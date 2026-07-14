<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CanvasNodeMediaPresentation } from './canvas-node-presentation'
const props = defineProps<{ media: CanvasNodeMediaPresentation }>()
const state = ref<'loading' | 'ready' | 'error'>('loading')
watch(() => props.media, () => { state.value = 'loading' })
function imageLoaded(event: Event) { const image = event.currentTarget as HTMLImageElement; state.value = image.naturalWidth > 0 && image.naturalHeight > 0 ? 'ready' : 'error' }
</script>
<template>
  <div class="canvas-node-media" :aria-label="media.label">
    <span v-if="media.kind === 'placeholder'" class="canvas-node-media__message">{{ media.label }}</span>
    <template v-else>
      <span v-if="state === 'loading'" class="canvas-node-media__message" role="status">媒体加载中…</span>
      <span v-if="state === 'error'" class="canvas-node-media__message is-error" role="alert">媒体不可用，可稍后重试</span>
      <img v-if="media.kind === 'image'" :src="media.url" :alt="media.label" @load="imageLoaded" @error="state = 'error'" />
      <video v-else :src="media.url" :poster="media.poster" :aria-label="media.label" controls preload="metadata" @loadedmetadata="state = 'ready'" @error="state = 'error'" />
    </template>
  </div>
</template>
