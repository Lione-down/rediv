<script setup lang="ts">
import { Camera } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CanvasNodeMediaPresentation } from './canvas-node-presentation'
import CanvasVideoKeyframeRail from './CanvasVideoKeyframeRail.vue'
const CANVAS_VIDEO_PLAY_EVENT = 'revid:canvas-video-play'
const props = withDefaults(defineProps<{ media: CanvasNodeMediaPresentation; canCaptureFrame?: boolean; capturePending?: boolean; keyframeRailPlacement?: 'above' | 'below' }>(), { canCaptureFrame: false, capturePending: false, keyframeRailPlacement: 'below' })
const emit = defineEmits<{ captureFrame: [file: File, timeSeconds: number, aspectRatio: number]; metadata: [aspectRatio: number] }>()
const state = ref<'loading' | 'ready' | 'error'>('loading')
const captureError = ref('')
const isCapturing = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)
const videoLoadMode = ref<'canvas-readable' | 'playback-only'>('canvas-readable')
const canReadVideoFrames = computed(() => videoLoadMode.value === 'canvas-readable' && props.canCaptureFrame)
watch(() => props.media.kind === 'placeholder' ? props.media.kind : `${props.media.kind}:${props.media.url}`, () => {
  state.value = 'loading'
  captureError.value = ''
  videoLoadMode.value = 'canvas-readable'
})
function imageLoaded(event: Event) { const image = event.currentTarget as HTMLImageElement; state.value = image.naturalWidth > 0 && image.naturalHeight > 0 ? 'ready' : 'error'; if (state.value === 'ready') emit('metadata', image.naturalWidth / image.naturalHeight) }
function videoLoaded(event: Event) { const video = event.currentTarget as HTMLVideoElement; state.value = video.videoWidth > 0 && video.videoHeight > 0 ? 'ready' : 'error'; currentTime.value = video.currentTime; if (state.value === 'ready') emit('metadata', video.videoWidth / video.videoHeight) }
function syncCurrentTime(event: Event) { currentTime.value = (event.currentTarget as HTMLVideoElement).currentTime }
function claimVideoPlayback(event: Event) {
  const video = event.currentTarget as HTMLVideoElement
  window.dispatchEvent(new CustomEvent<HTMLVideoElement>(CANVAS_VIDEO_PLAY_EVENT, { detail: video }))
}
function pauseForPeerPlayback(event: Event) {
  const video = videoRef.value
  const peer = (event as CustomEvent<HTMLVideoElement>).detail
  if (video && video !== peer && !video.paused) video.pause()
}
async function handleVideoKeydown(event: KeyboardEvent) {
  const video = event.currentTarget as HTMLVideoElement
  if (event.key === ' ' || event.key.toLowerCase() === 'k') {
    event.preventDefault()
    if (video.paused) await video.play()
    else video.pause()
    return
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    const step = event.key === 'ArrowLeft' ? -5 : 5
    video.currentTime = Math.min(Math.max(video.currentTime + step, 0), Number.isFinite(video.duration) ? video.duration : video.currentTime)
    return
  }
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault()
    const step = event.key === 'ArrowUp' ? 0.1 : -0.1
    video.volume = Math.min(Math.max(Number((video.volume + step).toFixed(2)), 0), 1)
  }
}
function videoFailed() {
  if (videoLoadMode.value === 'canvas-readable') {
    state.value = 'loading'
    videoLoadMode.value = 'playback-only'
    return
  }
  state.value = 'error'
}
function seekToFrame(timeSeconds: number) {
  const video = videoRef.value
  if (!video || state.value !== 'ready') return
  video.currentTime = timeSeconds
  currentTime.value = timeSeconds
}
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
onMounted(() => window.addEventListener(CANVAS_VIDEO_PLAY_EVENT, pauseForPeerPlayback))
onBeforeUnmount(() => window.removeEventListener(CANVAS_VIDEO_PLAY_EVENT, pauseForPeerPlayback))
</script>
<template>
  <div class="canvas-node-media" :aria-label="media.label">
    <div class="canvas-node-media__viewport">
      <span v-if="media.kind === 'placeholder'" class="canvas-node-media__message">{{ media.label }}</span>
      <template v-else>
        <span v-if="state === 'loading'" class="canvas-node-media__message" role="status">媒体加载中…</span>
        <span v-if="state === 'error'" class="canvas-node-media__message is-error" role="alert">媒体不可用，可稍后重试</span>
        <img v-if="media.kind === 'image'" v-show="state !== 'error'" :src="media.url" :alt="media.label" @load="imageLoaded" @error="state = 'error'" />
        <video v-else :key="videoLoadMode" ref="videoRef" v-show="state !== 'error'" :src="media.url" :poster="media.poster" :aria-label="media.label" :crossorigin="videoLoadMode === 'canvas-readable' ? 'anonymous' : undefined" :data-playback-capability="videoLoadMode" controls preload="metadata" @loadedmetadata="videoLoaded" @timeupdate="syncCurrentTime" @seeked="syncCurrentTime" @play="claimVideoPlayback" @error="videoFailed" @click.stop @dblclick.stop @pointerdown.stop @keydown.stop="handleVideoKeydown" />
        <button v-if="media.kind === 'video' && canReadVideoFrames && state === 'ready'" type="button" class="canvas-node-media__capture" :disabled="isCapturing || capturePending" @click.stop="captureCurrentFrame" @pointerdown.stop>
          <Camera :size="14" aria-hidden="true" />{{ isCapturing || capturePending ? '正在截取' : '截取当前帧' }}
        </button>
        <span v-if="captureError" class="canvas-node-media__capture-error" role="alert">{{ captureError }}</span>
      </template>
    </div>
    <CanvasVideoKeyframeRail v-if="media.kind === 'video' && canReadVideoFrames && state === 'ready'" :current-time="currentTime" :placement="keyframeRailPlacement" :src="media.url" @seek="seekToFrame" />
  </div>
</template>

<style scoped lang="scss">
.canvas-node-media {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  overflow: visible;
  border-radius: var(--canvas-media-radius, var(--v2-radius-sm));
  pointer-events: none;
}

.canvas-node-media__viewport { position: relative; display: grid; width: 100%; height: 100%; place-items: center; overflow: hidden; border-radius: inherit; background: var(--v2-surface-1); }

.canvas-node-media__viewport img,
.canvas-node-media__viewport video {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.canvas-node-media__viewport video { pointer-events: auto; }
.canvas-node-media__capture { position: absolute; z-index: 2; top: 8px; right: 8px; display: inline-flex; min-height: 30px; align-items: center; gap: 5px; padding: 0 9px; border: 1px solid color-mix(in oklch, var(--accent-select) 54%, var(--v2-border-standard)); border-radius: var(--radius-pill); color: var(--v2-text-primary); background: color-mix(in oklch, var(--v2-surface-1) 88%, transparent); box-shadow: 0 8px 20px oklch(3% 0.01 292 / 0.3); font: inherit; font-size: 11px; white-space: nowrap; backdrop-filter: blur(10px); pointer-events: auto; cursor: pointer; }
.canvas-node-media__capture:hover { border-color: var(--accent-select); background: var(--v2-surface-2); }
.canvas-node-media__capture:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.canvas-node-media__capture:disabled { cursor: wait; opacity: 0.72; }
.canvas-node-media__capture-error { position: absolute; z-index: 2; top: 46px; right: 8px; max-width: calc(100% - 16px); padding: 6px 8px; border-radius: var(--v2-radius-sm); color: var(--v2-danger); background: var(--v2-surface-2); font-size: 11px; }
.canvas-node-media__message { position: absolute; z-index: 1; padding: calc(8px * var(--canvas-surface-zoom, 1)) calc(12px * var(--canvas-surface-zoom, 1)); border-radius: calc(var(--v2-radius-sm) * var(--canvas-surface-zoom, 1)); color: var(--v2-text-secondary); background: var(--v2-surface-2); font-size: calc(12px * var(--canvas-surface-zoom, 1)); }
.canvas-node-media__message.is-error { color: var(--v2-danger); }
</style>
