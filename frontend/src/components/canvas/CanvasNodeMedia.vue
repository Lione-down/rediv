<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CanvasNodeMediaPresentation } from './canvas-node-presentation'
const props = defineProps<{ media: CanvasNodeMediaPresentation }>()
const emit = defineEmits<{ metadata: [aspectRatio: number] }>()
const state = ref<'loading' | 'ready' | 'error'>('loading')
watch(() => props.media.kind === 'placeholder' ? props.media.kind : `${props.media.kind}:${props.media.url}`, () => {
  state.value = 'loading'
})
function imageLoaded(event: Event) { const image = event.currentTarget as HTMLImageElement; state.value = image.naturalWidth > 0 && image.naturalHeight > 0 ? 'ready' : 'error'; if (state.value === 'ready') emit('metadata', image.naturalWidth / image.naturalHeight) }
function videoLoaded(event: Event) { const video = event.currentTarget as HTMLVideoElement; state.value = video.videoWidth > 0 && video.videoHeight > 0 ? 'ready' : 'error'; if (state.value === 'ready') emit('metadata', video.videoWidth / video.videoHeight) }
</script>
<template>
  <div class="canvas-node-media" :aria-label="media.label">
    <span v-if="media.kind === 'placeholder'" class="canvas-node-media__message">{{ media.label }}</span>
    <template v-else>
      <span v-if="state === 'loading'" class="canvas-node-media__message" role="status">媒体加载中…</span>
      <span v-if="state === 'error'" class="canvas-node-media__message is-error" role="alert">媒体不可用，可稍后重试</span>
      <img v-if="media.kind === 'image'" v-show="state !== 'error'" :src="media.url" :alt="media.label" @load="imageLoaded" @error="state = 'error'" />
      <video v-else v-show="state !== 'error'" :src="media.url" :poster="media.poster" :aria-label="media.label" controls preload="metadata" @loadedmetadata="videoLoaded" @error="state = 'error'" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.canvas-node-media {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  overflow: hidden;
  border-radius: var(--canvas-media-radius, var(--v2-radius-sm));
  background: var(--v2-surface-1);
  pointer-events: none;
}

.canvas-node-media img,
.canvas-node-media video {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.canvas-node-media video { pointer-events: auto; }
.canvas-node-media__message { position: absolute; z-index: 1; padding: calc(8px * var(--canvas-surface-zoom, 1)) calc(12px * var(--canvas-surface-zoom, 1)); border-radius: calc(var(--v2-radius-sm) * var(--canvas-surface-zoom, 1)); color: var(--v2-text-secondary); background: var(--v2-surface-2); font-size: calc(12px * var(--canvas-surface-zoom, 1)); }
.canvas-node-media__message.is-error { color: var(--v2-danger); }
</style>
