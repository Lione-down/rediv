<script setup lang="ts">
import { Camera } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import type { CanvasNodeMediaPresentation } from './canvas-node-presentation'
const props = withDefaults(defineProps<{ media: CanvasNodeMediaPresentation; canCaptureFrame?: boolean; capturePending?: boolean }>(), { canCaptureFrame: false, capturePending: false })
const emit = defineEmits<{ captureFrame: [file: File, timeSeconds: number, aspectRatio: number]; metadata: [aspectRatio: number] }>()
const state = ref<'loading' | 'ready' | 'error'>('loading')
const captureError = ref('')
const isCapturing = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
watch(() => props.media.kind === 'placeholder' ? props.media.kind : `${props.media.kind}:${props.media.url}`, () => {
  state.value = 'loading'
  captureError.value = ''
})
function imageLoaded(event: Event) { const image = event.currentTarget as HTMLImageElement; state.value = image.naturalWidth > 0 && image.naturalHeight > 0 ? 'ready' : 'error'; if (state.value === 'ready') emit('metadata', image.naturalWidth / image.naturalHeight) }
function videoLoaded(event: Event) { const video = event.currentTarget as HTMLVideoElement; state.value = video.videoWidth > 0 && video.videoHeight > 0 ? 'ready' : 'error'; if (state.value === 'ready') emit('metadata', video.videoWidth / video.videoHeight) }
async function captureCurrentFrame() {
  const video = videoRef.value
  if (!video || state.value !== 'ready' || !video.videoWidth || !video.videoHeight || isCapturing.value || props.capturePending) return
  captureError.value = ''
  isCapturing.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器无法创建帧画布。')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('当前视频帧编码失败。')), 'image/png'))
    const timeSeconds = Number(video.currentTime.toFixed(3))
    emit('captureFrame', new File([blob], `video-frame-${Math.round(timeSeconds * 1000)}ms.png`, { type: 'image/png' }), timeSeconds, video.videoWidth / video.videoHeight)
  } catch (error) {
    captureError.value = error instanceof Error ? error.message : '当前视频帧截取失败。'
  } finally {
    isCapturing.value = false
  }
}
</script>
<template>
  <div class="canvas-node-media" :aria-label="media.label">
    <span v-if="media.kind === 'placeholder'" class="canvas-node-media__message">{{ media.label }}</span>
    <template v-else>
      <span v-if="state === 'loading'" class="canvas-node-media__message" role="status">媒体加载中…</span>
      <span v-if="state === 'error'" class="canvas-node-media__message is-error" role="alert">媒体不可用，可稍后重试</span>
      <img v-if="media.kind === 'image'" v-show="state !== 'error'" :src="media.url" :alt="media.label" @load="imageLoaded" @error="state = 'error'" />
      <video v-else ref="videoRef" v-show="state !== 'error'" :src="media.url" :poster="media.poster" :aria-label="media.label" crossorigin="anonymous" controls preload="metadata" @loadedmetadata="videoLoaded" @error="state = 'error'" />
      <button v-if="media.kind === 'video' && canCaptureFrame && state === 'ready'" type="button" class="canvas-node-media__capture" :disabled="isCapturing || capturePending" @click.stop="captureCurrentFrame" @pointerdown.stop>
        <Camera :size="14" aria-hidden="true" />{{ isCapturing || capturePending ? '正在截取' : '截取当前帧' }}
      </button>
      <span v-if="captureError" class="canvas-node-media__capture-error" role="alert">{{ captureError }}</span>
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
.canvas-node-media__capture { position: absolute; z-index: 2; top: 8px; right: 8px; display: inline-flex; min-height: 30px; align-items: center; gap: 5px; padding: 0 9px; border: 1px solid color-mix(in oklch, var(--accent-select) 54%, var(--v2-border-standard)); border-radius: var(--radius-pill); color: var(--v2-text-primary); background: color-mix(in oklch, var(--v2-surface-1) 88%, transparent); box-shadow: 0 8px 20px oklch(3% 0.01 292 / 0.3); font: inherit; font-size: 11px; white-space: nowrap; backdrop-filter: blur(10px); pointer-events: auto; cursor: pointer; }
.canvas-node-media__capture:hover { border-color: var(--accent-select); background: var(--v2-surface-2); }
.canvas-node-media__capture:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.canvas-node-media__capture:disabled { cursor: wait; opacity: 0.72; }
.canvas-node-media__capture-error { position: absolute; z-index: 2; top: 46px; right: 8px; max-width: calc(100% - 16px); padding: 6px 8px; border-radius: var(--v2-radius-sm); color: var(--v2-danger); background: var(--v2-surface-2); font-size: 11px; }
.canvas-node-media__message { position: absolute; z-index: 1; padding: calc(8px * var(--canvas-surface-zoom, 1)) calc(12px * var(--canvas-surface-zoom, 1)); border-radius: calc(var(--v2-radius-sm) * var(--canvas-surface-zoom, 1)); color: var(--v2-text-secondary); background: var(--v2-surface-2); font-size: calc(12px * var(--canvas-surface-zoom, 1)); }
.canvas-node-media__message.is-error { color: var(--v2-danger); }
</style>
